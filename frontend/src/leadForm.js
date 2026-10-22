export function validateLeadForm(value) {
  const name = String(value.name || '').trim();
  const phone = String(value.phone || '').trim();
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2 || name.length > 80 || !/^\+?[0-9][0-9 ()-]{6,24}$/.test(phone)
    || digits.length < 7 || digits.length > 15 || !['parent', 'student'].includes(value.role)) return null;
  return { name, phone, role: value.role, comment: String(value.comment || '').trim().slice(0, 600) };
}

export async function sendLead(payload, lang, request = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await request('/api/lead', {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, lang }),
    });
    if (!response.ok || !(await response.json()).ok) throw new Error('lead_not_saved');
  } finally { clearTimeout(timeout); }
}
