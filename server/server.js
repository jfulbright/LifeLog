import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const REQUEST_TIMEOUT_MS = 10_000;

// Only allow requests from the React frontend
app.use(cors({ origin: CORS_ORIGIN }));
app.options("*", cors());
app.use(express.json({ limit: "10mb" }));

const SETLISTFM_BASE = "https://api.setlist.fm/rest/1.0/search/setlists";

/**
 * GET /api/setlists/search
 * Dedicated Setlist.fm search endpoint. The client passes search params;
 * the server constructs the upstream URL — the client never controls the
 * target host, eliminating the SSRF / API-key-leak risk of the old
 * open /api/proxy?url= pattern.
 *
 * Accepted params: artistName (required), year, countryCode, stateCode, p (page)
 */
app.get("/api/setlists/search", async (req, res) => {
  const { artistName, year, countryCode, stateCode, p } = req.query;

  if (!artistName || !String(artistName).trim()) {
    return res.status(400).json({ error: "artistName is required" });
  }

  // Build upstream query from an explicit allowlist — no arbitrary params pass through
  const upstream = new URLSearchParams();
  upstream.set("artistName", String(artistName).trim());
  if (year)        upstream.set("year",        String(year).trim());
  if (countryCode) upstream.set("countryCode", String(countryCode).trim());
  if (stateCode)   upstream.set("stateCode",   String(stateCode).trim());
  if (p)           upstream.set("p",           String(p).trim());

  const targetUrl = `${SETLISTFM_BASE}?${upstream.toString()}`;

  // Enforce a hard timeout so a slow upstream can't hang the server
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "x-api-key": process.env.SETLISTFM_API_KEY,
        Accept: "application/json",
        "User-Agent": "LifeSnapsApp/1.0 (jfulbright@gmail.com)",
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Setlist.fm error: ${response.statusText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Setlist.fm request timed out" });
    }
    console.error("Setlists search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/wine/scan
 * Proxies a base64 label image to Google Cloud Vision TEXT_DETECTION.
 * Keeps the API key server-side so it is never exposed in the client bundle.
 *
 * Body: { image: "<base64 string>" }
 * Response: { text: "<extracted text>" }
 */
app.post("/api/wine/scan", async (req, res) => {
  const { image } = req.body || {};

  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: "image (base64 string) is required" });
  }

  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Google Cloud Vision API key not configured" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: image },
              features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      }
    );

    clearTimeout(timer);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Vision API error: ${response.statusText}` });
    }

    const data = await response.json();
    const text = data.responses?.[0]?.fullTextAnnotation?.text || "";
    res.json({ text });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Vision API request timed out" });
    }
    console.error("Wine scan error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`📸 LifeSnaps proxy running on http://localhost:${PORT}`);
});
