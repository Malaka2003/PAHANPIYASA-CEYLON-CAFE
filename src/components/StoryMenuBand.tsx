import {
  ArrowRight,
  CakeSlice,
  Camera,
  ChevronRight,
  Coffee,
  CupSoda,
  Flame,
  Leaf,
  Mountain,
  UtensilsCrossed,
} from 'lucide-react';
import { CATEGORY_IMAGE_MAP, MenuCategoryId } from '../data/cafeData';
import { CustomImagesMap } from '../types/siteConfig';
import { ResilientImage } from './ResilientImage';

interface StoryMenuBandProps {
  cafeName: string;
  customImages: CustomImagesMap;
  onQuickJumpCategory: (category: MenuCategoryId) => void;
}

const QUICK_MENU_LINKS: {
  label: string;
  category: MenuCategoryId;
  icon: typeof Coffee;
}[] = [
  { label: 'Sri Lankan Roti & Kottu', category: 'roti', icon: UtensilsCrossed },
  { label: 'Village Rice & Curry', category: 'rice&curry', icon: CakeSlice },
  { label: 'King Coconut & Fresh Juice', category: 'juice', icon: CupSoda },
  { label: 'Ceylon Shakes & Ice Coffee', category: 'milkshake', icon: Coffee },
];

const VILLAGE_HIGHLIGHTS = [
  { label: 'Village Veranda Views', icon: Mountain },
  { label: 'Clay-Pot & Griddle Cooking', icon: Flame },
  { label: 'Garden-Fresh Ingredients', icon: Leaf },
  { label: 'Near Nine Arch Trail', icon: Camera },
];

export function StoryMenuBand({
  cafeName,
  customImages,
  onQuickJumpCategory,
}: StoryMenuBandProps) {
  const storyDishImg =
    customImages['cat:rice&curry'] || CATEGORY_IMAGE_MAP['rice&curry'].image;
  const sideDrinkImg =
    customImages['cat:juice'] || CATEGORY_IMAGE_MAP.juice.image;

  return (
    <section
      id="our-story"
      className="pt-8 sm:pt-12 pb-12 sm:pb-16"
      style={{ backgroundColor: 'var(--canvas)' }}
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-9 items-center">
          {/* Left: Traditional Rice & Curry Dish Image */}
          <div className="lg:col-span-3">
            <div
              className="aspect-[4/3] lg:aspect-[5/4] rounded-2xl overflow-hidden border shadow-sm"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <ResilientImage
                src={storyDishImg}
                alt={`Traditional Sri Lankan Rice & Curry cooked fresh in village style at ${cafeName}`}
                fallbackLabel="Village Rice & Curry"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Center: 02. Our Story */}
          <div className="lg:col-span-4">
            <p
              className="text-xs font-semibold tracking-wide mb-2"
              style={{ color: 'var(--warm-accent)' }}
            >
              02. Our Story · අපේ කතාව
            </p>
            <h2
              className="font-display text-3xl sm:text-[2.15rem] leading-[1.15] font-medium tracking-tight mb-3 text-balance"
              style={{ color: 'var(--text-primary)' }}
            >
              A Village Kitchen Above the Clouds
            </h2>
            <p
              className="text-sm sm:text-[15px] leading-relaxed mb-5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Rooted in Sri Lankan village hospitality (ගැමි ආගන්තුක සත්කාරය), {cafeName} welcomes travellers off the Demodara trail with home-cooked rice and curry, hot pol roti, and calm mountain air.
            </p>
            <a
              href="#sri-lankan-experience"
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[40px] text-xs font-semibold rounded-full border transition-colors whitespace-nowrap"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <span>Discover Village Life</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Right: Quick Traditional Menu Links + Tropical Drink Photo */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            <div className="sm:col-span-7">
              <div className="mb-3">
                <h3
                  className="font-display text-2xl font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Traditional Menu
                </h3>
                <div className="flex items-center gap-2 mt-1.5" aria-hidden="true">
                  <span
                    className="h-px w-10"
                    style={{ backgroundColor: 'var(--warm-accent)', opacity: 0.45 }}
                  />
                  <span
                    className="w-1.5 h-1.5 rotate-45"
                    style={{ backgroundColor: 'var(--warm-accent)' }}
                  />
                  <span
                    className="h-px w-10"
                    style={{ backgroundColor: 'var(--warm-accent)', opacity: 0.45 }}
                  />
                </div>
              </div>

              <div
                className="divide-y border-t border-b"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {QUICK_MENU_LINKS.map(({ label, category, icon: Icon }) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onQuickJumpCategory(category)}
                    className="w-full py-3 flex items-center justify-between gap-3 text-left group cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--warm-accent)' }}
                      />
                      <span
                        className="text-sm font-medium truncate group-hover:underline"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {label}
                      </span>
                    </span>
                    <ChevronRight
                      className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-5">
              <div
                className="aspect-[4/3] sm:aspect-[3/4] rounded-2xl overflow-hidden border shadow-sm"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <ResilientImage
                  src={sideDrinkImg}
                  alt={`Fresh Sri Lankan king coconut and tropical juices served at ${cafeName}`}
                  fallbackLabel="King Coconut & Fresh Juice"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Traditional Village Hospitality Strip */}
        <div
          className="mt-12 pt-8 border-t grid grid-cols-2 lg:grid-cols-4 gap-6"
          style={{ borderColor: 'var(--border-color)' }}
        >
          {VILLAGE_HIGHLIGHTS.map(({ label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2 px-2">
              <Icon
                className="w-5 h-5"
                strokeWidth={1.6}
                style={{ color: 'var(--warm-accent)' }}
              />
              <span
                className="text-xs sm:text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
