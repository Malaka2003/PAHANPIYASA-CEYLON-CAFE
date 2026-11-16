import { MenuItem } from '../data/cafeData';

export type ThemeId =
  | 'village-ella'
  | 'golden-ella'
  | 'tea-estate'
  | 'cinnamon-brass'
  | 'highland-monsoon';
export type HeroLayout = 'panoramic' | 'split';
export type MenuViewMode = 'gallery' | 'cards' | 'board';
export type FontStyle = 'editorial' | 'modern';
export type SectionId = 'menu' | 'gallery' | 'experience' | 'visit-us' | 'contact';

export type CustomSectionLayout = 'auto' | 'single' | 'two-up' | 'grid' | 'split';

export interface CustomSectionPhoto {
  id: string;
  slotKey: string;
  defaultSrc?: string;
  caption?: string;
}

export interface CustomPhotoSection {
  id: string;
  kicker?: string;
  title: string;
  description: string;
  layout: CustomSectionLayout;
  visible: boolean;
  photos: CustomSectionPhoto[];
}

export interface ThemePalette {
  id: ThemeId;
  name: string;
  subtitle: string;
  canvas: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  warmAccent: string;
  espresso: string;
}

export interface SiteConfig {
  themeId: ThemeId;
  heroLayout: HeroLayout;
  menuViewMode: MenuViewMode;
  fontStyle: FontStyle;
  cafeName: string;
  ayubowanGreeting: string;
  locationLabel: string;
  heroHeadline: string;
  heroAccentLine: string;
  heroSubtitle: string;
  openingHours: string;
  phoneDisplay: string;
  whatsappNumber: string;
  email: string;
  showSinhalaSubtitles: boolean;
  sectionOrder: SectionId[];
  hiddenSections: SectionId[];
  customMenuItems: MenuItem[];
  customPhotoSections: CustomPhotoSection[];
}

export type CustomImagesMap = Record<string, string>;
