// server.js - PRODUCTION VERSION
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors25');
const app = express();

// CORS - allow your frontend only
app.use(cors({
  origin: 'https://murasakiwastaken.github.io/spoticlone-frontend/',
  credentials: true
}));
app.use(express.json());

// Load from environment variables
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '4ef0b2e57bff49f88229c6f4a877dc21';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '6d0f38dfc7664fdf80ffea93c5cae859';
const REDIRECT_URI = 'https://murasakiwastaken.github.io/spoticlone-frontend/';

// =========================================
// EXCHANGE CODE FOR TOKEN
// =========================================
app.post('/api/token', async (req, res) => {
  const { code } = req.body;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// =========================================
// PROXY SPOTIFY API CALLS
// =========================================
app.get('/api/spotify/*', async (req, res) => {
  const userToken = req.headers['authorization'];
  const spotifyUrl = `https://api.spotify.com${req.path.replace('/api/spotify', '')}`;
  
  try {
    const response = await axios.get(spotifyUrl, {
      headers: { Authorization: userToken }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Proxy error' });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
