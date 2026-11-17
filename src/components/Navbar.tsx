import { useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { SectionId } from '../types/siteConfig';

export type PageTabId =
  | 'home'
  | 'our-story'
  | 'menu'
  | 'gallery'
  | 'reservations';

interface NavbarProps {
  cafeName: string;
  trayCount: number;
  visibleSections: SectionId[];
  activeTab: PageTabId;
  onSelectTab: (tab: PageTabId) => void;
  colorMode: 'light' | 'dark';
  onToggleColorMode: () => void;
  onOpenTray: () => void;
}

export function Navbar({
  cafeName,
  trayCount,
  visibleSections,
  activeTab,
  onSelectTab,
  colorMode,
  onToggleColorMode,
  onOpenTray,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasMenu = visibleSections.includes('menu');
  const hasGallery = visibleSections.includes('gallery');
  const hasReservations =
    visibleSections.includes('contact') || visibleSections.includes('visit-us');

  const allTabs: {
    id: PageTabId;
    href: string;
    label: string;
    mobileLabel: string;
    show: boolean;
  }[] = [
    { id: 'home', href: '#home', label: 'Home', mobileLabel: '01. Home', show: true },
    {
      id: 'our-story',
      href: '#our-story',
      label: 'Our Story',
      mobileLabel: '02. Our Story',
      show: true,
    },
    {
      id: 'menu',
      href: '#traditional-menu',
      label: 'Traditional Menu',
      mobileLabel: '03. Traditional Menu',
      show: hasMenu,
    },
    {
      id: 'gallery',
      href: '#gallery',
      label: 'Gallery',
      mobileLabel: '04. Gallery',
      show: hasGallery,
    },
    {
      id: 'reservations',
      href: '#reservations',
      label: 'Reservations',
      mobileLabel: '05. Reservations & Visit Us',
      show: hasReservations,
    },
  ];
  const navTabs = allTabs.filter((tab) => tab.show);

  const handleTabClick = (tabId: PageTabId) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--espresso) 94%, transparent)',
        borderColor: 'rgba(229, 216, 191, 0.16)',
      }}
    >
      <div className="max-w-[1240px] mx-auto px-3.5 sm:px-6 lg:px-8 min-h-16 py-2 flex items-center justify-between gap-2.5 sm:gap-4 lg:gap-6">
        {/* Zone 1: Brand Emblem + Responsive Wordmark */}
        <button
          type="button"
          onClick={() => handleTabClick('home')}
          className="inline-flex items-center gap-2 sm:gap-2.5 min-w-0 shrink text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A43B] rounded-sm"
        >
          <svg
            width="26"
            height="22"
            viewBox="0 0 36 28"
            fill="none"
            aria-hidden="true"
            className="w-6 h-5 sm:w-7 sm:h-6 shrink-0 text-[#E2A43B]"
          >
            <path
              d="M2 24C8 17 14 14 20 17C25 19.5 30 16 34 11"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M11 11H23C23 15 20.5 18 17 18C13.5 18 11 15 11 11Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M23 12.5H24.8C25.9 12.5 26.5 13.2 26.5 14C26.5 14.9 25.8 15.5 24.8 15.5H22.6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M15 7.5C15 6 16.5 5 16.5 3.5M19 7.5C19 6 20.5 5 20.5 3.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-[13px] min-[390px]:text-sm sm:text-base lg:text-lg leading-[1.15] font-medium tracking-tight text-[#FAF4E8] sm:whitespace-nowrap">
            {cafeName}
          </span>
        </button>

        {/* Zone 2: 5 concise single-line section tabs (desktop 1024px+) */}
        <nav
          aria-label="Primary navigation"
          role="tablist"
          className="hidden lg:flex items-center gap-5 xl:gap-6 text-[13px] xl:text-sm font-medium text-[#EFE6D5]"
        >
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabClick(tab.id)}
                className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A43B] rounded-t-sm ${
                  isActive
                    ? 'text-[#F2B449] border-[#F2B449] font-semibold'
                    : 'text-[#EFE6D5] border-transparent hover:text-[#F2B449]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme toggle + primary action + mobile drawer toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleColorMode}
            aria-label={colorMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={colorMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] inline-flex items-center justify-center rounded-full border text-[#FAF4E8] hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A43B]"
            style={{ borderColor: 'rgba(229, 216, 191, 0.28)' }}
          >
            {colorMode === 'dark' ? (
              <Sun className="w-4 h-4 text-[#F2B449]" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenTray}
            className="px-3 sm:px-4 py-1.5 sm:py-2 min-h-[38px] sm:min-h-[40px] text-xs sm:text-sm font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A43B] focus-visible:ring-offset-2"
            style={{
              backgroundColor: '#E2A43B',
              color: '#24160D',
            }}
          >
            <span>Order Tray</span>
            {trayCount > 0 && (
              <span className="ml-1 font-mono-tabular">({trayCount})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden p-2 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] inline-flex items-center justify-center rounded-lg text-[#FAF4E8] hover:bg-white/10 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & tablet navigation drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden border-t px-4 py-3 flex flex-col gap-1 max-h-[calc(100dvh-4rem)] overflow-y-auto"
          style={{
            backgroundColor: 'var(--espresso)',
            borderColor: 'rgba(229, 216, 191, 0.16)',
          }}
        >
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`w-full text-left py-2.5 px-3 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#F2B449] bg-white/10 font-semibold'
                    : 'text-[#FAF4E8] hover:text-[#F2B449] hover:bg-white/5'
                }`}
              >
                {tab.mobileLabel}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              onToggleColorMode();
              setMobileMenuOpen(false);
            }}
            className="mt-1 pt-2.5 pb-2 px-3 border-t flex items-center gap-2.5 text-sm font-medium text-[#F2B449] hover:bg-white/5 rounded-md transition-colors cursor-pointer text-left"
            style={{ borderColor: 'rgba(229, 216, 191, 0.14)' }}
          >
            {colorMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{colorMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
          </button>
        </nav>
      )}
    </header>
  );
}
