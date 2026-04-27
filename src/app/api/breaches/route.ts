import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ count: 0 });
    }

    const domain = email.split("@")[1];
    
    // Check breaches by domain using HIBP API
    // Note: The /breaches?domain endpoint doesn't require an API key
    const res = await fetch(`https://haveibeenpwned.com/api/v3/breaches?domain=${encodeURIComponent(domain)}`, {
      headers: { "User-Agent": "VigilAI-Security-App" },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      if (res.status === 404) return NextResponse.json({ count: 0 }); // 404 means no breaches
      throw new Error(`HIBP API returned status: ${res.status}`);
    }

    const breaches = await res.json();
    return NextResponse.json({ count: Array.isArray(breaches) ? breaches.length : 0 });

  } catch (error) {
    console.error("Breaches API error:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
