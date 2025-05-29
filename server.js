const express = require('express');
const ccxt = require('ccxt');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

const exchanges = {
  binance: new ccxt.binance(),
  coinbasepro: new ccxt.coinbasepro(),
  kraken: new ccxt.kraken()
};

let bestArbitrage = null;
const FEE = 50; // flat taker fee in USD per round trip
const MIN_PROFIT = 50; // minimum net profit to report

async function fetchPrices() {
  const tickers = {};
  for (const [name, ex] of Object.entries(exchanges)) {
    try {
      const ticker = await ex.fetchTicker('BTC/USDT');
      tickers[name] = { bid: ticker.bid, ask: ticker.ask };
    } catch (err) {
      console.error(`Error fetching ${name}:`, err.message);
    }
  }
  return tickers;
}

function computeArbitrage(tickers) {
  const names = Object.keys(tickers);
  let best = null;
  for (const buy of names) {
    for (const sell of names) {
      if (buy === sell) continue;
      const buyPrice = tickers[buy].ask;
      const sellPrice = tickers[sell].bid;
      const spread = sellPrice - buyPrice;
      const netProfit = spread - FEE;
      if (netProfit >= MIN_PROFIT && (!best || netProfit > best.netProfit)) {
        best = { buy, sell, buyPrice, sellPrice, spread, netProfit };
      }
    }
  }
  bestArbitrage = best;
}

async function poll() {
  const tickers = await fetchPrices();
  if (Object.keys(tickers).length >= 2) {
    computeArbitrage(tickers);
  }
}

// poll every 10 seconds instead of 5
setInterval(poll, 10000);
// initial call
poll().catch(console.error);

app.get('/api/arbitrage', (req, res) => {
  if (bestArbitrage) {
    res.json(bestArbitrage);
  } else {
    res.json({});
  }
});

app.listen(port, () => {
  console.log(`Arbitrage server listening on ${port}`);
});
