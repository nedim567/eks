"use client";

import { useEffect, useMemo, useState } from "react";
import type { MediaItem } from "@/lib/media";

const displayName = (filename: string) => filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

function VideoThumbnail({ src, label, onOpen }: { src: string; label: string; onOpen: () => void }) {
  return (
    <div className="video-thumb">
      <video src={src} playsInline preload="metadata" aria-label={label} />
      <button className="video-play" type="button" onClick={onOpen} aria-label={`Play ${label}`}><span className="video-play-icon">▶</span></button>
    </div>
  );
}

function MediaCard({
  item,
  onOpen,
}: {
  item: MediaItem;
  onOpen: (item: MediaItem) => void;
}) {
  const label = displayName(item.name) || "Untitled";
  return (
    <article className="media-card">
      <div className="media-frame">
        {item.type === "video" ? (
          <VideoThumbnail src={item.src} label={label} onOpen={() => onOpen(item)} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <button className="image-open" type="button" onClick={() => onOpen(item)} aria-label={`Open ${label} full size`}>
            <img src={item.src} alt={label} loading="lazy" />
          </button>
        )}
        <span className="media-type">{item.type === "video" ? "▶ Video" : "↗ Photo"}</span>
      </div>
    </article>
  );
}

export default function GalleryClient({ items }: { items: MediaItem[] }) {
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const mediaItems = useMemo(() => items, [items]);

  useEffect(() => {
    if (!lightboxItem) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxItem(null);
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const currentIndex = mediaItems.findIndex((item) => item.name === lightboxItem.name);
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + direction + mediaItems.length) % mediaItems.length;
        if (mediaItems[nextIndex]) setLightboxItem(mediaItems[nextIndex]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mediaItems, lightboxItem]);

  return (
    <>
      <section className="gallery-section" id="gallery" aria-label="Gallery">
        {items.length > 0 ? <div className="gallery-grid">{items.map((item) => <MediaCard key={item.name} item={item} onOpen={setLightboxItem} />)}</div> : (
          <div className="empty-state"><span className="empty-icon">✳</span><h3>Your gallery starts here.</h3><p>Drop photos and videos into <code>public/media</code>, then refresh the page.</p><span className="empty-formats">JPG · PNG · WEBP · MP4 · WEBM · MOV</span></div>
        )}
      </section>

      {lightboxItem && <div className="lightbox" role="dialog" aria-modal="true" aria-label={displayName(lightboxItem.name)} onClick={() => setLightboxItem(null)}>
        <button className="lightbox-close" type="button" aria-label="Close viewer" onClick={() => setLightboxItem(null)}>×</button>
        {mediaItems.length > 1 && <button className="lightbox-nav lightbox-prev" type="button" aria-label="Previous item" onClick={(event) => { event.stopPropagation(); const index = mediaItems.findIndex((item) => item.name === lightboxItem.name); setLightboxItem(mediaItems[(index - 1 + mediaItems.length) % mediaItems.length]); }}>‹</button>}
        {lightboxItem.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="lightbox-image" src={lightboxItem.src} alt={displayName(lightboxItem.name)} onClick={(event) => event.stopPropagation()} />
        ) : <video className="lightbox-video" src={lightboxItem.src} controls autoPlay playsInline onClick={(event) => event.stopPropagation()} />}
        {mediaItems.length > 1 && <button className="lightbox-nav lightbox-next" type="button" aria-label="Next item" onClick={(event) => { event.stopPropagation(); const index = mediaItems.findIndex((item) => item.name === lightboxItem.name); setLightboxItem(mediaItems[(index + 1) % mediaItems.length]); }}>›</button>}
      </div>}
    </>
  );
}
