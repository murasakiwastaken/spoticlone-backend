// server.js - Spotify-token proxy
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors'); // ← removed “cors25” typo
const app = express();

// allow ONLY your GitHub Page
app.use(cors({
  origin: 'https://murasakiwastaken.github.io',
  credentials: true
}));
app.use(express.json());

// Spotify credentials
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '4ef0b2e57bff49f88229c6f4a877dc21';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '6d0f38dfc7664fdf80ffea93c5cae859';
const REDIRECT_URI = 'https://murasakiwastaken.github.io/spoticlone-frontend/'; // ← no space

// ---------- exchange code for token ----------
app.post('/api/token', async (req, res) => {
  const { code } = req.body;
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);

  try {
    const { data } = await axios.post(
      'https://accounts.spotify.com/api/token', // ← no space
      params,
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    res.json(data);
  } catch (err) {
    console.error('Token exchange failed:', err.response?.data);
    res.status(err.response?.status || 500).json({ error: 'Token exchange failed' });
  }
});

// ---------- proxy Spotify API ----------
app.get('/api/spotify/*', async (req, res) => {
  const userToken = req.headers['authorization'];
  const spotifyUrl = `https://api.spotify.com${req.path.replace('/api/spotify', '')}`; // ← no space

  try {
    const { data } = await axios.get(spotifyUrl, {
      headers: { Authorization: userToken }
    });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Proxy error' });
  }
});

// health check
app.get('/health', (_, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
