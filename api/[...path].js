// Legacy /api/training/*, /api/mock/* and JSON API 404s on Vercel.
// The Express app mounts explicit endpoint files lazily; never this adapter.
module.exports = (req, res) => require('../backend/server')(req, res);
module.exports.config = { api: { bodyParser: false } };
