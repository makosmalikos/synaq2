// Shared lightweight endpoints and JSON API 404s on Vercel. The old
// /api/training/* and /api/mock/* routes are no longer mounted (they returned
// answers without authentication). Dedicated endpoint files take precedence.
module.exports = (req, res) => require('../backend/server')(req, res);
module.exports.config = { api: { bodyParser: false } };
