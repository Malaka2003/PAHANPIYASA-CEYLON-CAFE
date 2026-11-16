import { ImagePlus } from 'lucide-react';
import { CustomImagesMap, CustomPhotoSection } from '../types/siteConfig';
import { ResilientImage } from './ResilientImage';

interface CustomPhotoSectionsProps {
  sections: CustomPhotoSection[];
  customImages: CustomImagesMap;
  canEdit?: boolean;
  onEditSections?: () => void;
}

export function CustomPhotoSections({
  sections,
  customImages,
  canEdit = false,
  onEditSections,
}: CustomPhotoSectionsProps) {
  const visibleSections = sections.filter((sec) => sec.visible);
  const showAdminControls = Boolean(canEdit && onEditSections);

  return (
    <section
      id="gallery"
      className="py-16 sm:py-24 border-t scroll-mt-16"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        {/* Section 04 Master Gallery Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <p
              className="text-xs font-semibold tracking-wide mb-2"
              style={{ color: 'var(--warm-accent)' }}
            >
              04. Gallery · දර්ශන එකතුව
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-balance"
              style={{ color: 'var(--text-primary)' }}
            >
              Life around our Ella village veranda &amp; kitchen
            </h2>
          </div>

          {showAdminControls && (
            <button
              type="button"
              onClick={onEditSections}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <ImagePlus className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span>Add Gallery Section / Photos</span>
            </button>
          )}
        </div>

        {visibleSections.length === 0 ? (
          <EmptyPhotoSlot onEdit={showAdminControls ? onEditSections : undefined} />
        ) : (
          <div className="space-y-16">
            {visibleSections.map((section, idx) => {
              const resolvedPhotos = section.photos
                .map((photo) => ({
                  ...photo,
                  src: customImages[photo.slotKey] || photo.defaultSrc || '',
                }))
                .filter((photo) => Boolean(photo.src));

              const effectiveLayout =
                section.layout === 'auto'
                  ? resolvedPhotos.length <= 1
                    ? 'single'
                    : resolvedPhotos.length === 2
                    ? 'two-up'
                    : 'grid'
                  : section.layout;

              return (
                <div
                  key={section.id}
                  id={`gallery-${section.id}`}
                  className={idx > 0 ? 'pt-12 border-t' : ''}
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  {effectiveLayout === 'split' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                      <div className="lg:col-span-5 flex flex-col justify-between">
                        <div>
                          {section.kicker && (
                            <p
                              className="text-xs font-medium tracking-wide mb-2"
                              style={{ color: 'var(--warm-accent)' }}
                            >
                              {section.kicker}
                            </p>
                          )}
                          <h3
                            className="font-display text-2xl sm:text-3xl font-medium tracking-tight mb-3 text-balance"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {section.title}
                          </h3>
                          {section.description && (
                            <p
                              className="text-sm sm:text-base leading-relaxed"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {section.description}
                            </p>
                          )}
                        </div>

                        {showAdminControls && (
                          <div className="mt-6">
                            <button
                              type="button"
                              onClick={onEditSections}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg border transition-colors cursor-pointer"
                              style={{
                                backgroundColor: 'var(--surface)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              <ImagePlus className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                              <span>Add or Edit Pictures</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-7">
                        {resolvedPhotos.length === 0 ? (
                          <EmptyPhotoSlot onEdit={showAdminControls ? onEditSections : undefined} />
                        ) : resolvedPhotos.length === 1 ? (
                          <figure
                            className="border rounded-xl overflow-hidden h-full flex flex-col"
                            style={{
                              backgroundColor: 'var(--surface)',
                              borderColor: 'var(--border-color)',
                            }}
                          >
                            <div className="flex-1 min-h-[260px]">
                              <ResilientImage
                                src={resolvedPhotos[0].src}
                                alt={resolvedPhotos[0].caption || section.title}
                                fallbackLabel={section.title}
                                className="w-full h-full object-cover aspect-[16/10] lg:aspect-auto"
                              />
                            </div>
                            {resolvedPhotos[0].caption && (
                              <figcaption
                                className="px-4 py-3 text-xs border-t"
                                style={{
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {resolvedPhotos[0].caption}
                              </figcaption>
                            )}
                          </figure>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                            {resolvedPhotos.map((photo) => (
                              <figure
                                key={photo.id}
                                className="border rounded-xl overflow-hidden flex flex-col"
                                style={{
                                  backgroundColor: 'var(--surface)',
                                  borderColor: 'var(--border-color)',
                                }}
                              >
                                <div className="aspect-[4/3] w-full overflow-hidden">
                                  <ResilientImage
                                    src={photo.src}
                                    alt={photo.caption || section.title}
                                    fallbackLabel={section.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                {photo.caption && (
                                  <figcaption
                                    className="px-4 py-2.5 text-xs border-t"
                                    style={{
                                      borderColor: 'var(--border-color)',
                                      color: 'var(--text-secondary)',
                                    }}
                                  >
                                    {photo.caption}
                                  </figcaption>
                                )}
                              </figure>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div className="max-w-2xl">
                          {section.kicker && (
                            <p
                              className="text-xs font-medium tracking-wide mb-1.5"
                              style={{ color: 'var(--warm-accent)' }}
                            >
                              {section.kicker}
                            </p>
                          )}
                          <h3
                            className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-balance"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {section.title}
                          </h3>
                          {section.description && (
                            <p
                              className="text-sm mt-2 leading-relaxed"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {section.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {resolvedPhotos.length === 0 ? (
                        <EmptyPhotoSlot onEdit={showAdminControls ? onEditSections : undefined} />
                      ) : effectiveLayout === 'single' ? (
                        <div className="space-y-6">
                          {resolvedPhotos.map((photo) => (
                            <figure
                              key={photo.id}
                              className="border rounded-2xl overflow-hidden"
                              style={{
                                backgroundColor: 'var(--surface)',
                                borderColor: 'var(--border-color)',
                              }}
                            >
                              <div className="aspect-[16/9] sm:aspect-[21/10] w-full overflow-hidden">
                                <ResilientImage
                                  src={photo.src}
                                  alt={photo.caption || section.title}
                                  fallbackLabel={section.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {photo.caption && (
                                <figcaption
                                  className="px-5 py-3.5 text-sm border-t"
                                  style={{
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {photo.caption}
                                </figcaption>
                              )}
                            </figure>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`grid gap-5 ${
                            effectiveLayout === 'two-up'
                              ? 'grid-cols-1 md:grid-cols-2'
                              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                          }`}
                        >
                          {resolvedPhotos.map((photo) => (
                            <figure
                              key={photo.id}
                              className="border rounded-xl overflow-hidden flex flex-col"
                              style={{
                                backgroundColor: 'var(--surface)',
                                borderColor: 'var(--border-color)',
                              }}
                            >
                              <div className="aspect-[4/3] w-full overflow-hidden">
                                <ResilientImage
                                  src={photo.src}
                                  alt={photo.caption || section.title}
                                  fallbackLabel={section.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {photo.caption && (
                                <figcaption
                                  className="px-4 py-3 text-xs border-t leading-relaxed"
                                  style={{
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {photo.caption}
                                </figcaption>
                              )}
                            </figure>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyPhotoSlot({ onEdit }: { onEdit?: () => void }) {
  return (
    <div
      className="border rounded-xl p-10 text-center"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <p className="font-display text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
        No pictures added to this gallery section yet
      </p>
      {onEdit ? (
        <>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Upload one or more photos from your device or paste an image link.
          </p>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-medium text-white rounded-lg cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <ImagePlus className="w-4 h-4" />
            <span>Upload Pictures</span>
          </button>
        </>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Gallery photos are being curated for our guests.
        </p>
      )}
    </div>
  );
}
