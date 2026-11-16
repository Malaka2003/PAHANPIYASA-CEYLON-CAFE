import {
  CAFE_INFO,
  CATEGORY_IMAGE_MAP,
  NINE_ARCH_GUIDE,
  SRI_LANKA_THEMES,
  VILLAGE_EXPERIENCE_PILLARS,
} from '../data/cafeData';
import { CustomImagesMap, SiteConfig } from '../types/siteConfig';

export function downloadJsonConfig(config: SiteConfig) {
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pahanpiyasa-ceylon-cafe-config.json';
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadStaticHtml(
  config: SiteConfig,
  customImages: CustomImagesMap = {}
) {
  const palette = SRI_LANKA_THEMES[config.themeId] ?? SRI_LANKA_THEMES['village-ella'];
  const visibleItems = config.customMenuItems.filter((item) => item.available !== false);
  const heroImg = customImages.hero;
  const bridgeImg = customImages.bridge;

  const groupedHtml = visibleItems
    .map((item) => {
      const itemImg =
        customImages[`item:${item.id}`] ||
        customImages[`cat:${item.category}`] ||
        undefined;
      const defaultCatImg = CATEGORY_IMAGE_MAP[item.category]?.image;
      const resolvedImg =
        itemImg || (defaultCatImg?.startsWith('http') ? defaultCatImg : undefined);

      return `
      <article class="menu-card">
        ${resolvedImg ? `<img src="${escapeHtml(resolvedImg)}" alt="${escapeHtml(item.name)}" class="card-img" />` : ''}
        <div class="card-body">
          <div class="meta">${escapeHtml(item.categoryLabel)} · ${escapeHtml(item.styleTag)}${
        item.vegetarian ? ' · Veg' : ''
      }</div>
          <h3>${escapeHtml(item.name)}${
        config.showSinhalaSubtitles && item.sinhalaName
          ? ` <span class="si">(${escapeHtml(item.sinhalaName)})</span>`
          : ''
      }</h3>
          <p>${escapeHtml(item.note)}</p>
          ${item.priceLkr ? `<div class="price">LKR ${escapeHtml(item.priceLkr)}</div>` : ''}
        </div>
      </article>`;
    })
    .join('\n');

  const photoSectionsHtml = config.customPhotoSections
    .filter((sec) => sec.visible && sec.photos.length > 0)
    .map((sec) => {
      const photosMarkup = sec.photos
        .map((photo) => {
          const src = customImages[photo.slotKey] || photo.defaultSrc;
          if (!src) return '';
          return `
          <figure class="photo-figure">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(photo.caption || sec.title)}" />
            ${photo.caption ? `<figcaption>${escapeHtml(photo.caption)}</figcaption>` : ''}
          </figure>`;
        })
        .filter(Boolean)
        .join('\n');

      if (!photosMarkup) return '';

      return `
      <div style="margin-top: 2rem;">
        ${sec.kicker ? `<div class="meta">${escapeHtml(sec.kicker)}</div>` : ''}
        <h3 style="font-size: 1.5rem;">${escapeHtml(sec.title)}</h3>
        ${sec.description ? `<p style="max-width: 680px; color: var(--text-2);">${escapeHtml(sec.description)}</p>` : ''}
        <div class="photo-grid ${sec.photos.length === 1 || sec.layout === 'single' ? 'single' : ''}">
          ${photosMarkup}
        </div>
      </div>`;
    })
    .join('\n');

  const experiencePillarsHtml = VILLAGE_EXPERIENCE_PILLARS.map(
    (p) => `
      <div class="pillar-card">
        <div class="meta">${escapeHtml(p.number)}. ${escapeHtml(p.sinhalaTitle)}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <p style="color: var(--text-2); font-size: 0.92rem;">${escapeHtml(p.description)}</p>
      </div>`
  ).join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(config.cafeName)} — ${escapeHtml(config.locationLabel)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --canvas: ${palette.canvas};
      --surface: ${palette.surface};
      --muted: ${palette.surfaceMuted};
      --border: ${palette.border};
      --text: ${palette.textPrimary};
      --text-2: ${palette.textSecondary};
      --accent: ${palette.accent};
      --espresso: ${palette.espresso};
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: var(--canvas); color: var(--text); line-height: 1.6; }
    h1, h2, h3 { font-family: 'Fraunces', serif; font-weight: 500; margin: 0 0 0.5rem; }
    .container { max-width: 1120px; margin: 0 auto; padding: 0 1.25rem; }
    header { background: var(--espresso); color: #FAF4E8; padding: 1rem 0; position: sticky; top: 0; z-index: 20; }
    .nav { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
    .nav-links { display: flex; gap: 1.15rem; flex-wrap: wrap; }
    .nav-links a { color: #EFE6D5; text-decoration: none; font-size: 0.88rem; font-weight: 500; }
    .btn { background: #E2A43B; color: #24160D; padding: 0.6rem 1.15rem; border-radius: 999px; text-decoration: none; font-size: 0.88rem; font-weight: 600; display: inline-block; }
    section { padding: 3.5rem 0; border-bottom: 1px solid var(--border); }
    .hero-img, .bridge-img { width: 100%; max-height: 440px; object-fit: cover; border-radius: 14px; border: 1px solid var(--border); margin-bottom: 1.5rem; }
    .menu-grid, .pillar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .menu-card, .pillar-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .pillar-card { padding: 1.25rem; }
    .card-img { width: 100%; height: 170px; object-fit: cover; display: block; }
    .card-body { padding: 1.25rem; }
    .photo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1.25rem; }
    .photo-grid.single { grid-template-columns: 1fr; }
    .photo-figure { margin: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .photo-figure img { width: 100%; height: 280px; object-fit: cover; display: block; }
    .photo-grid.single .photo-figure img { height: 420px; }
    .photo-figure figcaption { padding: 0.75rem 1rem; font-size: 0.85rem; color: var(--text-2); }
    .meta { font-size: 0.78rem; color: var(--text-2); margin-bottom: 0.35rem; font-weight: 600; }
    .si { font-size: 0.85rem; color: var(--text-2); font-weight: 400; }
    .price { margin-top: 0.75rem; font-weight: 600; color: var(--accent); font-size: 0.9rem; }
    footer { background: var(--espresso); color: #EFE6D5; padding: 2.25rem 0; font-size: 0.85rem; }
    .footer-inner { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
  </style>
</head>
<body>
  <header>
    <div class="container nav">
      <strong>${escapeHtml(config.cafeName)}</strong>
      <div class="nav-links">
        <a href="#home">Home</a>
        <a href="#our-story">Our Story</a>
        <a href="#traditional-menu">Traditional Menu</a>
        <a href="#gallery">Gallery</a>
        <a href="#sri-lankan-experience">Experience</a>
        <a href="#visit-us">Visit Us</a>
        <a href="#contact">Reservations</a>
      </div>
      <a class="btn" href="https://wa.me/${escapeHtml(config.whatsappNumber)}" target="_blank">WhatsApp Order</a>
    </div>
  </header>
  <main class="container">
    <section id="home">
      ${heroImg ? `<img src="${escapeHtml(heroImg)}" alt="${escapeHtml(config.cafeName)}" class="hero-img" />` : ''}
      <p class="meta">${escapeHtml(config.ayubowanGreeting)} · ${escapeHtml(config.locationLabel)}</p>
      <h1 style="font-size: clamp(2rem, 4vw, 3.2rem);">${escapeHtml(config.heroHeadline)} ${escapeHtml(config.heroAccentLine)}</h1>
      <p style="max-width: 640px; color: var(--text-2);">${escapeHtml(config.heroSubtitle)}</p>
      <p class="meta" style="margin-top: 1rem;">Hours: ${escapeHtml(config.openingHours)} · Phone: ${escapeHtml(config.phoneDisplay)}</p>
    </section>

    <section id="our-story">
      <div class="meta">02. Our Story · අපේ කතාව</div>
      <h2>A Village Kitchen Above the Clouds</h2>
      <p style="max-width: 680px; color: var(--text-2);">Rooted in Sri Lankan village hospitality (ගැමි ආගන්තුක සත්කාරය), ${escapeHtml(config.cafeName)} welcomes travellers off the Demodara trail with home-cooked rice and curry, hot pol roti, and calm mountain air.</p>
    </section>

    <section id="traditional-menu">
      <div class="meta">03. Traditional Menu · ගැමි කෑම වට්ටෝරුව</div>
      <h2>Traditional Menu (${visibleItems.length} Dishes &amp; Drinks)</h2>
      <div class="menu-grid">
        ${groupedHtml}
      </div>
    </section>

    <section id="gallery">
      <div class="meta">04. Gallery · දර්ශන එකතුව</div>
      <h2>Life around our Ella village veranda &amp; kitchen</h2>
      ${photoSectionsHtml}
    </section>

    <section id="sri-lankan-experience">
      <div class="meta">05. Sri Lankan Experience · ශ්‍රී ලාංකේය ගැමි අත්දැකීම</div>
      <h2>Traditional village warmth, clay-pot cooking, and hill-country heritage</h2>
      <div class="pillar-grid">
        ${experiencePillarsHtml}
      </div>
      <div style="margin-top: 2rem;">
        ${bridgeImg ? `<img src="${escapeHtml(bridgeImg)}" alt="Nine Arch Bridge" class="bridge-img" />` : ''}
        <h3>${escapeHtml(NINE_ARCH_GUIDE.englishTitle)} · ${escapeHtml(NINE_ARCH_GUIDE.sinhalaTitle)}</h3>
        <p>${escapeHtml(NINE_ARCH_GUIDE.englishLead)}</p>
        <p style="color: var(--text-2);">${escapeHtml(NINE_ARCH_GUIDE.sinhalaLead)}</p>
      </div>
    </section>

    <section id="visit-us">
      <div class="meta">06. Visit Us · අප වෙත එන්න</div>
      <h2>Follow the village footpath near Nine Arch Bridge in Demodara, Ella</h2>
      <p>Hours: ${escapeHtml(config.openingHours)} · Location: ${escapeHtml(config.locationLabel)}</p>
      <iframe src="${escapeHtml(CAFE_INFO.mapEmbedUrl)}" width="100%" height="280" style="border:0; border-radius:12px; margin-top:1rem;" loading="lazy"></iframe>
    </section>

    <section id="contact" style="border-bottom: none;">
      <div class="meta">07. Contact &amp; Reservations · වෙන්කරවා ගැනීම් සහ සම්බන්ධතා</div>
      <h2>Reserve a veranda table or message our family kitchen</h2>
      <p>Phone / WhatsApp: ${escapeHtml(config.phoneDisplay)} · Email: ${escapeHtml(config.email)} · ${escapeHtml(config.locationLabel)}</p>
    </section>
  </main>
  <footer>
    <div class="container footer-inner">
      <span>© 2026 ${escapeHtml(config.cafeName)}</span>
      <span>${escapeHtml(config.locationLabel)}</span>
    </div>
  </footer>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'index.html';
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
