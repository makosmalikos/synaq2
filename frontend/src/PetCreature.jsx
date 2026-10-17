import React, { useId } from 'react';
import './PetCreature.css';

// Нарисованные питомцы: яйцо → малыш → подросток → взрослый → легенда.
const SPECIES = {
  owl:     { body: '#8B5E3C', belly: '#F3E2C7', dark: '#5B3A22', accent: '#F0A93B', feet: '#F0A93B', arms: '#6E4529', egg: '#B07A4B' },
  fox:     { body: '#F28C28', belly: '#FFF3E0', dark: '#4A2E1C', accent: '#4A2E1C', feet: '#4A2E1C', arms: '#F28C28', egg: '#F28C28' },
  panda:   { body: '#FFFFFF', belly: '#F1F3F6', dark: '#2B2F36', accent: '#2B2F36', feet: '#2B2F36', arms: '#2B2F36', egg: '#4B525C' },
  lion:    { body: '#EBB45E', belly: '#F9E3B4', dark: '#5A3A22', accent: '#5A3A22', feet: '#D9A04B', arms: '#EBB45E', egg: '#D8892F', mane: '#B9692B' },
  penguin: { body: '#33466B', belly: '#FFFFFF', dark: '#1F2B45', accent: '#F5A623', feet: '#F5A623', arms: '#26385A', egg: '#33466B' },
  koala:   { body: '#A9B0BC', belly: '#E9ECF1', dark: '#2B2F36', accent: '#2B2F36', feet: '#8E96A4', arms: '#A9B0BC', egg: '#8E96A4' },
};

const GEOM = {
  2: { hy: 120, hr: 50, by: 174, brx: 32, bry: 26 },
  3: { hy: 94, hr: 44, by: 158, brx: 38, bry: 38 },
  4: { hy: 76, hr: 40, by: 150, brx: 44, bry: 50 },
  5: { hy: 76, hr: 40, by: 150, brx: 44, bry: 50 },
};
const STROKE = 'rgba(0,0,0,.2)';
const CX = 100;

function Egg({ c, progress, pet }) {
  const cracks = progress >= 0.85 ? 2 : progress >= 0.55 ? 1 : 0;
  return (
    <g className={`pc-egg${cracks ? ' pc-egg--shaky' : ''}`}>
      <ellipse cx={CX} cy={134} rx={48} ry={62} fill="#FFF7E8" stroke={STROKE} strokeWidth="2" />
      <path d={`M54 128 Q${CX - 24} 112 ${CX} 128 T146 128 L146 150 Q${CX + 24} 166 ${CX} 150 T54 150 Z`} fill={c.egg} opacity=".85" />
      <circle cx={78} cy={92} r={7} fill={c.egg} opacity=".8" />
      <circle cx={118} cy={86} r={5} fill={c.egg} opacity=".8" />
      <circle cx={132} cy={104} r={4} fill={c.egg} opacity=".7" />
      <ellipse cx={80} cy={112} rx={7} ry={14} fill="#fff" opacity=".55" transform="rotate(18 80 112)" />
      {cracks >= 1 && <path d="M88 76 L97 90 L90 98 L101 110" fill="none" stroke={c.dark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {cracks >= 2 && <path d="M120 82 L112 96 L121 104 L112 118" fill="none" stroke={c.dark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {pet === 'penguin' && <ellipse cx={CX} cy={170} rx={26} ry={12} fill="#fff" opacity=".7" />}
    </g>
  );
}

function Ears({ pet, c, hy, hr }) {
  const L = (k) => CX - hr * k, R = (k) => CX + hr * k, Y = (k) => hy + hr * k;
  if (pet === 'owl') return (
    <g fill={c.dark} stroke={STROKE} strokeWidth="2" strokeLinejoin="round">
      <polygon points={`${L(0.9)},${Y(-0.45)} ${L(0.95)},${Y(-1.2)} ${L(0.25)},${Y(-0.95)}`} />
      <polygon points={`${R(0.9)},${Y(-0.45)} ${R(0.95)},${Y(-1.2)} ${R(0.25)},${Y(-0.95)}`} />
    </g>
  );
  if (pet === 'fox') return (
    <g stroke={STROKE} strokeWidth="2" strokeLinejoin="round">
      <polygon fill={c.body} points={`${L(0.92)},${Y(-0.2)} ${L(0.78)},${Y(-1.4)} ${L(0.12)},${Y(-0.88)}`} />
      <polygon fill={c.dark} points={`${L(0.7)},${Y(-0.45)} ${L(0.68)},${Y(-1.05)} ${L(0.32)},${Y(-0.78)}`} stroke="none" />
      <polygon fill={c.body} points={`${R(0.92)},${Y(-0.2)} ${R(0.78)},${Y(-1.4)} ${R(0.12)},${Y(-0.88)}`} />
      <polygon fill={c.dark} points={`${R(0.7)},${Y(-0.45)} ${R(0.68)},${Y(-1.05)} ${R(0.32)},${Y(-0.78)}`} stroke="none" />
    </g>
  );
  if (pet === 'panda') return (
    <g fill={c.dark}><circle cx={L(0.72)} cy={Y(-0.74)} r={hr * 0.3} /><circle cx={R(0.72)} cy={Y(-0.74)} r={hr * 0.3} /></g>
  );
  if (pet === 'lion') return (
    <g fill={c.body} stroke={STROKE} strokeWidth="2"><circle cx={L(0.62)} cy={Y(-0.8)} r={hr * 0.25} /><circle cx={R(0.62)} cy={Y(-0.8)} r={hr * 0.25} /></g>
  );
  if (pet === 'koala') return (
    <g>
      <circle cx={L(0.92)} cy={Y(-0.55)} r={hr * 0.4} fill={c.body} stroke={STROKE} strokeWidth="2" />
      <circle cx={R(0.92)} cy={Y(-0.55)} r={hr * 0.4} fill={c.body} stroke={STROKE} strokeWidth="2" />
      <circle cx={L(0.92)} cy={Y(-0.55)} r={hr * 0.23} fill="#F3D6DD" />
      <circle cx={R(0.92)} cy={Y(-0.55)} r={hr * 0.23} fill="#F3D6DD" />
    </g>
  );
  return null;
}

function Face({ pet, c, hy, hr, stage }) {
  const ex = hr * 0.38, ey = hy - hr * 0.05, er = hr * 0.1;
  const eye = (x, big) => (
    <g key={x}>
      <circle cx={x} cy={ey} r={big || er} fill={c.dark} />
      <circle cx={x - (big || er) * 0.3} cy={ey - (big || er) * 0.3} r={(big || er) * 0.35} fill="#fff" />
    </g>
  );
  const smile = (y) => <path d={`M${CX - 7} ${y} Q${CX} ${y + 7} ${CX + 7} ${y}`} fill="none" stroke={c.dark} strokeWidth="2.2" strokeLinecap="round" />;
  const blush = (
    <g fill="#FF8FA3" opacity=".45"><circle cx={CX - hr * 0.62} cy={hy + hr * 0.32} r={hr * 0.11} /><circle cx={CX + hr * 0.62} cy={hy + hr * 0.32} r={hr * 0.11} /></g>
  );
  if (pet === 'owl') return (
    <g>
      <circle cx={CX - ex} cy={ey} r={hr * 0.3} fill="#fff" stroke={c.dark} strokeWidth="2" />
      <circle cx={CX + ex} cy={ey} r={hr * 0.3} fill="#fff" stroke={c.dark} strokeWidth="2" />
      <g className="pc-blink">{eye(CX - ex, hr * 0.15)}{eye(CX + ex, hr * 0.15)}</g>
      <polygon points={`${CX - 6},${hy + hr * 0.2} ${CX + 6},${hy + hr * 0.2} ${CX},${hy + hr * 0.5}`} fill={c.accent} stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" />
      {blush}
    </g>
  );
  if (pet === 'fox') return (
    <g>
      <ellipse cx={CX} cy={hy + hr * 0.38} rx={hr * 0.6} ry={hr * 0.4} fill={c.belly} />
      <g className="pc-blink">{eye(CX - ex, er)}{eye(CX + ex, er)}</g>
      <ellipse cx={CX} cy={hy + hr * 0.2} rx={hr * 0.1} ry={hr * 0.08} fill={c.dark} />
      {smile(hy + hr * 0.42)}{blush}
    </g>
  );
  if (pet === 'panda') return (
    <g>
      <ellipse cx={CX - ex} cy={ey + 1} rx={hr * 0.2} ry={hr * 0.27} fill={c.dark} transform={`rotate(20 ${CX - ex} ${ey})`} />
      <ellipse cx={CX + ex} cy={ey + 1} rx={hr * 0.2} ry={hr * 0.27} fill={c.dark} transform={`rotate(-20 ${CX + ex} ${ey})`} />
      <g className="pc-blink">
        <circle cx={CX - ex} cy={ey} r={er} fill="#fff" /><circle cx={CX - ex} cy={ey} r={er * 0.55} fill={c.dark} />
        <circle cx={CX + ex} cy={ey} r={er} fill="#fff" /><circle cx={CX + ex} cy={ey} r={er * 0.55} fill={c.dark} />
      </g>
      <ellipse cx={CX} cy={hy + hr * 0.25} rx={hr * 0.13} ry={hr * 0.09} fill={c.dark} />
      {smile(hy + hr * 0.42)}{blush}
    </g>
  );
  if (pet === 'lion') return (
    <g>
      <ellipse cx={CX} cy={hy + hr * 0.38} rx={hr * 0.55} ry={hr * 0.38} fill={c.belly} />
      <g className="pc-blink">{eye(CX - ex, er)}{eye(CX + ex, er)}</g>
      <polygon points={`${CX - 7},${hy + hr * 0.16} ${CX + 7},${hy + hr * 0.16} ${CX},${hy + hr * 0.3}`} fill={c.dark} strokeLinejoin="round" stroke={c.dark} strokeWidth="2" />
      {smile(hy + hr * 0.45)}{blush}
    </g>
  );
  if (pet === 'penguin') return (
    <g>
      <path d={`M${CX - hr * 0.8} ${hy - hr * 0.05} Q${CX - hr * 0.3} ${hy - hr * 0.45} ${CX} ${hy - hr * 0.1} Q${CX + hr * 0.3} ${hy - hr * 0.45} ${CX + hr * 0.8} ${hy - hr * 0.05} Q${CX + hr * 0.75} ${hy + hr * 0.8} ${CX} ${hy + hr * 0.85} Q${CX - hr * 0.75} ${hy + hr * 0.8} ${CX - hr * 0.8} ${hy - hr * 0.05} Z`} fill="#fff" />
      <g className="pc-blink">{eye(CX - ex * 0.85, er)}{eye(CX + ex * 0.85, er)}</g>
      <ellipse cx={CX} cy={hy + hr * 0.3} rx={hr * 0.2} ry={hr * 0.11} fill={c.accent} stroke={STROKE} strokeWidth="1.5" />
      {blush}
    </g>
  );
  // koala
  return (
    <g>
      <g className="pc-blink">{eye(CX - ex, er)}{eye(CX + ex, er)}</g>
      <ellipse cx={CX} cy={hy + hr * 0.2} rx={hr * 0.2} ry={hr * 0.28} fill={c.dark} />
      <ellipse cx={CX - 3} cy={hy + hr * 0.08} rx={hr * 0.05} ry={hr * 0.07} fill="#fff" opacity=".6" />
      {blush}
    </g>
  );
}

export default function PetCreature({ pet = 'owl', stage = 1, progress = 0, size = 220, className = '', label = '' }) {
  const id = useId().replace(/:/g, '');
  const c = SPECIES[pet] || SPECIES.owl;
  const s = Math.min(5, Math.max(1, stage));
  const g = GEOM[s];
  const legend = s === 5;
  return (
    <svg className={`pet-creature pc-${pet} pc-stage-${s} ${className}`} viewBox="0 0 200 220" width={size} height={size * 1.1}
      role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
      <defs>
        <radialGradient id={`aura${id}`}><stop offset="0" stopColor="#FFE58A" stopOpacity=".85" /><stop offset="1" stopColor="#FFE58A" stopOpacity="0" /></radialGradient>
      </defs>
      {legend && <circle className="pc-aura" cx={CX} cy={130} r={100} fill={`url(#aura${id})`} />}
      <ellipse className="pc-shadow" cx={CX} cy={208} rx={s === 1 ? 40 : g.brx + 12} ry={7} fill="#000" opacity=".14" />
      {s === 1 ? (
        <Egg c={c} progress={progress} pet={pet} />
      ) : (
        <g className="pc-body-bob">
          {pet === 'fox' && (
            <g className="pc-tail">
              <path d={`M${CX + g.brx - 4} ${g.by + 18} Q${CX + g.brx + 50} ${g.by + 20} ${CX + g.brx + 34} ${g.by - 32} Q${CX + g.brx + 10} ${g.by - 6} ${CX + g.brx - 8} ${g.by - 6} Z`} fill={c.body} stroke={STROKE} strokeWidth="2" />
              <path d={`M${CX + g.brx + 34} ${g.by - 32} Q${CX + g.brx + 22} ${g.by - 14} ${CX + g.brx + 40} ${g.by - 12} Q${CX + g.brx + 48} ${g.by - 24} ${CX + g.brx + 34} ${g.by - 32} Z`} fill="#fff" />
            </g>
          )}
          {pet === 'lion' && (
            <g className="pc-tail">
              <path d={`M${CX + g.brx - 4} ${g.by + 16} Q${CX + g.brx + 34} ${g.by + 18} ${CX + g.brx + 30} ${g.by - 16}`} fill="none" stroke={c.body} strokeWidth="6" strokeLinecap="round" />
              <circle cx={CX + g.brx + 30} cy={g.by - 18} r={8} fill={c.mane} />
            </g>
          )}
          {pet === 'panda' && <circle cx={CX + g.brx - 2} cy={g.by + g.bry * 0.6} r={9} fill="#fff" stroke={STROKE} strokeWidth="2" />}
          <ellipse cx={CX - g.brx * 0.5} cy={g.by + g.bry - 2} rx={15} ry={8} fill={c.feet} stroke={STROKE} strokeWidth="2" />
          <ellipse cx={CX + g.brx * 0.5} cy={g.by + g.bry - 2} rx={15} ry={8} fill={c.feet} stroke={STROKE} strokeWidth="2" />
          <ellipse cx={CX} cy={g.by} rx={g.brx} ry={g.bry} fill={c.body} stroke={STROKE} strokeWidth="2" />
          <ellipse cx={CX} cy={g.by + g.bry * 0.12} rx={g.brx * 0.66} ry={g.bry * 0.78} fill={c.belly} />
          {s >= 3 && <>
            <ellipse cx={CX - g.brx * 0.98} cy={g.by - 2} rx={9} ry={g.bry * 0.55} fill={c.arms} stroke={STROKE} strokeWidth="2" transform={`rotate(14 ${CX - g.brx} ${g.by - 10})`} />
            <g className={s >= 4 ? 'pc-wave' : ''}>
              <ellipse cx={CX + g.brx * 0.98} cy={g.by - 2} rx={9} ry={g.bry * 0.55} fill={c.arms} stroke={STROKE} strokeWidth="2" transform={`rotate(-14 ${CX + g.brx} ${g.by - 10})`} />
            </g>
          </>}
          {pet === 'lion' && (
            <g fill={c.mane} stroke={STROKE} strokeWidth="2">
              {Array.from({ length: 10 }, (_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return <circle key={i} cx={CX + Math.cos(a) * g.hr * 0.98} cy={g.hy + Math.sin(a) * g.hr * 0.98} r={g.hr * 0.36} />;
              })}
              <circle cx={CX} cy={g.hy} r={g.hr * 1.05} stroke="none" />
            </g>
          )}
          <Ears pet={pet} c={c} hy={g.hy} hr={g.hr} />
          <circle cx={CX} cy={g.hy} r={g.hr} fill={c.body} stroke={STROKE} strokeWidth="2" />
          <Face pet={pet} c={c} hy={g.hy} hr={g.hr} stage={s} />
          {s >= 4 && <path d={`M${CX - g.hr * 0.72} ${g.hy + g.hr * 0.92} Q${CX} ${g.hy + g.hr * 1.18} ${CX + g.hr * 0.72} ${g.hy + g.hr * 0.92} L${CX + g.hr * 0.62} ${g.hy + g.hr * 1.1} Q${CX} ${g.hy + g.hr * 1.36} ${CX - g.hr * 0.62} ${g.hy + g.hr * 1.1} Z`} fill="#E5484D" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" />}
          {legend && (
            <g className="pc-crown">
              <path d={`M${CX - 17} ${g.hy - g.hr * 0.98} L${CX - 17} ${g.hy - g.hr * 0.98 - 17} L${CX - 8} ${g.hy - g.hr * 0.98 - 8} L${CX} ${g.hy - g.hr * 0.98 - 22} L${CX + 8} ${g.hy - g.hr * 0.98 - 8} L${CX + 17} ${g.hy - g.hr * 0.98 - 17} L${CX + 17} ${g.hy - g.hr * 0.98} Z`} fill="#F5C242" stroke="#C98F10" strokeWidth="2" strokeLinejoin="round" />
              <circle cx={CX} cy={g.hy - g.hr * 0.98 - 8} r={3} fill="#E5484D" />
            </g>
          )}
        </g>
      )}
      {legend && ['M30 60', 'M168 48', 'M22 140', 'M176 128'].map((p, i) => (
        <path key={p} className="pc-spark" style={{ animationDelay: `${i * 0.45}s` }} d={`${p} l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z`} fill="#F5C242" />
      ))}
    </svg>
  );
}
