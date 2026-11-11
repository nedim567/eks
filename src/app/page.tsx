import GalleryClient from "./gallery-client";
import { getGalleryData } from "@/lib/media";

export const dynamic = "force-dynamic";

function CountryFlags() {
  return (
    <span className="title-flags" role="group" aria-label="Italy, Monaco, and Spain">
      <svg className="title-flag title-flag-italy" viewBox="0 0 90 60" role="img" aria-label="Italy">
        <rect width="30" height="60" fill="#009246" />
        <rect x="30" width="30" height="60" fill="#fff" />
        <rect x="60" width="30" height="60" fill="#ce2b37" />
      </svg>
      <svg className="title-flag title-flag-monaco" viewBox="0 0 80 100" role="img" aria-label="Monaco">
        <rect width="80" height="50" fill="#ce1126" />
        <rect y="50" width="80" height="50" fill="#fff" />
      </svg>
      <svg className="title-flag title-flag-spain" viewBox="0 0 90 60" role="img" aria-label="Spain">
        <rect width="90" height="15" fill="#aa151b" />
        <rect y="15" width="90" height="30" fill="#f1bf00" />
        <rect y="45" width="90" height="15" fill="#aa151b" />
      </svg>
    </span>
  );
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }
  return shuffled;
}

export default function Home() {
  const { title, subtitle, description, privacyNotice, featured, gallery } = getGalleryData();
  const items = [...featured, ...shuffle(gallery)];
  const photoCount = items.filter((item) => item.type === "image").length;
  const videoCount = items.length - photoCount;
  return (
    <main className="site-shell">
      <header className="topbar"><span className="brand-dot" aria-hidden="true" /><a className="top-link" href="#gallery">Browse photos <span>↘</span></a></header>
      <section className="hero" id="top">
        <div className="hero-copy">
          <h1>{title}<CountryFlags /></h1>
          {subtitle.trim() && <p className="hero-subtitle">{subtitle}</p>}
          {description.trim() && <p className="hero-description">{description}</p>}
          <div className="media-counts"><span><strong>{photoCount}</strong> PHOTOS</span><span><strong>{videoCount}</strong> VIDEOS</span></div>
        </div>
      </section>
      <GalleryClient items={items} />
      <footer className="footer">{privacyNotice && <span className="privacy-note">{privacyNotice}</span>}<a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
