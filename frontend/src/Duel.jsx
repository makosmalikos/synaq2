import React from 'react';
export default function Duel() {
  return (
    <main>
      <p className="kicker">Дуэль</p>
      <h1>Достыңмен жарыс</h1>
      <div className="card" style={{ marginTop: 16, textAlign: 'center', padding: 40 }}>
        <div style={{ font: "700 40px 'Lora',serif", color: '#B0342B' }}>⚔</div>
        <p className="muted" style={{ marginTop: 10 }}>Нақты уақыттағы дуэль жақында қосылады.</p>
      </div>
    </main>
  );
}
