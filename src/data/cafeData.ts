import { ThemeId, ThemePalette } from '../types/siteConfig';

export type MenuCategoryId =
  | 'roti'
  | 'juice'
  | 'milkshake'
  | 'rice'
  | 'rice&curry'
  | 'kottu'
  | 'sweets'
  | 'buns';

export interface MenuCategory {
  id: MenuCategoryId;
  label: string;
  sinhalaLabel: string;
  subtitle: string;
  image: string;
  imageAlt: string;
}

export interface MenuItemOption {
  id: string;
  name: string;
  sinhalaName?: string;
  priceLkr?: string;
  available?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  sinhalaName?: string;
  category: MenuCategoryId;
  categoryLabel: string;
  note: string;
  vegetarian: boolean;
  styleTag: string;
  priceLkr?: string;
  available?: boolean;
  options?: MenuItemOption[];
}

export function getOptionMediaSlotKey(itemId: string, optionId: string): string {
  return `opt:${itemId}:${optionId}`;
}

export function getTrayItemKey(itemId: string, optionId?: string): string {
  return optionId ? `${itemId}::${optionId}` : itemId;
}

export function parseTrayItemKey(trayKey: string): {
  itemId: string;
  optionId?: string;
} {
  const sepIndex = trayKey.indexOf('::');
  if (sepIndex === -1) {
    return { itemId: trayKey };
  }
  const itemId = trayKey.slice(0, sepIndex);
  const optionId = trayKey.slice(sepIndex + 2);
  return optionId ? { itemId, optionId } : { itemId };
}

export const SRI_LANKA_THEMES: Record<ThemeId, ThemePalette> = {
  'village-ella': {
    id: 'village-ella',
    name: 'Sri Lankan Village',
    subtitle: 'Handloom cotton, paddy-leaf green, clay-pot sienna & jak-wood',
    canvas: '#F6EFE0',
    surface: '#FFFDF8',
    surfaceMuted: '#ECE1CC',
    border: '#DDD0B6',
    textPrimary: '#2A1C12',
    textSecondary: '#543E2D',
    textMuted: '#6E5745',
    accent: '#2A5C3A',
    accentHover: '#1F462B',
    warmAccent: '#9E4822',
    espresso: '#2C1D13',
  },
  'golden-ella': {
    id: 'golden-ella',
    name: 'Golden Hour Ella',
    subtitle: 'Warm teak, Sri Lankan sunset gold & highland parchment',
    canvas: '#FBF6EC',
    surface: '#FFFFFF',
    surfaceMuted: '#F3E9D6',
    border: '#E5D8BF',
    textPrimary: '#2D1D12',
    textSecondary: '#5A4332',
    textMuted: '#755D4B',
    accent: '#C47E19',
    accentHover: '#A36610',
    warmAccent: '#B56E14',
    espresso: '#2B1B10',
  },
  'tea-estate': {
    id: 'tea-estate',
    name: 'Ceylon Tea Estate',
    subtitle: 'Emerald hills & warm limestone mist',
    canvas: '#F7F6F1',
    surface: '#FFFFFF',
    surfaceMuted: '#EFECE4',
    border: '#E0DBD0',
    textPrimary: '#16211D',
    textSecondary: '#475650',
    textMuted: '#5C6B65',
    accent: '#0F5C46',
    accentHover: '#0A4232',
    warmAccent: '#9E5E1A',
    espresso: '#18241F',
  },
  'cinnamon-brass': {
    id: 'cinnamon-brass',
    name: 'Cinnamon & Brass',
    subtitle: 'Sun-dried Ceylon spice & Kandyan teak',
    canvas: '#FAF6F0',
    surface: '#FFFFFF',
    surfaceMuted: '#F2EAE0',
    border: '#E4D8C8',
    textPrimary: '#241A14',
    textSecondary: '#59463A',
    textMuted: '#6E5A4D',
    accent: '#8C4314',
    accentHover: '#6E330D',
    warmAccent: '#1C5D4B',
    espresso: '#261810',
  },
  'highland-monsoon': {
    id: 'highland-monsoon',
    name: 'Highland Monsoon',
    subtitle: 'Ella Gap cloud mist & deep valley slate',
    canvas: '#F3F5F7',
    surface: '#FFFFFF',
    surfaceMuted: '#E7ECEF',
    border: '#D5DDE2',
    textPrimary: '#141D24',
    textSecondary: '#43515C',
    textMuted: '#5B6B76',
    accent: '#164E63',
    accentHover: '#0E3747',
    warmAccent: '#9A5D1F',
    espresso: '#152029',
  },
};

export const SRI_LANKA_DARK_THEMES: Record<ThemeId, ThemePalette> = {
  'village-ella': {
    id: 'village-ella',
    name: 'Sri Lankan Village',
    subtitle: 'Dark jak-wood timber, lantern brass & lush paddy green',
    canvas: '#16100B',
    surface: '#211711',
    surfaceMuted: '#2D2017',
    border: '#3F2E21',
    textPrimary: '#F7EFE1',
    textSecondary: '#DCCCB4',
    textMuted: '#B5A289',
    accent: '#347A4B',
    accentHover: '#28603B',
    warmAccent: '#E89B4D',
    espresso: '#110B07',
  },
  'golden-ella': {
    id: 'golden-ella',
    name: 'Golden Hour Ella',
    subtitle: 'Roasted teakwood, sunset amber & warm candlelight',
    canvas: '#17110B',
    surface: '#221810',
    surfaceMuted: '#2F2217',
    border: '#433222',
    textPrimary: '#FBF3E4',
    textSecondary: '#E0D0B8',
    textMuted: '#B6A38A',
    accent: '#B56E14',
    accentHover: '#965A0E',
    warmAccent: '#F2B449',
    espresso: '#110C07',
  },
  'tea-estate': {
    id: 'tea-estate',
    name: 'Ceylon Tea Estate',
    subtitle: 'Night highland mist & deep emerald leaf',
    canvas: '#0F1613',
    surface: '#17211D',
    surfaceMuted: '#202E28',
    border: '#2F4139',
    textPrimary: '#EFF5F2',
    textSecondary: '#C8D8D1',
    textMuted: '#99AEA5',
    accent: '#187559',
    accentHover: '#115B44',
    warmAccent: '#E09A4F',
    espresso: '#0A0F0D',
  },
  'cinnamon-brass': {
    id: 'cinnamon-brass',
    name: 'Cinnamon & Brass',
    subtitle: 'Spiced dark timber & warm Ceylon copper',
    canvas: '#17100C',
    surface: '#221712',
    surfaceMuted: '#2F2019',
    border: '#443026',
    textPrimary: '#FAF1E7',
    textSecondary: '#DECBC0',
    textMuted: '#B49E91',
    accent: '#A44F1A',
    accentHover: '#843E13',
    warmAccent: '#4CA48B',
    espresso: '#100B08',
  },
  'highland-monsoon': {
    id: 'highland-monsoon',
    name: 'Highland Monsoon',
    subtitle: 'Midnight Ella Gap slate & warm lantern gold',
    canvas: '#0F151A',
    surface: '#172028',
    surfaceMuted: '#212D38',
    border: '#314251',
    textPrimary: '#EFF4F8',
    textSecondary: '#C7D3DD',
    textMuted: '#96A7B5',
    accent: '#1E6F8A',
    accentHover: '#16566C',
    warmAccent: '#E5A052',
    espresso: '#0B0F14',
  },
};

export const CAFE_INFO = {
  name: 'PAHANPIYASA CEYLON CAFÉ',
  ayubowan: 'ආයුබෝවන් · Warm Village Hospitality in Demodara, Ella',
  location: 'Demodara, Ella, Sri Lanka',
  phoneDisplay: '+94 78 119 2871',
  whatsappNumber: '94781192871',
  email: 'ellacloudscapecafe@gmail.com',
  hours: 'Daily · 07:30 – 21:30',
  heroImage: '/src/assets/images/hero_ella_cloudscape_1794858474215.jpg',
  bridgeImage: '/src/assets/images/nine_arch_bridge_ella_1794858474711.jpg',
  mapEmbedUrl: 'https://www.google.com/maps?q=Ella+Cloudscape+Cafe&output=embed',
};

export const CATEGORY_IMAGE_MAP: Record<MenuCategoryId, { image: string; alt: string }> = {
  roti: {
    image: '/src/assets/images/cat_roti_kottu_1794858475364.jpg',
    alt: 'Freshly griddled Sri Lankan coconut roti and stuffed roti',
  },
  kottu: {
    image: '/src/assets/images/cat_roti_kottu_1794858475364.jpg',
    alt: 'Sizzling Sri Lankan kottu roti with curry leaves',
  },
  'rice&curry': {
    image: '/src/assets/images/cat_rice_curry_1794858475734.jpg',
    alt: 'Traditional Sri Lankan rice and curry platter',
  },
  rice: {
    image: '/src/assets/images/cat_rice_curry_1794858475734.jpg',
    alt: 'Fragrant wok-tossed Sri Lankan fried rice',
  },
  juice: {
    image: '/src/assets/images/cat_tropical_drinks_1794858476342.jpg',
    alt: 'Chilled Sri Lankan king coconut and tropical fruit juices',
  },
  milkshake: {
    image: '/src/assets/images/cat_tropical_drinks_1794858476342.jpg',
    alt: 'Chilled ice coffee and creamy milkshakes',
  },
  buns: {
    image: '/src/assets/images/cat_bakery_sweets_1794858479939.jpg',
    alt: 'Freshly baked Sri Lankan savory buns',
  },
  sweets: {
    image: '/src/assets/images/cat_bakery_sweets_1794858479939.jpg',
    alt: 'Glazed donuts, butter cake, and chocolate cake',
  },
};

export const MENU_PILLARS: {
  id: string;
  title: string;
  sinhalaTitle: string;
  description: string;
  categoryFilter: MenuCategoryId;
  itemCountLabel: string;
  image: string;
  imageAlt: string;
}[] = [
  {
    id: 'pillar-roti-kottu',
    title: 'Griddled Roti & Kottu',
    sinhalaTitle: 'රොටී සහ කොත්තු',
    description: 'Hand-stretched flatbreads, sweet fruit rotis, and sizzling spiced kottu chopped fresh to order.',
    categoryFilter: 'roti',
    itemCountLabel: '14 Savory & Sweet Varieties',
    image: '/src/assets/images/cat_roti_kottu_1794858475364.jpg',
    imageAlt: 'Freshly griddled Sri Lankan coconut roti, stuffed vegetable roti, and chicken kottu on stoneware plates',
  },
  {
    id: 'pillar-rice-curry',
    title: 'Rice & Curry · Fried Rice',
    sinhalaTitle: 'බත් සහ කරි',
    description: 'Traditional hill-country rice plates with dhal, coconut sambol, and fragrant wok-tossed fried rice.',
    categoryFilter: 'rice&curry',
    itemCountLabel: '9 Hearty Main Plates',
    image: '/src/assets/images/cat_rice_curry_1794858475734.jpg',
    imageAlt: 'Traditional Sri Lankan rice and curry alongside fragrant fried rice with fresh herbs',
  },
  {
    id: 'pillar-drinks',
    title: 'Fresh Juices & Shakes',
    sinhalaTitle: 'නැවුම් පළතුරු බීම',
    description: 'Chilled golden king coconut, sun-ripened tropical fruit juices, ice coffee, and thick milkshakes.',
    categoryFilter: 'juice',
    itemCountLabel: '14 Chilled Refreshments',
    image: '/src/assets/images/cat_tropical_drinks_1794858476342.jpg',
    imageAlt: 'Fresh golden king coconut, mango juice, iced coffee, and chocolate milkshake overlooking tea hills',
  },
  {
    id: 'pillar-bakery',
    title: 'Bakery Buns & Sweets',
    sinhalaTitle: 'බනිස් සහ රසකැවිලි',
    description: 'Warm Sri Lankan savory buns, burgers, glazed donuts, and homestyle butter and chocolate cakes.',
    categoryFilter: 'sweets',
    itemCountLabel: '7 Freshly Baked Items',
    image: '/src/assets/images/cat_bakery_sweets_1794858479939.jpg',
    imageAlt: 'Golden egg buns, sugar-glazed donuts, butter cake, and dark chocolate cake on a tiered stand',
  },
];

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: 'roti',
    label: 'Roti',
    sinhalaLabel: 'රොටී',
    subtitle: 'Savory & sweet griddled flatbreads',
    image: '/src/assets/images/cat_roti_kottu_1794858475364.jpg',
    imageAlt: 'Sri Lankan coconut and stuffed roti',
  },
  {
    id: 'kottu',
    label: 'Kottu',
    sinhalaLabel: 'කොත්තු',
    subtitle: 'Hot-plate chopped godamba roti',
    image: '/src/assets/images/cat_roti_kottu_1794858475364.jpg',
    imageAlt: 'Sizzling Sri Lankan kottu roti',
  },
  {
    id: 'rice&curry',
    label: 'Rice & Curry',
    sinhalaLabel: 'බත් සහ කරි',
    subtitle: 'Traditional Sri Lankan plates',
    image: '/src/assets/images/cat_rice_curry_1794858475734.jpg',
    imageAlt: 'Sri Lankan rice and curry platter',
  },
  {
    id: 'rice',
    label: 'Fried Rice',
    sinhalaLabel: 'ෆ්‍රයිඩ් රයිස්',
    subtitle: 'Fragrant wok-tossed rice',
    image: '/src/assets/images/cat_rice_curry_1794858475734.jpg',
    imageAlt: 'Fragrant Sri Lankan fried rice',
  },
  {
    id: 'juice',
    label: 'Juice',
    sinhalaLabel: 'පළතුරු යුෂ',
    subtitle: 'Pressed tropical fruits & king coconut',
    image: '/src/assets/images/cat_tropical_drinks_1794858476342.jpg',
    imageAlt: 'Chilled tropical juices and king coconut',
  },
  {
    id: 'milkshake',
    label: 'Milkshake',
    sinhalaLabel: 'මිල්ක්ෂේක්',
    subtitle: 'Creamy shakes & highland ice coffee',
    image: '/src/assets/images/cat_tropical_drinks_1794858476342.jpg',
    imageAlt: 'Creamy milkshakes and iced coffee',
  },
  {
    id: 'buns',
    label: 'Buns',
    sinhalaLabel: 'බනිස්',
    subtitle: 'Savory bakery buns & burgers',
    image: '/src/assets/images/cat_bakery_sweets_1794858479939.jpg',
    imageAlt: 'Freshly baked Sri Lankan buns',
  },
  {
    id: 'sweets',
    label: 'Sweets',
    sinhalaLabel: 'රසකැවිලි',
    subtitle: 'Donuts & homestyle cakes',
    image: '/src/assets/images/cat_bakery_sweets_1794858479939.jpg',
    imageAlt: 'Donuts, butter cake, and chocolate cake',
  },
];

export const MENU_ITEMS: MenuItem[] = [
  // Roti (9)
  {
    id: 'roti-vegetable',
    name: 'Vegetable Roti',
    sinhalaName: 'එළවළු රොටී',
    category: 'roti',
    categoryLabel: 'Roti',
    note: 'Folded flatbread filled with mildly spiced potato, carrot, and leek.',
    vegetarian: true,
    styleTag: 'Savory · Griddled',
    available: true,
  },
  {
    id: 'roti-coconut',
    name: 'Coconut Roti',
    sinhalaName: 'පොල් රොටී',
    category: 'roti',
    categoryLabel: 'Roti',
    note: 'Classic pol roti made with freshly grated coconut, onion, and green chili.',
    vegetarian: true,
    styleTag: 'Traditional · Griddled',
    available: true,
  },
  {
    id: 'roti-parata',
    name: 'Parata',
    sinhalaName: 'පරාටා',
    category: 'roti',
    categoryLabel: 'Roti',
    note: 'Flaky layered flatbread served warm off the flat iron griddle.',
    vegetarian: true,
    styleTag: 'Savory · Layered',
    available: true,
  },
  {
    id: 'roti-fish',
    name: 'Fish Roti',
    sinhalaName: 'මාළු රොටී',
    category: 'roti',
    categoryLabel: 'Roti',
    note: 'Crispy triangular roti stuffed with seasoned spiced fish and potato.',
    vegetarian: false,
    styleTag: 'Savory · Griddled',
    available: true,
  },
  {
    id: 'roti-chicken',
    name: 'Chicken Roti',
    sinhalaName: 'චිකන් රොටී',
    category: 'roti',
    categoryLabel: 'Roti',
    note: 'Hearty parcel filled with roasted Sri Lankan spiced chicken and herbs.',
    vegetarian: false,
    styleTag: 'Savory · Griddled',
    available: true,
  },
  {
    id: 'roti-egg',
    name: 'Egg Roti',
    sinhalaName: 'බිත්තර රොටී',
    category: 'roti',
    categoryLabel: 'Roti',
    note: 'Thin godamba dough folded around a whisked farm egg and cracked pepper.',
    vegetarian: true,
    styleTag: 'Savory · Griddled',
    available: true,
  },
  {
    id: 'roti-mango',
    name: 'Mango Roti',
    sinhalaName: 'අඹ රොටී',
    category: 'roti',
    categoryLabel: 'Roti',
    note: 'Warm folded crepe-style roti packed with ripe diced Ella mango.',
    vegetarian: true,
    styleTag: 'Sweet · Tropical',
    available: true,
  },
  {
    id: 'roti-banana',
    name: 'Banana Roti',
    sinhalaName: 'කෙසෙල් රොටී',
    category: 'roti',
    categoryLabel: 'Roti',
    note: 'Caramelized sweet banana folded inside crisp golden roti.',
    vegetarian: true,
    styleTag: 'Sweet · Classic',
    available: true,
  },
  {
    id: 'roti-chocolate',
    name: 'Chocolate Roti',
    sinhalaName: 'චොකලට් රොටී',
    category: 'roti',
    categoryLabel: 'Roti',
    note: 'Warm crisp roti filled with melted rich chocolate.',
    vegetarian: true,
    styleTag: 'Sweet · Warm',
    available: true,
  },

  // Juice (10)
  {
    id: 'juice-mango',
    name: 'Mango Juice',
    sinhalaName: 'අඹ යුෂ',
    category: 'juice',
    categoryLabel: 'Juice',
    note: 'Freshly blended ripe tropical mango served chilled over ice.',
    vegetarian: true,
    styleTag: 'Fresh Pressed · Chilled',
    available: true,
  },
  {
    id: 'juice-king-coconut',
    name: 'King Coconut',
    sinhalaName: 'තැඹිලි',
    category: 'juice',
    categoryLabel: 'Juice',
    note: 'Naturally sweet golden Sri Lankan thambili opened fresh to order.',
    vegetarian: true,
    styleTag: 'Whole Fruit · Natural',
    available: true,
  },
  {
    id: 'juice-orange',
    name: 'Orange',
    sinhalaName: 'දොඩම් යුෂ',
    category: 'juice',
    categoryLabel: 'Juice',
    note: 'Bright, citrus-pressed fresh orange juice.',
    vegetarian: true,
    styleTag: 'Fresh Pressed · Chilled',
    available: true,
  },
  {
    id: 'juice-banana',
    name: 'Banana',
    sinhalaName: 'කෙසෙල් බීම',
    category: 'juice',
    categoryLabel: 'Juice',
    note: 'Smooth blended highland banana smoothie-style juice.',
    vegetarian: true,
    styleTag: 'Fresh Blended · Chilled',
    available: true,
  },
  {
    id: 'juice-banana-vanilla',
    name: 'Banana & Vanilla',
    sinhalaName: 'කෙසෙල් සහ වැනිලා',
    category: 'juice',
    categoryLabel: 'Juice',
    note: 'Sweet banana blended with aromatic vanilla for a velvety finish.',
    vegetarian: true,
    styleTag: 'Fresh Blended · Sweet',
    available: true,
  },
  {
    id: 'juice-pineapple',
    name: 'Pineapple',
    sinhalaName: 'අන්නාසි යුෂ',
    category: 'juice',
    categoryLabel: 'Juice',
    note: 'Crisp and tangy island-grown pineapple pressed fresh.',
    vegetarian: true,
    styleTag: 'Fresh Pressed · Chilled',
    available: true,
  },
  {
    id: 'juice-watermelon',
    name: 'Watermelon',
    sinhalaName: 'කොමඩු යුෂ',
    category: 'juice',
    categoryLabel: 'Juice',
    note: 'Light, hydrating crushed red watermelon juice after a trail hike.',
    vegetarian: true,
    styleTag: 'Fresh Pressed · Chilled',
    available: true,
  },
  {
    id: 'juice-papaya',
    name: 'Papaya',
    sinhalaName: 'පැපොල් යුෂ',
    category: 'juice',
    categoryLabel: 'Juice',
    note: 'Silky ripe papaya juice with a subtle squeeze of lime.',
    vegetarian: true,
    styleTag: 'Fresh Blended · Chilled',
    available: true,
  },
  {
    id: 'juice-lime',
    name: 'Lime',
    sinhalaName: 'දෙහි යුෂ',
    category: 'juice',
    categoryLabel: 'Juice',
    note: 'Zesty fresh Sri Lankan lime cooler balanced with cane sugar.',
    vegetarian: true,
    styleTag: 'Citrus Cooler · Chilled',
    available: true,
  },
  {
    id: 'juice-mix',
    name: 'Mix Fruit Juice',
    sinhalaName: 'මිශ්‍ර පළතුරු යුෂ',
    category: 'juice',
    categoryLabel: 'Juice',
    note: 'Seasonal blend of mango, pineapple, papaya, and banana.',
    vegetarian: true,
    styleTag: 'House Blend · Chilled',
    available: true,
  },

  // Milkshake (4)
  {
    id: 'milkshake-chocolate',
    name: 'Chocolate Milkshake',
    sinhalaName: 'චොකලට් මිල්ක්ෂේක්',
    category: 'milkshake',
    categoryLabel: 'Milkshake',
    note: 'Thick chilled chocolate shake blended with creamy ice cream.',
    vegetarian: true,
    styleTag: 'Creamy · Chilled',
    available: true,
  },
  {
    id: 'milkshake-vanilla',
    name: 'Vanilla Milkshake',
    sinhalaName: 'වැනිලා මිල්ක්ෂේක්',
    category: 'milkshake',
    categoryLabel: 'Milkshake',
    note: 'Classic smooth vanilla bean shake served tall and cold.',
    vegetarian: true,
    styleTag: 'Creamy · Chilled',
    available: true,
  },
  {
    id: 'milkshake-mango',
    name: 'Mango Milkshake',
    sinhalaName: 'අඹ මිල්ක්ෂේක්',
    category: 'milkshake',
    categoryLabel: 'Milkshake',
    note: 'Ripe mango swirled with chilled milk and vanilla ice cream.',
    vegetarian: true,
    styleTag: 'Fruit Shake · Chilled',
    available: true,
  },
  {
    id: 'milkshake-ice-coffee',
    name: 'Ice Coffee',
    sinhalaName: 'අයිස් කෝපි',
    category: 'milkshake',
    categoryLabel: 'Milkshake',
    note: 'Sri Lankan café-style chilled coffee with milk and gentle spice.',
    vegetarian: true,
    styleTag: 'Highland Brew · Chilled',
    available: true,
  },

  // Fried Rice (5)
  {
    id: 'rice-egg',
    name: 'Egg Rice',
    sinhalaName: 'බිත්තර ෆ්‍රයිඩ් රයිස්',
    category: 'rice',
    categoryLabel: 'Fried Rice',
    note: 'Wok-fried basmati rice with scrambled egg, spring onion, and carrot.',
    vegetarian: true,
    styleTag: 'Wok Tossed · Hot',
    available: true,
  },
  {
    id: 'rice-fish',
    name: 'Fish Rice',
    sinhalaName: 'මාළු ෆ්‍රයිඩ් රයිස්',
    category: 'rice',
    categoryLabel: 'Fried Rice',
    note: 'Fragrant fried rice tossed with flaked seasoned fish and vegetables.',
    vegetarian: false,
    styleTag: 'Wok Tossed · Hot',
    available: true,
  },
  {
    id: 'rice-chicken',
    name: 'Chicken Rice',
    sinhalaName: 'චිකන් ෆ්‍රයිඩ් රයිස්',
    category: 'rice',
    categoryLabel: 'Fried Rice',
    note: 'Steaming fried rice with tender diced chicken, leeks, and chili paste.',
    vegetarian: false,
    styleTag: 'Wok Tossed · Hot',
    available: true,
  },
  {
    id: 'rice-vegetable',
    name: 'Vegetable Rice',
    sinhalaName: 'එළවළු ෆ්‍රයිඩ් රයිස්',
    category: 'rice',
    categoryLabel: 'Fried Rice',
    note: 'Crisp garden carrots, beans, cabbage, and leeks tossed in seasoned rice.',
    vegetarian: true,
    styleTag: 'Plant-Based · Hot',
    available: true,
  },
  {
    id: 'rice-mix',
    name: 'Mix Rice',
    sinhalaName: 'මික්ස් ෆ්‍රයිඩ් රයිස්',
    category: 'rice',
    categoryLabel: 'Fried Rice',
    note: 'Generous combination of chicken, seafood, egg, and crisp vegetables.',
    vegetarian: false,
    styleTag: 'House Special · Hot',
    available: true,
  },

  // Rice & Curry (4)
  {
    id: 'rc-egg',
    name: 'Egg Rice & Curry',
    sinhalaName: 'බිත්තර බත් සහ කරි',
    category: 'rice&curry',
    categoryLabel: 'Rice & Curry',
    note: 'Steamed rice with spiced egg curry, tempered dhal, vegetable curries, and papadam.',
    vegetarian: true,
    styleTag: 'Home Style · Platter',
    available: true,
  },
  {
    id: 'rc-chicken',
    name: 'Chicken Rice & Curry',
    sinhalaName: 'චිකන් බත් සහ කරි',
    category: 'rice&curry',
    categoryLabel: 'Rice & Curry',
    note: 'Slow-simmered Sri Lankan chicken curry served with dhal, sambol, and seasonal curries.',
    vegetarian: false,
    styleTag: 'House Favorite · Platter',
    available: true,
  },
  {
    id: 'rc-fish',
    name: 'Fish Rice & Curry',
    sinhalaName: 'මාළු බත් සහ කරි',
    category: 'rice&curry',
    categoryLabel: 'Rice & Curry',
    note: 'Tangy island fish curry paired with coconut sambol, dhal, and crispy papadam.',
    vegetarian: false,
    styleTag: 'Traditional · Platter',
    available: true,
  },
  {
    id: 'rc-normal',
    name: 'Normal Rice & Curry',
    sinhalaName: 'එළවළු බත් සහ කරි',
    category: 'rice&curry',
    categoryLabel: 'Rice & Curry',
    note: 'Wholesome vegetarian Sri Lankan rice plate with four seasonal vegetable curries and dhal.',
    vegetarian: true,
    styleTag: 'Vegetarian · Platter',
    available: true,
  },

  // Kottu (5)
  {
    id: 'kottu-vegetable',
    name: 'Vegetable Kottu',
    sinhalaName: 'එළවළු කොත්තු',
    category: 'kottu',
    categoryLabel: 'Kottu',
    note: 'Rhythmically chopped godamba roti stir-fried with cabbage, carrots, leeks, and curry gravy.',
    vegetarian: true,
    styleTag: 'Hot Plate · Vegetarian',
    available: true,
  },
  {
    id: 'kottu-egg',
    name: 'Egg Kottu',
    sinhalaName: 'බිත්තර කොත්තු',
    category: 'kottu',
    categoryLabel: 'Kottu',
    note: 'Shredded flatbread tossed on the iron griddle with farm eggs and aromatic spices.',
    vegetarian: true,
    styleTag: 'Hot Plate · Classic',
    available: true,
  },
  {
    id: 'kottu-fish',
    name: 'Fish Kottu',
    sinhalaName: 'මාළු කොත්තු',
    category: 'kottu',
    categoryLabel: 'Kottu',
    note: 'Savory chopped roti folded with spiced fish, curry leaves, and sautéed onions.',
    vegetarian: false,
    styleTag: 'Hot Plate · Savory',
    available: true,
  },
  {
    id: 'kottu-chicken',
    name: 'Chicken Kottu',
    sinhalaName: 'චිකන් කොත්තු',
    category: 'kottu',
    categoryLabel: 'Kottu',
    note: 'Ella’s evening staple: sizzling chopped roti with spiced chicken curry and crisp greens.',
    vegetarian: false,
    styleTag: 'House Favorite · Hot',
    available: true,
  },
  {
    id: 'kottu-mix',
    name: 'Mix Kottu',
    sinhalaName: 'මික්ස් කොත්තු',
    category: 'kottu',
    categoryLabel: 'Kottu',
    note: 'Loaded kottu combining chicken, fish, egg, and fresh vegetables on the hot plate.',
    vegetarian: false,
    styleTag: 'House Special · Hot',
    available: true,
  },

  // Sweets (3)
  {
    id: 'sweet-donut',
    name: 'Donut',
    sinhalaName: 'ඩෝනට්',
    category: 'sweets',
    categoryLabel: 'Sweets',
    note: 'Soft golden ring donut dusted with fine sugar, baked fresh for morning tea.',
    vegetarian: true,
    styleTag: 'Bakery · Fresh',
    available: true,
  },
  {
    id: 'sweet-butter-cake',
    name: 'Butter Cake',
    sinhalaName: 'බටර් කේක්',
    category: 'sweets',
    categoryLabel: 'Sweets',
    note: 'Tender golden Sri Lankan butter cake slice, ideal alongside hot Ceylon tea.',
    vegetarian: true,
    styleTag: 'Homestyle · Slice',
    available: true,
  },
  {
    id: 'sweet-chocolate-cake',
    name: 'Chocolate Cake',
    sinhalaName: 'චොකලට් කේක්',
    category: 'sweets',
    categoryLabel: 'Sweets',
    note: 'Rich cocoa sponge layered with smooth dark chocolate ganache.',
    vegetarian: true,
    styleTag: 'Bakery · Slice',
    available: true,
  },

  // Buns (4)
  {
    id: 'buns-egg',
    name: 'Egg Bun',
    sinhalaName: 'බිත්තර බනිස්',
    category: 'buns',
    categoryLabel: 'Buns',
    note: 'Warm glazed bakery bun baked with a seasoned boiled egg center.',
    vegetarian: true,
    styleTag: 'Bakery · Warm',
    available: true,
  },
  {
    id: 'buns-hotdog',
    name: 'Hot Dog',
    sinhalaName: 'හොට් ඩෝග්',
    category: 'buns',
    categoryLabel: 'Buns',
    note: 'Soft toasted roll with grilled sausage, sautéed onions, and mustard.',
    vegetarian: false,
    styleTag: 'Savory · Warm',
    available: true,
  },
  {
    id: 'buns-burger',
    name: 'Burger',
    sinhalaName: 'බර්ගර්',
    category: 'buns',
    categoryLabel: 'Buns',
    note: 'Toasted sesame bun with seasoned patty, crisp lettuce, tomato, and house sauce.',
    vegetarian: false,
    styleTag: 'Grilled · Warm',
    available: true,
  },
  {
    id: 'buns-sausage',
    name: 'Sausage Bun',
    sinhalaName: 'සොසේජ් බනිස්',
    category: 'buns',
    categoryLabel: 'Buns',
    note: 'Golden Sri Lankan bakery roll wrapped around a spiced savory sausage.',
    vegetarian: false,
    styleTag: 'Bakery · Warm',
    available: true,
  },
];

export const VILLAGE_EXPERIENCE_PILLARS = [
  {
    number: '01',
    title: 'Clay-Pot Village Kitchen',
    sinhalaTitle: 'මැටි වළං රස ගුණ',
    description:
      'Homestyle Sri Lankan rice and curry simmered slowly with fresh coconut milk, roasted spices, curry leaves, and local hill-country vegetables.',
  },
  {
    number: '02',
    title: 'Hand-Griddled Pol Roti & Kottu',
    sinhalaTitle: 'උණුසුම් පොල් රොටී සහ කොත්තු',
    description:
      'Prepared fresh on the flat iron griddle when you order—served warm with coconut sambol, spiced curries, or sweet tropical mango and banana.',
  },
  {
    number: '03',
    title: 'King Coconut & Hill-Country Tea',
    sinhalaTitle: 'තැඹිලි සහ උඩරට තේ',
    description:
      'Cool down after walking the Nine Arch trail with golden Sri Lankan thambili or relax on our wooden veranda as morning mountain mist drifts past.',
  },
];

export const NINE_ARCH_GUIDE = {
  englishTitle: 'Nine Arch Bridge',
  sinhalaTitle: 'නයින් ආර්ච් පාලම',
  englishLead:
    'The Nine Arch Bridge, also known as the Bridge in the Sky, is a spectacular viaduct located in Demodara, Ella.',
  englishDetail:
    'Spanning 91 metres across lush tea estates and cloud forest, the stone-and-brick viaduct stands 24 metres above the valley floor without a single piece of structural steel.',
  sinhalaLead:
    'නයින් ආර්ච් පාලම Ella Demodara ප්‍රදේශයේ පිහිටි ඉතා සුන්දර ඉංජිනේරු නිර්මාණයකි.',
  sinhalaDetail:
    'උඩරට දුම්රිය මාර්ගයේ ඇල්ල සහ දෙමෝදර දුම්රිය ස්ථාන අතර පිහිටි මෙම පාලම අහසේ පාලම ලෙසද හඳුන්වනු ලබන අතර සම්පූර්ණයෙන්ම ගල්, ගඩොල් සහ සිමෙන්ති වලින් නිමවා ඇත.',
  visitorNotes: [
    { label: 'Morning Mist Window', value: '07:30 – 09:30' },
    { label: 'Typical Train Crossings', value: '09:30 · 11:30 · 15:30 · 17:30' },
    { label: 'Best Café Pairing', value: 'Thambili & Warm Coconut Roti' },
  ],
};
