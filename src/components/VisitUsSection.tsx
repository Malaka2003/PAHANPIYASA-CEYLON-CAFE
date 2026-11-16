import { Clock, MapPin, MessageCircle, Train } from 'lucide-react';
import { CAFE_INFO } from '../data/cafeData';

interface VisitUsSectionProps {
  cafeName: string;
  locationLabel: string;
  openingHours: string;
  phoneDisplay: string;
  whatsappNumber: string;
}

export function VisitUsSection({
  cafeName,
  locationLabel,
  openingHours,
  phoneDisplay,
  whatsappNumber,
}: VisitUsSectionProps) {
  return (
    <section
      id="visit-us"
      className="py-16 sm:py-24 border-t"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mb-10">
          <p
            className="text-xs font-semibold tracking-wide mb-2"
            style={{ color: 'var(--warm-accent)' }}
          >
            06. Visit Us · අප වෙත එන්න
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-balance"
            style={{ color: 'var(--text-primary)' }}
          >
            Follow the village footpath near Nine Arch Bridge in Demodara, Ella
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Directions, Hours & Village Trail Notes */}
          <div
            className="lg:col-span-5 border rounded-xl p-6 sm:p-7 flex flex-col justify-between gap-6"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MapPin
                  className="w-4 h-4 mt-1 shrink-0"
                  style={{ color: 'var(--accent)' }}
                />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    Village Location
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {cafeName} · {locationLabel}
                  </p>
                  <p
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Located along the scenic Demodara – Nine Arch Bridge hillside walk, surrounded by tea bushes and village greenery.
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 pt-4 border-t"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <Clock
                  className="w-4 h-4 mt-1 shrink-0"
                  style={{ color: 'var(--accent)' }}
                />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    Opening Hours
                  </p>
                  <p
                    className="text-sm font-medium font-mono-tabular"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {openingHours}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Fresh morning roti &amp; Ceylon tea from 07:30 · Hot evening kottu until 21:30
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 pt-4 border-t"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <Train
                  className="w-4 h-4 mt-1 shrink-0"
                  style={{ color: 'var(--accent)' }}
                />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    Best Times to Visit
                  </p>
                  <p
                    className="text-sm font-medium font-mono-tabular"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    07:30 – 09:30 Morning Mist · Sunset Views
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Stop by before or after the Kandy–Badulla blue train crosses the viaduct.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="pt-4 border-t flex flex-wrap items-center justify-between gap-3"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Need walking directions?
                </p>
                <p
                  className="text-sm font-medium font-mono-tabular"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {phoneDisplay}
                </p>
              </div>

              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs font-medium text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Directions</span>
              </a>
            </div>
          </div>

          {/* Right: Interactive Google Map */}
          <div className="lg:col-span-7 flex">
            <div
              className="w-full border rounded-xl overflow-hidden min-h-[340px]"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <iframe
                title={`${cafeName} on Google Maps`}
                src={CAFE_INFO.mapEmbedUrl}
                className="w-full h-full min-h-[340px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
