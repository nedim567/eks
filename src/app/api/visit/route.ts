import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getDevice(userAgent: string) {
  if (/iPhone/i.test(userAgent)) return "iPhone (exact model not provided by browser)";
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/Android/i.test(userAgent)) {
    const model = userAgent.match(/Android[^;)]*;\s*([^;)]+)/i)?.[1]?.replace(/\s+Build\/.*/i, "").trim();
    return model && model.length < 60 ? `Android — ${model}` : "Android device (model not provided)";
  }
  if (/Mobile/i.test(userAgent)) return "Mobile device (model not provided)";
  return "Desktop or laptop";
}

function getOperatingSystem(userAgent: string) {
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS / iPadOS";
  if (/Windows NT/i.test(userAgent)) return "Windows";
  if (/Mac OS X/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown";
}

function getBrowser(userAgent: string) {
  if (/Edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/CriOS\//i.test(userAgent)) return "Chrome on iOS";
  if (/Chrome\//i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent)) return "Safari";
  return "Unknown browser";
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return new NextResponse(null, { status: 403 });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return new NextResponse("Discord webhook is not configured", { status: 503 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const time = new Intl.DateTimeFormat("bs-BA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Sarajevo",
  }).format(new Date());

  const result = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content: `🌐 **Nova posjeta galeriji**\n📱 Uređaj: ${getDevice(userAgent)}\n🧭 Sistem: ${getOperatingSystem(userAgent)}\n🌍 Browser: ${getBrowser(userAgent)}\n🕒 Vrijeme: ${time}`,
      allowed_mentions: { parse: [] },
    }),
    cache: "no-store",
  });

  return new NextResponse(null, { status: result.ok ? 204 : 502 });
}
