import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import HomePage from './pages/HomePage';
import GameSettings from './pages/GameSettings';
import GamePlay from './pages/GamePlay';
import Results from './pages/Results';
import OnlineLobby from './pages/OnlineLobby';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StatsPage from './pages/StatsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import './App.css';

function App() {
  return (
    <GameProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/settings" element={<GameSettings />} />
            <Route path="/game" element={<GamePlay />} />
            <Route path="/results" element={<Results />} />
            <Route path="/online" element={<OnlineLobby />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;
