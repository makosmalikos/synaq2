// Уведомление админу: кладём запись во входящие «Өтінімдер» (коллекция leads).
// Идемпотентно: одинаковый id не создаётся второй раз, поэтому повтор вебхука не плодит дубликаты.
async function notifyAdmin(db, { id, name, phone = '', comment, lang = 'ru', source }) {
  const ref = db.collection('leads').doc(id);
  if ((await ref.get()).exists) return false;
  await ref.set({ name: String(name || 'Родитель').slice(0, 80), phone: String(phone || '').slice(0, 32), role: 'parent',
    comment: String(comment || '').slice(0, 600), status: 'new', source, lang: lang === 'kk' ? 'kk' : 'ru', createdAt: new Date() });
  return true;
}
module.exports = { notifyAdmin };
