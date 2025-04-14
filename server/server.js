import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = 5050;

// ✅ Enable CORS for frontend
app.use(cors({ origin: "http://localhost:3000" }));

// ✅ Handle preflight requests
app.options("*", cors());

app.get("/api/setlists", async (req, res) => {
  const { artist, year } = req.query;

  if (!artist || !year) {
    return res.status(400).json({ error: "Missing artist or year" });
  }

  const url = `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(
    artist
  )}&year=${year}`;

  try {
    const response = await fetch(url, {
      headers: {
        "x-api-key": process.env.SETLISTFM_API_KEY,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Setlist.fm error: ${response.statusText}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🎧 Setlist.fm proxy running on http://localhost:${PORT}`);
});
