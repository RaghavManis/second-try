import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Matches from './pages/Matches';
import ScoreEntry from './pages/ScoreEntry';
import PointsTable from './pages/PointsTable';
import TeamSquad from './pages/TeamSquad';
import PlayersList from './pages/PlayersList';
import PlayerProfile from './pages/PlayerProfile';
import AdminLogin from './pages/AdminLogin';
import LiveMatch from './pages/LiveMatch';
import AdminScoringPanel from './pages/AdminScoringPanel';
import MatchScorecard from './pages/MatchScorecard';
import Gallery from './pages/Gallery';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import ScrollToTop from './components/ScrollToTop';


const App: React.FC = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="app-container">
            <Toaster position="top-right" toastOptions={{
              style: { background: '#1a1a2e', color: '#fff', border: '1px solid #ffffff20' }
            }} />
            <Navbar />
            <main className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
              <div style={{ flexGrow: 1 }}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<AdminLogin />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/teams" element={<Teams />} />
                  <Route path="/teams/:teamId" element={<TeamSquad />} />
                  <Route path="/players" element={<PlayersList />} />
                  <Route path="/players/:playerId" element={<PlayerProfile />} />
                  <Route path="/matches" element={<Matches />} />
                  <Route path="/matches/:matchId/score" element={<ProtectedRoute><ScoreEntry /></ProtectedRoute>} />
                  <Route path="/matches/:matchId/score-live" element={<ProtectedRoute><AdminScoringPanel /></ProtectedRoute>} />
                  <Route path="/matches/:matchId/scorecard" element={<MatchScorecard />} />
                  <Route path="/live-match" element={<LiveMatch />} />
                  <Route path="/points-table" element={<PointsTable />} />
                  <Route path="/gallery" element={<Gallery />} />
                </Routes>
              </div>
              <Footer />
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
};


export default App;
