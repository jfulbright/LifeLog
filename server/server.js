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

app.listen(PORT, () => {
  console.log(`📸 LifeSnaps proxy running on http://localhost:${PORT}`);
});
