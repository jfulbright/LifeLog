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
    const res = await fetch(`${SERVER_URL}/api/wine/winery/${encodeURIComponent(slug)}`);
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
 * Extract wine-relevant tokens from a raw OCR text blob.
 * Returns { vintageGuess, searchQuery, varietal, wineType, wineName }.
 *
 * Strategy:
 *   1. Find a vintage year (4-digit, reasonable range).
 *   2. Match the full text against VARIETAL_TYPE_MAP (case-insensitive) to get
 *      varietal and wineType without needing VinoFYI.
 *   3. Build a clean wineName by removing the year, varietal component words,
 *      and very long lines — what remains is most likely the winery / wine name.
 *   4. Build a searchQuery (used by the VinoFYI path when available).
 */
export function parseOcrText(text) {
  if (!text) return { vintageGuess: null, searchQuery: "", varietal: null, wineType: null, wineName: null };

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

  // 3. Clean wineName — strip lines that are just varietal component words or the year
  //    e.g. for "Pinot Noir", strip lines "PINOT", "NOIR", "PINOT NOIR"
  const varietalWords = varietal
    ? new Set(varietal.toLowerCase().split(/[\s/]+/).filter(Boolean))
    : new Set();

  const nameLines = lines.filter((l) => {
    const lower = l.toLowerCase().replace(/[^a-z\s]/g, "");
    if (/^\d+$/.test(l)) return false;                            // pure number
    if (vintageGuess && l.includes(vintageGuess)) return false;   // year line
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

  // 4. searchQuery for VinoFYI (unchanged from original strategy)
  const queryCandidates = lines
    .filter((l) => !/^\d+$/.test(l))
    .filter((l) => l.length >= 3 && l.length <= 60)
    .slice(0, 4);
  const searchQuery = queryCandidates.join(" ").replace(/\s+/g, " ").trim().slice(0, 80);

  return { vintageGuess, searchQuery, varietal, wineType, wineName };
}
