import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  LayoutGrid,
  List,
  Minus,
  Plus,
  Search,
  SquareStack,
  X,
} from 'lucide-react';
import {
  CATEGORY_IMAGE_MAP,
  MENU_CATEGORIES,
  MENU_PILLARS,
  MenuCategoryId,
  MenuItem,
  MenuItemOption,
  getOptionMediaSlotKey,
  getTrayItemKey,
} from '../data/cafeData';
import { CustomImagesMap, MenuViewMode } from '../types/siteConfig';
import { ResilientImage } from './ResilientImage';

interface MenuSectionProps {
  items: MenuItem[];
  customImages: CustomImagesMap;
  viewMode: MenuViewMode;
  showSinhalaSubtitles: boolean;
  externalCategorySelection?: { category: MenuCategoryId; seq: number } | null;
  onChangeViewMode: (mode: MenuViewMode) => void;
  trayQuantities: Record<string, number>;
  onAddItem: (item: MenuItem, option?: MenuItemOption) => void;
  onDecrementItem: (trayKey: string) => void;
  onBackToHome?: () => void;
}

function getAvailableOptions(item: MenuItem): MenuItemOption[] {
  return (item.options ?? []).filter((opt) => opt.available !== false);
}

function getPriceSummary(item: MenuItem, options: MenuItemOption[]): string | undefined {
  if (options.length === 0) {
    return item.priceLkr ? `LKR ${item.priceLkr}` : undefined;
  }

  const prices = options
    .map((opt) => opt.priceLkr?.trim())
    .filter((p): p is string => Boolean(p));

  if (prices.length === 0) {
    return item.priceLkr ? `LKR ${item.priceLkr}` : undefined;
  }

  const numericPrices = prices
    .map((p) => Number(p.replace(/[^0-9.]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (numericPrices.length > 0) {
    const min = Math.min(...numericPrices);
    const max = Math.max(...numericPrices);
    if (min === max) {
      return `LKR ${min.toLocaleString()}`;
    }
    return `From LKR ${min.toLocaleString()}`;
  }

  return `LKR ${prices[0]}`;
}

function getDishTotalTrayQty(
  item: MenuItem,
  options: MenuItemOption[],
  trayQuantities: Record<string, number>
): number {
  let total = trayQuantities[item.id] ?? 0;
  for (const opt of options) {
    total += trayQuantities[getTrayItemKey(item.id, opt.id)] ?? 0;
  }
  return total;
}

export function MenuSection({
  items,
  customImages,
  viewMode,
  showSinhalaSubtitles,
  externalCategorySelection,
  onChangeViewMode,
  trayQuantities,
  onAddItem,
  onDecrementItem,
  onBackToHome,
}: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | MenuCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const ledgerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalCategorySelection) {
      setActiveCategory(externalCategorySelection.category);
      ledgerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [externalCategorySelection]);

  const activeItems = useMemo(
    () => items.filter((item) => item.available !== false),
    [items]
  );

  const selectedDish = useMemo(
    () => activeItems.find((item) => item.id === selectedDishId) ?? null,
    [activeItems, selectedDishId]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activeItems.length };
    for (const item of activeItems) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [activeItems]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return activeItems.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (vegOnly && !item.vegetarian) {
        return false;
      }
      if (query) {
        const optionText = getAvailableOptions(item)
          .map((opt) => `${opt.name} ${opt.sinhalaName ?? ''}`)
          .join(' ');
        const haystack =
          `${item.name} ${item.sinhalaName ?? ''} ${item.categoryLabel} ${item.note} ${optionText}`.toLowerCase();
        return haystack.includes(query);
      }
      return true;
    });
  }, [activeItems, activeCategory, searchQuery, vegOnly]);

  const handleSelectPillar = (category: MenuCategoryId) => {
    setActiveCategory(category);
    ledgerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setVegOnly(false);
  };

  return (
    <section
      id="traditional-menu"
      className="py-16 sm:py-24 border-t scroll-mt-16"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        {onBackToHome && (
          <div className="mb-6">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-semibold rounded-full border transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          </div>
        )}

        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p
              className="text-xs font-semibold tracking-wide mb-2"
              style={{ color: 'var(--warm-accent)' }}
            >
              03. Traditional Menu · ගැමි කෑම වට්ටෝරුව
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-balance"
              style={{ color: 'var(--text-primary)' }}
            >
              Hand-griddled pol roti, clay-pot rice &amp; curry, kottu, and fresh island drinks
            </h2>
          </div>

          {/* Flexible Menu View Switcher */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Menu View
            </span>
            <div
              role="group"
              aria-label="Menu view layout"
              className="inline-flex items-center gap-1 p-1 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-muted)',
                borderColor: 'var(--border-color)',
              }}
            >
              {(
                [
                  { id: 'gallery', label: 'Photo Cards', icon: LayoutGrid },
                  { id: 'cards', label: 'Clean Grid', icon: SquareStack },
                  { id: 'board', label: 'Menu Board', icon: List },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const selected = viewMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChangeViewMode(id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: selected ? 'var(--surface)' : 'transparent',
                      color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: selected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 Culinary Pillars visual showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {MENU_PILLARS.map((pillar) => {
            const isSelected = activeCategory === pillar.categoryFilter;
            const pillarImageSrc =
              customImages[`cat:${pillar.categoryFilter}`] || pillar.image;

            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => handleSelectPillar(pillar.categoryFilter)}
                className="group text-left border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                  boxShadow: isSelected ? '0 0 0 1px var(--accent)' : 'none',
                }}
              >
                <div
                  className="aspect-[4/3] w-full overflow-hidden"
                  style={{ backgroundColor: 'var(--surface-muted)' }}
                >
                  <ResilientImage
                    src={pillarImageSrc}
                    alt={pillar.imageAlt}
                    fallbackLabel={pillar.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    {pillar.itemCountLabel}
                  </p>
                  <h3
                    className="font-display text-lg font-medium mb-0.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {pillar.title}
                  </h3>
                  {showSinhalaSubtitles && (
                    <p
                      className="text-xs font-medium mb-1.5"
                      style={{ color: 'var(--warm-accent)' }}
                    >
                      {pillar.sinhalaTitle}
                    </p>
                  )}
                  <p
                    className="text-xs leading-relaxed line-clamp-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {pillar.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Menu Explorer */}
        <div ref={ledgerRef} className="scroll-mt-24">
          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {/* Category filter tabs */}
            <div
              role="tablist"
              aria-label="Menu categories"
              className="flex flex-wrap items-center gap-1.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'all'}
                onClick={() => setActiveCategory('all')}
                className="px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor:
                    activeCategory === 'all' ? 'var(--accent)' : 'var(--surface-muted)',
                  color: activeCategory === 'all' ? '#FFFFFF' : 'var(--text-primary)',
                }}
              >
                All{' '}
                <span className="font-mono-tabular opacity-80">({categoryCounts.all})</span>
              </button>

              {MENU_CATEGORIES.map((cat) => {
                const selected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveCategory(cat.id)}
                    className="px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: selected ? 'var(--accent)' : 'var(--surface-muted)',
                      color: selected ? '#FFFFFF' : 'var(--text-primary)',
                    }}
                  >
                    {cat.label}{' '}
                    <span className="font-mono-tabular opacity-80">
                      ({categoryCounts[cat.id] ?? 0})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search & Veg toggle */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <div className="relative flex-1 sm:w-56">
                <Search
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes or drinks..."
                  aria-label="Search menu items"
                  className="w-full pl-9 pr-8 py-2 min-h-[40px] text-sm border rounded-lg focus:outline-none"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                aria-pressed={vegOnly}
                onClick={() => setVegOnly((v) => !v)}
                className="px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: vegOnly ? 'var(--text-primary)' : 'var(--surface)',
                  borderColor: vegOnly ? 'var(--text-primary)' : 'var(--border-color)',
                  color: vegOnly ? '#FFFFFF' : 'var(--text-primary)',
                }}
              >
                Vegetarian Only
              </button>
            </div>
          </div>

          {/* Results count bar */}
          <div
            className="flex items-center justify-between py-4 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>
              Showing{' '}
              <span
                className="font-mono-tabular font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {filteredItems.length}
              </span>{' '}
              {filteredItems.length === 1 ? 'item' : 'items'}
              {activeCategory !== 'all' && (
                <>
                  {' '}
                  in{' '}
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {MENU_CATEGORIES.find((c) => c.id === activeCategory)?.label}
                  </span>
                </>
              )}
            </span>

            {(activeCategory !== 'all' || searchQuery || vegOnly) && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium hover:underline cursor-pointer whitespace-nowrap"
                style={{ color: 'var(--accent)' }}
              >
                Show all {activeItems.length} items
              </button>
            )}
          </div>

          {/* Empty state */}
          {filteredItems.length === 0 ? (
            <div
              className="border rounded-xl p-10 text-center"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <p
                className="font-display text-xl mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                No matching dishes found
              </p>
              <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                Try clearing your search or switching back to all menu categories.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 min-h-[40px] text-sm font-medium text-white rounded-lg transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'board' ? (
            /* Compact 2-Column Café Menu Board */
            <div
              className="border rounded-xl grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              {filteredItems.map((item, idx) => {
                const options = getAvailableOptions(item);
                const hasOptions = options.length > 0;
                const qty = getDishTotalTrayQty(item, options, trayQuantities);
                const priceSummary = getPriceSummary(item, options);

                return (
                  <article
                    key={item.id}
                    className={`p-4 sm:px-5 flex items-center justify-between gap-4 border-b ${
                      idx % 2 === 0 ? 'lg:border-r' : ''
                    }`}
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDishId(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedDishId(item.id);
                        }
                      }}
                      className="min-w-0 flex-1 cursor-pointer group"
                    >
                      <div
                        className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs mb-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <span>{item.categoryLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.styleTag}</span>
                        {item.vegetarian && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium" style={{ color: 'var(--accent)' }}>
                              Veg
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h3
                          className="font-display text-base font-medium group-hover:underline"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {item.name}
                        </h3>
                        {showSinhalaSubtitles && item.sinhalaName && (
                          <span className="text-xs" style={{ color: 'var(--warm-accent)' }}>
                            {item.sinhalaName}
                          </span>
                        )}
                        {priceSummary && (
                          <span
                            className="text-xs font-mono-tabular font-medium"
                            style={{ color: 'var(--accent)' }}
                          >
                            {priceSummary}
                          </span>
                        )}
                      </div>
                      {hasOptions && (
                        <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                          {options.length} options: {options.map((o) => o.name).join(' · ')}
                        </p>
                      )}
                    </div>

                    {hasOptions ? (
                      <button
                        type="button"
                        onClick={() => setSelectedDishId(item.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        style={{
                          backgroundColor: qty > 0 ? 'var(--accent)' : 'var(--surface-muted)',
                          color: qty > 0 ? '#FFFFFF' : 'var(--accent)',
                        }}
                      >
                        <span>{qty > 0 ? `${qty} in Tray` : 'Select Option'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <ItemStepper
                        item={item}
                        qty={qty}
                        onAdd={() => onAddItem(item)}
                        onDecrement={() => onDecrementItem(item.id)}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            /* Photo Cards or Clean Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const options = getAvailableOptions(item);
                const hasOptions = options.length > 0;
                const qty = getDishTotalTrayQty(item, options, trayQuantities);
                const priceSummary = getPriceSummary(item, options);
                const defaultCatImg = CATEGORY_IMAGE_MAP[item.category];
                const resolvedImgSrc =
                  customImages[`item:${item.id}`] ||
                  customImages[`cat:${item.category}`] ||
                  defaultCatImg?.image;

                return (
                  <article
                    key={item.id}
                    className="border rounded-xl overflow-hidden flex flex-col justify-between transition-colors"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    {viewMode === 'gallery' && resolvedImgSrc && (
                      <button
                        type="button"
                        onClick={() => setSelectedDishId(item.id)}
                        className="aspect-[16/9] w-full overflow-hidden block cursor-pointer group relative text-left"
                        style={{ backgroundColor: 'var(--surface-muted)' }}
                        aria-label={`View details and options for ${item.name}`}
                      >
                        <ResilientImage
                          src={resolvedImgSrc}
                          alt={`${item.name} — ${defaultCatImg?.alt ?? item.categoryLabel}`}
                          fallbackLabel={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        {hasOptions && (
                          <span
                            className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md text-[11px] font-semibold backdrop-blur-sm"
                            style={{
                              backgroundColor: 'rgba(24, 16, 10, 0.78)',
                              color: '#FAF4E8',
                            }}
                          >
                            {options.length} Options
                          </span>
                        )}
                      </button>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div
                          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs mb-1.5"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <span>{item.categoryLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.styleTag}</span>
                          {item.vegetarian && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium" style={{ color: 'var(--accent)' }}>
                                Veg
                              </span>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedDishId(item.id)}
                          className="w-full flex items-baseline justify-between gap-3 mb-1 text-left cursor-pointer group"
                        >
                          <h3
                            className="font-display text-lg font-medium group-hover:underline"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.name}
                          </h3>
                          {priceSummary && (
                            <span
                              className="text-sm font-mono-tabular font-medium shrink-0"
                              style={{ color: 'var(--accent)' }}
                            >
                              {priceSummary}
                            </span>
                          )}
                        </button>

                        {showSinhalaSubtitles && item.sinhalaName && (
                          <p
                            className="text-xs font-medium mb-1.5"
                            style={{ color: 'var(--warm-accent)' }}
                          >
                            {item.sinhalaName}
                          </p>
                        )}

                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {item.note}
                        </p>

                        {hasOptions && (
                          <div
                            className="mt-3 pt-2.5 border-t flex flex-wrap items-center gap-1.5 text-xs"
                            style={{ borderColor: 'var(--surface-muted)' }}
                          >
                            <span style={{ color: 'var(--text-muted)' }}>Options:</span>
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {options.map((opt) => opt.name).join(' · ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        className="flex items-center justify-between pt-3 border-t gap-3"
                        style={{ borderColor: 'var(--surface-muted)' }}
                      >
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {hasOptions ? 'Click to choose style' : 'Prepared fresh on order'}
                        </span>

                        {hasOptions ? (
                          <button
                            type="button"
                            onClick={() => setSelectedDishId(item.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            style={{
                              backgroundColor: qty > 0 ? 'var(--accent)' : 'var(--surface-muted)',
                              color: qty > 0 ? '#FFFFFF' : 'var(--accent)',
                            }}
                          >
                            <span>{qty > 0 ? `Choose (${qty} in Tray)` : 'Select Option'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <ItemStepper
                            item={item}
                            qty={qty}
                            onAdd={() => onAddItem(item)}
                            onDecrement={() => onDecrementItem(item.id)}
                          />
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedDish && (
        <DishOptionsModal
          item={selectedDish}
          customImages={customImages}
          showSinhalaSubtitles={showSinhalaSubtitles}
          trayQuantities={trayQuantities}
          onAddItem={onAddItem}
          onDecrementItem={onDecrementItem}
          onClose={() => setSelectedDishId(null)}
        />
      )}
    </section>
  );
}

function DishOptionsModal({
  item,
  customImages,
  showSinhalaSubtitles,
  trayQuantities,
  onAddItem,
  onDecrementItem,
  onClose,
}: {
  item: MenuItem;
  customImages: CustomImagesMap;
  showSinhalaSubtitles: boolean;
  trayQuantities: Record<string, number>;
  onAddItem: (item: MenuItem, option?: MenuItemOption) => void;
  onDecrementItem: (trayKey: string) => void;
  onClose: () => void;
}) {
  const options = getAvailableOptions(item);
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    options[0]?.id ?? ''
  );

  useEffect(() => {
    if (options.length > 0 && !options.some((o) => o.id === selectedOptionId)) {
      setSelectedOptionId(options[0].id);
    }
  }, [options, selectedOptionId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const activeOption = options.find((o) => o.id === selectedOptionId) ?? options[0];
  const defaultCatImg = CATEGORY_IMAGE_MAP[item.category];
  const baseDishImg =
    customImages[`item:${item.id}`] ||
    customImages[`cat:${item.category}`] ||
    defaultCatImg?.image ||
    '';

  const activeImgSrc = activeOption
    ? customImages[getOptionMediaSlotKey(item.id, activeOption.id)] || baseDishImg
    : baseDishImg;

  const activeTrayKey = activeOption
    ? getTrayItemKey(item.id, activeOption.id)
    : item.id;
  const activeQty = trayQuantities[activeTrayKey] ?? 0;
  const activePrice = activeOption?.priceLkr || item.priceLkr;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} options`}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border shadow-2xl flex flex-col"
        style={{
          backgroundColor: 'var(--canvas)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dynamic Dish / Selected Option Photo Header */}
        <div
          className="relative aspect-[16/10] w-full overflow-hidden shrink-0"
          style={{ backgroundColor: 'var(--surface-muted)' }}
        >
          {activeImgSrc && (
            <ResilientImage
              src={activeImgSrc}
              alt={activeOption ? `${item.name} — ${activeOption.name}` : item.name}
              fallbackLabel={activeOption ? `${item.name} (${activeOption.name})` : item.name}
              className="w-full h-full object-cover"
            />
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dish details"
            className="absolute top-3 right-3 w-10 h-10 rounded-full inline-flex items-center justify-center bg-black/60 text-white hover:bg-black/75 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {activeOption && (
            <div
              className="absolute bottom-3 left-3 right-3 px-3.5 py-2 rounded-xl flex items-center justify-between gap-3 backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(24, 16, 10, 0.78)',
                color: '#FAF4E8',
              }}
            >
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider opacity-80">
                  Selected Option
                </p>
                <p className="text-sm font-semibold truncate">{activeOption.name}</p>
              </div>
              {activePrice && (
                <p className="text-sm font-mono-tabular font-semibold shrink-0 text-[#F2B449]">
                  LKR {activePrice}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Dish Body & Option Selector */}
        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <div
              className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs mb-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>{item.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{item.styleTag}</span>
              {item.vegetarian && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium" style={{ color: 'var(--accent)' }}>
                    Veg
                  </span>
                </>
              )}
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-2xl font-medium">{item.name}</h3>
              {activePrice && (
                <span
                  className="text-base font-mono-tabular font-semibold shrink-0"
                  style={{ color: 'var(--accent)' }}
                >
                  LKR {activePrice}
                </span>
              )}
            </div>

            {showSinhalaSubtitles && item.sinhalaName && (
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--warm-accent)' }}>
                {item.sinhalaName}
              </p>
            )}

            <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
              {item.note}
            </p>
          </div>

          {options.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Choose Your Preference ({options.length})
              </p>

              <div className="space-y-2">
                {options.map((option) => {
                  const isSelected = option.id === activeOption?.id;
                  const optImgSrc =
                    customImages[getOptionMediaSlotKey(item.id, option.id)] || baseDishImg;
                  const optTrayKey = getTrayItemKey(item.id, option.id);
                  const optQty = trayQuantities[optTrayKey] ?? 0;
                  const optPrice = option.priceLkr || item.priceLkr;

                  return (
                    <div
                      key={option.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedOptionId(option.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedOptionId(option.id);
                        }
                      }}
                      className="p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                        boxShadow: isSelected ? '0 0 0 1px var(--accent)' : 'none',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-14 h-12 rounded-lg overflow-hidden border shrink-0"
                          style={{
                            backgroundColor: 'var(--surface-muted)',
                            borderColor: 'var(--border-color)',
                          }}
                        >
                          {optImgSrc && (
                            <ResilientImage
                              src={optImgSrc}
                              alt={`${item.name} — ${option.name}`}
                              fallbackLabel={option.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold truncate">{option.name}</p>
                            {isSelected && (
                              <Check
                                className="w-4 h-4 shrink-0"
                                style={{ color: 'var(--accent)' }}
                              />
                            )}
                          </div>
                          {showSinhalaSubtitles && option.sinhalaName && (
                            <p className="text-xs truncate" style={{ color: 'var(--warm-accent)' }}>
                              {option.sinhalaName}
                            </p>
                          )}
                          {optPrice && (
                            <p
                              className="text-xs font-mono-tabular font-medium mt-0.5"
                              style={{ color: 'var(--accent)' }}
                            >
                              LKR {optPrice}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ItemStepper
                          item={item}
                          optionName={option.name}
                          qty={optQty}
                          onAdd={() => {
                            setSelectedOptionId(option.id);
                            onAddItem(item, option);
                          }}
                          onDecrement={() => onDecrementItem(optTrayKey)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Modal Action Bar */}
          <div
            className="pt-4 border-t flex flex-wrap items-center justify-between gap-3"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {activeOption ? (
              <div className="flex items-center gap-2 flex-1">
                {activeQty === 0 ? (
                  <button
                    type="button"
                    onClick={() => onAddItem(item, activeOption)}
                    className="flex-1 py-2.5 px-4 min-h-[44px] inline-flex items-center justify-center gap-2 text-sm font-semibold text-white rounded-xl cursor-pointer"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      Add {activeOption.name}
                      {activePrice ? ` · LKR ${activePrice}` : ''}
                    </span>
                  </button>
                ) : (
                  <div
                    className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <span className="text-xs font-medium truncate pr-2">
                      {activeOption.name} in tray
                    </span>
                    <ItemStepper
                      item={item}
                      optionName={activeOption.name}
                      qty={activeQty}
                      onAdd={() => onAddItem(item, activeOption)}
                      onDecrement={() => onDecrementItem(activeTrayKey)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <ItemStepper
                item={item}
                qty={activeQty}
                onAdd={() => onAddItem(item)}
                onDecrement={() => onDecrementItem(item.id)}
              />
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl border cursor-pointer"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemStepper({
  item,
  optionName,
  qty,
  onAdd,
  onDecrement,
}: {
  item: MenuItem;
  optionName?: string;
  qty: number;
  onAdd: () => void;
  onDecrement: () => void;
}) {
  const fullLabel = optionName ? `${item.name} (${optionName})` : item.name;

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        style={{
          backgroundColor: 'var(--surface-muted)',
          color: 'var(--accent)',
        }}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add to Tray</span>
      </button>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg p-1 shrink-0"
      style={{ backgroundColor: 'var(--surface-muted)' }}
    >
      <button
        type="button"
        onClick={onDecrement}
        aria-label={`Remove one ${fullLabel}`}
        className="w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors cursor-pointer"
        style={{
          backgroundColor: 'var(--surface)',
          color: 'var(--text-primary)',
        }}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span
        className="w-7 text-center text-xs font-mono-tabular font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add one more ${fullLabel}`}
        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white transition-colors cursor-pointer"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
