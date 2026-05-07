// Import required modules
import express from "express";
import fetch from "node-fetch"; // used to forward requests to Setlist.fm
import dotenv from "dotenv"; // loads your .env file with API key
import cors from "cors"; // allows requests from your frontend

// Load environment variables (like your SETLISTFM_API_KEY)
dotenv.config();

const app = express();
const PORT = 5050;

// ✅ Allow requests from your React frontend running on port 3000
app.use(cors({ origin: "http://localhost:3000" }));

// ✅ Handle preflight OPTIONS requests for CORS
app.options("*", cors());

/**
 * GET /api/proxy
 * Secure proxy endpoint that forwards frontend requests to Setlist.fm
 * Example: /api/proxy?url=https://api.setlist.fm/rest/1.0/search/setlists?artistName=coldplay&year=2023
 */
app.get("/api/proxy", async (req, res) => {
  const externalUrl = req.query.url;

  // If the URL parameter is missing, respond with a 400 error
  if (!externalUrl) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    // Forward the request to the Setlist.fm API using your secure key and headers
    const response = await fetch(externalUrl, {
      headers: {
        "x-api-key": process.env.SETLISTFM_API_KEY, // API key from your .env file
        Accept: "application/json",
        "User-Agent": "LifeSnapsApp/1.0 (jfulbright@gmail.com)", // required by Setlist.fm
      },
    });

    // If the Setlist.fm API responds with an error (like 403 or 404), pass it along
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Setlist.fm error: ${response.statusText}` });
    }

    // Parse and return the JSON data from Setlist.fm
    const data = await response.json();
    res.json(data);
  } catch (err) {
    // Catch any network or unexpected server errors
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy server error" });
  }
});

// ✅ Start the proxy server on port 5050
app.listen(PORT, () => {
  console.log(`🎧 Setlist.fm proxy running on http://localhost:${PORT}`);
});
