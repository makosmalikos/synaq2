import React from 'react';
export default function League() {
  return (
    <main>
      <p className="kicker">Лига</p>
      <h1>Апталық рейтинг</h1>
      <div className="card" style={{ marginTop: 16, textAlign: 'center', padding: 40 }}>
        <div style={{ font: "700 40px 'Lora',serif", color: '#B0342B' }}>🏆</div>
        <p className="muted" style={{ marginTop: 10 }}>Лига мен рейтинг жақында қосылады.</p>
      </div>
    </main>
  );
}
