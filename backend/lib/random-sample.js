// Partial Fisher–Yates: O(n + k), no random-key sort and no input mutation.
function randomSample(items, count, random = Math.random) {
  const size = Math.min(items.length, Math.max(0, Math.floor(count)));
  if (!size) return [];
  const copy = items.slice();
  for (let i = 0; i < size; i++) {
    const j = i + Math.floor(random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, size);
}
module.exports = { randomSample };
