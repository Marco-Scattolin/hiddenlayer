import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";


interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  googleMapsUri?: string;
  primaryTypeDisplayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
    openNow?: boolean;
  };
  currentOpeningHours?: {
    openNow?: boolean;
  };
  businessStatus?: string;
  photos?: Array<{ name: string }>;
}

interface Business {
  name: string;
  category: string | null;
  address: string;
  phone: string | null;
  mapsUrl: string;
  reason: "no_website" | "unreachable_website";
  rating: number | null;
  user_ratings_total: number | null;
  opening_hours: {
    weekday_text: string[] | null;
    open_now: boolean | null;
  };
  business_status: string | null;
  photo_reference: string | null;
}

// Returns true if the server sends any HTTP response (even 4xx/5xx).
// Returns false only on network failure, DNS error, or timeout.
async function isUrlReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Returns true if the business name or domain matches an exclusion row.
async function isExcluded(name: string, websiteUri?: string): Promise<boolean> {
  const nameLower = name.toLowerCase();

  const { data: nameMatches } = await supabase
    .from("exclusion")
    .select("id")
    .ilike("name", `%${nameLower}%`)
    .limit(1);

  if (nameMatches && nameMatches.length > 0) return true;

  if (websiteUri) {
    let domain: string;
    try {
      domain = new URL(websiteUri).hostname.replace(/^www\./, "");
    } catch {
      return false;
    }

    const { data: domainMatches } = await supabase
      .from("exclusion")
      .select("id")
      .eq("domain", domain)
      .limit(1);

    if (domainMatches && domainMatches.length > 0) return true;
  }

  return false;
}

// Uses Claude to generate 3-4 Italian search query variations for the sector.
// Falls back to [sector] if the API call fails for any reason.
async function getSectorVariations(sector: string): Promise<string[]> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `Sei un esperto di ricerca locale in Italia. Dato il settore "${sector}", genera 3-4 varianti di query di ricerca in italiano che un utente userebbe su Google Maps per trovare attività locali di quel tipo. Rispondi SOLO con le varianti, una per riga, senza numerazione, spiegazioni o testo aggiuntivo.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const variations = text
      .split("\n")
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .slice(0, 4);

    return [sector, ...variations.filter((v) => v.toLowerCase() !== sector.toLowerCase())];
  } catch (err) {
    console.error("Claude variation generation failed, falling back to original sector:", err);
    return [sector];
  }
}

const PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.googleMapsUri",
  "places.primaryTypeDisplayName",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours",
  "places.currentOpeningHours",
  "places.businessStatus",
  "places.photos",
  "nextPageToken",
].join(",");

// Fetches places for a single text query, paginating up to 3 pages.
// Waits 2 seconds between page requests as required by the Places API.
async function fetchPlaces(textQuery: string, apiKey: string): Promise<PlaceResult[]> {
  const allPlaces: PlaceResult[] = [];
  const seen = new Set<string>();
  let pageToken: string | undefined;
  const MAX_PAGES = 3;

  for (let page = 0; page < MAX_PAGES; page++) {
    if (page > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const body: Record<string, unknown> = { textQuery, maxResultCount: 20 };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": PLACES_FIELD_MASK,
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      console.error(`Places API error for query "${textQuery}" (page ${page + 1}):`, await res.text());
      break;
    }

    const data = await res.json();
    const places: PlaceResult[] = data.places ?? [];

    for (const place of places) {
      if (!seen.has(place.id)) {
        seen.add(place.id);
        allPlaces.push(place);
      }
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return allPlaces;
}

export async function GET(request: NextRequest) {
  const sector = request.nextUrl.searchParams.get("sector")?.trim() || "";
  const area = request.nextUrl.searchParams.get("area")?.trim() || "";

  if (!sector && !area) {
    return NextResponse.json(
      { error: "Inserisci almeno un settore o un'area geografica." },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chiave API non configurata." },
      { status: 500 }
    );
  }

  // Build query terms: if no sector, use a generic fallback (no variations needed)
  let queryTerms: string[];
  if (sector) {
    queryTerms = await getSectorVariations(sector);
  } else {
    queryTerms = ["negozi e servizi locali"];
  }

  // Run all Places API calls in parallel
  const rawResults = await Promise.all(
    queryTerms.map((term) =>
      fetchPlaces([term, area].filter(Boolean).join(" "), apiKey)
    )
  );

  // Merge and deduplicate by place ID
  const seen = new Set<string>();
  const merged: PlaceResult[] = [];
  for (const batch of rawResults) {
    for (const place of batch) {
      if (!seen.has(place.id)) {
        seen.add(place.id);
        merged.push(place);
      }
    }
  }

  const areaLower = area.toLowerCase();
  const areaOnlySearch = !sector;
  const mallKeywords = ["centro commerciale", "mall", "shopping", "galleria"];

  const places = merged.filter((p) => {
    const nameLower = p.displayName?.text?.toLowerCase() ?? "";
    if (areaLower && nameLower === areaLower) return false;
    if (mallKeywords.some((kw) => nameLower.includes(kw))) return false;
    if (areaOnlySearch && !p.nationalPhoneNumber) return false;
    if (!p.nationalPhoneNumber && !p.formattedAddress?.match(/\d/)) return false;
    return true;
  });

  const settled = await Promise.all(
    places.map(async (place): Promise<Business | null> => {
      const name = place.displayName?.text ?? "Sconosciuto";
      const category = place.primaryTypeDisplayName?.text ?? null;
      const address = place.formattedAddress ?? "";
      const phone = place.nationalPhoneNumber ?? null;
      const mapsUrl =
        place.googleMapsUri ??
        `https://www.google.com/maps/place/?q=place_id:${place.id}`;

      const rating = place.rating ?? null;
      const user_ratings_total = place.userRatingCount ?? null;
      const opening_hours = {
        weekday_text: place.regularOpeningHours?.weekdayDescriptions ?? null,
        open_now:
          place.currentOpeningHours?.openNow ??
          place.regularOpeningHours?.openNow ??
          null,
      };
      const business_status = place.businessStatus ?? null;
      const photo_reference = place.photos?.[0]?.name ?? null;

      if (await isExcluded(name, place.websiteUri)) return null;

      if (!place.websiteUri) {
        return { name, category, address, phone, mapsUrl, reason: "no_website", rating, user_ratings_total, opening_hours, business_status, photo_reference };
      }

      const reachable = await isUrlReachable(place.websiteUri);
      if (!reachable) {
        return { name, category, address, phone, mapsUrl, reason: "unreachable_website", rating, user_ratings_total, opening_hours, business_status, photo_reference };
      }

      return null;
    })
  );

  const businesses = settled.filter((b): b is Business => b !== null);

  return NextResponse.json({ businesses });
}
