/**
 * Wine API integrations for Phase W2.
 *
 * Three data sources, all free at personal scale:
 *   1. VinoFYI      — wine search/detail (CORS-open, no key)
 *   2. Open Food Facts — barcode UPC lookup (CORS-open, no key)
 *   3. Google Cloud Vision — label OCR via server proxy (key stays server-side)
 */

const VINOFYI_BASE = "https://vinofyi.com/api";
const OFF_BASE = "https://world.openfoodfacts.org/api/v0/product";
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5050";

// ── VinoFYI ────────────────────────────────────────────────────────────────────

/**
 * Search VinoFYI across wines, wineries, grapes, and regions.
 * Returns an array of result objects: { name, slug, type, url }
 */
export async function searchWines(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `${VINOFYI_BASE}/search/?q=${encodeURIComponent(query.trim())}`,
      { headers: { "User-Agent": "LifeSnaps/1.0" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Fetch full wine detail from VinoFYI by slug.
 * Returns a partial formData object ready to spread into state.
 */
export async function fetchWineDetail(slug) {
  try {
    const res = await fetch(
      `${VINOFYI_BASE}/wine/${slug}/`,
      { headers: { "User-Agent": "LifeSnaps/1.0" } }
    );
    if (!res.ok) return null;
    const d = await res.json();

    const primaryGrape = d.grapes?.find((g) => g.is_primary) || d.grapes?.[0];

    return {
      wineName: d.name || "",
      winery: d.winery?.name || "",
      wineType: normalizeWineType(d.wine_type),
      region: d.region || "",
      varietal: primaryGrape?.name || "",
    };
  } catch {
    return null;
  }
}

/**
 * Fetch winery detail from VinoFYI by slug.
 */
export async function fetchWineryDetail(slug) {
  try {
    const res = await fetch(
      `${VINOFYI_BASE}/winery/${slug}/`,
      { headers: { "User-Agent": "LifeSnaps/1.0" } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Normalize VinoFYI's wine_type string to match our schema options.
 */
function normalizeWineType(raw) {
  if (!raw) return "";
  const map = {
    red: "Red", white: "White", rosé: "Rosé", rose: "Rosé",
    sparkling: "Sparkling", dessert: "Dessert", fortified: "Fortified",
    orange: "Orange",
  };
  return map[raw.toLowerCase()] || raw;
}

// ── Open Food Facts (barcode) ──────────────────────────────────────────────────

/**
 * Look up a wine bottle by UPC/EAN barcode via Open Food Facts.
 * Returns partial formData or null.
 */
export async function lookupByBarcode(upc) {
  if (!upc) return null;
  try {
    const res = await fetch(`${OFF_BASE}/${upc}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const name = p.product_name_en || p.product_name || "";
    const brand = p.brands || "";
    const imageUrl = p.image_url || p.image_front_url || "";

    if (!name) return null;

    return {
      wineName: name,
      winery: brand,
      photoLink: imageUrl,
      barcodeUpc: upc,
    };
  } catch {
    return null;
  }
}

// ── Google Cloud Vision OCR (via server proxy) ─────────────────────────────────

/**
 * Send a base64 image to the server's /api/wine/scan endpoint.
 * The server calls Google Cloud Vision TEXT_DETECTION and returns the text blob.
 * Returns extracted text string, or null if unavailable.
 */
export async function scanLabelOcr(base64Image) {
  try {
    const res = await fetch(`${SERVER_URL}/api/wine/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
  } catch {
    return null;
  }
}

// ── OCR text parsing ───────────────────────────────────────────────────────────

/**
 * Extract wine-relevant tokens from a raw OCR text blob.
 * Returns { vintageGuess, searchQuery } — vintageGuess may be null.
 *
 * Strategy: find a 4-digit year in range 1900-2035, use the rest of the
 * text as a condensed search query for VinoFYI.
 */
export function parseOcrText(text) {
  if (!text) return { vintageGuess: null, searchQuery: "" };

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  // Find the most prominent 4-digit year
  const yearMatch = text.match(/\b(19[5-9]\d|20[0-2]\d|2030|2031|2032|2033|2034|2035)\b/);
  const vintageGuess = yearMatch ? yearMatch[1] : null;

  // Build a search query from the longest non-numeric lines (wine name candidates)
  const candidates = lines
    .filter((l) => !/^\d+$/.test(l))
    .filter((l) => l.length >= 3 && l.length <= 60)
    .slice(0, 4);

  const searchQuery = candidates.join(" ").replace(/\s+/g, " ").trim().slice(0, 80);

  return { vintageGuess, searchQuery };
}
