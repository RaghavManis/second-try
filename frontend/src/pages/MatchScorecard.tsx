import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchScoringService } from '../services/api';
import type { Match, ScorecardBatting, ScorecardBowling } from '../types';
import { AnimatedSection } from '../components/AnimatedSection';

interface ScorecardData {
  match: Match;
  batting: ScorecardBatting[];
  bowling: ScorecardBowling[];
}

const MatchScorecard: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (matchId) {
      fetchScorecard(parseInt(matchId));
    }
  }, [matchId]);

  const fetchScorecard = async (id: number) => {
    try {
      const res = await MatchScoringService.getCompleteScorecard(id);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading Scorecard...</div>;
  if (!data) return <div className="page-container text-center">Scorecard not found or match is incomplete.</div>;

  const { match, batting, bowling } = data;

  // Separate by innings
  const innings1Batting = batting.filter(b => b.innings === 1);
  const innings1Bowling = bowling.filter(b => b.innings === 1);
  const innings2Batting = batting.filter(b => b.innings === 2);
  const innings2Bowling = bowling.filter(b => b.innings === 2);

  const calculateTotal = (batters: ScorecardBatting[]) => {
    return batters.reduce((acc, curr) => acc + curr.runs, 0); // Note: Simple MVP total, Extras would need to be tracked explicitly in DB for 100% accuracy.
  };
  const calculateWickets = (batters: ScorecardBatting[]) => batters.filter(b => b.howOut && b.howOut !== 'not out').length;

  const getRandomLogo = (id: number) => `https://api.dicebear.com/7.x/identicon/svg?seed=Team${id}&backgroundColor=1e293b`;

  return (
    <div className="dashboard-wrapper">
      <div className="parallax-hero" style={{ 
        minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '-80px', padding: '4rem 1rem'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
            <img src={match.teamA.teamLogo || getRandomLogo(match.teamA.id || 0)} alt={match.teamA.teamName} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
            <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 800, margin: 0 }}>
              VS
            </h1>
            <img src={match.teamB.teamLogo || getRandomLogo(match.teamB.id || 0)} alt={match.teamB.teamName} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>{match.teamA.teamName} vs {match.teamB.teamName}</h2>

          <p style={{ color: '#cbd5e1', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{match.matchDate}</p>
          
          {match.manOfTheMatch && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.2) 100%)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid #f59e0b', display: 'inline-block' }}>
                <span style={{ color: '#f59e0b', fontSize: '1.3rem', fontWeight: 'bold' }}>🏆 Player of the Match: {match.manOfTheMatch.name}</span>
                <div style={{ marginTop: '0.75rem' }}>
                    <button className="btn" onClick={() => {
                        const div = document.getElementById('mom-stats');
                        if (div) div.style.display = div.style.display === 'none' ? 'block' : 'none';
                    }} style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                        View Performance
                    </button>
                </div>
                
                <div id="mom-stats" style={{ display: 'none', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center', color: '#cbd5e1' }}>
                    {(() => {
                        const momBat = batting.find(b => b.player.id === match.manOfTheMatch?.id);
                        const momBowl = bowling.find(b => b.player.id === match.manOfTheMatch?.id);
                        return (
                            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {momBat && momBat.balls > 0 && <div><strong style={{color: '#fff'}}>Batting:</strong> {momBat.runs} ({momBat.balls})</div>}
                                {momBowl && momBowl.overs > 0 && <div><strong style={{color: '#fff'}}>Bowling:</strong> {momBowl.overs} - {momBowl.maidens || 0} - {momBowl.runs} - {momBowl.wickets}</div>}
                                {(!momBat || momBat.balls === 0) && (!momBowl || momBowl.overs === 0) && <div>Special performance or fielding.</div>}
                            </div>
                        );
                    })()}
                </div>
              </div>
            </div>
          )}

          {match.status === 'COMPLETED' && (
             <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.5rem 1.5rem', borderRadius: '30px', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
               {match.winnerTeam ? `${match.result || match.winnerTeam.teamName + ' Won'}` : 'Match Tied / No Result'}
             </div>
          )}
        </div>
      </div>
      
      <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', marginTop: '2rem', paddingBottom: '4rem' }}>
         
         <button className="btn" onClick={() => navigate('/matches')} style={{ marginBottom: '2rem' }}>&larr; Back to Matches</button>

         {match.status === 'SCHEDULED' ? (
           <div className="glass-panel text-center" style={{ padding: '4rem', color: 'var(--text-secondary)' }}>
              <h2>Match has not started yet</h2>
              <p>Scorecard and details will be active once the toss is completed and scoring begins.</p>
           </div>
         ) : (
           <>
             {/* Playing XI Section */}
             {(match.playingXiTeamA?.length || match.playingXiTeamB?.length) ? (
               <AnimatedSection>
                 <div className="glass-panel" style={{ marginBottom: '3rem', padding: '1.5rem' }}>
                    <h3 className="gradient-text" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Playing XI</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                       <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                             <img src={match.teamA.teamLogo || getRandomLogo(match.teamA.id || 0)} alt="Logo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                             <h4 style={{ color: 'var(--primary)', margin: 0 }}>{match.teamA.teamName}</h4>
                          </div>
                          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                             {match.playingXiTeamA?.map(p => (
                               <li key={p.id}>• {p.name} {p.isCaptain ? '(C)' : ''} {p.isViceCaptain ? '(VC)' : ''} {p.role === 'WICKETKEEPER' ? '(WK)' : ''}</li>
                             ))}
                             {(!match.playingXiTeamA || match.playingXiTeamA.length === 0) && <li style={{color: '#64748b'}}>Not announced</li>}
                          </ul>
                       </div>
                       <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                             <img src={match.teamB.teamLogo || getRandomLogo(match.teamB.id || 0)} alt="Logo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                             <h4 style={{ color: 'var(--primary)', margin: 0 }}>{match.teamB.teamName}</h4>
                          </div>
                          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                             {match.playingXiTeamB?.map(p => (
                               <li key={p.id}>• {p.name} {p.isCaptain ? '(C)' : ''} {p.isViceCaptain ? '(VC)' : ''} {p.role === 'WICKETKEEPER' ? '(WK)' : ''}</li>
                             ))}
                             {(!match.playingXiTeamB || match.playingXiTeamB.length === 0) && <li style={{color: '#64748b'}}>Not announced</li>}
                          </ul>
                       </div>
                    </div>
                 </div>
               </AnimatedSection>
             ) : null}

             {/* 1st Innings */}
         {innings1Batting.length > 0 && (
         <AnimatedSection>
            <div className="glass-panel" style={{ marginBottom: '3rem', padding: '0' }}>
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary)' }}>{innings1Batting[0].team.teamName} Innings</h3>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{calculateTotal(innings1Batting)}-{calculateWickets(innings1Batting)}</div>
               </div>
               
               {/* Batting Table */}
               <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                 <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
                   <thead>
                     <tr style={{ color: '#94a3b8', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                       <th style={{ padding: '0.75rem 0' }}>Batter</th>
                       <th></th>
                       <th style={{ textAlign: 'center' }}>R</th>
                       <th style={{ textAlign: 'center' }}>B</th>
                       <th style={{ textAlign: 'center' }}>4s</th>
                       <th style={{ textAlign: 'center' }}>6s</th>
                       <th style={{ textAlign: 'right' }}>SR</th>
                     </tr>
                   </thead>
                   <tbody>
                      {innings1Batting.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                           <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: '#fff' }}>{b.player.name}</td>
                           <td style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{b.howOut || 'not out'}</td>
                           <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>{b.runs}</td>
                           <td style={{ textAlign: 'center' }}>{b.balls}</td>
                           <td style={{ textAlign: 'center' }}>{b.fours}</td>
                           <td style={{ textAlign: 'center' }}>{b.sixes}</td>
                           <td style={{ textAlign: 'right' }}>{b.strikeRate?.toFixed(1) || '0.0'}</td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>

               {/* Bowling Table */}
               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', overflowX: 'auto' }}>
                 <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
                   <thead>
                     <tr style={{ color: '#94a3b8', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                       <th style={{ padding: '0.75rem 0' }}>Bowler</th>
                       <th style={{ textAlign: 'center' }}>O</th>
                       <th style={{ textAlign: 'center' }}>M</th>
                       <th style={{ textAlign: 'center' }}>R</th>
                       <th style={{ textAlign: 'center' }}>W</th>
                       <th style={{ textAlign: 'right' }}>ECON</th>
                     </tr>
                   </thead>
                   <tbody>
                      {innings1Bowling.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                           <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: '#fff' }}>{b.player.name}</td>
                           <td style={{ textAlign: 'center' }}>{b.overs}</td>
                           <td style={{ textAlign: 'center' }}>{b.maidens || 0}</td>
                           <td style={{ textAlign: 'center' }}>{b.runs}</td>
                           <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>{b.wickets}</td>
                           <td style={{ textAlign: 'right' }}>{b.economyRate?.toFixed(1) || '0.0'}</td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
            </div>
         </AnimatedSection>
         )}

         {/* 2nd Innings */}
         {innings2Batting.length > 0 && (
         <AnimatedSection>
            <div className="glass-panel" style={{ marginBottom: '3rem', padding: '0' }}>
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary)' }}>{innings2Batting[0].team.teamName} Innings</h3>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{calculateTotal(innings2Batting)}-{calculateWickets(innings2Batting)}</div>
               </div>
               
               {/* Batting Table */}
               <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                 <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
                   <thead>
                     <tr style={{ color: '#94a3b8', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                       <th style={{ padding: '0.75rem 0' }}>Batter</th>
                       <th></th>
                       <th style={{ textAlign: 'center' }}>R</th>
                       <th style={{ textAlign: 'center' }}>B</th>
                       <th style={{ textAlign: 'center' }}>4s</th>
                       <th style={{ textAlign: 'center' }}>6s</th>
                       <th style={{ textAlign: 'right' }}>SR</th>
                     </tr>
                   </thead>
                   <tbody>
                      {innings2Batting.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                           <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: '#fff' }}>{b.player.name}</td>
                           <td style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{b.howOut || 'not out'}</td>
                           <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>{b.runs}</td>
                           <td style={{ textAlign: 'center' }}>{b.balls}</td>
                           <td style={{ textAlign: 'center' }}>{b.fours}</td>
                           <td style={{ textAlign: 'center' }}>{b.sixes}</td>
                           <td style={{ textAlign: 'right' }}>{b.strikeRate?.toFixed(1) || '0.0'}</td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>

               {/* Bowling Table */}
               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', overflowX: 'auto' }}>
                 <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
                   <thead>
                     <tr style={{ color: '#94a3b8', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                       <th style={{ padding: '0.75rem 0' }}>Bowler</th>
                       <th style={{ textAlign: 'center' }}>O</th>
                       <th style={{ textAlign: 'center' }}>M</th>
                       <th style={{ textAlign: 'center' }}>R</th>
                       <th style={{ textAlign: 'center' }}>W</th>
                       <th style={{ textAlign: 'right' }}>ECON</th>
                     </tr>
                   </thead>
                   <tbody>
                      {innings2Bowling.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                           <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: '#fff' }}>{b.player.name}</td>
                           <td style={{ textAlign: 'center' }}>{b.overs}</td>
                           <td style={{ textAlign: 'center' }}>{b.maidens || 0}</td>
                           <td style={{ textAlign: 'center' }}>{b.runs}</td>
                           <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>{b.wickets}</td>
                           <td style={{ textAlign: 'right' }}>{b.economyRate?.toFixed(1) || '0.0'}</td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
            </div>
         </AnimatedSection>
         )}
         
         </>
       )}

      </div>
    </div>
  );
};

export default MatchScorecard;
