const PLACE_BASIC_FIELD_MASK = [
  "displayName",
  "formattedAddress",
  "primaryTypeDisplayName",
  "googleMapsUri",
  "businessStatus",
].join(",");

export interface PlaceBasicDetails {
  name: string;
  address: string;
  category: string | null;
  mapsUrl: string;
  business_status: string | null;
}

export async function getPlaceBasicDetails(placeId: string): Promise<PlaceBasicDetails> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY non configurata.");

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACE_BASIC_FIELD_MASK,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Places Basic API error ${res.status} per place_id "${placeId}": ${body}`);
  }

  const data = await res.json();
  return {
    name: data.displayName?.text ?? "",
    address: data.formattedAddress ?? "",
    category: data.primaryTypeDisplayName?.text ?? null,
    mapsUrl: data.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    business_status: data.businessStatus ?? null,
  };
}

export async function getPlacesBasicDetailsBulk(
  placeIds: string[]
): Promise<Record<string, PlaceBasicDetails>> {
  const results = await Promise.all(
    placeIds.map(async (id) => {
      try {
        return [id, await getPlaceBasicDetails(id)] as const;
      } catch (err) {
        console.error(`[getPlacesBasicDetailsBulk] Errore per place_id "${id}":`, err);
        return null;
      }
    })
  );
  return Object.fromEntries(
    results.filter((r): r is [string, PlaceBasicDetails] => r !== null)
  );
}

const PLACE_DETAILS_FIELD_MASK = [
  "displayName",
  "formattedAddress",
  "primaryTypeDisplayName",
  "nationalPhoneNumber",
  "googleMapsUri",
  "rating",
  "businessStatus",
].join(",");

export interface PlaceDetails {
  name: string;
  address: string;
  category: string | null;
  phone: string | null;
  mapsUrl: string;
  rating: number | null;
  business_status: string | null;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY non configurata.");
  }

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Places Details API error ${res.status} per place_id "${placeId}": ${body}`);
  }

  const data = await res.json();

  const name: string | undefined = data.displayName?.text;
  if (!name) {
    throw new Error(`Google Places Details: displayName mancante per place_id "${placeId}".`);
  }

  return {
    name,
    address: data.formattedAddress ?? "",
    category: data.primaryTypeDisplayName?.text ?? null,
    phone: data.nationalPhoneNumber ?? null,
    mapsUrl: data.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    rating: data.rating ?? null,
    business_status: data.businessStatus ?? null,
  };
}
