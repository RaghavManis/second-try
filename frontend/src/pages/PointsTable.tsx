import React, { useEffect, useState } from 'react';
import { PointsService, TeamService } from '../services/api';
import type { PointsTableEntry, Team } from '../types';
import { Trophy } from 'lucide-react';
import { AnimatedSection } from '../components/AnimatedSection';
import { AutoScrollContainer } from '../components/AutoScrollContainer';

const PointsTable: React.FC = () => {
  const [points, setPoints] = useState<PointsTableEntry[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [topWickets, setTopWickets] = useState<any[]>([]);

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
      setTopScorers(perfRes.data.topRunScorers || []);
      setTopWickets(perfRes.data.topWicketTakers || []);
      setTeams(teamsRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load points table.');
      setLoading(false);
    }
  };

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading standings...</div>;
  if (error) return <div className="error" style={{ textAlign: 'center', marginTop: '20vh' }}>{error}</div>;

  const topTeams = points.slice(0, 1);
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
          <div><span style={{color: 'var(--text-secondary)'}}>NRR:</span> {pt.netRunRate ? pt.netRunRate.toFixed(2) : '0.00'}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-wrapper">
      {/* SECTION 1: HERO */}
      <div className="parallax-hero" style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '-80px'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem' }}>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Tournament Leaderboard
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            See which teams are dominating the standings.
          </p>
          <button onClick={() => document.getElementById('standings-content')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary hover-lift" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', borderRadius: '30px' }}>
            View Standings <Trophy size={20} style={{ marginLeft: '8px' }}/>
          </button>
        </div>
      </div>

      <div id="standings-content" className="dashboard-sections">
        
        {/* SECTION 2: TOP TEAMS PODIUM */}
        {topTeams.length > 0 && (
        <AnimatedSection className="bg-section-2 theme-light">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Table Topper</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '3.5rem' }}>The number one team leading the charge.</p>
          <AutoScrollContainer className="horizontal-scroller" style={{ paddingTop: '16px' }}>
            {topTeams.map((pt, index) => (
              <PodiumCard key={pt.teamId} pt={pt} rank={index + 1} />
            ))}
          </AutoScrollContainer>
        </AnimatedSection>
        )}

        {/* SECTION 3: FULL POINTS TABLE */}
        <AnimatedSection className="bg-section-3 theme-dark">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Full Standings</h2>
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
                {points.length === 0 ? (
                  <tr><td colSpan={8} style={{textAlign: 'center', padding: '2rem'}}>No matches played yet.</td></tr>
                ) : (
                  points.map((pt, index) => {
                    const teamObj = teams.find(t => t.id === pt.teamId);
                    return (
                    <tr key={pt.teamId}>
                      <td className="font-bold">{index + 1}</td>
                      <td className="team-name">
                        <img src={(teamObj && teamObj.teamLogo) || getRandomLogo(pt.teamId || 0)} alt={pt.teamName} style={{ width: 24, height: 24, borderRadius: '50%', marginRight: '10px', objectFit: 'cover' }} />
                        {pt.teamName}
                      </td>
                      <td>{pt.matchesPlayed}</td>
                      <td className="text-green">{pt.wins}</td>
                      <td className="text-red">{pt.losses}</td>
                      <td>{pt.ties}</td>
                      <td>{pt.netRunRate ? pt.netRunRate.toFixed(2) : '0.00'}</td>
                      <td className="font-bold text-primary" style={{fontSize: '1.1rem'}}>{pt.points}</td>
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
           <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginTop: '3rem' }}>
               
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
                             {topScorers.length === 0 ? <tr><td colSpan={4} className="text-center" style={{color: '#fff', padding: '1rem'}}>No runs recorded</td></tr> : 
                               topScorers.map((ts, i) => (
                                   <tr key={i} style={{ background: i === 0 ? 'rgba(249, 115, 22, 0.15)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                       <td style={{color: '#cbd5e1', padding: '1rem'}}>{i + 1}</td>
                                       <td className="font-bold" style={{ color: i === 0 ? '#ffedd5' : '#ffffff', fontSize: i === 0 ? '1.1rem' : '1rem' }}>{ts.playerName}</td>
                                       <td style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{ts.teamName}</td>
                                       <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: i === 0 ? '1.3rem' : '1.1rem', color: i === 0 ? '#f97316' : '#fed7aa', paddingRight: '1rem' }}>{ts.totalRuns}</td>
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
                             {topWickets.length === 0 ? <tr><td colSpan={4} className="text-center" style={{color: '#fff', padding: '1rem'}}>No wickets recorded</td></tr> : 
                               topWickets.map((tw, i) => (
                                   <tr key={i} style={{ background: i === 0 ? 'rgba(168, 85, 247, 0.15)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                       <td style={{color: '#cbd5e1', padding: '1rem'}}>{i + 1}</td>
                                       <td className="font-bold" style={{ color: i === 0 ? '#f3e8ff' : '#ffffff', fontSize: i === 0 ? '1.1rem' : '1rem' }}>{tw.playerName}</td>
                                       <td style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{tw.teamName}</td>
                                       <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: i === 0 ? '1.3rem' : '1.1rem', color: i === 0 ? '#a855f7' : '#e9d5ff', paddingRight: '1rem' }}>{tw.totalWickets}</td>
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
