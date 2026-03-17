import { useState } from 'react';
import TournamentView from './components/TournamentView';

export default function App() {
  const [activeTab, setActiveTab] = useState('mens');

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span className="trophy">🏆</span>
          <h1>March Madness 2026</h1>
          <span className="subtitle">Model Predictions Tracker</span>
        </div>
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'mens' ? 'active' : ''}`}
            onClick={() => setActiveTab('mens')}
          >
            Men's
          </button>
          <button
            className={`tab-btn ${activeTab === 'womens' ? 'active' : ''}`}
            onClick={() => setActiveTab('womens')}
          >
            Women's
          </button>
        </div>
      </header>
      <main className="app-main">
        <TournamentView gender={activeTab} />
      </main>
    </div>
  );
}
