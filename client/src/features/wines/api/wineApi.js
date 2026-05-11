/**
 * Wine API integrations for Phase W2.
 *
 * Three data sources, all free at personal scale:
 *   1. VinoFYI      — wine search/detail (CORS-open, no key)
 *   2. Open Food Facts — barcode UPC lookup (CORS-open, no key)
 *   3. Google Cloud Vision — label OCR via server proxy (key stays server-side)
 */

const OFF_BASE = "https://world.openfoodfacts.org/api/v0/product";
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5050";

// ── VinoFYI ────────────────────────────────────────────────────────────────────

/**
 * Search VinoFYI across wines, wineries, grapes, and regions.
 * Returns an array of result objects: { name, slug, type, url }
 */
/**
 * Search VinoFYI via the server proxy.
 * Throws an Error with `code: "unavailable"` when the server can't reach VinoFYI
 * so callers can show a helpful offline message.
 * Returns [] when the query is too short or no results exist.
 */
export async function searchWines(query) {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(
    `${SERVER_URL}/api/wine/search?q=${encodeURIComponent(query.trim())}`
  );
  if (!res.ok) {
    const err = new Error("Wine search unavailable");
    err.code = "unavailable";
    throw err;
  }
  const data = await res.json();
  return data.results || [];
}

/**
 * Fetch full wine detail from VinoFYI by slug.
 * Returns a partial formData object ready to spread into state.
 */
export async function fetchWineDetail(slug) {
  try {
    const res = await fetch(`${SERVER_URL}/api/wine/detail/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const d = await res.json();

    const primaryGrape = d.grapes?.find((g) => g.is_primary) || d.grapes?.[0];

    return {
      wineName: d.name || "",
      winery: d.winery?.name || "",
      wineType: normalizeWineType(d.wine_type),
      region: d.region || "",
      country: d.country || "",
      varietal: primaryGrape?.name || "",
      foodPairings: (d.food_pairings || []).map((p) => p.name).join(", "),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch winery detail from VinoFYI by slug.
 * Returns winery metadata plus a top-wines list for the sub-picker.
 */
export async function fetchWineryDetail(slug) {
  try {
    const res = await fetch(`${SERVER_URL}/api/wine/winery/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const d = await res.json();
    return {
      winery: d.name || "",
      region: d.region || "",
      country: d.country || "",
      topWines: (d.top_wines || []).map((w) => ({
        name: w.name,
        slug: w.slug,
        wineType: w.wine_type,
        rating: w.avg_rating,
      })),
    };
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
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[wineApi] OCR server error ${res.status}:`, body);
      return null;
    }
    const data = await res.json();
    return data.text || null;
  } catch (err) {
    console.error("[wineApi] OCR fetch failed (server down or CORS?):", err.message);
    return null;
  }
}

// ── OCR text parsing ───────────────────────────────────────────────────────────

/**
 * Maps every recognised varietal to its wine type.
 * Kept here (not imported from wineSchema) so this module stays side-effect-free.
 */
const VARIETAL_TYPE_MAP = {
  "Cabernet Sauvignon": "Red",
  "Pinot Noir": "Red",
  "Merlot": "Red",
  "Syrah / Shiraz": "Red",
  "Zinfandel": "Red",
  "Malbec": "Red",
  "Tempranillo": "Red",
  "Sangiovese": "Red",
  "Grenache": "Red",
  "Nebbiolo": "Red",
  "Chardonnay": "White",
  "Sauvignon Blanc": "White",
  "Pinot Grigio": "White",
  "Riesling": "White",
  "Albariño": "White",
  "Viognier": "White",
  "Gewürztraminer": "White",
  "Moscato": "White",
  "Chenin Blanc": "White",
  "Grüner Veltliner": "White",
  "Rosé": "Rosé",
  "Prosecco": "Sparkling",
  "Champagne": "Sparkling",
  "Cava": "Sparkling",
};

/**
 * Well-known wine regions commonly found on bottle labels.
 * Used for OCR text matching — if any of these appear in the label, we can
 * pre-fill the region field without needing VinoFYI.
 */
const KNOWN_REGIONS = [
  "Napa Valley", "Sonoma", "Willamette Valley", "Paso Robles", "Central Coast",
  "Walla Walla", "Columbia Valley", "Finger Lakes", "Russian River Valley",
  "Bordeaux", "Burgundy", "Champagne", "Rhône", "Loire", "Alsace", "Provence",
  "Rioja", "Ribera del Duero", "Priorat",
  "Tuscany", "Piedmont", "Veneto", "Sicily", "Chianti",
  "Marlborough", "Hawke's Bay",
  "Barossa Valley", "McLaren Vale", "Margaret River",
  "Mendoza", "Stellenbosch", "Mosel", "Douro",
];

/**
 * Extract wine-relevant tokens from a raw OCR text blob.
 * Returns { vintageGuess, searchQuery, varietal, wineType, wineName, region }.
 *
 * Strategy:
 *   1. Find a vintage year (4-digit, reasonable range).
 *   2. Match the full text against VARIETAL_TYPE_MAP (case-insensitive) to get
 *      varietal and wineType without needing VinoFYI.
 *   3. Match against KNOWN_REGIONS for region extraction.
 *   4. Build a clean wineName by removing the year, varietal component words,
 *      and very long lines — what remains is most likely the winery / wine name.
 *   5. Build a smart searchQuery (wineName + varietal for better VinoFYI hits).
 */
export function parseOcrText(text) {
  if (!text) return { vintageGuess: null, searchQuery: "", varietal: null, wineType: null, wineName: null, region: null };

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  // 1. Vintage year
  const yearMatch = text.match(/\b(19[5-9]\d|20[0-2]\d|2030|2031|2032|2033|2034|2035)\b/);
  const vintageGuess = yearMatch ? yearMatch[1] : null;

  // 2. Varietal + wineType — scan full text case-insensitively
  let varietal = null;
  let wineType = null;
  const textLower = text.toLowerCase();
  for (const [v, t] of Object.entries(VARIETAL_TYPE_MAP)) {
    if (textLower.includes(v.toLowerCase())) {
      varietal = v;
      wineType = t;
      break;
    }
  }

  // 3. Region — match against known wine regions
  let region = null;
  for (const r of KNOWN_REGIONS) {
    if (textLower.includes(r.toLowerCase())) {
      region = r;
      break;
    }
  }

  // 4. Clean wineName — strip lines that are just varietal component words, year, or region
  const varietalWords = varietal
    ? new Set(varietal.toLowerCase().split(/[\s/]+/).filter(Boolean))
    : new Set();
  const regionLower = region ? region.toLowerCase() : "";

  const nameLines = lines.filter((l) => {
    const lower = l.toLowerCase().replace(/[^a-z\s]/g, "");
    if (/^\d+$/.test(l)) return false;                            // pure number
    if (vintageGuess && l.includes(vintageGuess)) return false;   // year line
    if (regionLower && lower.includes(regionLower)) return false; // region line
    // Skip if the line is entirely made up of varietal component words
    if (varietalWords.size > 0) {
      const lineWords = new Set(lower.split(/\s+/).filter(Boolean));
      const allVarietal = [...lineWords].every((w) => varietalWords.has(w));
      if (allVarietal) return false;
    }
    return true;
  });

  // Prefer shorter lines (≤ 20 chars) as they're more likely to be a name than a
  // description or region — fall back to the first available line if none are short.
  const shortLines = nameLines.filter((l) => l.length <= 20);
  const nameCandidates = shortLines.length > 0 ? shortLines : nameLines;
  const wineName = nameCandidates.slice(0, 2).join(" ").trim() || null;

  // 5. Smart searchQuery — "wineName varietal" matches VinoFYI's index better
  //    than dumping the full OCR text
  const targetedQuery = [wineName, varietal].filter(Boolean).join(" ");
  const searchQuery = targetedQuery.length >= 4
    ? targetedQuery.slice(0, 60)
    : lines
        .filter((l) => !/^\d+$/.test(l))
        .filter((l) => l.length >= 3 && l.length <= 60)
        .slice(0, 4)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);

  return { vintageGuess, searchQuery, varietal, wineType, wineName, region };
}
