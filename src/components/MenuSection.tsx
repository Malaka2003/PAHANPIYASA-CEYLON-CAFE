import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, List, Minus, Plus, Search, SquareStack, X } from 'lucide-react';
import {
  CATEGORY_IMAGE_MAP,
  MENU_CATEGORIES,
  MENU_PILLARS,
  MenuCategoryId,
  MenuItem,
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
  onAddItem: (item: MenuItem) => void;
  onDecrementItem: (itemId: string) => void;
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
}: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | MenuCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
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
        const haystack = `${item.name} ${item.sinhalaName ?? ''} ${item.categoryLabel} ${item.note}`.toLowerCase();
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
                const qty = trayQuantities[item.id] ?? 0;
                return (
                  <article
                    key={item.id}
                    className={`p-4 sm:px-5 flex items-center justify-between gap-4 border-b ${
                      idx % 2 === 0 ? 'lg:border-r' : ''
                    }`}
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="min-w-0">
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
                          className="font-display text-base font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {item.name}
                        </h3>
                        {showSinhalaSubtitles && item.sinhalaName && (
                          <span className="text-xs" style={{ color: 'var(--warm-accent)' }}>
                            {item.sinhalaName}
                          </span>
                        )}
                        {item.priceLkr && (
                          <span
                            className="text-xs font-mono-tabular font-medium"
                            style={{ color: 'var(--accent)' }}
                          >
                            LKR {item.priceLkr}
                          </span>
                        )}
                      </div>
                    </div>

                    <ItemStepper
                      item={item}
                      qty={qty}
                      onAdd={() => onAddItem(item)}
                      onDecrement={() => onDecrementItem(item.id)}
                    />
                  </article>
                );
              })}
            </div>
          ) : (
            /* Photo Cards or Clean Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const qty = trayQuantities[item.id] ?? 0;
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
                      <div
                        className="aspect-[16/9] w-full overflow-hidden"
                        style={{ backgroundColor: 'var(--surface-muted)' }}
                      >
                        <ResilientImage
                          src={resolvedImgSrc}
                          alt={`${item.name} — ${defaultCatImg?.alt ?? item.categoryLabel}`}
                          fallbackLabel={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
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

                        <div className="flex items-baseline justify-between gap-3 mb-1">
                          <h3
                            className="font-display text-lg font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.name}
                          </h3>
                          {item.priceLkr && (
                            <span
                              className="text-sm font-mono-tabular font-medium shrink-0"
                              style={{ color: 'var(--accent)' }}
                            >
                              LKR {item.priceLkr}
                            </span>
                          )}
                        </div>

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
                      </div>

                      <div
                        className="flex items-center justify-between pt-3 border-t"
                        style={{ borderColor: 'var(--surface-muted)' }}
                      >
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Prepared fresh on order
                        </span>
                        <ItemStepper
                          item={item}
                          qty={qty}
                          onAdd={() => onAddItem(item)}
                          onDecrement={() => onDecrementItem(item.id)}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ItemStepper({
  item,
  qty,
  onAdd,
  onDecrement,
}: {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
  onDecrement: () => void;
}) {
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
        aria-label={`Remove one ${item.name}`}
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
        aria-label={`Add one more ${item.name}`}
        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white transition-colors cursor-pointer"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
