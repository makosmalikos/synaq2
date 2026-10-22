const KEY = 'synaq_chunk_recovery_at';
export function claimChunkRecovery(error, storage, now = Date.now()) {
  const message = `${error?.name || ''} ${error?.message || ''}`;
  if (!/ChunkLoadError|Loading chunk .+ failed|Failed to fetch dynamically imported module|Importing a module script failed|Unable to preload CSS|error loading dynamically imported module/i.test(message)) return false;
  try {
    const previous = Number(storage.getItem(KEY));
    if (previous > 0 && now - previous < 15 * 60000) return false;
    storage.setItem(KEY, String(now));
    return true;
  } catch { return false; }
}
