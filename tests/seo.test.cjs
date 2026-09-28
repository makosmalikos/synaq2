const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.resolve(__dirname, '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

test('SEO metadata uses the final production host without a redirect', () => {
  const index = read('frontend/index.html')
  const robots = read('frontend/public/robots.txt')
  const sitemap = read('frontend/public/sitemap.xml')

  assert.match(index, /<link rel="canonical" href="https:\/\/www\.synaq\.app\/" \/>/)
  assert.match(index, /<meta property="og:url" content="https:\/\/www\.synaq\.app\/" \/>/)
  assert.match(robots, /Sitemap: https:\/\/www\.synaq\.app\/sitemap\.xml/)
  assert.match(sitemap, /<loc>https:\/\/www\.synaq\.app\/<\/loc>/)
})
