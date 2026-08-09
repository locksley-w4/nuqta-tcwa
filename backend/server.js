const express = require('express');
const cors = require('cors');
const analyzeRouter = require('./routes/analyze');
const hotspotsRouter = require('./routes/hotspots');
const financeRouter = require('./routes/finance');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'AI Business Analyzer API' });
});

app.use('/analyze', analyzeRouter);
app.use('/find-hotspots', hotspotsRouter);
app.use('/analyze-finance', financeRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
