import fs from "node:fs";
import path from "node:path";

const mediaDirectory = path.join(process.cwd(), "public", "media");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const videoExtensions = new Set([".mp4", ".webm", ".mov", ".m4v"]);

export type MediaItem = {
  name: string;
  src: string;
  type: "image" | "video";
  featured: boolean;
};

export function getGalleryData() {
  const configPath = path.join(process.cwd(), "media.config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
    title?: string;
    subtitle?: string;
    featured?: string[];
  };
  const featuredNames = new Set(config.featured ?? []);
  const files = fs.existsSync(mediaDirectory) ? fs.readdirSync(mediaDirectory, { withFileTypes: true }) : [];
  const items: MediaItem[] = files
    .filter((file) => file.isFile())
    .map((file) => {
      const extension = path.extname(file.name).toLowerCase();
      const type = imageExtensions.has(extension) ? "image" : videoExtensions.has(extension) ? "video" : null;
      return type ? { name: file.name, src: `/media/${encodeURIComponent(file.name)}`, type, featured: featuredNames.has(file.name) } : null;
    })
    .filter((item): item is MediaItem => item !== null)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

  return {
    title: config.title || "Maturalna Ekskurzija IV-4 2026",
    subtitle: config.subtitle ?? "",
    featured: items.filter((item) => item.featured),
    gallery: items.filter((item) => !item.featured),
  };
}

export function prettyName(filename: string) {
  return path.basename(filename, path.extname(filename)).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}
