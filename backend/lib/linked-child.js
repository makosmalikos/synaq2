// A Firebase account with a child-shaped email is not proof of enrollment.
// Relationships are written by child-create, never by the browser.
async function requireLinkedChild(db, user, tx = null) {
  const deny = () => { throw Object.assign(new Error('child_required'), { status: 403 }); };
  if (!user?.uid || !/^[a-z0-9]+@synaq\.kids$/.test(user.email || '')) deny();
  const read = ref => tx ? tx.get(ref) : ref.get();
  const index = await read(db.collection('childIndex').doc(user.uid));
  const parentUid = index.data()?.parentUid;
  if (!index.exists || typeof parentUid !== 'string' || !parentUid || parentUid.length > 128 || parentUid.includes('/')) deny();
  const familyRef = db.collection('families').doc(parentUid);
  const [family, child] = await Promise.all([read(familyRef), read(familyRef.collection('children').doc(user.uid))]);
  if (!family.exists || !child.exists || `${child.data()?.code}@synaq.kids` !== user.email) deny();
  return { parentUid };
}
module.exports = { requireLinkedChild };
