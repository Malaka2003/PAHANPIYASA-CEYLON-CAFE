import { useState } from 'react';
import {
  CAFE_INFO,
  NINE_ARCH_GUIDE,
  VILLAGE_EXPERIENCE_PILLARS,
} from '../data/cafeData';
import { ResilientImage } from './ResilientImage';

type LanguageMode = 'both' | 'en' | 'si';

interface SriLankanExperienceSectionProps {
  bridgeImageSrc?: string;
}

export function SriLankanExperienceSection({
  bridgeImageSrc,
}: SriLankanExperienceSectionProps) {
  const [lang, setLang] = useState<LanguageMode>('both');

  return (
    <section
      id="sri-lankan-experience"
      className="py-16 sm:py-24 border-t"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--surface-muted) 65%, var(--canvas))',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 space-y-14">
        {/* Section Heading */}
        <div className="max-w-2xl">
          <p
            className="text-xs font-semibold tracking-wide mb-2"
            style={{ color: 'var(--warm-accent)' }}
          >
            05. Sri Lankan Experience · ශ්‍රී ලාංකේය ගැමි අත්දැකීම
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-balance"
            style={{ color: 'var(--text-primary)' }}
          >
            Traditional village warmth, clay-pot cooking, and hill-country heritage
          </h2>
        </div>

        {/* 3 Numbered Village Traditions (Editorial Rhythm, no icon-on-top cliché) */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-b py-8"
          style={{ borderColor: 'var(--border-color)' }}
        >
          {VILLAGE_EXPERIENCE_PILLARS.map((item) => (
            <div key={item.number} className="space-y-2">
              <div className="flex items-baseline gap-2.5">
                <span
                  className="font-mono-tabular text-xs font-semibold"
                  style={{ color: 'var(--warm-accent)' }}
                >
                  {item.number}.
                </span>
                <h3
                  className="font-display text-xl font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.title}
                </h3>
              </div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--accent)' }}
              >
                {item.sinhalaTitle}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bilingual Nine Arch Bridge Heritage Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex">
            <div
              className="w-full rounded-xl overflow-hidden border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <ResilientImage
                src={bridgeImageSrc || CAFE_INFO.bridgeImage}
                alt="Historic Nine Arch Bridge stone viaduct surrounded by emerald tea estates and morning mist in Demodara, Ella"
                fallbackLabel="Nine Arch Bridge · Demodara, Ella"
                className="w-full aspect-[4/3] lg:aspect-auto lg:h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between py-1">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <p
                  className="text-xs font-medium tracking-wide"
                  style={{ color: 'var(--warm-accent)' }}
                >
                  Village Trail Landmark · Demodara, Ella
                </p>

                <div
                  role="group"
                  aria-label="Language view"
                  className="inline-flex items-center p-1 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-muted)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {(
                    [
                      { id: 'both', label: 'Both' },
                      { id: 'en', label: 'English' },
                      { id: 'si', label: 'සිංහල' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setLang(option.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      style={{
                        backgroundColor:
                          lang === option.id ? 'var(--surface)' : 'transparent',
                        color:
                          lang === option.id
                            ? 'var(--text-primary)'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <h3
                className="font-display text-2xl sm:text-3xl font-medium tracking-tight mb-5 text-balance"
                style={{ color: 'var(--text-primary)' }}
              >
                {NINE_ARCH_GUIDE.englishTitle} · {NINE_ARCH_GUIDE.sinhalaTitle}
              </h3>

              <div className="space-y-5">
                {(lang === 'both' || lang === 'en') && (
                  <div className="space-y-2">
                    <p
                      className="text-xs font-medium"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      English
                    </p>
                    <p
                      className="text-base leading-relaxed"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {NINE_ARCH_GUIDE.englishLead}
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {NINE_ARCH_GUIDE.englishDetail}
                    </p>
                  </div>
                )}

                {(lang === 'both' || lang === 'si') && (
                  <div
                    className={`space-y-2 ${lang === 'both' ? 'pt-5 border-t' : ''}`}
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <p
                      className="text-xs font-medium"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      සිංහල
                    </p>
                    <p
                      className="text-base leading-relaxed"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {NINE_ARCH_GUIDE.sinhalaLead}
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {NINE_ARCH_GUIDE.sinhalaDetail}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <dl
              className="mt-8 pt-6 border-t grid grid-cols-1 sm:grid-cols-3 gap-4"
              style={{ borderColor: 'var(--border-color)' }}
            >
              {NINE_ARCH_GUIDE.visitorNotes.map((note) => (
                <div key={note.label}>
                  <dt className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    {note.label}
                  </dt>
                  <dd
                    className="text-sm font-medium font-mono-tabular"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {note.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
