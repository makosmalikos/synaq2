import React from 'react';

export default function Home({ go, name }) {
  return (
    <main>
      <p className="kicker">Басты бет</p>
      <h1 style={{ fontSize: 30 }}>Сәлем, {name || 'бала'}!</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>Бүгін де бір қадам алға. Тақырып таңдап баста немесе апталық сынақты өт.</p>

      <div className="hero-card">
        <h2>Бүгінгі дайындықты бастайық</h2>
        <p>Тақырып таңдап, есептерді шығар. Әр қатеден кейін толық талдау болады.</p>
        <button className="btn accent" onClick={() => go('training')}>Бастау →</button>
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card click" onClick={() => go('mock')}>
          <p className="kicker" style={{ margin: 0 }}>Апталық сынақ</p>
          <div style={{ font: "600 16px 'Golos Text'", margin: '8px 0 4px' }}>Осы аптаның нұсқасы</div>
          <div className="muted" style={{ fontSize: 13 }}>Нақты емтихан форматы →</div>
        </div>
        <div className="card click" onClick={() => go('progress')}>
          <p className="kicker" style={{ margin: 0 }}>Прогресс</p>
          <div style={{ font: "600 16px 'Golos Text'", margin: '8px 0 4px' }}>Нәтижелерің</div>
          <div className="muted" style={{ fontSize: 13 }}>Шешілген есеп, % және тарих →</div>
        </div>
      </div>
    </main>
  );
}
