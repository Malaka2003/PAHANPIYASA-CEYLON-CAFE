import { ChangeEvent, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  EyeOff,
  ImagePlus,
  Link2,
  Plus,
  RotateCcw,
  Trash2,
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

interface CustomizerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig;
  customImages: CustomImagesMap;
  initialTab?: CustomizerTab;
  onUpdateConfig: (updater: (prev: SiteConfig) => SiteConfig) => void;
  onSaveCustomImage: (slotKey: string, value: string) => Promise<void>;
  onResetCustomImage: (slotKey: string) => Promise<void>;
  onResetConfig: () => void;
}

export type CustomizerTab =
  | 'sections'
  | 'images'
  | 'vibe'
  | 'details'
  | 'menu'
  | 'export';

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

export function CustomizerDrawer({
  isOpen,
  onClose,
  config,
  customImages,
  initialTab = 'sections',
  onUpdateConfig,
  onSaveCustomImage,
  onResetCustomImage,
  onResetConfig,
}: CustomizerDrawerProps) {
  const [activeTab, setActiveTab] = useState<CustomizerTab>(initialTab);
  const [menuSearch, setMenuSearch] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [newDishName, setNewDishName] = useState('');
  const [newDishSinhala, setNewDishSinhala] = useState('');
  const [newDishCategory, setNewDishCategory] = useState<MenuCategoryId>('roti');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishNote, setNewDishNote] = useState('');
  const [newDishVeg, setNewDishVeg] = useState(true);

  if (!isOpen) return null;

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= config.sectionOrder.length) return;
    onUpdateConfig((prev) => {
      const nextOrder = [...prev.sectionOrder];
      const [moved] = nextOrder.splice(index, 1);
      nextOrder.splice(target, 0, moved);
      return { ...prev, sectionOrder: nextOrder };
    });
  };

  const toggleSectionVisibility = (sectionId: SectionId) => {
    onUpdateConfig((prev) => {
      const isHidden = prev.hiddenSections.includes(sectionId);
      return {
        ...prev,
        hiddenSections: isHidden
          ? prev.hiddenSections.filter((id) => id !== sectionId)
          : [...prev.hiddenSections, sectionId],
      };
    });
  };

  const handleCreatePhotoSection = () => {
    const created: CustomPhotoSection = {
      id: `sec-${Date.now()}`,
      kicker: 'Pahanpiyasa Ceylon Café Moments',
      title: 'New Photo Section',
      description: 'Share scenic terrace views, food specials, or guest moments.',
      layout: 'auto',
      visible: true,
      photos: [],
    };
    onUpdateConfig((prev) => ({
      ...prev,
      customPhotoSections: [created, ...prev.customPhotoSections],
    }));
  };

  const handleUpdatePhotoSection = (
    sectionId: string,
    patch: Partial<CustomPhotoSection>
  ) => {
    onUpdateConfig((prev) => ({
      ...prev,
      customPhotoSections: prev.customPhotoSections.map((sec) =>
        sec.id === sectionId ? { ...sec, ...patch } : sec
      ),
    }));
  };

  const handleDeletePhotoSection = async (section: CustomPhotoSection) => {
    for (const photo of section.photos) {
      if (customImages[photo.slotKey]) {
        await onResetCustomImage(photo.slotKey);
      }
    }
    onUpdateConfig((prev) => ({
      ...prev,
      customPhotoSections: prev.customPhotoSections.filter((s) => s.id !== section.id),
    }));
  };

  const handleUploadSectionPhotos = async (
    sectionId: string,
    files: FileList
  ) => {
    setImageError(null);
    const fileArray = Array.from(files);
    const createdPhotos: { id: string; slotKey: string; caption: string }[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const dataUrl = await processImageFile(file, 1400);
        const photoId = `ph-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
        const slotKey = `sec:${sectionId}:${photoId}`;
        await onSaveCustomImage(slotKey, dataUrl);
        createdPhotos.push({ id: photoId, slotKey, caption: '' });
      } catch (err) {
        setImageError(
          err instanceof Error ? err.message : 'Unable to process one of the selected photos.'
        );
      }
    }

    if (createdPhotos.length > 0) {
      onUpdateConfig((prev) => ({
        ...prev,
        customPhotoSections: prev.customPhotoSections.map((sec) =>
          sec.id === sectionId
            ? { ...sec, photos: [...sec.photos, ...createdPhotos] }
            : sec
        ),
      }));
    }
  };

  const handleAddSectionPhotoUrl = async (sectionId: string, url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const photoId = `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const slotKey = `sec:${sectionId}:${photoId}`;
    await onSaveCustomImage(slotKey, trimmed);
    onUpdateConfig((prev) => ({
      ...prev,
      customPhotoSections: prev.customPhotoSections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              photos: [...sec.photos, { id: photoId, slotKey, caption: '' }],
            }
          : sec
      ),
    }));
  };

  const handleRemoveSectionPhoto = async (
    sectionId: string,
    photoId: string,
    slotKey: string
  ) => {
    if (customImages[slotKey]) {
      await onResetCustomImage(slotKey);
    }
    onUpdateConfig((prev) => ({
      ...prev,
      customPhotoSections: prev.customPhotoSections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, photos: sec.photos.filter((p) => p.id !== photoId) }
          : sec
      ),
    }));
  };

  const handleUpdatePhotoCaption = (
    sectionId: string,
    photoId: string,
    caption: string
  ) => {
    onUpdateConfig((prev) => ({
      ...prev,
      customPhotoSections: prev.customPhotoSections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              photos: sec.photos.map((p) =>
                p.id === photoId ? { ...p, caption } : p
              ),
            }
          : sec
      ),
    }));
  };

  const handleUpdateMenuItem = (id: string, patch: Partial<MenuItem>) => {
    onUpdateConfig((prev) => ({
      ...prev,
      customMenuItems: prev.customMenuItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleAddCustomDish = () => {
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

    onUpdateConfig((prev) => ({
      ...prev,
      customMenuItems: [created, ...prev.customMenuItems],
    }));

    setNewDishName('');
    setNewDishSinhala('');
    setNewDishPrice('');
    setNewDishNote('');
  };

  const handleFileUpload = async (
    slotKey: string,
    file: File,
    maxDimension: number
  ) => {
    try {
      setImageError(null);
      const dataUrl = await processImageFile(file, maxDimension);
      await onSaveCustomImage(slotKey, dataUrl);
    } catch (err) {
      setImageError(
        err instanceof Error ? err.message : 'Unable to upload that image.'
      );
    }
  };

  const filteredMenuEditor = config.customMenuItems.filter((item) =>
    item.name.toLowerCase().includes(menuSearch.trim().toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Customize Web Page"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full flex flex-col border-l shadow-xl"
        style={{
          backgroundColor: 'var(--canvas)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between gap-4 border-b"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div>
            <h2 className="font-display text-xl font-medium">Customize Web Page</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Add photo sections, upload your own pictures, and edit café details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customizer"
            className="p-2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg hover:opacity-80 cursor-pointer"
            style={{ backgroundColor: 'var(--surface-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className="px-6 py-2.5 flex items-center gap-1.5 border-b overflow-x-auto"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          {(
            [
              { id: 'sections', label: 'Photo Sections' },
              { id: 'images', label: 'Site Photos' },
              { id: 'vibe', label: 'Vibe & Layout' },
              { id: 'details', label: 'Café Details' },
              { id: 'menu', label: 'Menu & Prices' },
              { id: 'export', label: 'Export' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="px-3 py-2 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: active ? 'var(--accent)' : 'var(--surface-muted)',
                  color: active ? '#FFFFFF' : 'var(--text-primary)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {imageError && (
            <p
              role="alert"
              className="text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3.5 py-2.5"
            >
              {imageError}
            </p>
          )}

          {activeTab === 'sections' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Custom Photo Sections
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Add sections with 1, 2, or multiple pictures and captions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreatePhotoSection}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-medium text-white rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              </div>

              {config.customPhotoSections.length === 0 ? (
                <div
                  className="p-6 rounded-xl border text-center space-y-3"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <p className="text-sm font-medium">No custom photo sections yet</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Create a section to showcase 1 or more pictures of your café, balcony views, or special dishes.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {config.customPhotoSections.map((section) => (
                    <PhotoSectionEditorCard
                      key={section.id}
                      section={section}
                      customImages={customImages}
                      onUpdate={(patch) => handleUpdatePhotoSection(section.id, patch)}
                      onDelete={() => handleDeletePhotoSection(section)}
                      onUploadFiles={(files) =>
                        handleUploadSectionPhotos(section.id, files)
                      }
                      onAddUrl={(url) => handleAddSectionPhotoUrl(section.id, url)}
                      onRemovePhoto={(photoId, slotKey) =>
                        handleRemoveSectionPhoto(section.id, photoId, slotKey)
                      }
                      onUpdateCaption={(photoId, caption) =>
                        handleUpdatePhotoCaption(section.id, photoId, caption)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-6">
              {/* Primary Scene Photos */}
              <div className="space-y-3">
                <div>
                  <p
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Main Café &amp; Location Photos
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Upload photos directly from your phone/computer or paste an image URL.
                  </p>
                </div>

                <ImageSlotCard
                  title="Hero Café View"
                  subtitle="Displayed at the top of your page"
                  currentSrc={customImages.hero || CAFE_INFO.heroImage}
                  isCustom={Boolean(customImages.hero)}
                  onUploadFile={(file) => handleFileUpload('hero', file, 1600)}
                  onSaveUrl={(url) => onSaveCustomImage('hero', url)}
                  onReset={() => onResetCustomImage('hero')}
                />

                <ImageSlotCard
                  title="Nine Arch Bridge Photo"
                  subtitle="Displayed in the Nine Arch Bridge heritage section"
                  currentSrc={customImages.bridge || CAFE_INFO.bridgeImage}
                  isCustom={Boolean(customImages.bridge)}
                  onUploadFile={(file) => handleFileUpload('bridge', file, 1400)}
                  onSaveUrl={(url) => onSaveCustomImage('bridge', url)}
                  onReset={() => onResetCustomImage('bridge')}
                />
              </div>

              {/* Category Photos */}
              <div className="space-y-3">
                <div>
                  <p
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Menu Category Photos
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Customize photos by food category, or attach photos to individual dishes inside the Menu &amp; Prices tab.
                  </p>
                </div>

                <div className="space-y-3">
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
                        onSaveUrl={(url) => onSaveCustomImage(slotKey, url)}
                        onReset={() => onResetCustomImage(slotKey)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vibe' && (
            <>
              {/* Sri Lankan Palette Presets */}
              <div className="space-y-2.5">
                <p
                  className="text-xs font-semibold tracking-wide"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Sri Lankan Color Vibe
                </p>
                <div className="space-y-2">
                  {(
                    Object.values(SRI_LANKA_THEMES) as (typeof SRI_LANKA_THEMES)[ThemeId][]
                  ).map((theme) => {
                    const selected = config.themeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() =>
                          onUpdateConfig((prev) => ({ ...prev, themeId: theme.id }))
                        }
                        className="w-full p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: selected ? 'var(--accent)' : 'var(--border-color)',
                          boxShadow: selected ? '0 0 0 1px var(--accent)' : 'none',
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium">{theme.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
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

              {/* Hero Layout */}
              <div className="space-y-2">
                <p
                  className="text-xs font-semibold tracking-wide"
                  style={{ color: 'var(--text-secondary)' }}
                >
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
                        onClick={() =>
                          onUpdateConfig((prev) => ({ ...prev, heroLayout: opt.id }))
                        }
                        className="py-2.5 px-3 min-h-[40px] text-xs font-medium rounded-lg border cursor-pointer"
                        style={{
                          backgroundColor: selected ? 'var(--accent)' : 'var(--surface)',
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

              {/* Default Menu Layout */}
              <div className="space-y-2">
                <p
                  className="text-xs font-semibold tracking-wide"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Menu Layout Style
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
                        onClick={() =>
                          onUpdateConfig((prev) => ({ ...prev, menuViewMode: opt.id }))
                        }
                        className="py-2.5 px-2 min-h-[40px] text-xs font-medium rounded-lg border cursor-pointer"
                        style={{
                          backgroundColor: selected ? 'var(--accent)' : 'var(--surface)',
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

              {/* Typography & Sinhala subtitles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Heading Font
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
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
                          onClick={() =>
                            onUpdateConfig((prev) => ({ ...prev, fontStyle: opt.id }))
                          }
                          className="py-2 px-2 text-xs font-medium rounded-lg border cursor-pointer"
                          style={{
                            backgroundColor: selected ? 'var(--accent)' : 'var(--surface)',
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
                  <p
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Sinhala Dish Names
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig((prev) => ({
                        ...prev,
                        showSinhalaSubtitles: !prev.showSinhalaSubtitles,
                      }))
                    }
                    className="w-full py-2 px-3 text-xs font-medium rounded-lg border cursor-pointer"
                    style={{
                      backgroundColor: config.showSinhalaSubtitles
                        ? 'var(--accent)'
                        : 'var(--surface)',
                      borderColor: config.showSinhalaSubtitles
                        ? 'var(--accent)'
                        : 'var(--border-color)',
                      color: config.showSinhalaSubtitles ? '#FFFFFF' : 'var(--text-primary)',
                    }}
                  >
                    {config.showSinhalaSubtitles ? 'Shown (සිංහල)' : 'Hidden'}
                  </button>
                </div>
              </div>

              {/* Flexible Section Order & Visibility */}
              <div className="space-y-2">
                <p
                  className="text-xs font-semibold tracking-wide"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Core Section Order &amp; Visibility
                </p>
                <div
                  className="rounded-xl border divide-y"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {config.sectionOrder.map((secId, idx) => {
                    const isHidden = config.hiddenSections.includes(secId);
                    return (
                      <div
                        key={secId}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-2"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <span
                          className={`text-sm font-medium ${isHidden ? 'opacity-45 line-through' : ''}`}
                        >
                          {SECTION_LABELS[secId]}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveSection(idx, -1)}
                            aria-label={`Move ${SECTION_LABELS[secId]} up`}
                            className="p-1.5 rounded-md disabled:opacity-30 hover:opacity-80 cursor-pointer"
                            style={{ backgroundColor: 'var(--surface-muted)' }}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === config.sectionOrder.length - 1}
                            onClick={() => moveSection(idx, 1)}
                            aria-label={`Move ${SECTION_LABELS[secId]} down`}
                            className="p-1.5 rounded-md disabled:opacity-30 hover:opacity-80 cursor-pointer"
                            style={{ backgroundColor: 'var(--surface-muted)' }}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSectionVisibility(secId)}
                            aria-label={
                              isHidden
                                ? `Show ${SECTION_LABELS[secId]}`
                                : `Hide ${SECTION_LABELS[secId]}`
                            }
                            className="p-1.5 rounded-md hover:opacity-80 cursor-pointer"
                            style={{ backgroundColor: 'var(--surface-muted)' }}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Café Wordmark
                </label>
                <input
                  type="text"
                  value={config.cafeName}
                  onChange={(e) =>
                    onUpdateConfig((prev) => ({ ...prev, cafeName: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Sri Lankan Welcome Greeting
                </label>
                <input
                  type="text"
                  value={config.ayubowanGreeting}
                  onChange={(e) =>
                    onUpdateConfig((prev) => ({ ...prev, ayubowanGreeting: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={config.heroHeadline}
                  onChange={(e) =>
                    onUpdateConfig((prev) => ({ ...prev, heroHeadline: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Hero Golden Accent Line
                </label>
                <input
                  type="text"
                  value={config.heroAccentLine}
                  onChange={(e) =>
                    onUpdateConfig((prev) => ({ ...prev, heroAccentLine: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Hero Description
                </label>
                <textarea
                  rows={3}
                  value={config.heroSubtitle}
                  onChange={(e) =>
                    onUpdateConfig((prev) => ({ ...prev, heroSubtitle: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    value={config.openingHours}
                    onChange={(e) =>
                      onUpdateConfig((prev) => ({ ...prev, openingHours: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Location Label
                  </label>
                  <input
                    type="text"
                    value={config.locationLabel}
                    onChange={(e) =>
                      onUpdateConfig((prev) => ({ ...prev, locationLabel: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Phone Display
                  </label>
                  <input
                    type="text"
                    value={config.phoneDisplay}
                    onChange={(e) =>
                      onUpdateConfig((prev) => ({
                        ...prev,
                        phoneDisplay: e.target.value,
                        whatsappNumber:
                          e.target.value.replace(/\D/g, '') || prev.whatsappNumber,
                      }))
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={config.email}
                    onChange={(e) =>
                      onUpdateConfig((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-5">
              {/* Add New Dish */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <p className="text-xs font-semibold">Add New Dish or Drink</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    placeholder="Dish name (e.g. Ceylon Tea Pot)"
                    className="px-3 py-2 text-xs rounded-lg border"
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
                    className="px-3 py-2 text-xs rounded-lg border"
                    style={{
                      backgroundColor: 'var(--canvas)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value as MenuCategoryId)}
                    className="px-3 py-2 text-xs rounded-lg border"
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
                    placeholder="Price in LKR (optional)"
                    className="px-3 py-2 text-xs rounded-lg border"
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
                  className="w-full px-3 py-2 text-xs rounded-lg border"
                  style={{
                    backgroundColor: 'var(--canvas)',
                    borderColor: 'var(--border-color)',
                  }}
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newDishVeg}
                      onChange={(e) => setNewDishVeg(e.target.checked)}
                    />
                    <span>Vegetarian</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCustomDish}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white rounded-lg cursor-pointer"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Edit Existing Prices, Individual Photos & Availability */}
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Filter dishes to upload photo, set LKR price, or hide..."
                  className="w-full px-3.5 py-2 text-xs rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                />

                <div
                  className="rounded-xl border divide-y max-h-[380px] overflow-y-auto"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {filteredMenuEditor.map((item) => {
                    const itemSlotKey = `item:${item.id}`;
                    const hasCustomPhoto = Boolean(customImages[itemSlotKey]);
                    const previewThumb =
                      customImages[itemSlotKey] ||
                      customImages[`cat:${item.category}`] ||
                      CATEGORY_IMAGE_MAP[item.category]?.image;

                    return (
                      <DishEditorRow
                        key={item.id}
                        item={item}
                        previewThumb={previewThumb}
                        hasCustomPhoto={hasCustomPhoto}
                        onChangePrice={(val) => handleUpdateMenuItem(item.id, { priceLkr: val })}
                        onToggleVisible={() =>
                          handleUpdateMenuItem(item.id, {
                            available: item.available === false,
                          })
                        }
                        onUploadDishPhoto={(file) =>
                          handleFileUpload(itemSlotKey, file, 800)
                        }
                        onRemoveDishPhoto={() => onResetCustomImage(itemSlotKey)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div
                className="p-5 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <h3 className="font-display text-lg font-medium">
                  Export for GitHub Pages
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Download a standalone <code className="font-mono-tabular">index.html</code> reflecting your selected Sri Lankan theme, uploaded photos, photo sections, café details, and menu prices.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => downloadStaticHtml(config, customImages)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-xs font-medium text-white rounded-lg cursor-pointer"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download index.html</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadJsonConfig(config)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-xs font-medium rounded-lg border cursor-pointer"
                    style={{
                      backgroundColor: 'var(--surface-muted)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Save JSON Backup</span>
                  </button>
                </div>
              </div>

              <div
                className="p-5 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <h3 className="font-display text-lg font-medium">Reset Customizations</h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Restore the default Sri Lankan Village vibe, default photos, 7-section layout, and standard 44-item traditional menu.
                </p>
                <button
                  type="button"
                  onClick={onResetConfig}
                  className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Everything to Defaults</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PhotoSectionEditorCard({
  section,
  customImages,
  onUpdate,
  onDelete,
  onUploadFiles,
  onAddUrl,
  onRemovePhoto,
  onUpdateCaption,
}: {
  section: CustomPhotoSection;
  customImages: CustomImagesMap;
  onUpdate: (patch: Partial<CustomPhotoSection>) => void;
  onDelete: () => void;
  onUploadFiles: (files: FileList) => void;
  onAddUrl: (url: string) => void;
  onRemovePhoto: (photoId: string, slotKey: string) => void;
  onUpdateCaption: (photoId: string, caption: string) => void;
}) {
  const multiFileRef = useRef<HTMLInputElement>(null);
  const [showUrlBox, setShowUrlBox] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  return (
    <div
      className="p-4 rounded-xl border space-y-3.5"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Title & Visibility / Delete */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
          {section.photos.length} {section.photos.length === 1 ? 'Picture' : 'Pictures'}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdate({ visible: !section.visible })}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md cursor-pointer"
            style={{ backgroundColor: 'var(--surface-muted)' }}
          >
            {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{section.visible ? 'Shown' : 'Hidden'}</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete section ${section.title}`}
            className="p-1.5 rounded-md text-[#9B2C2C] bg-[#FEF2F2] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Text Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <input
          type="text"
          value={section.kicker ?? ''}
          onChange={(e) => onUpdate({ kicker: e.target.value })}
          placeholder="Small label (e.g. Terrace Views)"
          className="px-3 py-2 text-xs rounded-lg border"
          style={{
            backgroundColor: 'var(--canvas)',
            borderColor: 'var(--border-color)',
          }}
        />
        <select
          value={section.layout}
          onChange={(e) =>
            onUpdate({ layout: e.target.value as CustomSectionLayout })
          }
          aria-label="Section layout"
          className="px-3 py-2 text-xs rounded-lg border"
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
        value={section.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        placeholder="Section Heading"
        className="w-full px-3 py-2 text-sm font-medium rounded-lg border"
        style={{
          backgroundColor: 'var(--canvas)',
          borderColor: 'var(--border-color)',
        }}
      />

      <textarea
        rows={2}
        value={section.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Short story or description..."
        className="w-full px-3 py-2 text-xs rounded-lg border"
        style={{
          backgroundColor: 'var(--canvas)',
          borderColor: 'var(--border-color)',
        }}
      />

      {/* Upload 1 or multiple photos */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={multiFileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onUploadFiles(e.target.files);
              e.target.value = '';
            }
          }}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => multiFileRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium text-white rounded-lg cursor-pointer"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <ImagePlus className="w-3.5 h-3.5" />
          <span>Upload 1+ Photos</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrlBox((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border cursor-pointer"
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderColor: 'var(--border-color)',
          }}
        >
          <Link2 className="w-3.5 h-3.5" />
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
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border"
            style={{
              backgroundColor: 'var(--canvas)',
              borderColor: 'var(--border-color)',
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (urlInput.trim()) {
                onAddUrl(urlInput);
                setUrlInput('');
                setShowUrlBox(false);
              }
            }}
            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Add
          </button>
        </div>
      )}

      {/* Existing photos inside this section */}
      {section.photos.length > 0 && (
        <div className="space-y-2 pt-1">
          {section.photos.map((photo) => {
            const src = customImages[photo.slotKey] || photo.defaultSrc || '';
            return (
              <div
                key={photo.id}
                className="p-2 rounded-lg border flex items-center gap-2.5"
                style={{
                  backgroundColor: 'var(--canvas)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div
                  className="w-14 h-11 rounded overflow-hidden border shrink-0"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  {src && (
                    <ResilientImage
                      src={src}
                      alt={photo.caption || section.title}
                      fallbackLabel={section.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <input
                  type="text"
                  value={photo.caption ?? ''}
                  onChange={(e) => onUpdateCaption(photo.id, e.target.value)}
                  placeholder="Optional photo caption..."
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                />

                <button
                  type="button"
                  onClick={() => onRemovePhoto(photo.id, photo.slotKey)}
                  aria-label="Remove photo"
                  className="p-1.5 rounded text-[#9B2C2C] bg-[#FEF2F2] cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
  onUploadFile: (file: File) => void;
  onSaveUrl: (url: string) => void;
  onReset: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState(
    isCustom && !currentSrc.startsWith('data:') ? currentSrc : ''
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    onSaveUrl(trimmed);
    setShowUrlInput(false);
  };

  return (
    <div
      className="p-3.5 rounded-xl border space-y-3"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center gap-3.5">
        <div
          className="w-20 h-14 rounded-lg overflow-hidden border shrink-0"
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
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {isCustom ? 'Using your custom photo' : subtitle}
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium text-white rounded-lg cursor-pointer"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <ImagePlus className="w-3.5 h-3.5" />
          <span>Upload Photo</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border cursor-pointer"
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
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] rounded-lg cursor-pointer ml-auto"
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
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border"
            style={{
              backgroundColor: 'var(--canvas)',
              borderColor: 'var(--border-color)',
            }}
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

function DishEditorRow({
  item,
  previewThumb,
  hasCustomPhoto,
  onChangePrice,
  onToggleVisible,
  onUploadDishPhoto,
  onRemoveDishPhoto,
}: {
  item: MenuItem;
  previewThumb?: string;
  hasCustomPhoto: boolean;
  onChangePrice: (val: string) => void;
  onToggleVisible: () => void;
  onUploadDishPhoto: (file: File) => void;
  onRemoveDishPhoto: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="p-3 flex items-center justify-between gap-2.5"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div
        className="w-11 h-9 rounded-md overflow-hidden border shrink-0"
        style={{
          backgroundColor: 'var(--surface-muted)',
          borderColor: 'var(--border-color)',
        }}
      >
        {previewThumb && (
          <ResilientImage
            src={previewThumb}
            alt={item.name}
            fallbackLabel={item.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-xs font-medium truncate ${
            item.available === false ? 'opacity-45 line-through' : ''
          }`}
        >
          {item.name}
        </p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {item.categoryLabel}
          {hasCustomPhoto ? ' · Custom Photo' : ''}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUploadDishPhoto(file);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title="Upload custom photo for this dish"
        aria-label={`Upload photo for ${item.name}`}
        className="p-1.5 rounded-md cursor-pointer"
        style={{
          backgroundColor: hasCustomPhoto ? 'var(--accent)' : 'var(--surface-muted)',
          color: hasCustomPhoto ? '#FFFFFF' : 'var(--text-primary)',
        }}
      >
        <ImagePlus className="w-3.5 h-3.5" />
      </button>

      {hasCustomPhoto && (
        <button
          type="button"
          onClick={onRemoveDishPhoto}
          title="Remove custom photo"
          aria-label={`Remove custom photo for ${item.name}`}
          className="p-1.5 rounded-md text-[#9B2C2C] bg-[#FEF2F2] cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      <input
        type="text"
        value={item.priceLkr ?? ''}
        onChange={(e) => onChangePrice(e.target.value)}
        placeholder="LKR"
        aria-label={`Price in LKR for ${item.name}`}
        className="w-16 px-2 py-1 text-xs font-mono-tabular rounded border"
        style={{
          backgroundColor: 'var(--canvas)',
          borderColor: 'var(--border-color)',
        }}
      />

      <button
        type="button"
        onClick={onToggleVisible}
        className="p-1.5 rounded-md cursor-pointer"
        style={{ backgroundColor: 'var(--surface-muted)' }}
        aria-label={item.available === false ? `Show ${item.name}` : `Hide ${item.name}`}
      >
        {item.available === false ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
