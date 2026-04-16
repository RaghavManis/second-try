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
      setPoints(ptRes.data);
      setPerfData(perfRes.data);
      setTeams(teamsRes.data);
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
           
           <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
               
               {/* ORANGE CAP */}
               <div className="glass-panel hover-lift" style={{ padding: '0', overflow: 'hidden' }}>
                   <div style={{ background: '#0f172a', padding: '1.5rem', borderBottom: '2px solid rgba(249, 115, 22, 0.8)' }}>
                      <h3 style={{ margin: 0, color: '#ffedd5', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
                         Top Scorer 🟠
                      </h3>
                   </div>
                   <div style={{ overflowX: 'auto', width: '100%', background: 'rgba(15, 23, 42, 0.6)' }}>
                     <table className="data-table" style={{ background: 'transparent', width: '100%', minWidth: '400px' }}>
                         <thead>
                             <tr><th style={{color: '#fdba74', padding: '1rem'}}>Rank</th><th style={{color: '#fdba74'}}>Player</th><th style={{color: '#fdba74'}}>Team</th><th style={{textAlign: 'right', color: '#fdba74', paddingRight: '1rem'}}>Runs</th></tr>
                         </thead>
                         <tbody>
                             {currentTopScorers.length === 0 ? <tr><td colSpan={4} className="text-center" style={{color: '#fff', padding: '1rem'}}>No runs recorded</td></tr> : 
                               currentTopScorers.map((ts: any, i: number) => (
                                   <tr key={i} style={{ background: i === 0 ? 'rgba(249, 115, 22, 0.15)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                       <td style={{color: '#cbd5e1', padding: '1rem'}}>{i + 1}</td>
                                       <td className="font-bold" style={{ fontSize: i === 0 ? '1.1rem' : '1rem' }}>
                                          {ts.player?.id
                                            ? <Link to={`/players/${ts.player.id}`} style={{ color: i === 0 ? '#fb923c' : '#60a5fa', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer' }}>{ts.player?.name || ts.playerName || '-'}</Link>
                                            : <span style={{ color: i === 0 ? '#ffedd5' : '#ffffff' }}>{ts.player?.name || ts.playerName || '-'}</span>
                                          }
                                        </td>
                                       <td style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{ts.teamName || '-'}</td>
                                       <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                                          <span style={{ fontWeight: 900, fontSize: i === 0 ? '1.3rem' : '1.1rem', color: i === 0 ? '#f97316' : ts.totalRuns >= 200 ? '#f59e0b' : ts.totalRuns >= 100 ? '#10b981' : '#fed7aa', background: i === 0 ? 'rgba(249,115,22,0.2)' : ts.totalRuns >= 200 ? 'rgba(245,158,11,0.15)' : ts.totalRuns >= 100 ? 'rgba(16,185,129,0.12)' : 'transparent', borderRadius: '8px', padding: i === 0 || ts.totalRuns >= 100 ? '2px 8px' : '0', display: 'inline-block' }}>{ts.totalRuns}</span>
                                        </td>
                                   </tr>
                               ))
                             }
                         </tbody>
                     </table>
                   </div>
               </div>

               {/* PURPLE CAP */}
               <div className="glass-panel hover-lift" style={{ padding: '0', overflow: 'hidden' }}>
                   <div style={{ background: '#0f172a', padding: '1.5rem', borderBottom: '2px solid rgba(168, 85, 247, 0.8)' }}>
                      <h3 style={{ margin: 0, color: '#f3e8ff', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
                         Top Wicket Taker 🟣
                      </h3>
                   </div>
                   <div style={{ overflowX: 'auto', width: '100%', background: 'rgba(15, 23, 42, 0.6)' }}>
                     <table className="data-table" style={{ background: 'transparent', width: '100%', minWidth: '400px' }}>
                         <thead>
                             <tr><th style={{color: '#d8b4fe', padding: '1rem'}}>Rank</th><th style={{color: '#d8b4fe'}}>Player</th><th style={{color: '#d8b4fe'}}>Team</th><th style={{textAlign: 'right', color: '#d8b4fe', paddingRight: '1rem'}}>Wickets</th></tr>
                         </thead>
                         <tbody>
                             {currentTopWickets.length === 0 ? <tr><td colSpan={4} className="text-center" style={{color: '#fff', padding: '1rem'}}>No wickets recorded</td></tr> : 
                               currentTopWickets.map((tw: any, i: number) => (
                                   <tr key={i} style={{ background: i === 0 ? 'rgba(168, 85, 247, 0.15)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                       <td style={{color: '#cbd5e1', padding: '1rem'}}>{i + 1}</td>
                                       <td className="font-bold" style={{ fontSize: i === 0 ? '1.1rem' : '1rem' }}>
                                          {tw.player?.id
                                            ? <Link to={`/players/${tw.player.id}`} style={{ color: i === 0 ? '#c084fc' : '#60a5fa', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer' }}>{tw.player?.name || tw.playerName || '-'}</Link>
                                            : <span style={{ color: i === 0 ? '#f3e8ff' : '#ffffff' }}>{tw.player?.name || tw.playerName || '-'}</span>
                                          }
                                        </td>
                                       <td style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{tw.teamName || '-'}</td>
                                       <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                                          <span style={{ fontWeight: 900, fontSize: i === 0 ? '1.3rem' : '1.1rem', color: i === 0 ? '#a855f7' : tw.totalWickets >= 10 ? '#ef4444' : tw.totalWickets >= 5 ? '#f87171' : '#e9d5ff', background: i === 0 ? 'rgba(168,85,247,0.2)' : tw.totalWickets >= 10 ? 'rgba(239,68,68,0.15)' : tw.totalWickets >= 5 ? 'rgba(248,113,113,0.12)' : 'transparent', borderRadius: '8px', padding: i === 0 || tw.totalWickets >= 5 ? '2px 8px' : '0', display: 'inline-block' }}>{tw.totalWickets}</span>
                                        </td>
                                   </tr>
                               ))
                             }
                         </tbody>
                     </table>
                   </div>
               </div>

           </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default PointsTable;
