/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import {
  ArrowDown,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  UtensilsCrossed,
} from 'lucide-react';
import {
  CAFE_INFO,
  MENU_ITEMS,
  MenuCategoryId,
  MenuItem,
  SRI_LANKA_DARK_THEMES,
  SRI_LANKA_THEMES,
} from './data/cafeData';
import { auth, isVerifiedOwnerAdmin } from './firebase';
import {
  recordAdminLogin,
  subscribeStorefrontData,
} from './services/siteFirestore';
import {
  CustomImagesMap,
  CustomPhotoSection,
  MenuViewMode,
  SectionId,
  SiteConfig,
} from './types/siteConfig';
import { Navbar } from './components/Navbar';
import { StoryMenuBand } from './components/StoryMenuBand';
import { MenuSection } from './components/MenuSection';
import { CustomPhotoSections } from './components/CustomPhotoSections';
import { SriLankanExperienceSection } from './components/SriLankanExperienceSection';
import { VisitUsSection } from './components/VisitUsSection';
import { ContactSection } from './components/ContactSection';
import { OrderTrayDrawer } from './components/OrderTrayDrawer';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard, AdminTab } from './components/AdminDashboard';
import { ResilientImage } from './components/ResilientImage';

const TRAY_STORAGE_KEY = 'ella_cloudscape_tray_v1';
const COLOR_MODE_STORAGE_KEY = 'pahanpiyasa_color_mode_v1';

const DEFAULT_PHOTO_SECTIONS: CustomPhotoSection[] = [
  {
    id: 'village-veranda-moments',
    kicker: 'Demodara Village · ගමේ සිරියාව',
    title: 'Wooden Veranda, Clay-Pot Dishes & Mountain Views',
    description:
      'Glimpses of our timber veranda overlooking the tea hills, freshly cooked Sri Lankan village dishes, and golden thambili refreshments.',
    layout: 'grid',
    visible: true,
    photos: [
      {
        id: 'default-p1',
        slotKey: 'sec:village-veranda-moments:default-p1',
        defaultSrc: '/src/assets/images/hero_ella_cloudscape_1794858474215.jpg',
        caption: 'Morning mist drifting across the tea hills from our village veranda',
      },
      {
        id: 'default-p2',
        slotKey: 'sec:village-veranda-moments:default-p2',
        defaultSrc: '/src/assets/images/cat_roti_kottu_1794858475364.jpg',
        caption: 'Hand-griddled Sri Lankan pol roti, vegetable roti, and sizzling kottu',
      },
      {
        id: 'default-p3',
        slotKey: 'sec:village-veranda-moments:default-p3',
        defaultSrc: '/src/assets/images/cat_tropical_drinks_1794858476342.jpg',
        caption: 'Fresh golden king coconut (thambili), mango juice, and highland ice coffee',
      },
    ],
  },
];

const DEFAULT_SECTION_ORDER: SectionId[] = [
  'menu',
  'gallery',
  'experience',
  'visit-us',
  'contact',
];

const DEFAULT_CONFIG: SiteConfig = {
  themeId: 'village-ella',
  heroLayout: 'panoramic',
  menuViewMode: 'gallery',
  fontStyle: 'editorial',
  cafeName: CAFE_INFO.name,
  ayubowanGreeting: CAFE_INFO.ayubowan,
  locationLabel: CAFE_INFO.location,
  heroHeadline: 'Fresh Village Flavours.',
  heroAccentLine: 'True Sri Lankan Hospitality.',
  heroSubtitle:
    'Rest under our wooden veranda in Demodara overlooking misty tea hills — with warm pol roti, clay-pot rice & curry, and chilled golden thambili.',
  openingHours: CAFE_INFO.hours,
  phoneDisplay: CAFE_INFO.phoneDisplay,
  whatsappNumber: CAFE_INFO.whatsappNumber,
  email: CAFE_INFO.email,
  showSinhalaSubtitles: true,
  sectionOrder: DEFAULT_SECTION_ORDER,
  hiddenSections: [],
  customMenuItems: MENU_ITEMS,
  customPhotoSections: DEFAULT_PHOTO_SECTIONS,
};

export default function App() {
  const [cloudSettings, setCloudSettings] = useState<Partial<SiteConfig> | null>(null);
  const [cloudMenuItems, setCloudMenuItems] = useState<MenuItem[] | null>(null);
  const [cloudPhotoSections, setCloudPhotoSections] = useState<CustomPhotoSection[] | null>(null);
  const [customImages, setCustomImages] = useState<CustomImagesMap>({});

  const [authState, setAuthState] = useState<{
    user: User | null;
    ready: boolean;
  }>({ user: null, ready: false });
  const currentUser = authState.user;
  const authReady = authState.ready;

  const [visitorMenuViewOverride, setVisitorMenuViewOverride] =
    useState<MenuViewMode | null>(null);

  const [externalCategorySelection, setExternalCategorySelection] = useState<{
    category: MenuCategoryId;
    seq: number;
  } | null>(null);

  const [trayQuantities, setTrayQuantities] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(TRAY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {
      // Ignore storage read errors
    }
    return {};
  });

  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<AdminTab>('photos');
  const ownerTapRef = useRef<{ count: number; lastAt: number }>({ count: 0, lastAt: 0 });
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ) {
        return 'dark';
      }
    } catch {
      // Ignore storage read errors
    }
    return 'light';
  });

  const isOwnerAdmin = isVerifiedOwnerAdmin(currentUser);

  // Compose authoritative storefront configuration (Firestore values override defaults)
  const validCloudOrder = Array.isArray(cloudSettings?.sectionOrder)
    ? cloudSettings.sectionOrder.filter((id): id is SectionId =>
        DEFAULT_SECTION_ORDER.includes(id)
      )
    : [];

  const config: SiteConfig = {
    ...DEFAULT_CONFIG,
    ...(cloudSettings ?? {}),
    sectionOrder:
      validCloudOrder.length === DEFAULT_SECTION_ORDER.length
        ? validCloudOrder
        : DEFAULT_SECTION_ORDER,
    hiddenSections: Array.isArray(cloudSettings?.hiddenSections)
      ? cloudSettings.hiddenSections
      : DEFAULT_CONFIG.hiddenSections,
    customMenuItems: cloudMenuItems ?? DEFAULT_CONFIG.customMenuItems,
    customPhotoSections: cloudPhotoSections ?? DEFAULT_CONFIG.customPhotoSections,
  };

  // Subscribe to Firebase Auth & ID token state (picks up emailVerified refreshes)
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      setAuthState({ user, ready: true });
      if (isVerifiedOwnerAdmin(user)) {
        void recordAdminLogin(user).catch((err) => {
          console.error('Failed to record admin login:', err);
        });
      } else {
        setIsDashboardOpen(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to live read-only storefront collections from Firestore
  useEffect(() => {
    const unsubscribe = subscribeStorefrontData({
      onSettings: (settings) => setCloudSettings(settings),
      onMenuItems: (items) => setCloudMenuItems(items),
      onPhotoSections: (sections) => setCloudPhotoSections(sections),
      onMediaMap: (media) => setCustomImages(media),
    });
    return () => unsubscribe();
  }, []);

  // Open owner login / dashboard when visiting /#admin or ?admin=1
  useEffect(() => {
    if (!authReady) return;

    const checkAdminRoute = () => {
      const wantsAdmin =
        window.location.hash === '#admin' ||
        new URLSearchParams(window.location.search).get('admin') === '1';
      if (!wantsAdmin) return;

      if (isVerifiedOwnerAdmin(currentUser)) {
        setIsLoginModalOpen(false);
        setIsDashboardOpen(true);
      } else {
        setIsLoginModalOpen(true);
      }
    };

    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    return () => window.removeEventListener('hashchange', checkAdminRoute);
  }, [authReady, currentUser]);

  // Keyboard shortcut (Ctrl/Cmd + Shift + A) to open private Owner Login / Admin Dashboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (isVerifiedOwnerAdmin(currentUser)) {
          setIsDashboardOpen(true);
        } else {
          setIsLoginModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentUser]);

  // Sync theme palette (Light or Dark mode) & typography tokens to :root
  useEffect(() => {
    const paletteSet =
      colorMode === 'dark' ? SRI_LANKA_DARK_THEMES : SRI_LANKA_THEMES;
    const palette = paletteSet[config.themeId] ?? paletteSet['village-ella'];
    const root = document.documentElement;
    root.style.colorScheme = colorMode;
    root.style.setProperty('--canvas', palette.canvas);
    root.style.setProperty('--surface', palette.surface);
    root.style.setProperty('--surface-muted', palette.surfaceMuted);
    root.style.setProperty('--border-color', palette.border);
    root.style.setProperty('--text-primary', palette.textPrimary);
    root.style.setProperty('--text-secondary', palette.textSecondary);
    root.style.setProperty('--text-muted', palette.textMuted);
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent-hover', palette.accentHover);
    root.style.setProperty('--warm-accent', palette.warmAccent);
    root.style.setProperty('--espresso', palette.espresso);
    root.style.setProperty(
      '--font-display-active',
      config.fontStyle === 'modern' ? 'var(--font-sans)' : 'var(--font-display)'
    );
  }, [config.themeId, config.fontStyle, colorMode]);

  useEffect(() => {
    try {
      localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
    } catch {
      // Ignore storage write errors
    }
  }, [colorMode]);

  useEffect(() => {
    try {
      localStorage.setItem(TRAY_STORAGE_KEY, JSON.stringify(trayQuantities));
    } catch {
      // Ignore storage write errors
    }
  }, [trayQuantities]);

  const handleAddItem = (item: MenuItem) => {
    setTrayQuantities((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] ?? 0) + 1,
    }));
  };

  const handleDecrementItem = (itemId: string) => {
    setTrayQuantities((prev) => {
      const current = prev[itemId] ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: current - 1,
      };
    });
  };

  const handleClearTray = () => {
    setTrayQuantities({});
  };

  const openAdminAccess = (tab: AdminTab = 'photos') => {
    if (isVerifiedOwnerAdmin(currentUser)) {
      setDashboardTab(tab);
      setIsDashboardOpen(true);
    } else {
      setDashboardTab(tab);
      setIsLoginModalOpen(true);
    }
  };

  const handleDiscreetOwnerTap = () => {
    const now = Date.now();
    if (now - ownerTapRef.current.lastAt > 2500) {
      ownerTapRef.current = { count: 1, lastAt: now };
    } else {
      ownerTapRef.current = {
        count: ownerTapRef.current.count + 1,
        lastAt: now,
      };
    }
    if (ownerTapRef.current.count >= 5) {
      ownerTapRef.current = { count: 0, lastAt: 0 };
      openAdminAccess('overview');
    }
  };

  const handleQuickJumpCategory = (category: MenuCategoryId) => {
    setExternalCategorySelection((prev) => ({
      category,
      seq: (prev?.seq ?? 0) + 1,
    }));
  };

  const totalTrayCount = Object.values(trayQuantities).reduce((sum, count) => sum + count, 0);
  const availableItemsCount = config.customMenuItems.filter(
    (item) => item.available !== false
  ).length;
  const visibleSections = config.sectionOrder.filter(
    (id) => !config.hiddenSections.includes(id)
  );
  const heroImageSrc = customImages.hero || CAFE_INFO.heroImage;
  const activeMenuViewMode = visitorMenuViewOverride ?? config.menuViewMode;

  const renderSection = (sectionId: SectionId) => {
    if (sectionId === 'menu') {
      return (
        <MenuSection
          key="menu"
          items={config.customMenuItems}
          customImages={customImages}
          viewMode={activeMenuViewMode}
          showSinhalaSubtitles={config.showSinhalaSubtitles}
          externalCategorySelection={externalCategorySelection}
          onChangeViewMode={(mode) => setVisitorMenuViewOverride(mode)}
          trayQuantities={trayQuantities}
          onAddItem={handleAddItem}
          onDecrementItem={handleDecrementItem}
        />
      );
    }

    if (sectionId === 'gallery') {
      return (
        <CustomPhotoSections
          key="gallery"
          sections={config.customPhotoSections}
          customImages={customImages}
          canEdit={isOwnerAdmin}
          onEditSections={
            isOwnerAdmin ? () => openAdminAccess('photos') : undefined
          }
        />
      );
    }

    if (sectionId === 'experience') {
      return (
        <SriLankanExperienceSection
          key="experience"
          bridgeImageSrc={customImages.bridge}
        />
      );
    }

    if (sectionId === 'visit-us') {
      return (
        <VisitUsSection
          key="visit-us"
          cafeName={config.cafeName}
          locationLabel={config.locationLabel}
          openingHours={config.openingHours}
          phoneDisplay={config.phoneDisplay}
          whatsappNumber={config.whatsappNumber}
        />
      );
    }

    return (
      <ContactSection
        key="contact"
        cafeName={config.cafeName}
        locationLabel={config.locationLabel}
        phoneDisplay={config.phoneDisplay}
        whatsappNumber={config.whatsappNumber}
        email={config.email}
      />
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--canvas)',
        color: 'var(--text-primary)',
      }}
    >
      <Navbar
        cafeName={config.cafeName}
        trayCount={totalTrayCount}
        visibleSections={visibleSections}
        colorMode={colorMode}
        onToggleColorMode={() =>
          setColorMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
        }
        onOpenTray={() => setIsTrayOpen(true)}
      />

      <main className="flex-1 overflow-x-clip">
        {/* 01. Home (Hero Terrace Section) */}
        <section id="home" className="relative scroll-mt-16">
          {config.heroLayout === 'panoramic' ? (
            <div className="relative overflow-hidden bg-[#23160D]">
              <div className="min-h-[500px] sm:min-h-[560px] lg:min-h-[600px] w-full relative">
                <ResilientImage
                  src={heroImageSrc}
                  alt={`${config.cafeName} wooden village veranda overlooking tea hills in ${config.locationLabel}`}
                  fallbackLabel={`${config.cafeName} · ${config.locationLabel}`}
                  className="absolute inset-0 w-full h-full object-cover brightness-[0.88] saturate-[1.05]"
                />

                {/* Centered warm Sri Lankan jak-wood gradient scrim */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, rgba(36, 22, 13, 0.86) 0%, rgba(36, 22, 13, 0.72) 55%, rgba(36, 22, 13, 0.48) 100%)',
                  }}
                />

                <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 pt-5 sm:pt-8 pb-22 sm:pb-26">
                  <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
                    <AyubowanLockup
                      greeting={config.ayubowanGreeting}
                      tone="dark"
                      centered
                    />

                    <h1 className="font-display text-[clamp(2.75rem,5.2vw,4.35rem)] leading-[1.08] font-medium tracking-tight text-[#FAF4E8] text-balance">
                      {config.heroHeadline}
                      {config.heroAccentLine && (
                        <span className="block italic font-normal text-[#F2B449] mt-1">
                          {config.heroAccentLine}
                        </span>
                      )}
                    </h1>

                    <p className="text-base sm:text-xl text-[#EFE6D5] max-w-2xl mx-auto leading-relaxed mt-4 mb-5">
                      {config.heroSubtitle}
                    </p>

                    {/* Subtle Sri Lankan lotus hairline divider */}
                    <div
                      className="flex items-center gap-3 w-full max-w-xs mx-auto mb-6"
                      aria-hidden="true"
                    >
                      <span className="h-px flex-1 bg-[#E2A43B]/45" />
                      <svg
                        width="20"
                        height="14"
                        viewBox="0 0 24 16"
                        fill="none"
                        className="text-[#F2B449] shrink-0"
                      >
                        <path
                          d="M12 2C14.2 5.2 14.2 9.4 12 13C9.8 9.4 9.8 5.2 12 2Z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                        <path
                          d="M6.5 5.2C9.5 6.8 11 9.8 11.4 13C8.2 12.2 6.2 9.2 6.5 5.2Z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                        <path
                          d="M17.5 5.2C14.5 6.8 13 9.8 12.6 13C15.8 12.2 17.8 9.2 17.5 5.2Z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                      </svg>
                      <span className="h-px flex-1 bg-[#E2A43B]/45" />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3.5">
                      <a
                        href="#traditional-menu"
                        className="inline-flex items-center gap-2 px-6 py-3 min-h-[46px] text-sm sm:text-base font-semibold rounded-full transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0"
                        style={{
                          backgroundColor: '#E2A43B',
                          color: '#24160D',
                        }}
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>Explore Traditional Menu</span>
                      </a>

                      <a
                        href="#visit-us"
                        className="inline-flex items-center gap-2 px-6 py-3 min-h-[46px] text-sm sm:text-base font-medium text-[#FAF4E8] border border-[#FAF4E8]/60 hover:bg-white/10 rounded-full transition-colors whitespace-nowrap shrink-0"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Visit Us</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Curved Sri Lankan wave transition into handloom parchment */}
              <div className="relative -mt-12 sm:-mt-16 z-20 pointer-events-none">
                <svg
                  viewBox="0 0 1440 90"
                  fill="none"
                  preserveAspectRatio="none"
                  className="w-full h-12 sm:h-16 block"
                  aria-hidden="true"
                >
                  <path
                    d="M0 34C260 88 540 2 760 44C980 86 1220 18 1440 48V90H0V34Z"
                    fill="var(--canvas)"
                  />
                </svg>
                <a
                  href="#our-story"
                  aria-label="Scroll to Our Story"
                  className="pointer-events-auto absolute left-1/2 -translate-x-1/2 -top-4 w-10 h-10 rounded-full border border-[#E2A43B]/70 bg-[#2C1D13]/90 text-[#F2B449] inline-flex items-center justify-center hover:scale-105 transition-transform shadow-sm"
                >
                  <ArrowDown className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            /* Editorial Split Hero Layout */
            <div className="pt-8 pb-10">
              <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div
                  className="lg:col-span-6 border rounded-2xl p-7 sm:p-10 flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div>
                    <AyubowanLockup
                      greeting={config.ayubowanGreeting}
                      tone={colorMode === 'dark' ? 'dark' : 'light'}
                    />
                    <h1
                      className="font-display text-[clamp(2.45rem,4vw,3.75rem)] leading-[1.08] font-medium tracking-tight mb-4 text-balance"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {config.heroHeadline}
                      {config.heroAccentLine && (
                        <span
                          className="block italic font-normal mt-1"
                          style={{ color: 'var(--accent)' }}
                        >
                          {config.heroAccentLine}
                        </span>
                      )}
                    </h1>
                    <p
                      className="text-base sm:text-lg leading-relaxed mb-7 max-w-xl"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {config.heroSubtitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3.5 pt-4">
                    <a
                      href="#traditional-menu"
                      className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] text-sm font-semibold text-white rounded-full transition-colors whitespace-nowrap shrink-0"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>Explore Traditional Menu</span>
                    </a>
                    <a
                      href="#visit-us"
                      className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] text-sm font-medium border rounded-full whitespace-nowrap shrink-0"
                      style={{
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Visit Us</span>
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-6 flex">
                  <div
                    className="w-full rounded-2xl overflow-hidden border"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <ResilientImage
                      src={heroImageSrc}
                      alt={`${config.cafeName} wooden village veranda overlooking tea hills in ${config.locationLabel}`}
                      fallbackLabel={`${config.cafeName} · ${config.locationLabel}`}
                      className="w-full aspect-[4/3] lg:aspect-auto lg:h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 02. Our Story + Quick Menu Directory + Village Hospitality Strip */}
        <StoryMenuBand
          cafeName={config.cafeName}
          customImages={customImages}
          onQuickJumpCategory={handleQuickJumpCategory}
        />

        {/* Read-Only Café Info Strip for Visitors */}
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 pb-12">
          <div
            className="border rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <dl
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="px-5 py-3.5" style={{ borderColor: 'var(--border-color)' }}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  Opening Hours
                </dt>
                <dd className="text-sm font-medium font-mono-tabular">
                  {config.openingHours}
                </dd>
              </div>
              <div className="px-5 py-3.5" style={{ borderColor: 'var(--border-color)' }}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  Village Location
                </dt>
                <dd className="text-sm font-medium">{config.locationLabel}</dd>
              </div>
              <div className="px-5 py-3.5" style={{ borderColor: 'var(--border-color)' }}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  Kitchen Selection
                </dt>
                <dd className="text-sm font-medium font-mono-tabular">
                  {availableItemsCount} Dishes &amp; Drinks
                </dd>
              </div>
              <div className="px-5 py-3.5" style={{ borderColor: 'var(--border-color)' }}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  WhatsApp Orders
                </dt>
                <dd className="text-sm font-medium font-mono-tabular">
                  <a
                    href={`https://wa.me/${config.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    {config.phoneDisplay}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* 03. Traditional Menu · 04. Gallery · 05. Sri Lankan Experience · 06. Visit Us · 07. Contact */}
        {visibleSections.map((sectionId) => renderSection(sectionId))}
      </main>

      {/* Dark Jak-Wood Espresso Footer ("Let's Connect") */}
      <footer
        className="text-[#FAF4E8]"
        style={{ backgroundColor: 'var(--espresso)' }}
      >
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div>
            <p className="font-display italic text-2xl font-medium text-[#F2B449]">
              Let&apos;s Connect
            </p>
            <p className="font-display text-lg font-medium text-[#FAF4E8] mt-1">
              {config.cafeName}
            </p>
            <p
              onClick={handleDiscreetOwnerTap}
              className="text-xs text-[#D8CCB8] mt-1 select-none"
            >
              © 2026 {config.cafeName} · {config.locationLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs font-medium text-[#EFE6D5]">
            <a href="#home" className="hover:text-[#F2B449] whitespace-nowrap">
              Home
            </a>
            <a href="#our-story" className="hover:text-[#F2B449] whitespace-nowrap">
              Our Story
            </a>
            {visibleSections.includes('menu') && (
              <a href="#traditional-menu" className="hover:text-[#F2B449] whitespace-nowrap">
                Traditional Menu
              </a>
            )}
            {visibleSections.includes('gallery') && (
              <a href="#gallery" className="hover:text-[#F2B449] whitespace-nowrap">
                Gallery
              </a>
            )}
            {visibleSections.includes('experience') && (
              <a
                href="#sri-lankan-experience"
                className="hover:text-[#F2B449] whitespace-nowrap"
              >
                Sri Lankan Experience
              </a>
            )}
            {visibleSections.includes('visit-us') && (
              <a href="#visit-us" className="hover:text-[#F2B449] whitespace-nowrap">
                Visit Us
              </a>
            )}
            {visibleSections.includes('contact') && (
              <a href="#contact" className="hover:text-[#F2B449] whitespace-nowrap">
                Reservations
              </a>
            )}
            <a
              href={`https://wa.me/${config.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F2B449] hover:underline whitespace-nowrap"
            >
              WhatsApp {config.phoneDisplay}
            </a>
            {isOwnerAdmin && (
              <button
                type="button"
                onClick={() => openAdminAccess('overview')}
                className="inline-flex items-center gap-1.5 text-[#F2B449] hover:underline whitespace-nowrap cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Floating Admin Return Bar — Strictly rendered ONLY for the verified owner */}
      {isOwnerAdmin && !isDashboardOpen && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            type="button"
            onClick={() => openAdminAccess('photos')}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white rounded-full shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Admin Dashboard</span>
          </button>
        </div>
      )}

      <OrderTrayDrawer
        isOpen={isTrayOpen}
        onClose={() => setIsTrayOpen(false)}
        cafeName={config.cafeName}
        whatsappNumber={config.whatsappNumber}
        menuItems={config.customMenuItems}
        trayQuantities={trayQuantities}
        onAddItem={handleAddItem}
        onDecrementItem={handleDecrementItem}
        onClearTray={handleClearTray}
      />

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        cafeName={config.cafeName}
        onAuthenticated={() => {
          setIsLoginModalOpen(false);
          setIsDashboardOpen(true);
        }}
      />

      {isOwnerAdmin && isDashboardOpen && (
        <AdminDashboard
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          currentUser={currentUser}
          config={config}
          defaultConfig={DEFAULT_CONFIG}
          customImages={customImages}
          hasCloudSettings={cloudSettings !== null}
          hasCloudMenu={cloudMenuItems !== null}
          hasCloudSections={cloudPhotoSections !== null}
          initialTab={dashboardTab}
        />
      )}
    </div>
  );
}

function AyubowanLockup({
  greeting,
  tone,
  centered = false,
}: {
  greeting: string;
  tone: 'dark' | 'light';
  centered?: boolean;
}) {
  const rest = greeting
    .replace('ආයුබෝවන්', '')
    .replace(/^\s*[·—-]\s*/, '')
    .trim();

  return (
    <div
      className={`mb-4 space-y-2 ${
        centered ? 'text-center flex flex-col items-center' : ''
      }`}
    >
      <span
        className={`inline-block ${
          tone === 'dark' ? 'ayubowan-blend-dark' : 'ayubowan-blend-light'
        }`}
      >
        <img
          src="/assets/aistudio/image_383d3ee2.png"
          alt="ආයුබෝවන්"
          className={`h-16 sm:h-20 md:h-24 max-w-full w-auto object-contain select-none ${
            centered ? 'mx-auto' : ''
          } ${tone === 'dark' ? 'ayubowan-tint-dark' : 'ayubowan-tint-light'}`}
        />
      </span>
      {rest && (
        <p
          className="text-sm sm:text-base font-medium tracking-wide"
          style={{ color: tone === 'dark' ? '#F3DFB8' : 'var(--warm-accent)' }}
        >
          {rest}
        </p>
      )}
    </div>
  );
}
