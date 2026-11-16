import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { User, signOut } from 'firebase/auth';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Cloud,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  LayoutDashboard,
  Link2,
  LogOut,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  CAFE_INFO,
  CATEGORY_IMAGE_MAP,
  MENU_CATEGORIES,
  MenuCategoryId,
  MenuItem,
  SRI_LANKA_THEMES,
} from '../data/cafeData';
import { auth, isVerifiedOwnerAdmin } from '../firebase';
import {
  deleteMenuItemFromFirestore,
  deletePhotoSectionFromFirestore,
  deleteSiteMediaFromFirestore,
  resetAllSiteContentInFirestore,
  saveSiteMediaToFirestore,
  saveSiteSettingsToFirestore,
  seedSiteDefaultsToFirestore,
  upsertMenuItemToFirestore,
  upsertPhotoSectionToFirestore,
} from '../services/siteFirestore';
import {
  CustomImagesMap,
  CustomPhotoSection,
  CustomSectionLayout,
  FontStyle,
  HeroLayout,
  MenuViewMode,
  SectionId,
  SiteConfig,
  ThemeId,
} from '../types/siteConfig';
import { downloadJsonConfig, downloadStaticHtml } from '../utils/exportHtml';
import { processImageFile } from '../utils/imageStore';
import { ResilientImage } from './ResilientImage';

export type AdminTab = 'overview' | 'photos' | 'menu' | 'details' | 'appearance';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  config: SiteConfig;
  defaultConfig: SiteConfig;
  customImages: CustomImagesMap;
  hasCloudSettings: boolean;
  hasCloudMenu: boolean;
  hasCloudSections: boolean;
  initialTab?: AdminTab;
}

const SECTION_LABELS: Record<SectionId, string> = {
  menu: '03. Traditional Menu',
  gallery: '04. Gallery & Photo Sections',
  experience: '05. Sri Lankan Experience',
  'visit-us': '06. Visit Us & Map',
  contact: '07. Contact & Reservations',
};

const LAYOUT_OPTIONS: { id: CustomSectionLayout; label: string }[] = [
  { id: 'auto', label: 'Auto Fit' },
  { id: 'single', label: '1 Large Photo' },
  { id: 'two-up', label: '2 Side-by-Side' },
  { id: 'grid', label: 'Multi-Photo Grid' },
  { id: 'split', label: 'Story + Photos' },
];

const NAV_TABS: { id: AdminTab; label: string; shortLabel: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { id: 'photos', label: 'Photos & Gallery', shortLabel: 'Photos', icon: ImagePlus },
  { id: 'menu', label: 'Menu & Prices', shortLabel: 'Menu', icon: UtensilsCrossed },
  { id: 'details', label: 'Website Info', shortLabel: 'Site Info', icon: Store },
  { id: 'appearance', label: 'Theme & Layout', shortLabel: 'Theme', icon: Palette },
];

export function AdminDashboard({
  isOpen,
  onClose,
  currentUser,
  config,
  defaultConfig,
  customImages,
  hasCloudSettings,
  hasCloudMenu,
  hasCloudSections,
  initialTab = 'photos',
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Details tab draft state
  const [detailsDraft, setDetailsDraft] = useState({
    cafeName: config.cafeName,
    ayubowanGreeting: config.ayubowanGreeting,
    heroHeadline: config.heroHeadline,
    heroAccentLine: config.heroAccentLine,
    heroSubtitle: config.heroSubtitle,
    openingHours: config.openingHours,
    locationLabel: config.locationLabel,
    phoneDisplay: config.phoneDisplay,
    email: config.email,
  });
  const [detailsDirty, setDetailsDirty] = useState(false);

  // Menu tab state
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<'all' | MenuCategoryId>('all');
  const [newDishName, setNewDishName] = useState('');
  const [newDishSinhala, setNewDishSinhala] = useState('');
  const [newDishCategory, setNewDishCategory] = useState<MenuCategoryId>('roti');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishNote, setNewDishNote] = useState('');
  const [newDishVeg, setNewDishVeg] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!detailsDirty) {
      setDetailsDraft({
        cafeName: config.cafeName,
        ayubowanGreeting: config.ayubowanGreeting,
        heroHeadline: config.heroHeadline,
        heroAccentLine: config.heroAccentLine,
        heroSubtitle: config.heroSubtitle,
        openingHours: config.openingHours,
        locationLabel: config.locationLabel,
        phoneDisplay: config.phoneDisplay,
        email: config.email,
      });
    }
  }, [
    config.cafeName,
    config.ayubowanGreeting,
    config.heroHeadline,
    config.heroAccentLine,
    config.heroSubtitle,
    config.openingHours,
    config.locationLabel,
    config.phoneDisplay,
    config.email,
    detailsDirty,
  ]);

  if (!isOpen || !isVerifiedOwnerAdmin(currentUser)) {
    return null;
  }

  const runMutation = async (label: string, action: () => Promise<void>) => {
    setSyncStatus('saving');
    setSyncMessage(label);
    try {
      await action();
      setSyncStatus('saved');
      setSyncMessage('Saved to cloud');
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(
        err instanceof Error
          ? err.message
          : 'Could not save changes. Please verify your owner connection.'
      );
    }
  };

  // Ensure Firestore collections are initialized before modifying an individual menu item or gallery section
  const ensureSeededCollections = async () => {
    if (!hasCloudSettings || !hasCloudMenu || !hasCloudSections) {
      await seedSiteDefaultsToFirestore(config, currentUser);
    }
  };

  const handlePublishDefaults = async () => {
    await runMutation('Publishing all defaults to cloud...', async () => {
      await seedSiteDefaultsToFirestore(config, currentUser);
    });
  };

  const handleResetAll = async () => {
    await runMutation('Restoring defaults...', async () => {
      await resetAllSiteContentInFirestore(
        defaultConfig,
        Object.keys(customImages),
        config.customMenuItems.map((m) => m.id),
        config.customPhotoSections.map((s) => s.id),
        currentUser
      );
      setDetailsDirty(false);
      setConfirmReset(false);
    });
  };

  const handleSaveSettingsPatch = async (patch: Partial<SiteConfig>) => {
    await runMutation('Saving settings...', async () => {
      await ensureSeededCollections();
      await saveSiteSettingsToFirestore({ ...config, ...patch }, currentUser);
    });
  };

  const handleSaveDetails = async () => {
    const cleanWhatsapp =
      detailsDraft.phoneDisplay.replace(/\D/g, '') || config.whatsappNumber;
    await runMutation('Saving website details...', async () => {
      await ensureSeededCollections();
      await saveSiteSettingsToFirestore(
        {
          ...config,
          ...detailsDraft,
          whatsappNumber: cleanWhatsapp,
        },
        currentUser
      );
      setDetailsDirty(false);
    });
  };

  const moveSection = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= config.sectionOrder.length) return;
    const nextOrder = [...config.sectionOrder];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(target, 0, moved);
    await handleSaveSettingsPatch({ sectionOrder: nextOrder });
  };

  const toggleSectionVisibility = async (sectionId: SectionId) => {
    const isHidden = config.hiddenSections.includes(sectionId);
    const nextHidden = isHidden
      ? config.hiddenSections.filter((id) => id !== sectionId)
      : [...config.hiddenSections, sectionId];
    await handleSaveSettingsPatch({ hiddenSections: nextHidden });
  };

  // Photo slot uploads
  const handleFileUpload = async (
    slotKey: string,
    file: File,
    maxDimension: number
  ) => {
    await runMutation('Uploading photo...', async () => {
      const dataUrl = await processImageFile(file, maxDimension, 380000);
      await saveSiteMediaToFirestore(slotKey, dataUrl, currentUser);
    });
  };

  const handleSaveMediaUrl = async (slotKey: string, url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    await runMutation('Saving photo link...', async () => {
      await saveSiteMediaToFirestore(slotKey, trimmed, currentUser);
    });
  };

  const handleResetMedia = async (slotKey: string) => {
    await runMutation('Removing custom photo...', async () => {
      await deleteSiteMediaFromFirestore(slotKey, currentUser);
    });
  };

  // Gallery photo sections CRUD
  const handleCreatePhotoSection = async () => {
    const created: CustomPhotoSection = {
      id: `sec-${Date.now()}`,
      kicker: 'Pahanpiyasa Ceylon Café Moments',
      title: 'New Photo Section',
      description: 'Share scenic terrace views, food specials, or guest moments.',
      layout: 'auto',
      visible: true,
      photos: [],
    };
    await runMutation('Creating photo section...', async () => {
      await ensureSeededCollections();
      await upsertPhotoSectionToFirestore(created, 0, currentUser);
    });
  };

  const handleSavePhotoSection = async (
    section: CustomPhotoSection,
    index: number
  ) => {
    await runMutation('Saving gallery section...', async () => {
      await ensureSeededCollections();
      await upsertPhotoSectionToFirestore(section, index, currentUser);
    });
  };

  const handleDeletePhotoSection = async (section: CustomPhotoSection) => {
    await runMutation('Deleting gallery section...', async () => {
      await ensureSeededCollections();
      for (const photo of section.photos) {
        if (customImages[photo.slotKey]) {
          await deleteSiteMediaFromFirestore(photo.slotKey, currentUser);
        }
      }
      await deletePhotoSectionFromFirestore(section.id, currentUser);
    });
  };

  const handleUploadSectionPhotos = async (
    section: CustomPhotoSection,
    index: number,
    files: FileList
  ) => {
    await runMutation('Uploading gallery photos...', async () => {
      await ensureSeededCollections();
      const fileArray = Array.from(files);
      const createdPhotos = [...section.photos];
      for (let i = 0; i < fileArray.length; i++) {
        const dataUrl = await processImageFile(fileArray[i], 1280, 380000);
        const photoId = `ph-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
        const slotKey = `sec:${section.id}:${photoId}`;
        await saveSiteMediaToFirestore(slotKey, dataUrl, currentUser);
        createdPhotos.push({ id: photoId, slotKey, caption: '' });
      }
      await upsertPhotoSectionToFirestore(
        { ...section, photos: createdPhotos },
        index,
        currentUser
      );
    });
  };

  const handleAddSectionPhotoUrl = async (
    section: CustomPhotoSection,
    index: number,
    url: string
  ) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    await runMutation('Adding photo URL...', async () => {
      await ensureSeededCollections();
      const photoId = `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const slotKey = `sec:${section.id}:${photoId}`;
      await saveSiteMediaToFirestore(slotKey, trimmed, currentUser);
      await upsertPhotoSectionToFirestore(
        {
          ...section,
          photos: [...section.photos, { id: photoId, slotKey, caption: '' }],
        },
        index,
        currentUser
      );
    });
  };

  const handleRemoveSectionPhoto = async (
    section: CustomPhotoSection,
    index: number,
    photoId: string,
    slotKey: string
  ) => {
    await runMutation('Removing photo...', async () => {
      await ensureSeededCollections();
      if (customImages[slotKey]) {
        await deleteSiteMediaFromFirestore(slotKey, currentUser);
      }
      await upsertPhotoSectionToFirestore(
        {
          ...section,
          photos: section.photos.filter((p) => p.id !== photoId),
        },
        index,
        currentUser
      );
    });
  };

  // Menu CRUD
  const handleAddCustomDish = async () => {
    if (!newDishName.trim()) return;
    const categoryMeta = MENU_CATEGORIES.find((c) => c.id === newDishCategory);
    const created: MenuItem = {
      id: `custom-${Date.now()}`,
      name: newDishName.trim(),
      sinhalaName: newDishSinhala.trim() || undefined,
      category: newDishCategory,
      categoryLabel: categoryMeta?.label ?? 'Special',
      note: newDishNote.trim() || `Freshly prepared to order at ${config.cafeName}.`,
      vegetarian: newDishVeg,
      styleTag: newDishVeg ? 'House Special · Veg' : 'House Special',
      priceLkr: newDishPrice.trim() || undefined,
      available: true,
    };

    await runMutation('Adding dish to menu...', async () => {
      await ensureSeededCollections();
      await upsertMenuItemToFirestore(created, 0, currentUser);
      setNewDishName('');
      setNewDishSinhala('');
      setNewDishPrice('');
      setNewDishNote('');
    });
  };

  const handleSaveMenuItem = async (item: MenuItem, index: number) => {
    await runMutation(`Saving ${item.name}...`, async () => {
      await ensureSeededCollections();
      await upsertMenuItemToFirestore(item, index, currentUser);
    });
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    await runMutation('Removing dish...', async () => {
      await ensureSeededCollections();
      const slotKey = `item:${itemId}`;
      if (customImages[slotKey]) {
        await deleteSiteMediaFromFirestore(slotKey, currentUser);
      }
      await deleteMenuItemFromFirestore(itemId, currentUser);
    });
  };

  const handleSignOut = async () => {
    await signOut(auth);
    onClose();
  };

  const filteredMenuEditor = config.customMenuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(menuSearch.trim().toLowerCase());
    const matchesCat =
      menuCategoryFilter === 'all' || item.category === menuCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const isCloudSeeded = hasCloudSettings && hasCloudMenu && hasCloudSections;
  const customPhotoCount = Object.keys(customImages).length;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col lg:flex-row"
      role="dialog"
      aria-modal="true"
      aria-label="Owner Admin Dashboard"
      style={{
        backgroundColor: 'var(--canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Desktop Left Sidebar */}
      <aside
        className="hidden lg:flex lg:w-72 lg:flex-col border-r shrink-0"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div
          className="px-6 py-5 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Owner Admin</span>
          </div>
          <h2 className="font-display text-xl font-medium truncate">
            {config.cafeName}
          </h2>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {currentUser.email}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto" aria-label="Admin sections">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-colors cursor-pointer text-left"
                style={{
                  backgroundColor: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#FFFFFF' : 'var(--text-primary)',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div
          className="p-4 border-t space-y-2"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-xl border cursor-pointer"
            style={{
              backgroundColor: 'var(--surface-muted)',
              borderColor: 'var(--border-color)',
            }}
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Live Website</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-xl text-[#9B2C2C] bg-[#FEF2F2] border border-[#FECACA] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (Topbar + Mobile Nav + Workspace) */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Sticky Top Bar (Visible on all sizes, compact on mobile) */}
        <header
          className="px-4 sm:px-6 lg:px-8 py-3.5 border-b flex items-center justify-between gap-3 shrink-0"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg sm:text-xl font-medium truncate">
                {NAV_TABS.find((t) => t.id === activeTab)?.label ?? 'Admin Dashboard'}
              </h1>
              {syncStatus !== 'idle' && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded-full ${
                    syncStatus === 'error'
                      ? 'bg-[#FEF2F2] text-[#9B2C2C]'
                      : syncStatus === 'saving'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {syncStatus === 'saved' && <Check className="w-3 h-3" />}
                  <span>{syncMessage}</span>
                </span>
              )}
            </div>
            <p className="text-xs truncate lg:hidden" style={{ color: 'var(--text-muted)' }}>
              {currentUser.email}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-medium rounded-lg text-[#9B2C2C] bg-[#FEF2F2] border border-[#FECACA] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dashboard and view website"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg border cursor-pointer"
              style={{
                backgroundColor: 'var(--surface-muted)',
                borderColor: 'var(--border-color)',
              }}
            >
              <X className="w-4 h-4" />
              <span>View Site</span>
            </button>
          </div>
        </header>

        {/* Mobile Tab Strip */}
        <div
          className="lg:hidden px-4 py-2.5 border-b flex items-center gap-2 overflow-x-auto shrink-0"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: active ? 'var(--accent)' : 'var(--surface-muted)',
                  color: active ? '#FFFFFF' : 'var(--text-primary)',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {syncStatus === 'error' && syncMessage && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#9B2C2C] text-xs font-medium"
              >
                {syncMessage}
              </div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div
                  className="p-5 sm:p-6 rounded-2xl border space-y-4"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div
                        className="inline-flex items-center gap-1.5 text-xs font-semibold mb-1"
                        style={{ color: 'var(--accent)' }}
                      >
                        <Cloud className="w-4 h-4" />
                        <span>
                          {isCloudSeeded
                            ? 'Cloud Database Active'
                            : 'Ready to Sync Default Site to Cloud'}
                        </span>
                      </div>
                      <h2 className="font-display text-xl font-medium">
                        {isCloudSeeded
                          ? 'Your live website is synced across all devices'
                          : 'Initialize Cloud Storage for Visitors'}
                      </h2>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Only your verified Google account (<strong>{currentUser.email}</strong>)
                        can modify photos, menus, prices, or site text. All visitors see a
                        protected read-only view.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handlePublishDefaults}
                      disabled={syncStatus === 'saving'}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white rounded-xl shrink-0 cursor-pointer disabled:opacity-60"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {isCloudSeeded ? 'Sync Current Site Now' : 'Publish Defaults to Cloud'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Menu Dishes
                      </p>
                      <p className="font-display text-2xl font-medium mt-1">
                        {config.customMenuItems.length}
                      </p>
                    </div>
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Gallery Sections
                      </p>
                      <p className="font-display text-2xl font-medium mt-1">
                        {config.customPhotoSections.length}
                      </p>
                    </div>
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Uploaded Custom Photos
                      </p>
                      <p className="font-display text-2xl font-medium mt-1">
                        {customPhotoCount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className="p-5 rounded-2xl border space-y-3"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <h3 className="font-display text-lg font-medium">
                      Static Export &amp; Backup
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Download a standalone HTML snapshot or JSON backup of your current
                      menu, photos, and Sri Lankan theme.
                    </p>
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => downloadStaticHtml(config, customImages)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs font-medium text-white rounded-xl cursor-pointer"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        <Download className="w-4 h-4" />
                        <span>Download index.html</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadJsonConfig(config)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs font-medium rounded-xl border cursor-pointer"
                        style={{
                          backgroundColor: 'var(--surface-muted)',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        <Download className="w-4 h-4" />
                        <span>JSON Backup</span>
                      </button>
                    </div>
                  </div>

                  <div
                    className="p-5 rounded-2xl border space-y-3"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <h3 className="font-display text-lg font-medium">
                      Reset to Original Defaults
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Restore the default Sri Lankan Village look, default veranda gallery,
                      and standard 44-item menu across the live cloud site.
                    </p>
                    {confirmReset ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleResetAll}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-[#9B2C2C] rounded-xl cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Confirm Full Reset</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="px-4 py-2.5 min-h-[42px] text-xs font-medium rounded-xl border cursor-pointer"
                          style={{
                            backgroundColor: 'var(--surface-muted)',
                            borderColor: 'var(--border-color)',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Site to Defaults</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PHOTOS & GALLERY TAB */}
            {activeTab === 'photos' && (
              <div className="space-y-8">
                {/* Gallery Sections */}
                <section className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-medium">
                        Gallery Photo Sections
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Create gallery sections, upload photos from phone or computer, edit captions, or remove pictures.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreatePhotoSection}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Photo Section</span>
                    </button>
                  </div>

                  {config.customPhotoSections.length === 0 ? (
                    <div
                      className="p-6 rounded-2xl border text-center space-y-2"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <p className="text-sm font-medium">No gallery sections yet</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Tap &ldquo;Add Photo Section&rdquo; to create a gallery section for your café.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {config.customPhotoSections.map((section, idx) => (
                        <PhotoSectionEditorCard
                          key={section.id}
                          section={section}
                          customImages={customImages}
                          onSave={(updated) => handleSavePhotoSection(updated, idx)}
                          onDelete={() => handleDeletePhotoSection(section)}
                          onUploadFiles={(files) =>
                            handleUploadSectionPhotos(section, idx, files)
                          }
                          onAddUrl={(url) =>
                            handleAddSectionPhotoUrl(section, idx, url)
                          }
                          onRemovePhoto={(photoId, slotKey) =>
                            handleRemoveSectionPhoto(section, idx, photoId, slotKey)
                          }
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Primary Hero & Category Photos */}
                <section className="space-y-4">
                  <div>
                    <h2 className="font-display text-xl font-medium">
                      Main Terrace &amp; Category Photos
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Replace the hero backdrop, Nine Arch Bridge picture, or menu category thumbnails.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ImageSlotCard
                      title="Hero Café View"
                      subtitle="Displayed at the top of the Home section"
                      currentSrc={customImages.hero || CAFE_INFO.heroImage}
                      isCustom={Boolean(customImages.hero)}
                      onUploadFile={(file) => handleFileUpload('hero', file, 1440)}
                      onSaveUrl={(url) => handleSaveMediaUrl('hero', url)}
                      onReset={() => handleResetMedia('hero')}
                    />
                    <ImageSlotCard
                      title="Nine Arch Bridge Photo"
                      subtitle="Displayed in Sri Lankan Experience"
                      currentSrc={customImages.bridge || CAFE_INFO.bridgeImage}
                      isCustom={Boolean(customImages.bridge)}
                      onUploadFile={(file) => handleFileUpload('bridge', file, 1280)}
                      onSaveUrl={(url) => handleSaveMediaUrl('bridge', url)}
                      onReset={() => handleResetMedia('bridge')}
                    />
                    {MENU_CATEGORIES.map((cat) => {
                      const slotKey = `cat:${cat.id}`;
                      const fallback = CATEGORY_IMAGE_MAP[cat.id]?.image ?? cat.image;
                      return (
                        <ImageSlotCard
                          key={cat.id}
                          title={`${cat.label} (${cat.sinhalaLabel})`}
                          subtitle={cat.subtitle}
                          currentSrc={customImages[slotKey] || fallback}
                          isCustom={Boolean(customImages[slotKey])}
                          onUploadFile={(file) => handleFileUpload(slotKey, file, 960)}
                          onSaveUrl={(url) => handleSaveMediaUrl(slotKey, url)}
                          onReset={() => handleResetMedia(slotKey)}
                        />
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* MENU & PRICES TAB */}
            {activeTab === 'menu' && (
              <div className="space-y-6">
                {/* Add New Dish Card */}
                <div
                  className="p-5 rounded-2xl border space-y-3.5"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <h2 className="font-display text-lg font-medium">
                    Add New Dish or Drink
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newDishName}
                      onChange={(e) => setNewDishName(e.target.value)}
                      placeholder="Dish name (e.g. Ceylon Ginger Tea)"
                      className="px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                    <input
                      type="text"
                      value={newDishSinhala}
                      onChange={(e) => setNewDishSinhala(e.target.value)}
                      placeholder="Sinhala name (optional)"
                      className="px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                    <select
                      value={newDishCategory}
                      onChange={(e) => setNewDishCategory(e.target.value as MenuCategoryId)}
                      aria-label="New dish category"
                      className="px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      {MENU_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newDishPrice}
                      onChange={(e) => setNewDishPrice(e.target.value)}
                      placeholder="Price in LKR (e.g. 850)"
                      className="px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    value={newDishNote}
                    onChange={(e) => setNewDishNote(e.target.value)}
                    placeholder="Short description..."
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                    style={{
                      backgroundColor: 'var(--canvas)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer min-h-[40px]">
                      <input
                        type="checkbox"
                        checked={newDishVeg}
                        onChange={(e) => setNewDishVeg(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span>Vegetarian dish</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddCustomDish}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white rounded-xl cursor-pointer"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to Menu</span>
                    </button>
                  </div>
                </div>

                {/* Filter & Dish Editor */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Search
                        className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}
                      />
                      <input
                        type="text"
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        placeholder="Search dishes by name..."
                        className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--border-color)',
                        }}
                      />
                    </div>
                    <select
                      value={menuCategoryFilter}
                      onChange={(e) =>
                        setMenuCategoryFilter(e.target.value as 'all' | MenuCategoryId)
                      }
                      aria-label="Filter menu by category"
                      className="px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border sm:w-56"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <option value="all">All Categories ({config.customMenuItems.length})</option>
                      {MENU_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    {filteredMenuEditor.map((item) => {
                      const originalIndex = config.customMenuItems.findIndex(
                        (m) => m.id === item.id
                      );
                      const itemSlotKey = `item:${item.id}`;
                      const hasCustomPhoto = Boolean(customImages[itemSlotKey]);
                      const previewThumb =
                        customImages[itemSlotKey] ||
                        customImages[`cat:${item.category}`] ||
                        CATEGORY_IMAGE_MAP[item.category]?.image;

                      return (
                        <DishEditorCard
                          key={item.id}
                          item={item}
                          previewThumb={previewThumb}
                          hasCustomPhoto={hasCustomPhoto}
                          onSave={(updated) =>
                            handleSaveMenuItem(
                              updated,
                              originalIndex >= 0 ? originalIndex : 0
                            )
                          }
                          onDelete={() => handleDeleteMenuItem(item.id)}
                          onUploadDishPhoto={(file) =>
                            handleFileUpload(itemSlotKey, file, 800)
                          }
                          onRemoveDishPhoto={() => handleResetMedia(itemSlotKey)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* WEBSITE DETAILS TAB */}
            {activeTab === 'details' && (
              <div
                className="p-5 sm:p-6 rounded-2xl border space-y-5"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-medium">
                      Café Information &amp; Hero Copy
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Edit your brand name, headlines, opening hours, WhatsApp phone, and email.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveDetails}
                    disabled={syncStatus === 'saving'}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white rounded-xl cursor-pointer disabled:opacity-60 shrink-0"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <Save className="w-4 h-4" />
                    <span>{detailsDirty ? 'Save Changes' : 'Save Website Info'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Café Name
                    </label>
                    <input
                      type="text"
                      value={detailsDraft.cafeName}
                      onChange={(e) => {
                        setDetailsDirty(true);
                        setDetailsDraft((p) => ({ ...p, cafeName: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Welcome Subtitle (Under ආයුබෝවන්)
                    </label>
                    <input
                      type="text"
                      value={detailsDraft.ayubowanGreeting}
                      onChange={(e) => {
                        setDetailsDirty(true);
                        setDetailsDraft((p) => ({ ...p, ayubowanGreeting: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Hero Headline
                    </label>
                    <input
                      type="text"
                      value={detailsDraft.heroHeadline}
                      onChange={(e) => {
                        setDetailsDirty(true);
                        setDetailsDraft((p) => ({ ...p, heroHeadline: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Hero Golden Accent Line
                    </label>
                    <input
                      type="text"
                      value={detailsDraft.heroAccentLine}
                      onChange={(e) => {
                        setDetailsDirty(true);
                        setDetailsDraft((p) => ({ ...p, heroAccentLine: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Hero Description
                  </label>
                  <textarea
                    rows={3}
                    value={detailsDraft.heroSubtitle}
                    onChange={(e) => {
                      setDetailsDirty(true);
                      setDetailsDraft((p) => ({ ...p, heroSubtitle: e.target.value }));
                    }}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border"
                    style={{
                      backgroundColor: 'var(--canvas)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Opening Hours
                    </label>
                    <input
                      type="text"
                      value={detailsDraft.openingHours}
                      onChange={(e) => {
                        setDetailsDirty(true);
                        setDetailsDraft((p) => ({ ...p, openingHours: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Village Location Label
                    </label>
                    <input
                      type="text"
                      value={detailsDraft.locationLabel}
                      onChange={(e) => {
                        setDetailsDirty(true);
                        setDetailsDraft((p) => ({ ...p, locationLabel: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Phone &amp; WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={detailsDraft.phoneDisplay}
                      onChange={(e) => {
                        setDetailsDirty(true);
                        setDetailsDraft((p) => ({ ...p, phoneDisplay: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={detailsDraft.email}
                      onChange={(e) => {
                        setDetailsDirty(true);
                        setDetailsDraft((p) => ({ ...p, email: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* THEME & LAYOUT TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div
                  className="p-5 sm:p-6 rounded-2xl border space-y-4"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <h2 className="font-display text-lg font-medium">
                    Sri Lankan Atmosphere Theme
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      Object.values(SRI_LANKA_THEMES) as (typeof SRI_LANKA_THEMES)[ThemeId][]
                    ).map((theme) => {
                      const selected = config.themeId === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => handleSaveSettingsPatch({ themeId: theme.id })}
                          className="p-4 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer min-h-[64px]"
                          style={{
                            backgroundColor: 'var(--canvas)',
                            borderColor: selected ? 'var(--accent)' : 'var(--border-color)',
                            boxShadow: selected ? '0 0 0 1px var(--accent)' : 'none',
                          }}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{theme.name}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {theme.subtitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="w-5 h-5 rounded-full border"
                              style={{
                                backgroundColor: theme.canvas,
                                borderColor: theme.border,
                              }}
                            />
                            <span
                              className="w-5 h-5 rounded-full"
                              style={{ backgroundColor: theme.accent }}
                            />
                            <span
                              className="w-5 h-5 rounded-full"
                              style={{ backgroundColor: theme.warmAccent }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="p-5 sm:p-6 rounded-2xl border space-y-5"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Hero Composition
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { id: 'panoramic', label: 'Panoramic Terrace' },
                            { id: 'split', label: 'Editorial Split' },
                          ] as { id: HeroLayout; label: string }[]
                        ).map((opt) => {
                          const selected = config.heroLayout === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSaveSettingsPatch({ heroLayout: opt.id })}
                              className="py-2.5 px-3 min-h-[44px] text-xs font-medium rounded-xl border cursor-pointer"
                              style={{
                                backgroundColor: selected ? 'var(--accent)' : 'var(--canvas)',
                                borderColor: selected ? 'var(--accent)' : 'var(--border-color)',
                                color: selected ? '#FFFFFF' : 'var(--text-primary)',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Default Menu View
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { id: 'gallery', label: 'Photo Cards' },
                            { id: 'cards', label: 'Clean Grid' },
                            { id: 'board', label: 'Menu Board' },
                          ] as { id: MenuViewMode; label: string }[]
                        ).map((opt) => {
                          const selected = config.menuViewMode === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSaveSettingsPatch({ menuViewMode: opt.id })}
                              className="py-2.5 px-2 min-h-[44px] text-xs font-medium rounded-xl border cursor-pointer"
                              style={{
                                backgroundColor: selected ? 'var(--accent)' : 'var(--canvas)',
                                borderColor: selected ? 'var(--accent)' : 'var(--border-color)',
                                color: selected ? '#FFFFFF' : 'var(--text-primary)',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Heading Font
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { id: 'editorial', label: 'Serif' },
                            { id: 'modern', label: 'Sans' },
                          ] as { id: FontStyle; label: string }[]
                        ).map((opt) => {
                          const selected = config.fontStyle === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSaveSettingsPatch({ fontStyle: opt.id })}
                              className="py-2.5 px-3 min-h-[44px] text-xs font-medium rounded-xl border cursor-pointer"
                              style={{
                                backgroundColor: selected ? 'var(--accent)' : 'var(--canvas)',
                                borderColor: selected ? 'var(--accent)' : 'var(--border-color)',
                                color: selected ? '#FFFFFF' : 'var(--text-primary)',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Sinhala Dish Subtitles
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveSettingsPatch({
                            showSinhalaSubtitles: !config.showSinhalaSubtitles,
                          })
                        }
                        className="w-full py-2.5 px-3 min-h-[44px] text-xs font-medium rounded-xl border cursor-pointer"
                        style={{
                          backgroundColor: config.showSinhalaSubtitles
                            ? 'var(--accent)'
                            : 'var(--canvas)',
                          borderColor: config.showSinhalaSubtitles
                            ? 'var(--accent)'
                            : 'var(--border-color)',
                          color: config.showSinhalaSubtitles
                            ? '#FFFFFF'
                            : 'var(--text-primary)',
                        }}
                      >
                        {config.showSinhalaSubtitles ? 'Shown (සිංහල)' : 'Hidden'}
                      </button>
                    </div>
                  </div>

                  {/* Section Ordering & Visibility */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Website Section Order &amp; Visibility
                    </p>
                    <div
                      className="rounded-xl border divide-y"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      {config.sectionOrder.map((secId, idx) => {
                        const isHidden = config.hiddenSections.includes(secId);
                        return (
                          <div
                            key={secId}
                            className="px-4 py-3 flex items-center justify-between gap-2"
                            style={{ borderColor: 'var(--border-color)' }}
                          >
                            <span
                              className={`text-sm font-medium ${
                                isHidden ? 'opacity-45 line-through' : ''
                              }`}
                            >
                              {SECTION_LABELS[secId]}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveSection(idx, -1)}
                                aria-label={`Move ${SECTION_LABELS[secId]} up`}
                                className="p-2 min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg disabled:opacity-30 cursor-pointer"
                                style={{ backgroundColor: 'var(--surface-muted)' }}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === config.sectionOrder.length - 1}
                                onClick={() => moveSection(idx, 1)}
                                aria-label={`Move ${SECTION_LABELS[secId]} down`}
                                className="p-2 min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg disabled:opacity-30 cursor-pointer"
                                style={{ backgroundColor: 'var(--surface-muted)' }}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleSectionVisibility(secId)}
                                aria-label={
                                  isHidden
                                    ? `Show ${SECTION_LABELS[secId]}`
                                    : `Hide ${SECTION_LABELS[secId]}`
                                }
                                className="p-2 min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg cursor-pointer"
                                style={{ backgroundColor: 'var(--surface-muted)' }}
                              >
                                {isHidden ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoSectionEditorCard({
  section,
  customImages,
  onSave,
  onDelete,
  onUploadFiles,
  onAddUrl,
  onRemovePhoto,
}: {
  section: CustomPhotoSection;
  customImages: CustomImagesMap;
  onSave: (updated: CustomPhotoSection) => Promise<void>;
  onDelete: () => Promise<void>;
  onUploadFiles: (files: FileList) => Promise<void>;
  onAddUrl: (url: string) => Promise<void>;
  onRemovePhoto: (photoId: string, slotKey: string) => Promise<void>;
}) {
  const multiFileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<CustomPhotoSection>(section);
  const [dirty, setDirty] = useState(false);
  const [showUrlBox, setShowUrlBox] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setDraft(section);
    setDirty(false);
  }, [section]);

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl border space-y-4"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
          {section.photos.length} {section.photos.length === 1 ? 'Picture' : 'Pictures'}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {dirty && (
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-semibold text-white rounded-lg cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Text &amp; Captions</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSave({ ...draft, visible: !draft.visible })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-medium rounded-lg cursor-pointer"
            style={{ backgroundColor: 'var(--surface-muted)' }}
          >
            {draft.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{draft.visible ? 'Shown' : 'Hidden'}</span>
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onDelete}
                className="px-3 py-1.5 min-h-[38px] text-xs font-semibold text-white bg-[#9B2C2C] rounded-lg cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 min-h-[38px] text-xs rounded-lg border cursor-pointer"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label={`Delete section ${section.title}`}
              className="p-2 min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg text-[#9B2C2C] bg-[#FEF2F2] cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={draft.kicker ?? ''}
          onChange={(e) => {
            setDirty(true);
            setDraft((p) => ({ ...p, kicker: e.target.value }));
          }}
          placeholder="Small label (e.g. Terrace Views)"
          className="px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border"
          style={{
            backgroundColor: 'var(--canvas)',
            borderColor: 'var(--border-color)',
          }}
        />
        <select
          value={draft.layout}
          onChange={(e) => {
            const layout = e.target.value as CustomSectionLayout;
            setDraft((p) => ({ ...p, layout }));
            void onSave({ ...draft, layout });
          }}
          aria-label="Section layout"
          className="px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border"
          style={{
            backgroundColor: 'var(--canvas)',
            borderColor: 'var(--border-color)',
          }}
        >
          {LAYOUT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              Layout: {opt.label}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        value={draft.title}
        onChange={(e) => {
          setDirty(true);
          setDraft((p) => ({ ...p, title: e.target.value }));
        }}
        placeholder="Section Heading"
        className="w-full px-3.5 py-2.5 min-h-[42px] text-sm font-medium rounded-xl border"
        style={{
          backgroundColor: 'var(--canvas)',
          borderColor: 'var(--border-color)',
        }}
      />

      <textarea
        rows={2}
        value={draft.description}
        onChange={(e) => {
          setDirty(true);
          setDraft((p) => ({ ...p, description: e.target.value }));
        }}
        placeholder="Short story or description..."
        className="w-full px-3.5 py-2.5 text-xs rounded-xl border"
        style={{
          backgroundColor: 'var(--canvas)',
          borderColor: 'var(--border-color)',
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={multiFileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              void onUploadFiles(e.target.files);
              e.target.value = '';
            }
          }}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => multiFileRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs font-semibold text-white rounded-xl cursor-pointer"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <ImagePlus className="w-4 h-4" />
          <span>Upload 1+ Photos</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrlBox((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs font-medium rounded-xl border cursor-pointer"
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderColor: 'var(--border-color)',
          }}
        >
          <Link2 className="w-4 h-4" />
          <span>Add by URL</span>
        </button>
      </div>

      {showUrlBox && (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="flex-1 px-3.5 py-2 min-h-[42px] text-xs rounded-xl border"
            style={{
              backgroundColor: 'var(--canvas)',
              borderColor: 'var(--border-color)',
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (urlInput.trim()) {
                void onAddUrl(urlInput);
                setUrlInput('');
                setShowUrlBox(false);
              }
            }}
            className="px-4 py-2 min-h-[42px] text-xs font-semibold text-white rounded-xl cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Add
          </button>
        </div>
      )}

      {draft.photos.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {draft.photos.map((photo) => {
            const src = customImages[photo.slotKey] || photo.defaultSrc || '';
            return (
              <div
                key={photo.id}
                className="p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-2.5"
                style={{
                  backgroundColor: 'var(--canvas)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div
                    className="w-16 h-12 rounded-lg overflow-hidden border shrink-0"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    {src && (
                      <ResilientImage
                        src={src}
                        alt={photo.caption || draft.title}
                        fallbackLabel={draft.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <input
                    type="text"
                    value={photo.caption ?? ''}
                    onChange={(e) => {
                      setDirty(true);
                      const caption = e.target.value;
                      setDraft((p) => ({
                        ...p,
                        photos: p.photos.map((ph) =>
                          ph.id === photo.id ? { ...ph, caption } : ph
                        ),
                      }));
                    }}
                    placeholder="Photo caption..."
                    className="flex-1 min-w-0 px-3 py-2 min-h-[40px] text-xs rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void onRemovePhoto(photo.id, photo.slotKey)}
                  aria-label="Remove photo"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] cursor-pointer shrink-0 self-end sm:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="sm:hidden">Remove</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ImageSlotCard({
  title,
  subtitle,
  currentSrc,
  isCustom,
  onUploadFile,
  onSaveUrl,
  onReset,
}: {
  title: string;
  subtitle: string;
  currentSrc: string;
  isCustom: boolean;
  onUploadFile: (file: File) => Promise<void>;
  onSaveUrl: (url: string) => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState(
    isCustom && !currentSrc.startsWith('data:') ? currentSrc : ''
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void onUploadFile(file);
      e.target.value = '';
    }
  };

  return (
    <div
      className="p-4 rounded-2xl border space-y-3"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center gap-3.5">
        <div
          className="w-20 h-14 rounded-xl overflow-hidden border shrink-0"
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderColor: 'var(--border-color)',
          }}
        >
          <ResilientImage
            src={currentSrc}
            alt={title}
            fallbackLabel={title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{title}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {isCustom ? 'Custom photo active' : subtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-white rounded-xl cursor-pointer"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <ImagePlus className="w-3.5 h-3.5" />
          <span>Upload Photo</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-xl border cursor-pointer"
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderColor: 'var(--border-color)',
          }}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Paste URL</span>
        </button>

        {isCustom && (
          <button
            type="button"
            onClick={() => void onReset()}
            className="inline-flex items-center gap-1 px-3 py-2 min-h-[40px] text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] rounded-xl cursor-pointer ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {showUrlInput && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://example.com/your-photo.jpg"
            className="flex-1 px-3 py-2 min-h-[40px] text-xs rounded-xl border"
            style={{
              backgroundColor: 'var(--canvas)',
              borderColor: 'var(--border-color)',
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (urlValue.trim()) {
                void onSaveUrl(urlValue);
                setShowUrlInput(false);
              }
            }}
            className="px-4 py-2 min-h-[40px] text-xs font-semibold text-white rounded-xl cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

function DishEditorCard({
  item,
  previewThumb,
  hasCustomPhoto,
  onSave,
  onDelete,
  onUploadDishPhoto,
  onRemoveDishPhoto,
}: {
  item: MenuItem;
  previewThumb?: string;
  hasCustomPhoto: boolean;
  onSave: (updated: MenuItem) => Promise<void>;
  onDelete: () => Promise<void>;
  onUploadDishPhoto: (file: File) => Promise<void>;
  onRemoveDishPhoto: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<MenuItem>(item);
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setDraft(item);
    setDirty(false);
  }, [item]);

  return (
    <div
      className="p-4 rounded-2xl border space-y-3"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-14 h-12 rounded-xl overflow-hidden border shrink-0"
            style={{
              backgroundColor: 'var(--surface-muted)',
              borderColor: 'var(--border-color)',
            }}
          >
            {previewThumb && (
              <ResilientImage
                src={previewThumb}
                alt={draft.name}
                fallbackLabel={draft.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold" style={{ color: 'var(--warm-accent)' }}>
              {item.categoryLabel}
              {hasCustomPhoto ? ' · Custom Photo' : ''}
            </p>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => {
                setDirty(true);
                setDraft((p) => ({ ...p, name: e.target.value }));
              }}
              aria-label={`Dish name for ${item.name}`}
              className={`w-full mt-0.5 px-2.5 py-1.5 text-sm font-medium rounded-lg border ${
                draft.available === false ? 'opacity-55 line-through' : ''
              }`}
              style={{
                backgroundColor: 'var(--canvas)',
                borderColor: 'var(--border-color)',
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onSave({ ...draft, available: draft.available === false })}
          className="inline-flex items-center gap-1 px-2.5 py-2 min-h-[38px] text-xs font-medium rounded-lg shrink-0 cursor-pointer"
          style={{ backgroundColor: 'var(--surface-muted)' }}
          aria-label={draft.available === false ? `Show ${item.name}` : `Hide ${item.name}`}
        >
          {draft.available === false ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hidden</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Available</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <input
          type="text"
          value={draft.priceLkr ?? ''}
          onChange={(e) => {
            setDirty(true);
            setDraft((p) => ({ ...p, priceLkr: e.target.value }));
          }}
          placeholder="Price in LKR (e.g. 950)"
          aria-label={`Price in LKR for ${item.name}`}
          className="px-3 py-2 min-h-[40px] text-xs font-mono-tabular rounded-xl border"
          style={{
            backgroundColor: 'var(--canvas)',
            borderColor: 'var(--border-color)',
          }}
        />
        <input
          type="text"
          value={draft.note}
          onChange={(e) => {
            setDirty(true);
            setDraft((p) => ({ ...p, note: e.target.value }));
          }}
          placeholder="Dish description..."
          aria-label={`Description for ${item.name}`}
          className="sm:col-span-2 px-3 py-2 min-h-[40px] text-xs rounded-xl border"
          style={{
            backgroundColor: 'var(--canvas)',
            borderColor: 'var(--border-color)',
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void onUploadDishPhoto(file);
                e.target.value = '';
              }
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-medium rounded-lg border cursor-pointer"
            style={{
              backgroundColor: 'var(--surface-muted)',
              borderColor: 'var(--border-color)',
            }}
          >
            <ImagePlus className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>{hasCustomPhoto ? 'Change Photo' : 'Upload Photo'}</span>
          </button>

          {hasCustomPhoto && (
            <button
              type="button"
              onClick={() => void onRemoveDishPhoto()}
              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[38px] text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] rounded-lg cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Photo</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {dirty && (
            <button
              type="button"
              onClick={() => void onSave(draft)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[38px] text-xs font-semibold text-white rounded-lg cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          )}

          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void onDelete()}
                className="px-3 py-1.5 min-h-[38px] text-xs font-semibold text-white bg-[#9B2C2C] rounded-lg cursor-pointer"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 min-h-[38px] text-xs rounded-lg border cursor-pointer"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label={`Delete ${item.name}`}
              className="p-2 min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg text-[#9B2C2C] bg-[#FEF2F2] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
