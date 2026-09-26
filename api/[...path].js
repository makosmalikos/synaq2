// Shared lightweight endpoints, legacy /api/training/*, /api/mock/* and JSON
// API 404s on Vercel. Dedicated endpoint files still take routing precedence.
module.exports = (req, res) => require('../backend/server')(req, res);
module.exports.config = { api: { bodyParser: false } };
