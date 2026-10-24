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
  return (
    <main className="site-shell">
      <header className="topbar"><span className="brand-dot" aria-hidden="true" /><a className="top-link" href="#gallery">Browse photos <span>↘</span></a></header>
      <section className="hero" id="top">
        <div className="hero-copy"><h1>{title}</h1>{subtitle.trim() && <p className="hero-subtitle">{subtitle}</p>}</div>
      </section>
      <GalleryClient items={items} />
      <footer className="footer"><span className="brand-dot" aria-hidden="true" /><a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
