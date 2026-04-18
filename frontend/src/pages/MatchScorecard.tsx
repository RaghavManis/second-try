import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MatchScoringService } from '../services/api';
import type { Match, ScorecardBatting, ScorecardBowling } from '../types';
import { X, Crown, Medal } from 'lucide-react';
import { AnimatedSection } from '../components/AnimatedSection';
import confetti from 'canvas-confetti';
import type { OverDetail } from '../types';

interface ScorecardData {
  match: Match;
  batting: ScorecardBatting[];
  bowling: ScorecardBowling[];
  innings1Overs?: OverDetail[];
  innings2Overs?: OverDetail[];
}

const MatchScorecard: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Summary');
  const [showPomStats, setShowPomStats] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Confetti when on Summary tab for completed matches
  useEffect(() => {
    if (activeTab === 'Summary' && data?.match?.status === 'COMPLETED') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [activeTab, data]);

  useEffect(() => {
    if (matchId) {
      fetchScorecard(parseInt(matchId));
    }
  }, [matchId]);

  const fetchScorecard = async (id: number) => {
    try {
      const res = await MatchScoringService.getCompleteScorecard(id);
      const rawData = res.data || {};
      setData({
        ...rawData,
        batting: Array.isArray(rawData.batting) ? rawData.batting : [],
        bowling: Array.isArray(rawData.bowling) ? rawData.bowling : [],
        innings1Overs: Array.isArray(rawData.innings1Overs) ? rawData.innings1Overs : [],
        innings2Overs: Array.isArray(rawData.innings2Overs) ? rawData.innings2Overs : []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading Scorecard...</div>;
  if (!data) return <div className="page-container text-center">Scorecard not found or match is incomplete.</div>;

  const { match, batting, bowling, innings1Overs, innings2Overs } = data;

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  // Core helpers (must be defined BEFORE any use of them above)
  const calculateTotal = (batters: ScorecardBatting[]) =>
    batters.reduce((acc, curr) => acc + curr.runs, 0);

  const calculateWickets = (batters: ScorecardBatting[]) => {
    const outs = batters.filter(b => b.howOut && b.howOut.toLowerCase() !== 'not out' && b.howOut !== '');
    const uniqueOuts = Array.from(new Set(outs.map(b => b.player.id)));
    return Math.min(10, uniqueOuts.length);
  };

  // Separate by innings (innings number, NOT by team)
  const innings1Batting = batting.filter(b => b.innings === 1);
  const innings1Bowling = bowling.filter(b => b.innings === 1);
  const innings2Batting = batting.filter(b => b.innings === 2);
  const innings2Bowling = bowling.filter(b => b.innings === 2);

  // ── Determine which team batted in which innings ──
  const inn1Team = innings1Batting.length > 0 ? innings1Batting[0].team : null;
  const teamABattedFirst = inn1Team ? inn1Team.id === match.teamA.id : true;

  // Scores per team (using correct innings mapping)
  const teamAScore   = teamABattedFirst
    ? (match.firstInningsScore   ?? calculateTotal(innings1Batting))
    : (match.currentScore        ?? calculateTotal(innings2Batting));
  const teamAWickets = teamABattedFirst
    ? (match.firstInningsWickets ?? calculateWickets(innings1Batting))
    : (match.currentWickets      ?? calculateWickets(innings2Batting));
  const teamBScore   = teamABattedFirst
    ? (match.currentScore        ?? calculateTotal(innings2Batting))
    : (match.firstInningsScore   ?? calculateTotal(innings1Batting));
  const teamBWickets = teamABattedFirst
    ? (match.currentWickets      ?? calculateWickets(innings2Batting))
    : (match.firstInningsWickets ?? calculateWickets(innings1Batting));

  // ── Display order: Innings 1 team = LEFT, Innings 2 team = RIGHT ──
  const leftTeam     = teamABattedFirst ? match.teamA : match.teamB;
  const rightTeam    = teamABattedFirst ? match.teamB : match.teamA;
  const leftScore    = teamABattedFirst ? teamAScore   : teamBScore;
  const leftWickets  = teamABattedFirst ? teamAWickets : teamBWickets;
  const rightScore   = teamABattedFirst ? teamBScore   : teamAScore;
  const rightWickets = teamABattedFirst ? teamBWickets : teamAWickets;
  const leftBatting  = innings1Batting;
  const leftBowling  = innings2Bowling;
  const rightBatting = innings2Batting;
  const rightBowling = innings1Bowling;

  // Find POM Stats
  const pomBatting = batting.find(b => b.player.id === match.manOfTheMatch?.id);
  const pomBowling = bowling.find(b => b.player.id === match.manOfTheMatch?.id);

  const getTopBatter = (batters: ScorecardBatting[]) => {
    if (batters.length === 0) return null;
    return [...batters].sort((a, b) => b.runs - a.runs || a.balls - b.balls)[0];
  };

  const getTopBowler = (bowlers: ScorecardBowling[]) => {
    if (bowlers.length === 0) return null;
    return [...bowlers].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0];
  };

  const getRandomLogo = (id: number) => `https://api.dicebear.com/7.x/identicon/svg?seed=Team${id}&backgroundColor=1e293b`;

  return (
    <div className="dashboard-wrapper" style={{ paddingBottom: '5rem' }}>
      <style>{`
        @keyframes winner-glow {
          0% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.3); }
          50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.7); border-color: rgba(245, 158, 11, 1); }
          100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.3); }
        }
        @keyframes crown-float {
          0% { transform: translateY(0) rotate(-10deg) scale(1.1); }
          50% { transform: translateY(-8px) rotate(-10deg) scale(1.1); }
          100% { transform: translateY(0) rotate(-10deg) scale(1.1); }
        }
        @keyframes scanline {
          0% { top: -100%; }
          100% { top: 100%; }
        }
        @keyframes arena-light {
          0% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
          100% { opacity: 0.3; transform: scale(1); }
        }
        .winner-highlight {
          animation: winner-glow 2s infinite ease-in-out;
          position: relative;
          z-index: 10;
        }
        .crown-icon {
          animation: crown-float 2s infinite ease-in-out;
        }
        .arena-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }
        .light-ray {
          position: absolute;
          width: 200%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
          top: -50%;
          left: -50%;
          animation: arena-light 4s infinite ease-in-out;
        }
        .hologram-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.03) 55%, transparent 70%);
          background-size: 200% 200%;
          background-position: var(--x) var(--y);
          pointer-events: none;
          z-index: 2;
        }
        @media (max-width: 600px) {
          .stat-pills-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .innings-compare-grid > div:first-child { border-radius: 12px 0 0 12px !important; }
          .innings-compare-grid > div:last-child { border-radius: 0 12px 12px 0 !important; }
          .innings-card-score { font-size: 1.5rem !important; }
          .innings-card-padding { padding: 0.75rem !important; padding-top: 1.8rem !important; gap: 0.6rem !important; }
          .innings-card-stat-label { font-size: 0.5rem !important; }
          .innings-card-name { font-size: 0.75rem !important; }
          .innings-card-value { font-size: 0.85rem !important; }
          .innings-card-team-name { font-size: 0.72rem !important; }
          .hero-team-name { font-size: 0.7rem !important; max-width: 70px !important; }
          .hero-score { font-size: 1rem !important; }
          .hero-logo { width: 42px !important; height: 42px !important; }
          .hero-logo.winner { width: 50px !important; height: 50px !important; }
          .hero-center { min-width: 50px !important; }
          .hero-crown { display: none !important; }
        }
      `}</style>
      {/* Compact Victory Stage Hero */}
      <div className="parallax-hero" style={{ 
        minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', padding: '1rem'
      }}>
        <div className="arena-bg">
          <div className="light-ray" style={{ left: '-20%', transform: 'rotate(-45deg)' }}></div>
          <div className="light-ray" style={{ right: '-20%', transform: 'rotate(45deg)' }}></div>
        </div>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)' }}></div>
        
        {/* Back button — top-left inside hero */}
        <button
          onClick={() => navigate('/matches')}
          style={{ position: 'absolute', top: '0.85rem', left: '1rem', zIndex: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.35rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
        >
          ← Back
        </button>

        <div style={{ zIndex: 2, width: '100%', maxWidth: '900px', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            
            {/* LEFT = Innings 1 team (batted first) */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="hero-team-name" style={{ color: match.winnerTeam?.id === leftTeam.id ? '#fbbf24' : '#94a3b8', fontSize: '0.95rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{leftTeam.teamName}</div>
                <div style={{ color: '#64748b', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>1st Innings</div>
                <div className="hero-score" style={{ color: match.winnerTeam?.id === leftTeam.id ? 'var(--primary)' : '#64748b', fontSize: '1.4rem', fontWeight: 900 }}>
                  {leftScore}-{leftWickets}
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                {match.winnerTeam?.id === leftTeam.id && (
                  <div className="crown-icon hero-crown" style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}>
                    <Crown size={18} color="#f59e0b" fill="#f59e0b" />
                  </div>
                )}
                {match.winnerTeam?.id === leftTeam.id && (
                  <div style={{ position: 'absolute', inset: '-6px', background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', opacity: 0.4, filter: 'blur(8px)', borderRadius: '50%' }}></div>
                )}
                <img 
                  src={leftTeam.teamLogo || getRandomLogo(leftTeam.id || 1)} 
                  alt="Logo" 
                  className={`hero-logo${match.winnerTeam?.id === leftTeam.id ? ' winner winner-highlight' : ''}`}
                  style={{ 
                    width: match.winnerTeam?.id === leftTeam.id ? '60px' : '50px', 
                    height: match.winnerTeam?.id === leftTeam.id ? '60px' : '50px', 
                    borderRadius: '50%', objectFit: 'cover', position: 'relative',
                    border: match.winnerTeam?.id === leftTeam.id ? '3px solid #f59e0b' : '2px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    filter: match.winnerTeam?.id === leftTeam.id ? 'none' : (match.winnerTeam ? 'grayscale(0.6)' : 'none'),
                    flexShrink: 0
                  }} 
                />
              </div>
            </div>

            {/* Center VS */}
            <div className="hero-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
              <h1 className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>VS</h1>
              <div style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{new Date(match.matchDateTime).toLocaleDateString()}</div>
              {match.status === 'COMPLETED' && match.winnerTeam && (
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 10px', borderRadius: '12px', color: '#fbbf24', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                  🏆 Winner
                </div>
              )}
            </div>

            {/* RIGHT = Innings 2 team (batted second) */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                {match.winnerTeam?.id === rightTeam.id && (
                  <div className="crown-icon hero-crown" style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}>
                    <Crown size={18} color="#f59e0b" fill="#f59e0b" />
                  </div>
                )}
                {match.winnerTeam?.id === rightTeam.id && (
                  <div style={{ position: 'absolute', inset: '-6px', background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', opacity: 0.4, filter: 'blur(8px)', borderRadius: '50%' }}></div>
                )}
                <img 
                  src={rightTeam.teamLogo || getRandomLogo(rightTeam.id || 2)} 
                  alt="Logo" 
                  className={`hero-logo${match.winnerTeam?.id === rightTeam.id ? ' winner winner-highlight' : ''}`}
                  style={{ 
                    width: match.winnerTeam?.id === rightTeam.id ? '60px' : '50px', 
                    height: match.winnerTeam?.id === rightTeam.id ? '60px' : '50px', 
                    borderRadius: '50%', objectFit: 'cover', position: 'relative',
                    border: match.winnerTeam?.id === rightTeam.id ? '3px solid #f59e0b' : '2px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    filter: match.winnerTeam?.id === rightTeam.id ? 'none' : (match.winnerTeam ? 'grayscale(0.6)' : 'none'),
                    flexShrink: 0
                  }} 
                />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div className="hero-team-name" style={{ color: match.winnerTeam?.id === rightTeam.id ? '#fbbf24' : '#94a3b8', fontSize: '0.95rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{rightTeam.teamName}</div>
                <div style={{ color: '#64748b', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>2nd Innings</div>
                <div className="hero-score" style={{ color: match.winnerTeam?.id === rightTeam.id ? 'var(--primary)' : '#64748b', fontSize: '1.4rem', fontWeight: 900 }}>
                  {rightScore}-{rightWickets}
                </div>
              </div>
            </div>
          </div>

          {/* Result ribbon */}
          {match.status === 'COMPLETED' && match.result && (
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>{match.result}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', marginTop: '1rem' }}>
         
         <div style={{ marginBottom: '0.4rem' }}>
            <div style={{ overflowX: 'hidden' }}>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              overflowX: 'auto', 
              paddingBottom: '0.1rem', 
              scrollbarWidth: 'none', 
              WebkitOverflowScrolling: 'touch',
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                {['Summary', '1st Innings', '2nd Innings', 'Over Details', 'Squads', 'Basic Info'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        style={{ 
                          whiteSpace: 'nowrap', 
                          background: 'none',
                          border: 'none',
                          color: activeTab === tab ? 'var(--primary)' : '#94a3b8',
                          padding: '0.5rem 0.25rem', 
                          fontSize: '0.9rem',
                          fontWeight: activeTab === tab ? 800 : 500,
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease'
                        }}>
                        {tab}
                        {activeTab === tab && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'var(--primary)', borderRadius: '3px 3px 0 0' }} />
                        )}
                    </button>
                ))}
            </div>
            </div>
         </div>

         {activeTab === 'Summary' && (
             <AnimatedSection>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.25rem 0' }}>

                    {/* ── Row 1: Quick-glance stat pills ── */}
                    <div className="stat-pills-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                        {(() => {
                          const runsM    = match.result?.match(/by (\d+) runs?/i);
                          const wicketsM = match.result?.match(/by (\d+) wickets?/i);
                          const winPill  = runsM
                            ? { label: 'Won By', value: `${runsM[1]} Runs`, sub: `${match.winnerTeam?.teamName ?? 'Winner'}`, color: '#f59e0b' }
                            : wicketsM
                            ? { label: 'Won By', value: `${wicketsM[1]} Wkts`, sub: `${match.winnerTeam?.teamName ?? 'Winner'}`, color: '#f59e0b' }
                            : match.status === 'COMPLETED'
                            ? { label: 'Result', value: 'Tied', sub: 'No winner', color: '#10b981' }
                            : match.status === 'ONGOING'
                            ? { label: 'Status', value: 'Live 🔴', sub: 'In Progress', color: '#ef4444' }
                            : { label: 'Status', value: 'Upcoming', sub: match.matchDateTime ? new Date(match.matchDateTime).toLocaleDateString() : '-', color: '#64748b' };

                          return [
                            { label: '1st Inn', value: `${leftScore}-${leftWickets}`,  sub: leftTeam.teamName,  color: '#3b82f6' },
                            { label: '2nd Inn', value: `${rightScore}-${rightWickets}`, sub: rightTeam.teamName, color: '#8b5cf6' },
                            { label: 'Boundaries', value: String(batting.reduce((a, b) => a + (b.fours || 0) + (b.sixes || 0), 0)), sub: '4s + 6s total', color: '#10b981' },
                            winPill,
                          ].map((s, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', textAlign: 'center' }}>
                              <div style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{s.label}</div>
                              <div style={{ color: s.color, fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{s.value}</div>
                              <div style={{ color: '#475569', fontSize: '0.65rem', marginTop: '2px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.sub}</div>
                            </div>
                          ));
                        })()}
                    </div>

                    {/* ── Row 2: MVP Card (full-width centrepiece) ── */}
                    {match.manOfTheMatch && (
                        <div
                          className="hologram-card"
                          onMouseMove={handleMouseMove}
                          onClick={() => setShowPomStats(true)}
                          style={{
                            cursor: 'pointer',
                            transform: `perspective(1000px) rotateX(${(mousePos.y - 50) / 12}deg) rotateY(${(mousePos.x - 50) / -12}deg)`,
                            '--x': `${mousePos.x}%`,
                            '--y': `${mousePos.y}%`,
                          } as React.CSSProperties}
                        >
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(30,41,59,0.95), rgba(139,92,246,0.08))',
                                border: '1px solid rgba(245,158,11,0.25)',
                                padding: '1.5rem 2rem',
                                borderRadius: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'linear-gradient(to bottom, #f59e0b, #8b5cf6)' }}></div>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div style={{ position: 'absolute', inset: '-8px', background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, transparent 70%)', filter: 'blur(10px)', borderRadius: '50%' }}></div>
                                    <img
                                        src={match.manOfTheMatch.playerImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.manOfTheMatch.id}&backgroundColor=b6e3f4,c0aede`}
                                        alt={match.manOfTheMatch.name}
                                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f59e0b', position: 'relative' }}
                                    />
                                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#f59e0b', color: '#0f172a', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.6rem', border: '2px solid #0f172a' }}>MVP</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#f59e0b', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 800 }}>Player of the Match</div>
                                    <div style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.5px', marginTop: '2px' }}>{match.manOfTheMatch.name}</div>
                                    <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '4px' }}>Tap to view full performance →</div>
                                </div>
                                <Medal size={52} color="rgba(245,158,11,0.15)" strokeWidth={1} style={{ flexShrink: 0 }} />
                            </div>
                        </div>
                    )}

                    {/* ── Row 3: Side-by-side Innings Comparison ── */}
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginLeft: '-0.5rem', marginRight: '-0.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
                    <div className="innings-compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'stretch', minWidth: '320px' }}>
                        {/* LEFT CARD: Innings 1 team */}
                        {(() => {
                            const s = { team: leftTeam, batters: leftBatting, bowlers: leftBowling, color: '#3b82f6', inningsLabel: '1st Innings' };
                            const topB = getTopBatter(s.batters);
                            const topW = getTopBowler(s.bowlers);
                            const total = calculateTotal(s.batters);
                            const wkts = calculateWickets(s.batters);
                            const t4 = s.batters.reduce((a, b) => a + (b.fours || 0), 0);
                            const t6 = s.batters.reduce((a, b) => a + (b.sixes || 0), 0);
                            const isWinner = match.winnerTeam?.id === s.team.id;
                            return (
                                <div className="innings-card-padding" style={{ background: isWinner ? 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(15,23,42,0.98))' : 'rgba(255,255,255,0.02)', border: isWinner ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.04)', borderRadius: '20px 0 0 20px', padding: '1.5rem', paddingTop: '2.2rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'right', position: 'relative', overflow: 'hidden' }}>
                                    {isWinner && <div style={{ position: 'absolute', top: 0, left: 0, background: '#f59e0b', color: '#0f172a', fontSize: '0.55rem', fontWeight: 900, padding: '3px 10px', borderRadius: '20px 0 8px 0', textTransform: 'uppercase', lineHeight: 1.8 }}>🏆 Winner</div>}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                            <span className="innings-card-team-name" style={{ color: isWinner ? '#fbbf24' : '#94a3b8', fontWeight: 800, fontSize: '0.85rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.team.teamName}</span>
                                            <img src={s.team.teamLogo || getRandomLogo(s.team.id || 1)} alt="" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }} />
                                        </div>
                                        <div className="innings-card-score" style={{ color: s.color, fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px', marginTop: '4px' }}>{total}-{wkts}</div>
                                    </div>
                                    {topB && <div><div className="innings-card-stat-label" style={{ color: '#475569', fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>Top Scorer</div><div className="innings-card-name" style={{ color: '#fff', fontWeight: 700 }}>{topB.player.name}</div><div className="innings-card-value" style={{ color: s.color, fontWeight: 900 }}>{topB.runs} <span style={{ color: '#475569', fontSize: '0.75rem' }}>({topB.balls}b)</span></div></div>}
                                    {topW && <div><div className="innings-card-stat-label" style={{ color: '#475569', fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>Best Bowling</div><div className="innings-card-name" style={{ color: '#fff', fontWeight: 700 }}>{topW.player.name}</div><div className="innings-card-value" style={{ color: s.color, fontWeight: 900 }}>{topW.wickets}/{topW.runs} <span style={{ color: '#475569', fontSize: '0.75rem' }}>({topW.overs}ov)</span></div></div>}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>4s: <strong style={{ color: '#fff' }}>{t4}</strong></span>
                                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>6s: <strong style={{ color: '#fff' }}>{t6}</strong></span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* VS divider */}
                        <div className="vs-divider" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem 0.6rem', gap: '0.5rem' }}>
                            <div style={{ width: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }}></div>
                            <div style={{ color: '#334155', fontWeight: 900, fontSize: '0.7rem', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '2px' }}>VS</div>
                            <div style={{ width: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }}></div>
                        </div>

                        {/* RIGHT CARD: Innings 2 team */}
                        {(() => {
                            const s = { team: rightTeam, batters: rightBatting, bowlers: rightBowling, color: '#8b5cf6', inningsLabel: '2nd Innings' };
                            const topB = getTopBatter(s.batters);
                            const topW = getTopBowler(s.bowlers);
                            const total = calculateTotal(s.batters);
                            const wkts = calculateWickets(s.batters);
                            const t4 = s.batters.reduce((a, b) => a + (b.fours || 0), 0);
                            const t6 = s.batters.reduce((a, b) => a + (b.sixes || 0), 0);
                            const isWinner = match.winnerTeam?.id === s.team.id;
                            return (
                                <div className="innings-card-padding" style={{ background: isWinner ? 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(15,23,42,0.98))' : 'rgba(255,255,255,0.02)', border: isWinner ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.04)', borderRadius: '0 20px 20px 0', padding: '1.5rem', paddingTop: '2.2rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
                                    {isWinner && <div style={{ position: 'absolute', top: 0, right: 0, background: '#f59e0b', color: '#0f172a', fontSize: '0.55rem', fontWeight: 900, padding: '3px 10px', borderRadius: '0 20px 0 8px', textTransform: 'uppercase', lineHeight: 1.8 }}>🏆 Winner</div>}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <img src={s.team.teamLogo || getRandomLogo(s.team.id || 2)} alt="" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }} />
                                            <span className="innings-card-team-name" style={{ color: isWinner ? '#fbbf24' : '#94a3b8', fontWeight: 800, fontSize: '0.85rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.team.teamName}</span>
                                        </div>
                                        <div className="innings-card-score" style={{ color: s.color, fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px', marginTop: '4px' }}>{total}-{wkts}</div>
                                    </div>
                                    {topB && <div><div className="innings-card-stat-label" style={{ color: '#475569', fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>Top Scorer</div><div className="innings-card-name" style={{ color: '#fff', fontWeight: 700 }}>{topB.player.name}</div><div className="innings-card-value" style={{ color: s.color, fontWeight: 900 }}>{topB.runs} <span style={{ color: '#475569', fontSize: '0.75rem' }}>({topB.balls}b)</span></div></div>}
                                    {topW && <div><div className="innings-card-stat-label" style={{ color: '#475569', fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>Best Bowling</div><div className="innings-card-name" style={{ color: '#fff', fontWeight: 700 }}>{topW.player.name}</div><div className="innings-card-value" style={{ color: s.color, fontWeight: 900 }}>{topW.wickets}/{topW.runs} <span style={{ color: '#475569', fontSize: '0.75rem' }}>({topW.overs}ov)</span></div></div>}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>4s: <strong style={{ color: '#fff' }}>{t4}</strong></span>
                                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>6s: <strong style={{ color: '#fff' }}>{t6}</strong></span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                    </div>

                    {/* ── Row 4: Head-to-Head Boundary Battle Bar ── */}
                    {(() => {
                        const tL_4s = leftBatting.reduce((a, b) => a + (b.fours || 0), 0);
                        const tL_6s = leftBatting.reduce((a, b) => a + (b.sixes || 0), 0);
                        const tR_4s = rightBatting.reduce((a, b) => a + (b.fours || 0), 0);
                        const tR_6s = rightBatting.reduce((a, b) => a + (b.sixes || 0), 0);
                        const tLTotal = tL_4s + tL_6s;
                        const tRTotal = tR_4s + tR_6s;
                        const grand = tLTotal + tRTotal || 1;
                        return (
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '18px', padding: '1.2rem 1.5rem' }}>
                                {/* Title row */}
                                <div style={{ textAlign: 'center', color: '#475569', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.75rem' }}>⚔️ Boundary Battle</div>

                                {/* Team name + total row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: '#3b82f6', fontWeight: 800, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leftTeam.teamName}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>{tLTotal} boundaries</div>
                                    </div>
                                    <div style={{ color: '#334155', fontSize: '0.65rem', fontWeight: 900, flexShrink: 0 }}>VS</div>
                                    <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                                        <div style={{ color: '#8b5cf6', fontWeight: 800, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rightTeam.teamName}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>{tRTotal} boundaries</div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div style={{ height: '10px', borderRadius: '10px', overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.04)', margin: '0.6rem 0' }}>
                                    <div style={{ width: `${(tLTotal / grand) * 100}%`, background: 'linear-gradient(to right, #3b82f6, #60a5fa)', borderRadius: '10px 0 0 10px', transition: 'width 0.5s ease' }}></div>
                                    <div style={{ width: `${(tRTotal / grand) * 100}%`, background: 'linear-gradient(to left, #8b5cf6, #a78bfa)', borderRadius: '0 10px 10px 0', transition: 'width 0.5s ease' }}></div>
                                </div>

                                {/* 4s / 6s breakdown row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <span style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px' }}>4s: {tL_4s}</span>
                                        <span style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px' }}>6s: {tL_6s}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <span style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px' }}>4s: {tR_4s}</span>
                                        <span style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px' }}>6s: {tR_6s}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}


                </div>
             </AnimatedSection>
         )}

         {activeTab === 'Basic Info' && (
             <AnimatedSection>
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '4px', height: '20px', background: 'var(--primary)' }}></div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Match Information</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {[
                          { label: 'Toss', value: `${match.tossWinner?.teamName || 'TBA'} (${match.tossDecision || '-'})` },
                          { label: 'Venue', value: 'Siddha Cricket Ground, Mau' },
                          { label: 'Match Type', value: match.matchType },
                          { label: 'Match Duration', value: `${match.overs} Overs Match` },
                          { label: 'Date', value: new Date(match.matchDateTime).toLocaleDateString() }
                        ].map((info, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,b,b,0.05)' }}>
                              <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{info.label}</div>
                              <div style={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 600 }}>{info.value}</div>
                          </div>
                        ))}
                    </div>
                </div>
             </AnimatedSection>
         )}

          {activeTab === 'Over Details' && (
              <AnimatedSection>
                  <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Over-wise Data</h3>
                      
                      {[
                        { title: '1st Innings', overs: innings1Overs, batters: innings1Batting },
                        { title: '2nd Innings', overs: innings2Overs, batters: innings2Batting }
                      ].map((inn, iIdx) => inn.overs && inn.overs.length > 0 && (
                          <div key={iIdx} style={{ marginBottom: iIdx === 0 ? '2.5rem' : 0 }}>
                            <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {inn.title} - {inn.batters.length > 0 ? inn.batters[0].team.teamName : 'Batting Team'}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {inn.overs.map((over, idx) => (
                                    <div key={idx} style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      background: 'rgba(255,255,255,0.01)', 
                                      padding: '0.6rem 0.75rem', 
                                      borderRadius: '8px', 
                                      border: '1px solid rgba(255,255,255,0.03)',
                                      flexWrap: 'nowrap',
                                      width: '100%',
                                      minWidth: 'fit-content'
                                    }}>
                                        <div style={{ width: '120px', flexShrink: 0 }}>
                                            <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.85rem' }}>OVER {over.overNumber}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{over.bowlerName}</div>
                                        </div>
                                        <div style={{ 
                                          display: 'flex', 
                                          gap: '0.35rem', 
                                          flex: 1, 
                                          overflowX: 'auto', 
                                          padding: '0 0.5rem',
                                          scrollbarWidth: 'none',
                                          msOverflowStyle: 'none',
                                          whiteSpace: 'nowrap'
                                        }}>
                                            {over.balls.map((b, bIdx) => {
                                                let bgColor = 'rgba(255,255,255,0.05)';
                                                let color = '#94a3b8';
                                                if (b === 'W') { bgColor = '#ef4444'; color = '#fff'; }
                                                else if (b === '4') { bgColor = '#3b82f6'; color = '#fff'; }
                                                else if (b === '6') { bgColor = '#8b5cf6'; color = '#fff'; }
                                                else if (b !== '0' && b.length === 1) { bgColor = 'rgba(16, 185, 129, 0.2)'; color = '#10b981'; }
                                                
                                                return (
                                                    <div key={bIdx} style={{ 
                                                        minWidth: '24px', height: '24px', borderRadius: '50%', backgroundColor: bgColor, color: color,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', 
                                                        fontSize: b.length > 2 ? '0.6rem' : '0.75rem',
                                                        border: b === '0' ? '1px solid rgba(255,b,b,0.1)' : 'none',
                                                        flexShrink: 0
                                                    }}>
                                                        {b}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div style={{ width: '80px', textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 800 }}>{over.runs} Runs</div>
                                            {over.wickets > 0 && <div style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 700 }}>{over.wickets} Wkts</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                          </div>
                      ))}
                  </div>
              </AnimatedSection>
          )}

          {['1st Innings', '2nd Innings'].includes(activeTab) && (
            (activeTab === '1st Innings' ? innings1Batting : innings2Batting).length > 0 ? (
                <AnimatedSection>
                    <div className="glass-panel" style={{ padding: '0', overflowX: 'auto', WebkitOverflowScrolling: 'touch', background: 'rgba(15, 23, 42, 0.6)' }}>
                        <div style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '450px' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f1f5f9' }}>
                              {(activeTab === '1st Innings' ? innings1Batting : innings2Batting)[0].team.teamName} Innings
                            </h4>
                            <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>
                              {calculateTotal(activeTab === '1st Innings' ? innings1Batting : innings2Batting)}-{calculateWickets(activeTab === '1st Innings' ? innings1Batting : innings2Batting)}
                            </div>
                        </div>
                        
                        <div style={{ padding: '0.5rem 0', minWidth: '450px' }}>
                            <div style={{ display: 'flex', padding: '0.5rem 1rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <div style={{ flex: 1 }}>Batter</div>
                                <div style={{ display: 'flex', width: '200px', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <div style={{ width: '35px', textAlign: 'right' }}>R</div>
                                    <div style={{ width: '35px', textAlign: 'right' }}>B</div>
                                    <div style={{ width: '30px', textAlign: 'right' }}>4s</div>
                                    <div style={{ width: '30px', textAlign: 'right' }}>6s</div>
                                    <div style={{ width: '45px', textAlign: 'right' }}>SR</div>
                                </div>
                            </div>
                            
                            {(activeTab === '1st Innings' ? innings1Batting : innings2Batting).map(b => (
                                <div key={b.id} style={{ display: 'flex', padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Link to={'/players/' + b.player.id} style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer', display: 'block' }}>{b.player.name}</Link>
                                        <div style={{ fontSize: '0.7rem', color: b.howOut?.toLowerCase() === 'not out' ? 'var(--primary)' : '#64748b' }}>{b.howOut || 'not out'}</div>
                                    </div>
                                    <div style={{ display: 'flex', width: '200px', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                                        <div style={{ width: '40px', textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: b.runs >= 50 ? '#f59e0b' : b.runs >= 30 ? '#10b981' : '#fff', background: b.runs >= 50 ? 'rgba(245,158,11,0.15)' : b.runs >= 30 ? 'rgba(16,185,129,0.12)' : 'transparent', borderRadius: '6px', padding: b.runs >= 30 ? '1px 4px' : '0', minWidth: '28px', display: 'inline-block' }}>{b.runs}</div>
                                        <div style={{ width: '35px', textAlign: 'right', fontSize: '0.85rem', color: '#94a3b8' }}>{b.balls}</div>
                                        <div style={{ width: '30px', textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>{b.fours}</div>
                                        <div style={{ width: '30px', textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>{b.sixes}</div>
                                        <div style={{ width: '45px', textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>{b.strikeRate?.toFixed(1) || '0.0'}</div>
                                    </div>
                                </div>
                            ))}
                            
                            <div style={{ padding: '0.75rem 1rem', borderTop: '2px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <div style={{ color: '#94a3b8', fontWeight: 600 }}>Extras</div>
                                <div style={{ color: '#f1f5f9', fontWeight: 800 }}>-</div>
                            </div>
                            
                            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>Total</div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.4rem' }}>
                                    {calculateTotal(activeTab === '1st Innings' ? innings1Batting : innings2Batting)}-{calculateWickets(activeTab === '1st Innings' ? innings1Batting : innings2Batting)}
                                  </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1.25rem 1rem', background: 'rgba(0,0,0,0.2)', minWidth: '450px' }}>
                            <div style={{ display: 'flex', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                <div style={{ flex: 1 }}>Bowler</div>
                                <div style={{ display: 'flex', width: '180px', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <div style={{ width: '35px', textAlign: 'right' }}>O</div>
                                    <div style={{ width: '25px', textAlign: 'right' }}>M</div>
                                    <div style={{ width: '35px', textAlign: 'right' }}>R</div>
                                    <div style={{ width: '35px', textAlign: 'right' }}>W</div>
                                    <div style={{ width: '40px', textAlign: 'right' }}>Eco</div>
                                </div>
                            </div>
                            
                            {(activeTab === '1st Innings' ? innings1Bowling : innings2Bowling).map(b => (
                                <div key={b.id} style={{ display: 'flex', padding: '0.6rem 0', borderTop: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                                    <Link to={'/players/' + b.player.id} style={{ flex: 1, fontWeight: 700, color: '#60a5fa', fontSize: '0.85rem', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer' }}>{b.player.name}</Link>
                                    <div style={{ display: 'flex', width: '180px', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                                        <div style={{ width: '35px', textAlign: 'right', fontSize: '0.85rem', color: '#f1f5f9' }}>{b.overs}</div>
                                        <div style={{ width: '25px', textAlign: 'right', fontSize: '0.85rem', color: '#94a3b8' }}>{b.maidens || 0}</div>
                                        <div style={{ width: '35px', textAlign: 'right', fontSize: '0.85rem', color: '#f1f5f9' }}>{b.runs}</div>
                                        <div style={{ width: '35px', textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: b.wickets >= 3 ? '#ef4444' : b.wickets >= 1 ? '#f87171' : '#64748b', background: b.wickets >= 3 ? 'rgba(239,68,68,0.15)' : b.wickets >= 1 ? 'rgba(248,113,113,0.1)' : 'transparent', borderRadius: '6px', padding: b.wickets >= 1 ? '1px 4px' : '0', minWidth: '24px', display: 'inline-block' }}>{b.wickets}</div>
                                        <div style={{ width: '40px', textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>{b.economyRate?.toFixed(1) || '0.0'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </AnimatedSection>
            ) : <div className="glass-panel text-center" style={{ padding: '3rem' }}>Data not yet available</div>
          )}

         {activeTab === 'Squads' && (
             <AnimatedSection>
                 <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '4px', height: '20px', background: 'var(--primary)' }}></div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Playing XI</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {[
                          { team: match.teamA, players: match.playingXiTeamA },
                          { team: match.teamB, players: match.playingXiTeamB }
                        ].map((s, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                  <img src={s.team.teamLogo || getRandomLogo(s.team.id || 0)} style={{ width: 32, height: 32, borderRadius: '50%' }} alt="Logo" />
                                  <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{s.team.teamName}</h4>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                  {s.players?.map(p => (
                                      <div key={p.id} style={{ color: '#cbd5e1', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                                        <Link to={'/players/' + p.id} style={{ color: '#60a5fa', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer' }}>{p.name}</Link> {p.isCaptain ? <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 900 }}>(C)</span> : ''} {p.isViceCaptain ? <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>(VC)</span> : ''}
                                      </div>
                                  ))}
                              </div>
                          </div>
                        ))}
                    </div>
                 </div>
             </AnimatedSection>
         )}

      </div>

      {showPomStats && match.manOfTheMatch && (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div className="modal-content glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '2.5rem', position: 'relative' }}>
                  <button 
                    onClick={() => setShowPomStats(false)} 
                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                      <X size={20} />
                  </button>

                  <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
                        <div style={{ position: 'absolute', inset: '-10px', background: 'var(--primary)', filter: 'blur(20px)', opacity: 0.3, borderRadius: '50%' }}></div>
                        <img 
                            src={match.manOfTheMatch.playerImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.manOfTheMatch.id}&backgroundColor=b6e3f4,c0aede`} 
                            style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--primary)', position: 'relative' }} 
                            alt={match.manOfTheMatch.name}
                        />
                      </div>
                      <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0 }}>{match.manOfTheMatch.name}</h2>
                      <div style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '0.5rem' }}>Match Performance</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                      <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                          <h4 style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontSize: '1.1rem' }}>
                             Batting
                          </h4>
                          {pomBatting ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{pomBatting.runs}<span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500, marginLeft: '5px' }}>({pomBatting.balls})</span></div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                                      <div><span style={{ color: '#94a3b8' }}>4s: </span> {pomBatting.fours}</div>
                                      <div><span style={{ color: '#94a3b8' }}>6s: </span> {pomBatting.sixes}</div>
                                      <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#94a3b8' }}>SR: </span> {pomBatting.strikeRate?.toFixed(1) || '0.0'}</div>
                                  </div>
                              </div>
                          ) : <div style={{ color: '#64748b' }}>Did not bat</div>}
                      </div>

                      <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                          <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontSize: '1.1rem' }}>
                             Bowling
                          </h4>
                          {pomBowling ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{pomBowling.wickets}<span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500, marginLeft: '5px' }}>/ {pomBowling.runs}</span></div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                                      <div><span style={{ color: '#94a3b8' }}>Overs: </span> {pomBowling.overs}</div>
                                      <div><span style={{ color: '#94a3b8' }}>Maidens: </span> {pomBowling.maidens || 0}</div>
                                      <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#94a3b8' }}>Econ: </span> {pomBowling.economyRate?.toFixed(1) || '0.0'}</div>
                                  </div>
                              </div>
                          ) : <div style={{ color: '#64748b' }}>Did not bowl</div>}
                      </div>
                  </div>
                  
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '2rem', borderRadius: '30px' }}
                    onClick={() => setShowPomStats(false)}
                  >
                      Close Summary
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default MatchScorecard;
