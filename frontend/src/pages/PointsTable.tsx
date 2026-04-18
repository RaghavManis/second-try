import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PointsService, TeamService } from '../services/api';
import type { PointsTableEntry, Team } from '../types';
import { Trophy } from 'lucide-react';
import { AnimatedSection } from '../components/AnimatedSection';
import { AutoScrollContainer } from '../components/AutoScrollContainer';
import SEO from '../components/common/SEO';


const PointsTable: React.FC = () => {
  const [points, setPoints] = useState<Record<'TOURNAMENT' | 'PRACTICE', PointsTableEntry[]>>({ TOURNAMENT: [], PRACTICE: [] });
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [perfData, setPerfData] = useState<any>(null);
  const [leaderboardType, setLeaderboardType] = useState<'TOURNAMENT' | 'PRACTICE'>('TOURNAMENT');

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      const [ptRes, perfRes, teamsRes] = await Promise.all([
         PointsService.getPointsTable(),
         PointsService.getTopPerformers(),
         TeamService.getAllTeams()
      ]);
      setPoints(ptRes.data || { TOURNAMENT: [], PRACTICE: [] });
      setPerfData(perfRes.data);
      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load points table.');
      setLoading(false);
    }
  };

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading standings...</div>;
  if (error) return <div className="error" style={{ textAlign: 'center', marginTop: '20vh' }}>{error}</div>;

  const currentPoints = points[leaderboardType] || [];
  const topTeams = currentPoints.length > 0 ? currentPoints.slice(0, 1) : [];

  const getRandomLogo = (id: number) => `https://api.dicebear.com/7.x/identicon/svg?seed=Team${id}&backgroundColor=1e293b`;

  const PodiumCard = ({ pt, rank }: { pt: PointsTableEntry, rank: number }) => {
    const color = '#fbbf24'; // Gold only
    const teamObj = teams.find(t => t.id === pt.teamId);
    return (
      <div className="glass-panel hover-lift" style={{ 
        padding: '1.5rem', 
        display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
        borderTop: `4px solid ${color}`
      }}>
        <div style={{ position: 'absolute', top: '-16px', background: color, color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          {rank}
        </div>
        <img src={(teamObj && teamObj.teamLogo) || getRandomLogo(pt.teamId || 0)} alt={pt.teamName} style={{ width: 72, height: 72, borderRadius: '16px', margin: '1rem 0', objectFit: 'cover' }} />
        <h3 className="gradient-text" style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '0.25rem' }}>{pt.teamName}</h3>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>{pt.points} <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>pts</span></div>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', fontSize: '0.9rem' }}>
          <div><span style={{color: 'var(--text-secondary)'}}>W:</span> <span className="text-green">{pt.wins}</span></div>
          <div><span style={{color: 'var(--text-secondary)'}}>L:</span> <span className="text-red">{pt.losses}</span></div>
          <div><span style={{color: 'var(--text-secondary)'}}>NRR:</span> {pt.netRunRate ? pt.netRunRate.toFixed(3) : '0.000'}</div>
        </div>
      </div>
    );
  };

  const currentTopScorers = perfData?.[leaderboardType]?.topRunScorers || [];
  const currentTopWickets = perfData?.[leaderboardType]?.topWicketTakers || [];
  const currentTopSixes = perfData?.[leaderboardType]?.topSixHitters || [];
  const currentTopFours = perfData?.[leaderboardType]?.topFourHitters || [];
  const currentTopCatches = perfData?.[leaderboardType]?.topCatchTakers || [];

  const LeaderboardPanel = ({ 
    title, 
    emoji, 
    data, 
    statKey, 
    statLabel, 
    color, 
    accentColor, 
    bgOpacity = '0.15' 
  }: { 
    title: string, 
    emoji: string, 
    data: any[], 
    statKey: string, 
    statLabel: string, 
    color: string, 
    accentColor: string, 
    bgOpacity?: string 
  }) => (
    <div className="glass-panel hover-lift" style={{ padding: '0', overflow: 'hidden', height: '100%' }}>
      <div style={{ background: '#0f172a', padding: '1.25rem', borderBottom: `2px solid ${accentColor}` }}>
        <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
          {title} {emoji}
        </h3>
      </div>
      <div style={{ overflowX: 'auto', width: '100%', background: 'rgba(15, 23, 42, 0.6)' }}>
        <table className="data-table" style={{ background: 'transparent', width: '100%', minWidth: '350px' }}>
          <thead>
            <tr>
              <th style={{ color: color, padding: '1rem', width: '60px' }}>Rank</th>
              <th style={{ color: color }}>Player</th>
              <th style={{ textAlign: 'right', color: color, paddingRight: '1rem' }}>{statLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={3} className="text-center" style={{ color: '#94a3b8', padding: '2rem' }}>No data available</td></tr>
            ) : (
              data.map((item, i) => (
                <tr key={i} style={{ 
                  background: i === 0 ? `rgba(${accentColor.replace(/[^\d,]/g, '') || '249, 115, 22'}, ${bgOpacity})` : 'transparent', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)' 
                }}>
                  <td style={{ color: '#cbd5e1', padding: '0.85rem 1rem' }}>{i + 1}</td>
                  <td className="font-bold">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {item.player?.id ? (
                        <Link to={`/players/${item.player.id}`} style={{ color: accentColor, textDecoration: 'none', fontWeight: 700 }}>
                          {item.player?.name || 'Unknown'}
                        </Link>
                      ) : (
                        <span style={{ color: accentColor, fontWeight: 700 }}>{item.player?.name || 'Unknown'}</span>
                      )}
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        fontWeight: 500,
                        letterSpacing: '0.025em',
                        marginTop: '2px'
                      }}>
                        {item.teamName || '-'}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                    <span style={{ 
                      fontWeight: 900, 
                      fontSize: i === 0 ? '1.2rem' : '1.1rem', 
                      color: i === 0 ? color : '#f8fafc',
                      background: i === 0 ? `rgba(${accentColor.replace(/[^\d,]/g, '') || '249, 115, 22'}, 0.2)` : 'transparent',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      display: 'inline-block'
                    }}>
                      {item[statKey]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="dashboard-wrapper">
      <SEO 
        title="Points Table & Leaderboard" 
        description="Real-time standings, team points, and top performers of the Siddha Premier League (SPL). Track the journey of your favorite teams to the finals."
      />

      {/* SECTION 1: HERO */}
      <div className="parallax-hero" style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("/trophy-bg.jpg")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '0', paddingTop: '80px'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.5) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem' }}>
          <div style={{ display: 'inline-block', marginBottom: '1rem', padding: '0.5rem 1.5rem', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '30px', backdropFilter: 'blur(10px)', color: '#fbbf24', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
            The Road to Glory
          </div>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            Tournament Leaderboard
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: 1.6, textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}>
            Explore the standings and top performers across all formats.
          </p>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', padding: '6px', maxWidth: '300px', margin: '0 auto 2rem auto', border: '1px solid var(--glass-border)' }}>
            <button 
              onClick={() => setLeaderboardType('TOURNAMENT')}
              style={{ flex: 1, background: leaderboardType === 'TOURNAMENT' ? 'var(--primary)' : 'transparent', color: leaderboardType === 'TOURNAMENT' ? '#fff' : 'var(--text-secondary)', padding: '12px 24px', borderRadius: '30px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s' }}>
              Tournament
            </button>
            <button 
              onClick={() => setLeaderboardType('PRACTICE')}
              style={{ flex: 1, background: leaderboardType === 'PRACTICE' ? 'var(--primary)' : 'transparent', color: leaderboardType === 'PRACTICE' ? '#fff' : 'var(--text-secondary)', padding: '12px 24px', borderRadius: '30px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s' }}>
              Practice
            </button>
          </div>
          <button onClick={() => document.getElementById('standings-content')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-secondary hover-lift" style={{ padding: '0.8rem 2.5rem', fontSize: '1.2rem', borderRadius: '30px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 25px rgba(251, 191, 36, 0.2)' }}>
            View Standings <Trophy size={18} style={{ marginLeft: '8px' }}/>
          </button>
        </div>
      </div>

      <div id="standings-content" className="dashboard-sections">
        
        {/* SECTION 2: TOP TEAMS PODIUM */}
        {topTeams.length > 0 && (
        <AnimatedSection className="bg-section-2 theme-light">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Table Topper</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '3.5rem' }}>The number one team leading the {leaderboardType.toLowerCase()} charge.</p>
          <AutoScrollContainer className="horizontal-scroller" style={{ paddingTop: '16px' }}>
            {topTeams.map((pt, index) => (
              <PodiumCard key={pt.teamId} pt={pt} rank={index + 1} />
            ))}
          </AutoScrollContainer>
        </AnimatedSection>
        )}

        {/* SECTION 3: FULL POINTS TABLE */}
        <AnimatedSection className="bg-section-3 theme-dark">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Full {leaderboardType} Standings</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>Comprehensive breakdown of all participating teams.</p>
          
          <div className="glass-panel hover-lift" style={{ padding: '0', overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>L</th>
                  <th>T</th>
                  <th>NRR</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {currentPoints.length === 0 ? (
                  <tr><td colSpan={8} style={{textAlign: 'center', padding: '2rem'}}>No matches played yet.</td></tr>
                ) : (
                  currentPoints.map((pt, index) => {
                    const teamObj = teams.find(t => t.id === pt.teamId);
                    return (
                    <tr key={pt.teamId}>
                      <td className="font-bold">{index + 1}</td>
                      <td className="team-name">
                        <img src={(teamObj && teamObj.teamLogo) || getRandomLogo(pt.teamId || 0)} alt={pt.teamName} style={{ width: 24, height: 24, borderRadius: '50%', marginRight: '10px', objectFit: 'cover' }} />
                        <Link to={`/teams/${pt.teamId}`} style={{ color: '#60a5fa', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer', fontWeight: 700 }}>{pt.teamName}</Link>
                      </td>
                      <td>{pt.matchesPlayed}</td>
                      <td className="text-green">{pt.wins}</td>
                      <td className="text-red">{pt.losses}</td>
                      <td>{pt.ties}</td>
                      <td>{pt.netRunRate ? pt.netRunRate.toFixed(3) : '0.000'}</td>
                      <td className="font-bold" style={{ fontSize: '1.1rem' }}>
                        <span style={{ color: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : 'var(--primary)', background: index === 0 ? 'rgba(245,158,11,0.15)' : index === 1 ? 'rgba(148,163,184,0.1)' : index === 2 ? 'rgba(205,127,50,0.12)' : 'transparent', borderRadius: '8px', padding: index <= 2 ? '2px 8px' : '0', fontWeight: 900, display: 'inline-block' }}>{pt.points}</span>
                      </td>
                    </tr>
                  )}
                  )
                )}
              </tbody>
            </table>
          </div>
        </AnimatedSection>
        
        {/* SECTION 4: TOURNAMENT LEADERS */}
        <AnimatedSection className="bg-section-4 theme-light">
           <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginTop: '2rem', marginBottom: '0.25rem' }}>Top {leaderboardType} Performers</h2>
           <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2rem' }}>Stats strictly from {leaderboardType.toLowerCase()} matches.</p>
           
           <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                <LeaderboardPanel 
                  title="Orange Cap" 
                  emoji="🟠" 
                  data={currentTopScorers} 
                  statKey="totalRuns" 
                  statLabel="Runs" 
                  color="#fdba74" 
                  accentColor="#f97316"
                />
                
                <LeaderboardPanel 
                  title="Purple Cap" 
                  emoji="🟣" 
                  data={currentTopWickets} 
                  statKey="totalWickets" 
                  statLabel="Wickets" 
                  color="#d8b4fe" 
                  accentColor="#a855f7"
                />

                <LeaderboardPanel 
                  title="Maximum Sixes" 
                  emoji="🔥" 
                  data={currentTopSixes} 
                  statKey="totalSixes" 
                  statLabel="Sixes" 
                  color="#fca5a5" 
                  accentColor="#ef4444"
                />

                <LeaderboardPanel 
                  title="Boundary King" 
                  emoji="🚀" 
                  data={currentTopFours} 
                  statKey="totalFours" 
                  statLabel="Fours" 
                  color="#86efac" 
                  accentColor="#22c55e"
                />

                <LeaderboardPanel 
                  title="Safe Hands" 
                  emoji="🧤" 
                  data={currentTopCatches} 
                  statKey="totalCatches" 
                  statLabel="Catches" 
                  color="#67e8f9" 
                  accentColor="#06b6d4"
                />
           </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default PointsTable;
