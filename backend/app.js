// Builds the Express app WITHOUT starting a listener, so the same app can be
// used by the local server (server.js) and by the Vercel serverless function
// (api/index.js), which supplies its own request lifecycle.
const express = require('express');
const cors = require('cors');
const analyzeRouter = require('./routes/analyze');
const hotspotsRouter = require('./routes/hotspots');
const financeRouter = require('./routes/finance');

const app = express();

app.use(cors());
app.use(express.json());

const health = (req, res) => {
  res.json({ status: 'ok', service: 'AI Business Analyzer API' });
};
app.get('/', health);
app.get('/api', health);

// Every router is mounted twice, at the bare path and under /api.
//   - bare  : local dev, where the frontend proxies straight to :5001
//   - /api  : production, where Vercel routes /api/* to one serverless
//             function and Express still receives the original request path
// Mounting both means neither environment depends on URL rewriting.
const ROUTES = [
  ['/analyze', analyzeRouter],
  ['/find-hotspots', hotspotsRouter],
  ['/analyze-finance', financeRouter],
];
for (const [path, router] of ROUTES) {
  app.use(path, router);
  app.use(`/api${path}`, router);
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
