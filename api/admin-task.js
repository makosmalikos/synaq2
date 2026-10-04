const { getAdmin } = require('../backend/lib/firebase-admin');
// Keep the shared factory accessors for initialization checks.
function getAdminAuth() { return getAdmin().auth; }
function getAdminDb() { return getAdmin().db; }
module.exports = require('../backend/handlers/admin-tasks').createHandler();
