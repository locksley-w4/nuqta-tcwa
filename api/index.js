// Vercel serverless entry point. Vercel routes every /api/* request here
// (see the rewrite in vercel.json) and this hands it to the same Express app
// that server.js runs locally.
const app = require('../backend/app');

module.exports = (req, res) => {
  // Vercel's Node runtime may have already read and parsed the request body.
  // In that case the stream is ended, and express.json() would parse an empty
  // stream and clobber req.body with {}. body-parser skips a request that is
  // already flagged as parsed, so set the flag when a body is present.
  if (req.body !== undefined) req._body = true;

  return app(req, res);
};
