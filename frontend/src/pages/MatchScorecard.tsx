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
  const [activeTab, setActiveTab] = useState<string>('Summary');

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
    return batters.reduce((acc, curr) => acc + curr.runs, 0); 
  };
  const calculateWickets = (batters: ScorecardBatting[]) => {
    const outs = batters.filter(b => b.howOut && b.howOut.toLowerCase() !== 'not out' && b.howOut !== '');
    const uniqueOuts = Array.from(new Set(outs.map(b => b.player.id)));
    return Math.min(10, uniqueOuts.length);
  };

  const getRandomLogo = (id: number) => `https://api.dicebear.com/7.x/identicon/svg?seed=Team${id}&backgroundColor=1e293b`;

  return (
    <div className="dashboard-wrapper" style={{ paddingBottom: '5rem' }}>
      <div className="parallax-hero" style={{ 
        minHeight: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '-80px', padding: '4rem 1rem'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem', maxWidth: '800px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
            <img src={match.teamA.teamLogo || getRandomLogo(match.teamA.id || 0)} alt={match.teamA.teamName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ textAlign: 'center' }}>
                <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900, margin: 0, lineHeight: 1 }}>VS</h1>
                <div style={{ color: '#94a3b8', marginTop: '0.5rem', fontWeight: 'bold' }}>{match.matchDate}</div>
            </div>
            <img src={match.teamB.teamLogo || getRandomLogo(match.teamB.id || 0)} alt={match.teamB.teamName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          
          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>{match.teamA.teamName} vs {match.teamB.teamName}</h2>
          
          {match.status === 'COMPLETED' && (
             <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.75rem 2rem', borderRadius: '40px', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.4)', fontSize: '1.2rem', marginTop: '1rem', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
               {match.result || (match.winnerTeam ? `${match.winnerTeam.teamName} Won` : 'Match Tied')}
             </div>
          )}

          {match.manOfTheMatch && (
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%)', padding: '1rem 2.5rem', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.5)', display: 'inline-block' }}>
                <div style={{ color: '#f59e0b', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>Player of the Match</div>
                <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>{match.manOfTheMatch.name}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', marginTop: '2rem' }}>
         
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/matches')}>&larr; Matches</button>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                {['Summary', 'Basic Info', '1st Innings', '2nd Innings', 'Squads'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ whiteSpace: 'nowrap', borderRadius: '20px', padding: '0.5rem 1.25rem' }}>
                        {tab}
                    </button>
                ))}
            </div>
         </div>

         {activeTab === 'Summary' && (
             <AnimatedSection>
                <div className="glass-panel text-center" style={{ padding: '3rem 2rem' }}>
                    <h3 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Match Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <h4 style={{ color: '#94a3b8', marginBottom: '0.75rem' }}>1st Innings</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                                {innings1Batting.length > 0 ? innings1Batting[0].team.teamName : 'TBA'}
                            </div>
                            <div style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: 800 }}>
                                {calculateTotal(innings1Batting)}-{calculateWickets(innings1Batting)}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <h4 style={{ color: '#94a3b8', marginBottom: '0.75rem' }}>2nd Innings</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                                {innings2Batting.length > 0 ? innings2Batting[0].team.teamName : 'TBA'}
                            </div>
                            <div style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: 800 }}>
                                {calculateTotal(innings2Batting)}-{calculateWickets(innings2Batting)}
                            </div>
                        </div>
                    </div>
                </div>
             </AnimatedSection>
         )}

         {activeTab === 'Basic Info' && (
             <AnimatedSection>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Match Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                        <div>
                            <div style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Toss</div>
                            <div style={{ color: '#fff' }}>{match.tossWinner?.teamName || 'TBA'} ({match.tossDecision || '-'})</div>
                        </div>
                        <div>
                            <div style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Venue</div>
                            <div style={{ color: '#fff' }}>Siddha Cricket Ground, Mau</div>
                        </div>
                        <div>
                            <div style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Type</div>
                            <div style={{ color: '#fff' }}>{match.matchType}</div>
                        </div>
                        <div>
                            <div style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Overs</div>
                            <div style={{ color: '#fff' }}>{match.overs} Overs Match</div>
                        </div>
                    </div>
                </div>
             </AnimatedSection>
         )}

         {activeTab === '1st Innings' && (
            innings1Batting.length > 0 ? (
                <AnimatedSection>
                    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                            <h4 style={{ margin: 0 }}>{innings1Batting[0].team.teamName} Innings</h4>
                            <div style={{ fontWeight: 'bold' }}>{calculateTotal(innings1Batting)}-{calculateWickets(innings1Batting)}</div>
                        </div>
                        <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                                <thead>
                                    <tr style={{ color: '#94a3b8', fontSize: '0.85rem', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '0.5rem' }}>Batter</th>
                                        <th>Status</th>
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
                                            <td style={{ padding: '0.75rem 0.5rem', color: '#fff', fontWeight: 'bold' }}>{b.player.name}</td>
                                            <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{b.howOut || 'not out'}</td>
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
                        <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                            <h5 style={{ color: '#94a3b8', marginBottom: '1rem' }}>Bowling</h5>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                                <thead>
                                    <tr style={{ color: '#94a3b8', fontSize: '0.85rem', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '0.5rem' }}>Bowler</th>
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
                                            <td style={{ padding: '0.75rem 0.5rem', color: '#fff', fontWeight: 'bold' }}>{b.player.name}</td>
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
            ) : <div className="glass-panel text-center" style={{ padding: '3rem' }}>No data available</div>
         )}

         {activeTab === '2nd Innings' && (
            innings2Batting.length > 0 ? (
                <AnimatedSection>
                    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                            <h4 style={{ margin: 0 }}>{innings2Batting[0].team.teamName} Innings</h4>
                            <div style={{ fontWeight: 'bold' }}>{calculateTotal(innings2Batting)}-{calculateWickets(innings2Batting)}</div>
                        </div>
                        <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                                <thead>
                                    <tr style={{ color: '#94a3b8', fontSize: '0.85rem', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '0.5rem' }}>Batter</th>
                                        <th>Status</th>
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
                                            <td style={{ padding: '0.75rem 0.5rem', color: '#fff', fontWeight: 'bold' }}>{b.player.name}</td>
                                            <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{b.howOut || 'not out'}</td>
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
                        <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                            <h5 style={{ color: '#94a3b8', marginBottom: '1rem' }}>Bowling</h5>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                                <thead>
                                    <tr style={{ color: '#94a3b8', fontSize: '0.85rem', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '0.5rem' }}>Bowler</th>
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
                                            <td style={{ padding: '0.75rem 0.5rem', color: '#fff', fontWeight: 'bold' }}>{b.player.name}</td>
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
            ) : <div className="glass-panel text-center" style={{ padding: '3rem' }}>Second innings data not yet available</div>
         )}

         {activeTab === 'Squads' && (
             <AnimatedSection>
                 <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <img src={match.teamA.teamLogo || getRandomLogo(match.teamA.id || 0)} style={{ width: 40, height: 40, borderRadius: '50%' }} alt="T1" />
                                <h4 style={{ color: 'var(--primary)', margin: 0 }}>{match.teamA.teamName}</h4>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#cbd5e1' }}>
                                {match.playingXiTeamA?.map(p => (
                                    <li key={p.id}>• {p.name} {p.isCaptain ? '(C)' : ''} {p.isViceCaptain ? '(VC)' : ''}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <img src={match.teamB.teamLogo || getRandomLogo(match.teamB.id || 0)} style={{ width: 40, height: 40, borderRadius: '50%' }} alt="T2" />
                                <h4 style={{ color: 'var(--primary)', margin: 0 }}>{match.teamB.teamName}</h4>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#cbd5e1' }}>
                                {match.playingXiTeamB?.map(p => (
                                    <li key={p.id}>• {p.name} {p.isCaptain ? '(C)' : ''} {p.isViceCaptain ? '(VC)' : ''}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                 </div>
             </AnimatedSection>
         )}

      </div>
    </div>
  );
};

export default MatchScorecard;
