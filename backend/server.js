// Local development entrypoint. On Vercel the app is served by api/index.js
// instead, which imports the same app.js and never calls listen().
const app = require('./app');

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
