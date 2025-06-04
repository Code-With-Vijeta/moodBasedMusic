const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 9000;

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/moods", (req, res) => {
  const moods = ["happy", "sad", "romantic", "party", "chill", "energetic", "motivational"];
  res.json(moods);
});

let spotifyAccessToken = "";

async function getSpotifyAccessToken() {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  spotifyAccessToken = res.data.access_token;
}

getSpotifyAccessToken();
setInterval(getSpotifyAccessToken, 55 * 60 * 1000);

app.get("/suggestions", async (req, res) => {
  const mood = req.query.mood || "happy";

  try {
    const searchRes = await axios.get(`https://api.spotify.com/v1/search`, {
      headers: { Authorization: `Bearer ${spotifyAccessToken}` },
      params: {
        q: `${mood} music`,
        type: "playlist",
        limit: 5,
      },
    });

    const playlists = searchRes.data.playlists.items;
    if (!playlists || playlists.length === 0) {
      console.warn(`No playlist found for mood: ${mood}`);
      return res.json([]);
    }

    for (const playlist of playlists) {
      const playlistId = playlist.id;
      const tracksRes = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: { Authorization: `Bearer ${spotifyAccessToken}` },
        }
      );

      const tracks = tracksRes.data.items
        .map((item) => item.track)
        .filter(track => track && track.external_urls && track.external_urls.spotify)
        .slice(0, 5);

      const formattedTracks = tracks.map((track) => ({
        title: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        videoUrl: track.external_urls.spotify,
        albumCover: track.album.images[1]?.url || "",
      }));

      if (formattedTracks.length > 0) return res.json(formattedTracks);
    }

    res.json([]); // fallback if no tracks found
  } catch (err) {
    console.error("Spotify error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch songs from Spotify" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
