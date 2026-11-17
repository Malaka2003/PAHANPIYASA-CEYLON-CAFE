import { useState } from 'react';
import { Check, Copy, MessageCircle, Minus, Plus, Trash2, X } from 'lucide-react';
import {
  MenuItem,
  MenuItemOption,
  parseTrayItemKey,
} from '../data/cafeData';

interface OrderTrayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cafeName: string;
  whatsappNumber: string;
  menuItems: MenuItem[];
  trayQuantities: Record<string, number>;
  onAddItem: (item: MenuItem, option?: MenuItemOption) => void;
  onDecrementItem: (trayKey: string) => void;
  onClearTray: () => void;
}

interface ResolvedTrayEntry {
  trayKey: string;
  item: MenuItem;
  option?: MenuItemOption;
  qty: number;
  unitPrice?: string;
}

export function OrderTrayDrawer({
  isOpen,
  onClose,
  cafeName,
  whatsappNumber,
  menuItems,
  trayQuantities,
  onAddItem,
  onDecrementItem,
  onClearTray,
}: OrderTrayDrawerProps) {
  const [diningMode, setDiningMode] = useState<'Dine-In Terrace' | 'Takeaway'>('Dine-In Terrace');
  const [guestNote, setGuestNote] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const menuMap = new Map(menuItems.map((item) => [item.id, item]));
  const selectedItems: ResolvedTrayEntry[] = [];

  for (const [trayKey, qty] of Object.entries(trayQuantities)) {
    if (!qty || qty <= 0) continue;
    const { itemId, optionId } = parseTrayItemKey(trayKey);
    const item = menuMap.get(itemId);
    if (!item) continue;
    const option = optionId
      ? item.options?.find((opt) => opt.id === optionId)
      : undefined;
    if (optionId && !option) continue;
    selectedItems.push({
      trayKey,
      item,
      option,
      qty,
      unitPrice: option?.priceLkr || item.priceLkr,
    });
  }

  const totalCount = selectedItems.reduce((sum, entry) => sum + entry.qty, 0);

  const buildOrderSummaryText = () => {
    const lines = [
      `Hello ${cafeName}!`,
      `Order Type: ${diningMode}`,
      '',
      'Items:',
      ...selectedItems.map((entry) => {
        const variantSuffix = entry.option ? ` — ${entry.option.name}` : '';
        const priceSuffix = entry.unitPrice ? ` — LKR ${entry.unitPrice}` : '';
        return `- ${entry.qty}x ${entry.item.name}${variantSuffix} (${entry.item.categoryLabel})${priceSuffix}`;
      }),
    ];
    if (guestNote.trim()) {
      lines.push('', `Notes: ${guestNote.trim()}`);
    }
    return lines.join('\n');
  };

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    buildOrderSummaryText()
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildOrderSummaryText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Order Tray"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full flex flex-col border-l shadow-xl"
        style={{
          backgroundColor: 'var(--canvas)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          className="px-6 py-5 border-b flex items-center justify-between gap-4"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div>
            <h2 className="font-display text-xl font-medium">Your Order Tray</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="font-mono-tabular font-medium" style={{ color: 'var(--text-primary)' }}>
                {totalCount}
              </span>{' '}
              {totalCount === 1 ? 'item' : 'items'} selected · Send directly to WhatsApp
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Order Tray"
            className="p-2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg hover:opacity-80 cursor-pointer"
            style={{ backgroundColor: 'var(--surface-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {selectedItems.length === 0 ? (
            <div
              className="border rounded-xl p-8 text-center my-8"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <p className="font-display text-lg mb-2">Your tray is empty</p>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Add roti, kottu, rice &amp; curry, or chilled tropical drinks from the menu to prepare an order for our kitchen.
              </p>
              <a
                href="#traditional-menu"
                onClick={onClose}
                className="inline-flex items-center justify-center px-4 py-2 min-h-[40px] text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Browse Menu
              </a>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Service Preference
                </p>
                <div
                  className="grid grid-cols-2 gap-1 p-1 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-muted)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {(['Dine-In Terrace', 'Takeaway'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDiningMode(mode)}
                      className="py-2 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer"
                      style={{
                        backgroundColor: diningMode === mode ? 'var(--surface)' : 'transparent',
                        color:
                          diningMode === mode ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <ul
                className="divide-y border rounded-xl"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-color)',
                }}
              >
                {selectedItems.map(({ trayKey, item, option, qty, unitPrice }) => (
                  <li
                    key={trayKey}
                    className="p-4 flex items-center justify-between gap-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                        {option && (
                          <span style={{ color: 'var(--accent)' }}> — {option.name}</span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.categoryLabel}
                        {unitPrice ? ` · LKR ${unitPrice}` : ''}
                      </p>
                    </div>

                    <div
                      className="flex items-center gap-1 border rounded-lg p-0.5 shrink-0"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onDecrementItem(trayKey)}
                        aria-label={`Decrease quantity of ${item.name}${option ? ` ${option.name}` : ''}`}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono-tabular font-medium">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddItem(item, option)}
                        aria-label={`Increase quantity of ${item.name}${option ? ` ${option.name}` : ''}`}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div>
                <label
                  htmlFor="tray-note"
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Kitchen or Timing Note (Optional)
                </label>
                <textarea
                  id="tray-note"
                  rows={2}
                  value={guestNote}
                  onChange={(e) => setGuestNote(e.target.value)}
                  placeholder="Spice preference, arrival time, or allergies..."
                  className="w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {selectedItems.length > 0 && (
          <div
            className="p-6 border-t space-y-2.5"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 min-h-[44px] inline-flex items-center justify-center gap-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Order via WhatsApp</span>
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2 px-3 min-h-[40px] inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-muted)',
                  color: 'var(--text-primary)',
                }}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied Summary' : 'Copy Order Text'}</span>
              </button>

              <button
                type="button"
                onClick={onClearTray}
                className="py-2 px-3 min-h-[40px] inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
