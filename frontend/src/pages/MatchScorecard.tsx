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

  return (
    <div className="dashboard-wrapper">
      <div className="parallax-hero" style={{ 
        height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '-80px'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem' }}>
          <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
             {match.teamA.teamName} vs {match.teamB.teamName}
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.2rem', marginBottom: '1rem' }}>{match.matchDate}</p>
          <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.5rem 1.5rem', borderRadius: '30px', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            {match.winnerTeam ? `${match.winnerTeam.teamName} Won` : 'Match Tied / No Result'}
          </div>
        </div>
      </div>

      <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', marginTop: '2rem', paddingBottom: '4rem' }}>
         
         <button className="btn" onClick={() => navigate('/matches')} style={{ marginBottom: '2rem' }}>&larr; Back to Matches</button>

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

      </div>
    </div>
  );
};

export default MatchScorecard;
