import React, { useEffect, useState } from 'react';
import { useLang } from './i18n.jsx';
import { auth, logout } from './firebase.js';
import Brand from './Brand.jsx';
import AdminWorkspace from './AdminWorkspace.jsx';
import './AdminWorkspace.css';

export default function Admin({ onExit }) {
  const { t, lang } = useLang();
  const [section, setSection] = useState('tasks');
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
    <header><div className="logo"><Brand compact /></div><button className="logout" onClick={() => (onExit || logout)()}>{t('common.exit')}</button></header>
    <main>
      <nav className="aw-tabs" aria-label={lang === 'ru' ? 'Разделы администратора' : 'Әкімші бөлімдері'}>
        <button className={section === 'tasks' ? 'active' : ''} onClick={() => setSection('tasks')}>{t('admin.tasksTab')}</button>
        <button className={section === 'leads' ? 'active' : ''} onClick={() => setSection('leads')}>{t('admin.leadsTab')}</button>
      </nav>
      <div hidden={section !== 'tasks'}><AdminWorkspace request={request} lang={lang} storageKey={`synaq-admin-draft:${auth.currentUser?.uid || 'local'}`} /></div>
      {section === 'leads' && <LeadInbox t={t} lang={lang} />}
    </main>
  </div>;
}

function LeadInbox({ t, lang }) {
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
                  <div style={{ font: "700 17px 'Golos Text'" }}>{lead.name}</div>
                  <a href={`tel:${lead.phone.replace(/[^+\d]/g, '')}`} style={{ display: 'inline-block', marginTop: 5, color: '#2563EB', fontWeight: 700 }}>{lead.phone}</a>
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
