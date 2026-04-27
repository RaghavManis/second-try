import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Users, Calendar, BarChart2, LogIn, LogOut, User, Circle, Image as ImageIcon, Sun, Moon, Crown, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MatchScoringService } from '../../services/api';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnLivePage = location.pathname === '/live-match';
  const isScoringPage = location.pathname.includes('/score');

  const [hasLiveMatch, setHasLiveMatch] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  React.useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  }, [theme]);

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
    const interval = setInterval(checkLiveMatches, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`navbar glass-panel ${isScoringPage ? 'non-sticky' : 'sticky-nav'}`}>
      <div className="nav-brand">
        <div className="brand-main">
          <Crown className="brand-icon premium-icon" size={32} />
          <span className="brand-text gradient-text">SPL</span>
        </div>
        <div className="brand-subtext mobile-only">SEASON 2026</div>
      </div>
      <ul className="nav-links">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BarChart2 size={20} />
            <span>Dashboard</span>
          </NavLink>
        </li>
        {hasLiveMatch && (
          <li>
            <NavLink to="/live-match" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: '#ef4444', fontWeight: 'bold' }}>
              <Circle size={16} fill="#ef4444" strokeWidth={0} className={!isOnLivePage ? "live-blink" : ""} />
              <span>LIVE</span>
            </NavLink>
          </li>
        )}
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
            <span>Points-table</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/players" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <User size={20} />
            <span>Players</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/gallery" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ImageIcon size={20} />
            <span>Gallery</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/highlights" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Play size={20} />
            <span>Highlights</span>
          </NavLink>
        </li>
        <li>
          <button className="nav-link" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </li>
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
