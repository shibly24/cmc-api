
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const API_KEY = process.env.CMC_API_KEY;

// 1. Get top tokens (previously from CoinGecko: /coins/markets)
app.get('/api/listings', async (req, res) => {
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: { 'X-CMC_PRO_API_KEY': API_KEY },
      params: {
        start: '1',
        limit: '20',
        convert: 'USD'
      }
    });
    res.json(response.data.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load listings', detail: err.message });
  }
});

// 2. Search tokens by symbol/name
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing query param ?q=' });

  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/map', {
      headers: { 'X-CMC_PRO_API_KEY': API_KEY }
    });

    const results = response.data.data.filter(token =>
      token.name.toLowerCase().includes(query.toLowerCase()) ||
      token.symbol.toLowerCase().includes(query.toLowerCase())
    );

    res.json(results.slice(0, 20)); // Return top 20 matches
  } catch (err) {
    res.status(500).json({ error: 'Search failed', detail: err.message });
  }
});

// 3. Get detailed info about token by symbol
app.get('/api/info', async (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol) return res.status(400).json({ error: 'Missing symbol param ?symbol=' });

  try {
    const quoteRes = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
      headers: { 'X-CMC_PRO_API_KEY': API_KEY },
      params: { symbol, convert: 'USD' }
    });

    const infoRes = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/info', {
      headers: { 'X-CMC_PRO_API_KEY': API_KEY },
      params: { symbol }
    });

    const tokenData = {
      ...quoteRes.data.data[symbol],
      ...infoRes.data.data[symbol]
    };

    res.json(tokenData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get token info', detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});
