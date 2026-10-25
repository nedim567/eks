"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaItem } from "@/lib/media";

const displayName = (filename: string) => filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
const pageSize = 12;

function VideoThumbnail({ src, label, onOpen }: { src: string; label: string; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [poster, setPoster] = useState<string | null>(null);

  useEffect(() => {
    const target = thumbnailRef.current;
    if (!target || shouldLoad) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: "300px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldLoad]);

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) return;
    const scale = Math.min(1, 900 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) return;
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setPoster(canvas.toDataURL("image/jpeg", 0.76));
    } catch {
      // Keep the video's own frame as the thumbnail if the browser cannot capture it.
    }
  };

  const seekToThumbnailFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = Math.min(0.8, video.duration * 0.1);
    else captureFrame();
  };

  return (
    <div ref={thumbnailRef} className={`video-thumb${poster ? " has-poster" : ""}`}>
      <video ref={videoRef} src={shouldLoad ? src : undefined} playsInline preload="metadata" aria-label={label} onLoadedMetadata={seekToThumbnailFrame} onLoadedData={captureFrame} onSeeked={captureFrame} />
      {poster && <img className="video-poster" src={poster} alt="" aria-hidden="true" />}
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
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const mediaItems = useMemo(() => items, [items]);
  const visibleItems = mediaItems.slice(0, visibleCount);

  useEffect(() => {
    if (visibleCount >= mediaItems.length || !sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleCount((current) => Math.min(current + pageSize, mediaItems.length));
      }
    }, { rootMargin: "450px 0px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [mediaItems.length, visibleCount]);

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
        {items.length > 0 ? <>
          <div className="gallery-grid">{visibleItems.map((item) => <MediaCard key={item.name} item={item} onOpen={setLightboxItem} />)}</div>
          {visibleCount < items.length && <div className="gallery-pagination"><button type="button" className="load-more" onClick={() => setVisibleCount((current) => Math.min(current + pageSize, items.length))}>Load more</button><div ref={sentinelRef} className="pagination-sentinel" aria-hidden="true" /></div>}
        </> : (
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
