// One shared read for the lightweight reports and the full training bank.
// Importing this module does not initialize Firebase or perform network I/O.
let pending;

export function readAdminTasks() {
  if (!pending) pending = (async () => {
    const [{ db }, { collection, getDocs }] = await Promise.all([
      import('./firebase.js'), import('firebase/firestore'),
    ]);
    const snapshot = await getDocs(collection(db, 'bankTasks'));
    return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
  })().catch((error) => {
    pending = null;
    throw error;
  });
  return pending;
}
