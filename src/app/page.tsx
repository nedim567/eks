import GalleryClient from "./gallery-client";
import { getGalleryData } from "@/lib/media";

export const dynamic = "force-dynamic";

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }
  return shuffled;
}

export default function Home() {
  const { title, subtitle, featured, gallery } = getGalleryData();
  const items = [...featured, ...shuffle(gallery)];
  const photoCount = items.filter((item) => item.type === "image").length;
  const videoCount = items.length - photoCount;
  return (
    <main className="site-shell">
      <header className="topbar"><span className="brand-dot" aria-hidden="true" /><a className="top-link" href="#gallery">Browse photos <span>↘</span></a></header>
      <section className="hero" id="top">
        <div className="hero-copy"><h1>{title}</h1>{subtitle.trim() && <p className="hero-subtitle">{subtitle}</p>}<div className="media-counts"><span><strong>{photoCount}</strong> PHOTOS</span><span><strong>{videoCount}</strong> VIDEOS</span></div></div>
      </section>
      <GalleryClient items={items} />
      <footer className="footer"><span className="privacy-note">Osnovni podaci o uređaju i browseru bilježe se pri posjeti.</span><a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
