const fs = require('node:fs/promises');
const path = require('node:path');
const directory = path.resolve(__dirname, '../../frontend/public/figures/synaq-editions');
const MAX_FIGURE_BYTES = 1024 * 1024;
const unavailable = () => Object.assign(new Error('figure-unavailable'), { status: 404 });
async function readPrivateFigure(image) {
  if (typeof image !== 'string' || !/^\/figures\/synaq-editions\/[a-z0-9-]+\.svg$/.test(image)) throw unavailable();
  const filename = path.join(directory, path.basename(image));
  try {
    const [stat,real] = await Promise.all([fs.lstat(filename),fs.realpath(filename)]);
    if (!stat.isFile() || stat.isSymbolicLink() || path.dirname(real) !== directory || stat.size > MAX_FIGURE_BYTES) throw unavailable();
    const bytes = await fs.readFile(real);
    if (bytes.length > MAX_FIGURE_BYTES) throw unavailable();
    return bytes;
  } catch (cause) { if (cause.status) throw cause; throw unavailable(); }
}
module.exports = { readPrivateFigure, MAX_FIGURE_BYTES };
