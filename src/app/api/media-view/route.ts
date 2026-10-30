import { NextRequest, NextResponse } from "next/server";
import { getGalleryData } from "@/lib/media";

export const runtime = "nodejs";

type MediaType = "image" | "video";

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function redisCommand(command: string[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("View counters are not configured");

  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Counter service request failed");
  const result = (await response.json()) as { result?: number | string | null; error?: string };
  if (result.error) throw new Error("Counter service returned an error");
  return result.result;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse(null, { status: 403 });

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return new NextResponse("Discord webhook is not configured", { status: 503 });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 512_000) return new NextResponse("Request too large", { status: 413 });

  let body: { name?: unknown; type?: unknown; preview?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.name !== "string" || (body.type !== "image" && body.type !== "video")) {
    return NextResponse.json({ error: "Invalid media" }, { status: 400 });
  }

  const name = body.name;
  const type = body.type as MediaType;
  let videoPreview: Buffer | null = null;
  if (type === "video" && body.preview !== undefined) {
    if (typeof body.preview !== "string" || body.preview.length > 450_000) {
      return NextResponse.json({ error: "Invalid video preview" }, { status: 400 });
    }
    const match = body.preview.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) return NextResponse.json({ error: "Invalid video preview" }, { status: 400 });
    videoPreview = Buffer.from(match[1], "base64");
    if (videoPreview.length > 320_000) return NextResponse.json({ error: "Video preview too large" }, { status: 413 });
  }
  const { featured, gallery } = getGalleryData();
  if (![...featured, ...gallery].some((item) => item.name === name && item.type === type)) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  try {
    const otherType = type === "image" ? "video" : "image";
    const [allViewsRaw, typeViewsRaw, otherViewsRaw, mediaViewsRaw] = await Promise.all([
      redisCommand(["INCR", "gallery:views:all"]),
      redisCommand(["INCR", `gallery:views:${type}`]),
      redisCommand(["GET", `gallery:views:${otherType}`]),
      redisCommand(["INCR", `gallery:views:item:${Buffer.from(name).toString("base64url")}`]),
    ]);
    const allViews = Number(allViewsRaw);
    const typeViews = Number(typeViewsRaw);
    const otherViews = Number(otherViewsRaw ?? 0);
    const mediaViews = Number(mediaViewsRaw);
    if (![allViews, typeViews, otherViews, mediaViews].every(Number.isFinite)) throw new Error("Invalid counter value");

    const photoViews = type === "image" ? typeViews : otherViews;
    const videoViews = type === "video" ? typeViews : otherViews;
    const icon = type === "image" ? "🖼️" : "🎬";
    const mediaUrl = new URL(media.src, request.nextUrl.origin).toString();
    const time = new Intl.DateTimeFormat("bs-BA", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Sarajevo",
    }).format(new Date());

    const content = `${icon} **${type === "image" ? "Otvorena fotografija" : "Otvoren video"}**\n🔢 Pregleda ovog ${type === "image" ? "fajla" : "videa"}: **${mediaViews}**\n📊 Ukupno: 🖼️ **${photoViews}** fotografija · 🎬 **${videoViews}** videa · **${allViews}** ukupno\n🕒 ${time}`;
    const embeds = type === "image"
      ? [{ image: { url: mediaUrl } }]
      : videoPreview
        ? [{ title: "🎬 Otvori video", url: mediaUrl, image: { url: "attachment://video-preview.jpg" } }]
        : [];

    let discordBody: BodyInit;
    const headers: Record<string, string> = {};
    if (videoPreview) {
      const form = new FormData();
      form.append("payload_json", JSON.stringify({ content, embeds, allowed_mentions: { parse: [] } }));
      form.append("files[0]", new Blob([new Uint8Array(videoPreview)], { type: "image/jpeg" }), "video-preview.jpg");
      discordBody = form;
    } else {
      headers["content-type"] = "application/json";
      discordBody = JSON.stringify({ content: type === "video" && embeds.length === 0 ? `${content}\n🎞️ ${mediaUrl}` : content, embeds, allowed_mentions: { parse: [] } });
    }

    const discordResponse = await fetch(webhookUrl, { method: "POST", headers, body: discordBody, cache: "no-store" });
    return new NextResponse(null, { status: discordResponse.ok ? 204 : 502 });
  } catch {
    return new NextResponse("View tracking is not configured or temporarily unavailable", { status: 503 });
  }
}
