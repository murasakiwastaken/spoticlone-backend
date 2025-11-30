// server.js - Deploy this to a hosting service
require('dotenv').config(); // Add this package: npm install dotenv
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// ALLOW YOUR FRONTEND DOMAIN ONLY
app.use(cors({
  origin: 'https://2625837.playcode.io', // Your frontend URL
  credentials: true
}));
app.use(express.json());

// Load from environment variables
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'https://2625837.playcode.io/callback'; // MUST MATCH DASHBOARD

// =========================================
// 1. EXCHANGE CODE FOR TOKEN (POST)
// =========================================
app.post('/api/token', async (req, res) => {
  const { code } = req.body;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI); // Must match exactly

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
    res.status(error.response?.status || 500).json({ error: 'Token exchange failed' });
  }
});

// =========================================
// 2. REFRESH TOKEN (POST)
// =========================================
app.post('/api/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refresh_token);

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Refresh failed' });
  }
});

// =========================================
// 3. PROXY SPOTIFY API CALLS (GET)
// =========================================
app.get('/api/spotify/*', async (req, res) => {
  const userToken = req.headers['authorization']; // Should be "Bearer <token>"
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
