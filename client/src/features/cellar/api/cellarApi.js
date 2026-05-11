/**
 * Cellar API integrations — Wine (VinoFYI) + Whiskey (WhiskeyFYI).
 *
 * Data sources (all free at personal scale):
 *   1. VinoFYI        — wine search/detail (via server proxy)
 *   2. WhiskeyFYI     — whiskey expression/distillery search (via server proxy)
 *   3. Open Food Facts — barcode UPC lookup (CORS-open, no key)
 *   4. Google Cloud Vision — label OCR via server proxy (key stays server-side)
 */

const OFF_BASE = "https://world.openfoodfacts.org/api/v0/product";
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5050";

// ═══════════════════════════════════════════════════════════════════════════════
// WINE — VinoFYI
// ═══════════════════════════════════════════════════════════════════════════════

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

function normalizeWineType(raw) {
  if (!raw) return "";
  const map = {
    red: "Red", white: "White", rosé: "Rosé", rose: "Rosé",
    sparkling: "Sparkling", dessert: "Dessert", fortified: "Fortified",
    orange: "Orange",
  };
  return map[raw.toLowerCase()] || raw;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHISKEY — WhiskeyFYI
// ═══════════════════════════════════════════════════════════════════════════════

export async function searchWhiskeys(query) {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(
    `${SERVER_URL}/api/whiskey/search?q=${encodeURIComponent(query.trim())}`
  );
  if (!res.ok) {
    const err = new Error("Whiskey search unavailable");
    err.code = "unavailable";
    throw err;
  }
  const data = await res.json();
  return data.results || [];
}

export async function fetchWhiskeyDetail(slug) {
  try {
    const res = await fetch(`${SERVER_URL}/api/whiskey/detail/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const d = await res.json();

    return {
      whiskyName: d.name || "",
      distillery: d.distillery?.name || "",
      whiskyType: normalizeWhiskeyType(d.whiskey_type?.name),
      abv: d.abv ? String(d.abv) : "",
      ageStatement: d.age_statement || "",
      priceRange: d.price_range || "",
      nose: d.nose || "",
      palate: d.palate || "",
      finish: d.finish || "",
      caskType: (d.cask_types || []).map((c) => c.name || c).join(", "),
      description: d.description || "",
    };
  } catch {
    return null;
  }
}

export async function fetchDistilleryDetail(slug) {
  try {
    const res = await fetch(`${SERVER_URL}/api/whiskey/distillery/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const d = await res.json();
    return {
      distillery: d.name || "",
      region: d.region?.name || d.region || "",
      country: d.country?.name || d.country || "",
    };
  } catch {
    return null;
  }
}

function normalizeWhiskeyType(raw) {
  if (!raw) return "";
  const map = {
    bourbon: "Bourbon", scotch: "Scotch", rye: "Rye",
    irish: "Irish", japanese: "Japanese", canadian: "Canadian",
  };
  return map[raw.toLowerCase()] || raw;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED — Barcode + OCR
// ═══════════════════════════════════════════════════════════════════════════════

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

export async function scanLabelOcr(base64Image) {
  try {
    const res = await fetch(`${SERVER_URL}/api/wine/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[cellarApi] OCR server error ${res.status}:`, body);
      return null;
    }
    const data = await res.json();
    return data.text || null;
  } catch (err) {
    console.error("[cellarApi] OCR fetch failed:", err.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OCR TEXT PARSING
// ═══════════════════════════════════════════════════════════════════════════════

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

const KNOWN_REGIONS = [
  "Napa Valley", "Sonoma", "Willamette Valley", "Paso Robles", "Central Coast",
  "Walla Walla", "Columbia Valley", "Finger Lakes", "Russian River Valley",
  "Bordeaux", "Burgundy", "Champagne", "Rhône", "Loire", "Alsace", "Provence",
  "Rioja", "Ribera del Duero", "Priorat",
  "Tuscany", "Piedmont", "Veneto", "Sicily", "Chianti",
  "Marlborough", "Hawke's Bay",
  "Barossa Valley", "McLaren Vale", "Margaret River",
  "Mendoza", "Stellenbosch", "Mosel", "Douro",
  "Kentucky", "Islay", "Speyside", "Highland", "Lowland", "Campbeltown",
];

const WHISKEY_KEYWORDS = [
  "bourbon", "whiskey", "whisky", "scotch", "rye", "single malt",
  "blended", "distillery", "cask strength", "barrel proof", "proof",
];

export function parseOcrText(text) {
  if (!text) return { vintageGuess: null, searchQuery: "", varietal: null, wineType: null, wineName: null, region: null, isWhiskey: false };

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  const textLower = text.toLowerCase();

  // Detect if this is likely a whiskey label
  const isWhiskey = WHISKEY_KEYWORDS.some((kw) => textLower.includes(kw));

  // 1. Vintage year (wine) or age statement
  const yearMatch = text.match(/\b(19[5-9]\d|20[0-2]\d|2030|2031|2032|2033|2034|2035)\b/);
  const vintageGuess = yearMatch ? yearMatch[1] : null;

  // 2. Varietal + wineType
  let varietal = null;
  let wineType = null;
  if (!isWhiskey) {
    for (const [v, t] of Object.entries(VARIETAL_TYPE_MAP)) {
      if (textLower.includes(v.toLowerCase())) {
        varietal = v;
        wineType = t;
        break;
      }
    }
  }

  // 3. Region
  let region = null;
  for (const r of KNOWN_REGIONS) {
    if (textLower.includes(r.toLowerCase())) {
      region = r;
      break;
    }
  }

  // 4. Clean name
  const varietalWords = varietal
    ? new Set(varietal.toLowerCase().split(/[\s/]+/).filter(Boolean))
    : new Set();
  const regionLower = region ? region.toLowerCase() : "";

  const nameLines = lines.filter((l) => {
    const lower = l.toLowerCase().replace(/[^a-z\s]/g, "");
    if (/^\d+$/.test(l)) return false;
    if (vintageGuess && l.includes(vintageGuess)) return false;
    if (regionLower && lower.includes(regionLower)) return false;
    if (varietalWords.size > 0) {
      const lineWords = new Set(lower.split(/\s+/).filter(Boolean));
      const allVarietal = [...lineWords].every((w) => varietalWords.has(w));
      if (allVarietal) return false;
    }
    return true;
  });

  const shortLines = nameLines.filter((l) => l.length <= 20);
  const nameCandidates = shortLines.length > 0 ? shortLines : nameLines;
  const wineName = nameCandidates.slice(0, 2).join(" ").trim() || null;

  // 5. Smart search query
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

  return { vintageGuess, searchQuery, varietal, wineType, wineName, region, isWhiskey };
}
