import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { CAFE_INFO, MENU_ITEMS, MenuItem, MenuItemOption } from '../data/cafeData';
import {
  OperationType,
  db,
  handleFirestoreError,
  isVerifiedOwnerAdmin,
} from '../firebase';
import {
  CustomImagesMap,
  CustomPhotoSection,
  CustomSectionPhoto,
  SectionId,
  SiteConfig,
} from '../types/siteConfig';
import { slotKeyToDocId } from '../utils/imageStore';

const VALID_SECTION_IDS: SectionId[] = [
  'menu',
  'gallery',
  'experience',
  'visit-us',
  'contact',
];

function sanitizeId(raw: string, fallback = 'item'): string {
  const clean = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return clean || fallback;
}

function clampStr(value: string | undefined, maxLen: number): string {
  return (value ?? '').trim().slice(0, maxLen);
}

function buildSiteSettingsPayload(config: SiteConfig, uid: string) {
  const cleanOrder = config.sectionOrder
    .filter((id) => VALID_SECTION_IDS.includes(id))
    .slice(0, 5);
  const safeOrder = cleanOrder.length > 0 ? cleanOrder : VALID_SECTION_IDS;
  const safeHidden = config.hiddenSections
    .filter((id) => VALID_SECTION_IDS.includes(id))
    .slice(0, 5);

  const safeWhatsapp = config.whatsappNumber.replace(/\D/g, '').slice(0, 30) || CAFE_INFO.whatsappNumber;

  return {
    themeId: config.themeId,
    heroLayout: config.heroLayout,
    menuViewMode: config.menuViewMode,
    fontStyle: config.fontStyle,
    cafeName: clampStr(config.cafeName, 120) || CAFE_INFO.name,
    ayubowanGreeting: clampStr(config.ayubowanGreeting, 200),
    locationLabel: clampStr(config.locationLabel, 140) || CAFE_INFO.location,
    heroHeadline: clampStr(config.heroHeadline, 140) || 'Fresh Village Flavours.',
    heroAccentLine: clampStr(config.heroAccentLine, 140),
    heroSubtitle: clampStr(config.heroSubtitle, 400),
    openingHours: clampStr(config.openingHours, 100) || CAFE_INFO.hours,
    phoneDisplay: clampStr(config.phoneDisplay, 40) || CAFE_INFO.phoneDisplay,
    whatsappNumber: safeWhatsapp,
    email: clampStr(config.email, 120) || CAFE_INFO.email,
    showSinhalaSubtitles: Boolean(config.showSinhalaSubtitles),
    sectionOrder: safeOrder,
    hiddenSections: safeHidden,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  };
}

function buildMenuItemPayload(item: MenuItem, sortOrder: number, uid: string) {
  const id = sanitizeId(item.id, `dish-${Date.now()}`);
  const payload: Record<string, unknown> = {
    id,
    name: clampStr(item.name, 120) || 'House Special',
    category: item.category,
    categoryLabel: clampStr(item.categoryLabel, 60) || 'Special',
    note: clampStr(item.note, 400),
    vegetarian: Boolean(item.vegetarian),
    styleTag: clampStr(item.styleTag, 60) || 'Prepared Fresh',
    available: item.available !== false,
    sortOrder: Math.max(0, Math.min(10000, Math.floor(sortOrder))),
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  };

  const sinhala = clampStr(item.sinhalaName, 120);
  if (sinhala) payload.sinhalaName = sinhala;
  const price = clampStr(item.priceLkr, 30);
  if (price) payload.priceLkr = price;

  if (Array.isArray(item.options)) {
    const safeOptions: MenuItemOption[] = item.options
      .slice(0, 20)
      .filter((opt) => opt && clampStr(opt.name, 80).length > 0)
      .map((opt, idx) => {
        const entry: MenuItemOption = {
          id: sanitizeId(opt.id || `opt-${idx + 1}`, `opt-${idx + 1}`),
          name: clampStr(opt.name, 80),
          available: opt.available !== false,
        };
        const optSinhala = clampStr(opt.sinhalaName, 80);
        if (optSinhala) entry.sinhalaName = optSinhala;
        const optPrice = clampStr(opt.priceLkr, 30);
        if (optPrice) entry.priceLkr = optPrice;
        return entry;
      });
    payload.options = safeOptions;
  }

  return { id, payload };
}

function buildPhotoSectionPayload(
  section: CustomPhotoSection,
  sortOrder: number,
  uid: string
) {
  const id = sanitizeId(section.id, `sec-${Date.now()}`);
  const safePhotos: CustomSectionPhoto[] = section.photos.slice(0, 20).map((p) => {
    const entry: CustomSectionPhoto = {
      id: sanitizeId(p.id, 'photo'),
      slotKey: clampStr(p.slotKey, 128),
    };
    if (p.defaultSrc) entry.defaultSrc = clampStr(p.defaultSrc, 500);
    if (p.caption) entry.caption = clampStr(p.caption, 240);
    return entry;
  });

  const payload: Record<string, unknown> = {
    id,
    title: clampStr(section.title, 160) || 'Gallery Section',
    description: clampStr(section.description, 500),
    layout: section.layout,
    visible: Boolean(section.visible),
    sortOrder: Math.max(0, Math.min(1000, Math.floor(sortOrder))),
    photos: safePhotos,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  };

  const kicker = clampStr(section.kicker, 120);
  if (kicker) payload.kicker = kicker;

  return { id, payload };
}

export interface StorefrontCallbacks {
  onSettings: (settings: Partial<SiteConfig> | null) => void;
  onMenuItems: (items: MenuItem[] | null) => void;
  onPhotoSections: (sections: CustomPhotoSection[] | null) => void;
  onMediaMap: (media: CustomImagesMap) => void;
}

export function subscribeStorefrontData({
  onSettings,
  onMenuItems,
  onPhotoSections,
  onMediaMap,
}: StorefrontCallbacks) {
  const unsubSettings = onSnapshot(
    doc(db, 'siteSettings', 'main'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onSettings({
          themeId: data.themeId,
          heroLayout: data.heroLayout,
          menuViewMode: data.menuViewMode,
          fontStyle: data.fontStyle,
          cafeName: data.cafeName,
          ayubowanGreeting: data.ayubowanGreeting ?? '',
          locationLabel: data.locationLabel,
          heroHeadline: data.heroHeadline,
          heroAccentLine: data.heroAccentLine ?? '',
          heroSubtitle: data.heroSubtitle ?? '',
          openingHours: data.openingHours,
          phoneDisplay: data.phoneDisplay,
          whatsappNumber: data.whatsappNumber,
          email: data.email,
          showSinhalaSubtitles: data.showSinhalaSubtitles,
          sectionOrder: Array.isArray(data.sectionOrder) ? data.sectionOrder : undefined,
          hiddenSections: Array.isArray(data.hiddenSections) ? data.hiddenSections : undefined,
        });
      } else {
        onSettings(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'siteSettings/main');
    }
  );

  const unsubMenu = onSnapshot(
    query(collection(db, 'menuItems'), orderBy('sortOrder', 'asc'), limit(200)),
    (snap) => {
      if (snap.empty) {
        onMenuItems(null);
      } else {
        const items: MenuItem[] = snap.docs.map((d) => {
          const data = d.data();
          const rawOptions = Array.isArray(data.options) ? data.options : undefined;
          const options: MenuItemOption[] | undefined = rawOptions
            ? rawOptions
                .filter(
                  (opt): opt is Record<string, unknown> =>
                    Boolean(opt) && typeof opt === 'object' && typeof (opt as { name?: unknown }).name === 'string'
                )
                .map((opt, idx) => ({
                  id: typeof opt.id === 'string' && opt.id ? opt.id : `opt-${idx + 1}`,
                  name: String(opt.name),
                  sinhalaName: typeof opt.sinhalaName === 'string' ? opt.sinhalaName : undefined,
                  priceLkr: typeof opt.priceLkr === 'string' ? opt.priceLkr : undefined,
                  available: opt.available !== false,
                }))
            : undefined;

          return {
            id: data.id || d.id,
            name: data.name,
            sinhalaName: data.sinhalaName,
            category: data.category,
            categoryLabel: data.categoryLabel,
            note: data.note ?? '',
            vegetarian: Boolean(data.vegetarian),
            styleTag: data.styleTag ?? 'Prepared Fresh',
            priceLkr: data.priceLkr,
            available: data.available !== false,
            options,
          };
        });
        onMenuItems(items);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menuItems');
    }
  );

  const unsubPhotos = onSnapshot(
    query(collection(db, 'photoSections'), orderBy('sortOrder', 'asc'), limit(100)),
    (snap) => {
      if (snap.empty) {
        onPhotoSections(null);
      } else {
        const sections: CustomPhotoSection[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            kicker: data.kicker,
            title: data.title,
            description: data.description ?? '',
            layout: data.layout ?? 'auto',
            visible: data.visible !== false,
            photos: Array.isArray(data.photos) ? data.photos : [],
          };
        });
        onPhotoSections(sections);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'photoSections');
    }
  );

  const unsubMedia = onSnapshot(
    query(collection(db, 'siteMedia'), limit(500)),
    (snap) => {
      const nextMap: CustomImagesMap = {};
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (typeof data.slotKey === 'string' && typeof data.imageUrl === 'string') {
          nextMap[data.slotKey] = data.imageUrl;
        }
      }
      onMediaMap(nextMap);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'siteMedia');
    }
  );

  return () => {
    unsubSettings();
    unsubMenu();
    unsubPhotos();
    unsubMedia();
  };
}

function assertAdmin(user: User | null): asserts user is User {
  if (!isVerifiedOwnerAdmin(user)) {
    throw new Error('Unauthorized: Only the verified website owner can modify content.');
  }
}

export async function recordAdminLogin(user: User) {
  assertAdmin(user);
  const path = `admins/${user.uid}`;
  try {
    await setDoc(doc(db, 'admins', user.uid), {
      uid: user.uid,
      email: user.email,
      role: 'owner',
      lastLoginAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveSiteSettingsToFirestore(config: SiteConfig, user: User | null) {
  assertAdmin(user);
  const path = 'siteSettings/main';
  try {
    const payload = buildSiteSettingsPayload(config, user.uid);
    await setDoc(doc(db, 'siteSettings', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertMenuItemToFirestore(
  item: MenuItem,
  sortOrder: number,
  user: User | null
) {
  assertAdmin(user);
  const { id, payload } = buildMenuItemPayload(item, sortOrder, user.uid);
  const path = `menuItems/${id}`;
  try {
    await setDoc(doc(db, 'menuItems', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMenuItemFromFirestore(itemId: string, user: User | null) {
  assertAdmin(user);
  const id = sanitizeId(itemId);
  const path = `menuItems/${id}`;
  try {
    await deleteDoc(doc(db, 'menuItems', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertPhotoSectionToFirestore(
  section: CustomPhotoSection,
  sortOrder: number,
  user: User | null
) {
  assertAdmin(user);
  const { id, payload } = buildPhotoSectionPayload(section, sortOrder, user.uid);
  const path = `photoSections/${id}`;
  try {
    await setDoc(doc(db, 'photoSections', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePhotoSectionFromFirestore(
  sectionId: string,
  user: User | null
) {
  assertAdmin(user);
  const id = sanitizeId(sectionId);
  const path = `photoSections/${id}`;
  try {
    await deleteDoc(doc(db, 'photoSections', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSiteMediaToFirestore(
  slotKey: string,
  imageUrl: string,
  user: User | null
) {
  assertAdmin(user);
  const cleanUrl = imageUrl.trim();
  if (!cleanUrl || cleanUrl.length > 450000) {
    throw new Error('Image URL or upload exceeds the maximum size allowed.');
  }
  const mediaId = slotKeyToDocId(slotKey);
  const path = `siteMedia/${mediaId}`;
  try {
    await setDoc(doc(db, 'siteMedia', mediaId), {
      slotKey: clampStr(slotKey, 128),
      imageUrl: cleanUrl,
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSiteMediaFromFirestore(slotKey: string, user: User | null) {
  assertAdmin(user);
  const mediaId = slotKeyToDocId(slotKey);
  const path = `siteMedia/${mediaId}`;
  try {
    await deleteDoc(doc(db, 'siteMedia', mediaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedSiteDefaultsToFirestore(
  defaults: SiteConfig,
  user: User | null
) {
  assertAdmin(user);
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'siteSettings', 'main'), buildSiteSettingsPayload(defaults, user.uid));

    const menuSource = defaults.customMenuItems.length > 0 ? defaults.customMenuItems : MENU_ITEMS;
    menuSource.forEach((item, index) => {
      const { id, payload } = buildMenuItemPayload(item, index, user.uid);
      batch.set(doc(db, 'menuItems', id), payload);
    });

    defaults.customPhotoSections.forEach((section, index) => {
      const { id, payload } = buildPhotoSectionPayload(section, index, user.uid);
      batch.set(doc(db, 'photoSections', id), payload);
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch_seed');
  }
}

export async function resetAllSiteContentInFirestore(
  defaults: SiteConfig,
  existingMediaKeys: string[],
  existingMenuIds: string[],
  existingSectionIds: string[],
  user: User | null
) {
  assertAdmin(user);
  try {
    const batch = writeBatch(db);

    for (const slotKey of existingMediaKeys) {
      batch.delete(doc(db, 'siteMedia', slotKeyToDocId(slotKey)));
    }
    for (const oldId of existingMenuIds) {
      batch.delete(doc(db, 'menuItems', sanitizeId(oldId)));
    }
    for (const oldSecId of existingSectionIds) {
      batch.delete(doc(db, 'photoSections', sanitizeId(oldSecId)));
    }

    batch.set(doc(db, 'siteSettings', 'main'), buildSiteSettingsPayload(defaults, user.uid));
    defaults.customMenuItems.forEach((item, index) => {
      const { id, payload } = buildMenuItemPayload(item, index, user.uid);
      batch.set(doc(db, 'menuItems', id), payload);
    });
    defaults.customPhotoSections.forEach((section, index) => {
      const { id, payload } = buildPhotoSectionPayload(section, index, user.uid);
      batch.set(doc(db, 'photoSections', id), payload);
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch_reset');
  }
}
