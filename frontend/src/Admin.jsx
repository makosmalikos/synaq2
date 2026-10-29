import React, { useEffect, useState } from 'react';
import { useLang } from './i18n.jsx';
import { auth, logout } from './firebase.js';
import Brand from './Brand.jsx';
import AdminCenters from './AdminCenters.jsx';
import AdminWorkspace from './AdminWorkspace.jsx';
import RewardQueue from './RewardQueue.jsx';
import AdminMentors from './AdminMentors.jsx';
import AdminLessons from './AdminLessons.jsx';
import './AdminWorkspace.css';

export default function Admin({ onExit }) {
  const { t, lang } = useLang();
  const [section, setSection] = useState('tasks');
  const [newCount, setNewCount] = useState(0);
  const refreshCount = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const response = await fetch('/api/admin-leads', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (response.ok && Array.isArray(data.leads)) setNewCount(data.leads.filter((lead) => lead.status === 'new').length);
    } catch { /* счётчик не должен мешать работе */ }
  };
  useEffect(() => { refreshCount(); const id = setInterval(refreshCount, 60000); return () => clearInterval(id); }, []);
  const request = async (options = {}) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('not_allowed');
    const { queryCursor, ...init } = options;
    const response = await fetch(`/api/admin-task${queryCursor ? `?cursor=${encodeURIComponent(queryCursor)}` : ''}`, { ...init,
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'failed'), { issues:data.issues });
    return data;
  };
  return <div className="app admin-app">
    <header><div className="logo"><Brand compact /></div><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <button type="button" className="logout" onClick={() => setSection('leads')} aria-label={lang === 'ru' ? 'Сообщения' : 'Хабарламалар'}>🔔{newCount > 0 && <b style={{ marginLeft: 6, background: '#DC2626', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 12 }}>{newCount}</b>}</button>
      <button className="logout" onClick={() => (onExit || logout)()}>{t('common.exit')}</button></div></header>
    <main>
      <nav className="aw-tabs" aria-label={lang === 'ru' ? 'Разделы администратора' : 'Әкімші бөлімдері'}>
        <button className={section === 'tasks' ? 'active' : ''} onClick={() => setSection('tasks')}>{t('admin.tasksTab')}</button>
        <button className={section === 'leads' ? 'active' : ''} onClick={() => setSection('leads')}>{t('admin.leadsTab')}{newCount > 0 && <b style={{ marginLeft: 6, background: '#DC2626', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 12 }}>{newCount}</b>}</button>
        <button className={section === 'mentors' ? 'active' : ''} onClick={() => setSection('mentors')}>{lang === 'ru' ? 'Наставники' : 'Тәлімгерлер'}</button>
        <button className={section === 'lessons' ? 'active' : ''} onClick={() => setSection('lessons')}>{lang === 'ru' ? 'Уроки' : 'Сабақтар'}</button>
        <button className={section === 'rewards' ? 'active' : ''} onClick={() => setSection('rewards')}>{lang === 'ru' ? 'Награды' : 'Сыйлықтар'}</button>
        <button className={section === 'centers' ? 'active' : ''} onClick={() => setSection('centers')}>{lang === 'ru' ? 'Центры' : 'Орталықтар'}</button>
      </nav>
      <div hidden={section !== 'tasks'}><AdminWorkspace request={request} lang={lang} storageKey={`synaq-admin-draft:${auth.currentUser?.uid || 'local'}`} /></div>
      {section === 'leads' && <LeadInbox t={t} lang={lang} onChanged={refreshCount} />}
      {section === 'mentors' && <AdminMentors lang={lang} />}
      {section === 'lessons' && <AdminLessons lang={lang} />}
      {section === 'centers' && <AdminCenters lang={lang} />}
      {section === 'rewards' && <RewardQueue />}
    </main>
  </div>;
}

function LeadInbox({ t, lang, onChanged = () => {} }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  const request = async (options = {}) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('login_required');
    const response = await fetch('/api/admin-leads', { ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'failed');
    return data;
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await request();
      setLeads(Array.isArray(data.leads) ? data.leads : []);
      onChanged();
    } catch {
      setError(t('admin.leadsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = async (id, status) => {
    if (updating) return;
    setUpdating(id); setError('');
    try {
      const data = await request({ method: 'PATCH', body: JSON.stringify({ id, status }) });
      setLeads((items) => items.map((lead) => lead.id === id ? { ...lead, status: data.status, updatedAt: data.updatedAt } : lead));
      onChanged();
    } catch {
      setError(t('admin.leadsUpdateError'));
    } finally {
      setUpdating('');
    }
  };

  if (loading) return <div className="card"><p style={{ margin: 0 }}>{t('common.loading')}</p></div>;
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end', marginBottom: 16 }}>
        <div><h1 style={{ margin: '0 0 4px' }}>{t('admin.leadsTitle')}</h1><p className="muted" style={{ margin: 0 }}>{t('admin.leadsSubtitle')}</p></div>
        <button type="button" className="btn ghost" onClick={load}>{t('admin.refresh')}</button>
      </div>
      {error && <div className="card" style={{ color: 'var(--accent)', marginBottom: 12 }}>{error}</div>}
      {!leads.length ? <div className="card"><p className="muted" style={{ margin: 0 }}>{t('admin.leadsEmpty')}</p></div> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {leads.map((lead) => (
            <article className="card" key={lead.id} style={{ borderColor: lead.status === 'new' ? '#93C5FD' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 14, flexWrap: 'wrap' }}>
                <div>
                  {lead.source !== 'landing' && <span className="tag" style={{ borderColor: '#DC2626', color: '#DC2626', marginBottom: 6, display: 'inline-block' }}>{lead.source === 'mentor_purchase' ? (lang === 'ru' ? '💳 Покупка Pro с наставником' : '💳 Наставникпен Pro сатып алды') : (lang === 'ru' ? '⬆ Хочет перейти на Pro' : '⬆ Pro-ға көшкісі келеді')}</span>}
                  <div style={{ font: "700 17px 'Golos Text',system-ui,sans-serif" }}>{lead.name}</div>
                  {lead.phone ? <a href={`tel:${lead.phone.replace(/[^+\d]/g, '')}`} style={{ display: 'inline-block', marginTop: 5, color: '#2563EB', fontWeight: 700 }}>{lead.phone}</a> : <span className="muted" style={{ display: 'inline-block', marginTop: 5 }}>{lang === 'ru' ? 'телефон не указан — см. email в тексте' : 'телефон жоқ — мәтіндегі email-ді қараңыз'}</span>}
                  <div className="muted" style={{ fontSize: 12, marginTop: 5 }}>
                    {lead.role === 'student' ? t('admin.leadStudent') : t('admin.leadParent')} · {lead.createdAt ? new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'kk-KZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lead.createdAt)) : '—'}
                  </div>
                </div>
                <span className="tag">{t(`admin.leadStatus.${lead.status}`)}</span>
              </div>
              {lead.comment && <p style={{ margin: '14px 0 0', whiteSpace: 'pre-wrap' }}>{lead.comment}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                {['new', 'contacted', 'closed'].map((status) => <button key={status} type="button" className={`btn ${lead.status === status ? 'accent' : 'ghost'}`}
                  disabled={updating === lead.id || lead.status === status} onClick={() => setStatus(lead.id, status)}>{t(`admin.leadStatus.${status}`)}</button>)}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
