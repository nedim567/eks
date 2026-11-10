import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const samsungModelNames: Record<string, string> = {
  "SM-S901B": "Samsung Galaxy S22",
  "SM-S906B": "Samsung Galaxy S22+",
  "SM-S908B": "Samsung Galaxy S22 Ultra",
  "SM-S911B": "Samsung Galaxy S23",
  "SM-S916B": "Samsung Galaxy S23+",
  "SM-S918B": "Samsung Galaxy S23 Ultra",
  "SM-S921B": "Samsung Galaxy S24",
  "SM-S926B": "Samsung Galaxy S24+",
  "SM-S928B": "Samsung Galaxy S24 Ultra",
  "SM-S931B": "Samsung Galaxy S25",
  "SM-S936B": "Samsung Galaxy S25+",
  "SM-S938B": "Samsung Galaxy S25 Ultra",
  "SM-A536B": "Samsung Galaxy A53 5G",
  "SM-A546B": "Samsung Galaxy A54 5G",
  "SM-A556B": "Samsung Galaxy A55 5G",
  "SM-A566B": "Samsung Galaxy A56 5G",
  "SM-F731B": "Samsung Galaxy Z Flip5",
  "SM-F741B": "Samsung Galaxy Z Flip6",
  "SM-F946B": "Samsung Galaxy Z Fold5",
  "SM-F956B": "Samsung Galaxy Z Fold6",
};

function formatDeviceModel(model: string) {
  const samsungCode = model.match(/\bSM-[A-Z0-9]+\b/i)?.[0]?.toUpperCase();
  const friendlyName = samsungCode ? samsungModelNames[samsungCode] : undefined;
  return friendlyName ? `${friendlyName} (${samsungCode})` : model;
}

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
  let deviceModel = "";
  try {
    const body = await request.json() as { deviceModel?: unknown };
    if (typeof body.deviceModel === "string") {
      deviceModel = body.deviceModel.replace(/[\r\n\u0000-\u001f]/g, " ").trim().slice(0, 80);
    }
  } catch {
    // Use the model information available in the User-Agent header when no client hint is sent.
  }
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Nije dostupna";
  const device = formatDeviceModel(deviceModel || getDevice(userAgent));
  const time = new Intl.DateTimeFormat("bs-BA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Sarajevo",
  }).format(new Date());

  const result = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content: `🌐 **Nova posjeta galeriji**\n🌐 IP adresa: ${ipAddress}\n📱 Uređaj/model: ${device}\n🧭 Sistem: ${getOperatingSystem(userAgent)}\n🌍 Browser: ${getBrowser(userAgent)}\n🕒 Vrijeme: ${time}`,
      allowed_mentions: { parse: [] },
    }),
    cache: "no-store",
  });

  return new NextResponse(null, { status: result.ok ? 204 : 502 });
}
