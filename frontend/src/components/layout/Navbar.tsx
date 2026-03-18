import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar, BarChart2, LogIn, LogOut, User, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MatchScoringService } from '../../services/api';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [hasLiveMatch, setHasLiveMatch] = React.useState(false);

  React.useEffect(() => {
    const checkLiveMatches = async () => {
      try {
        const res = await MatchScoringService.getLiveMatches();
        setHasLiveMatch(res.data.length > 0);
      } catch (err) {
        console.error('Failed to check live matches', err);
      }
    };
    checkLiveMatches();
    const interval = setInterval(checkLiveMatches, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar glass-panel">
      <div className="nav-brand">
        <Trophy className="brand-icon" size={28} />
        <span className="brand-text gradient-text">Cricket Tourney</span>
      </div>
      <ul className="nav-links">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BarChart2 size={20} />
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/teams" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>Teams</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/matches" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Calendar size={20} />
            <span>Matches</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/points-table" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Trophy size={20} />
            <span>Standings</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/players" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <User size={20} />
            <span>Players</span>
          </NavLink>
        </li>
        {hasLiveMatch && (
          <li>
            <NavLink to="/live-match" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: '#ef4444', fontWeight: 'bold' }}>
              <Radio size={20} className="animate-pulse" />
              <span>LIVE</span>
            </NavLink>
          </li>
        )}
        <li>
          {isAuthenticated ? (
            <button className="nav-link" onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          ) : (
            <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LogIn size={20} />
              <span>Admin Login</span>
            </NavLink>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
