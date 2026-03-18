import React, { useEffect, useState } from 'react';
import { MatchScoringService } from '../services/api';
import type { LiveMatchDetailsDto, Match, ScorecardBatting, ScorecardBowling, Player } from '../types';
import { AnimatedSection } from '../components/AnimatedSection';
import { Activity, Circle } from 'lucide-react';

const LiveMatch: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [details, setDetails] = useState<LiveMatchDetailsDto | null>(null);
  const [battingCards, setBattingCards] = useState<ScorecardBatting[]>([]);
  const [bowlingCards, setBowlingCards] = useState<ScorecardBowling[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll for live matches
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await MatchScoringService.getLiveMatches();
        setLiveMatches(res.data);
        if (res.data.length > 0 && !selectedMatchId) {
          setSelectedMatchId(res.data[0].id!);
        }
        if (res.data.length === 0) setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchMatches();
    const interval = setInterval(fetchMatches, 10000);
    return () => clearInterval(interval);
  }, [selectedMatchId]);

  // Poll for details of selected match
  useEffect(() => {
    if (!selectedMatchId) return;
    
    const fetchDetails = async () => {
      try {
        const res = await MatchScoringService.getLiveDetails(selectedMatchId);
        setDetails(res.data);
        
        try {
            const cardRes = await MatchScoringService.getCompleteScorecard(selectedMatchId);
            setBattingCards(cardRes.data.batting);
            setBowlingCards(cardRes.data.bowling);
        } catch (cardErr) {
            console.error('Failed fetching scorecard components', cardErr);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDetails();
    const interval = setInterval(fetchDetails, 5000); // 5s fast poll for live details
    return () => clearInterval(interval);
  }, [selectedMatchId]);

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading Live Feed...</div>;

  if (liveMatches.length === 0) {
    return (
      <div className="dashboard-wrapper">
        <div className="parallax-hero" style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="hero-overlay"></div>
          <div className="hero-content text-center animate-slide-up" style={{ zIndex: 2 }}>
            <Activity size={64} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
            <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 800 }}>No Live Matches</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>Check back later when a match has started.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!details) return null;

  const currentBattingTeam = details.match.currentInnings === 1 ? details.match.battingTeam : details.match.battingTeam; // Handled by backend accurately
  
  const currentInningsBatting = battingCards.filter(c => c.innings === details.match.currentInnings);
  const currentInningsBowling = bowlingCards.filter(c => c.innings === details.match.currentInnings);

  const previousInningsBatting = battingCards.filter(c => c.innings === 1);
  const previousInningsBowling = bowlingCards.filter(c => c.innings === 1);
  
  // Derive "Yet to bat"
  const battingSquad: Player[] = currentBattingTeam?.id === details.match.teamA.id 
    ? (details.match.playingXiTeamA || []) 
    : (details.match.playingXiTeamB || []);
  
  const roleOrder: Record<string, number> = { 'BATSMAN': 1, 'WICKETKEEPER': 2, 'ALL_ROUNDER': 3, 'BOWLER': 4 };
  const yetToBat = battingSquad
    .filter(p => !currentInningsBatting.some(bc => bc.player.id === p.id) && p.id !== details.currentStriker?.id && p.id !== details.currentNonStriker?.id)
    .sort((a, b) => (roleOrder[a.role] || 5) - (roleOrder[b.role] || 5));

  return (
    <div className="dashboard-wrapper" style={{ paddingBottom: '4rem' }}>
      
      {/* SECTION 1: LIVE HERO SCOREBOARD */}
      <div className="parallax-hero" style={{ 
        height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '-80px'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem', width: '100%', maxWidth: '800px' }}>
          
          {details.match.status === 'COMPLETED' ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.4rem 1rem', borderRadius: '30px', fontWeight: 'bold', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
              MATCH COMPLETED
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.4rem 1rem', borderRadius: '30px', fontWeight: 'bold', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
              <Circle size={12} className="animate-pulse" style={{ fill: '#ef4444', marginRight: '8px' }} /> LIVE
            </div>
          )}

          <h3 style={{ fontSize: '1.2rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>
            {details.match.teamA.teamName} vs {details.match.teamB.teamName}
          </h3>

          {details.match.status === 'COMPLETED' && details.match.result && (
              <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 800 }}>
                  {details.match.result}
              </h2>
          )}

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2.5rem 2rem', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <h2 style={{ fontSize: '2rem', margin: 0 }}>{currentBattingTeam?.teamName}</h2>
              </div>
              <div style={{ padding: '0 2rem' }}>
                <div style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                  {details.currentScore}<span style={{fontSize: '2.5rem', color: '#cbd5e1'}}>-{details.currentWickets}</span>
                </div>
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontSize: '1.2rem', color: '#94a3b8', margin: 0 }}>({details.currentOvers} Overs)</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', color: '#94a3b8', fontSize: '1.1rem' }}>
              <div>CRR: <span style={{color: '#fff', fontWeight: 'bold'}}>{details.currentRunRate.toFixed(2)}</span></div>
              {details.targetScore && (
                <>
                  <div>REQ: <span style={{color: '#fff', fontWeight: 'bold'}}>{details.requiredRunRate?.toFixed(2)}</span></div>
                  <div>TARGET: <span style={{color: '#fff', fontWeight: 'bold'}}>{details.targetScore}</span></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', marginTop: '2rem' }}>
        
        {/* MATCH SELECTOR IF MULTIPLE */}
        {liveMatches.length > 1 && (
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem' }}>
            {liveMatches.map(m => (
              <button 
                key={m.id}
                onClick={() => setSelectedMatchId(m.id!)}
                className={`btn ${selectedMatchId === m.id ? 'btn-primary' : ''}`}
                style={{ whiteSpace: 'nowrap', borderRadius: '30px', border: selectedMatchId !== m.id ? '1px solid var(--glass-border)' : 'none' }}>
                {m.teamA.teamName} vs {m.teamB.teamName}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* PREVIOUS INNINGS (1st INNINGS) IF CURRENTLY 2ND INNINGS */}
          {details.match.currentInnings === 2 && previousInningsBatting.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '1rem', opacity: 0.8 }}>
                <AnimatedSection>
                    <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                        <h3 className="gradient-text" style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>1st Innings - {details.match.bowlingTeam?.teamName} Batting</span>
                            {details.targetScore ? <span>Total: {details.targetScore - 1}</span> : null}
                        </h3>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '500px' }}>
                            <thead>
                                <tr style={{ color: '#94a3b8', fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ paddingBottom: '0.5rem', paddingLeft: '0.5rem' }}>Batter</th>
                                    <th style={{ paddingBottom: '0.5rem' }}></th>
                                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center', width: '40px' }}>R</th>
                                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center', width: '40px' }}>B</th>
                                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center', width: '40px' }}>4s</th>
                                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center', width: '40px' }}>6s</th>
                                    <th style={{ paddingBottom: '0.5rem', textAlign: 'right', width: '60px', paddingRight: '0.5rem' }}>SR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previousInningsBatting.map(card => (
                                    <tr key={card.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.5rem', color: '#fff' }}>{card.player.name} {card.howOut === 'not out' ? '*' : ''}</td>
                                        <td style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>{card.howOut}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{card.runs}</td>
                                        <td style={{ textAlign: 'center' }}>{card.balls}</td>
                                        <td style={{ textAlign: 'center' }}>{card.fours}</td>
                                        <td style={{ textAlign: 'center' }}>{card.sixes}</td>
                                        <td style={{ textAlign: 'right', paddingRight: '0.5rem' }}>{card.balls > 0 ? ((card.runs / card.balls) * 100).toFixed(1) : '0.0'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <h4 style={{ color: '#94a3b8', marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1rem' }}>Bowling</h4>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '400px' }}>
                            <thead>
                                <tr style={{ color: '#94a3b8', fontSize: '0.85rem', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ paddingBottom: '0.5rem', paddingLeft: '0.5rem' }}>Bowler</th>
                                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>O</th>
                                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>M</th>
                                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>R</th>
                                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>W</th>
                                    <th style={{ paddingBottom: '0.5rem', textAlign: 'right', paddingRight: '0.5rem' }}>ECO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previousInningsBowling.map(card => (
                                    <tr key={card.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.5rem', color: '#fff' }}>{card.player.name}</td>
                                        <td style={{ textAlign: 'center' }}>{card.overs}</td>
                                        <td style={{ textAlign: 'center' }}>{card.maidens}</td>
                                        <td style={{ textAlign: 'center' }}>{card.runs}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{card.wickets}</td>
                                        <td style={{ textAlign: 'right', paddingRight: '0.5rem' }}>{card.overs > 0 ? (card.runs / ((Math.floor(card.overs) * 6 + Math.round((card.overs % 1)*10)) / 6)).toFixed(1) : '0.0'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AnimatedSection>
            </div>
          )}

          {/* CURRENT INNINGS BATSMEN STATS */}
          <AnimatedSection>
            <div className="glass-panel hover-lift" style={{ padding: '1.5rem', overflowX: 'auto' }}>
              <h3 className="gradient-text" style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{details.match.currentInnings === 2 ? '2nd Innings - ' : '1st Innings - '} {currentBattingTeam?.teamName} Batting</span>
                <span>{details.currentScore}-{details.currentWickets} ({details.currentOvers})</span>
              </h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ paddingBottom: '0.5rem', paddingLeft: '0.5rem' }}>Batter</th>
                    <th style={{ paddingBottom: '0.5rem' }}></th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center', width: '40px' }}>R</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center', width: '40px' }}>B</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center', width: '40px' }}>4s</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center', width: '40px' }}>6s</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'right', width: '60px', paddingRight: '0.5rem' }}>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInningsBatting.map(card => {
                      const isStriker = details.currentStriker?.id === card.player.id;
                      const isNonStriker = details.currentNonStriker?.id === card.player.id;
                      const isAtCrease = isStriker || isNonStriker;
                      
                      return (
                        <tr key={card.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isAtCrease ? 'rgba(56, 189, 248, 0.05)' : 'transparent' }}>
                          <td style={{ padding: '0.8rem 0.5rem', fontWeight: isAtCrease ? 'bold' : 'normal', color: isAtCrease ? 'var(--primary)' : '#fff' }}>
                            {card.player.name} {isStriker ? '*' : ''}
                          </td>
                          <td style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            {card.howOut}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{card.runs}</td>
                          <td style={{ textAlign: 'center' }}>{card.balls}</td>
                          <td style={{ textAlign: 'center' }}>{card.fours}</td>
                          <td style={{ textAlign: 'center' }}>{card.sixes}</td>
                          <td style={{ textAlign: 'right', paddingRight: '0.5rem' }}>{card.balls > 0 ? ((card.runs / card.balls) * 100).toFixed(1) : '0.0'}</td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>

              {yetToBat.length > 0 && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Yet to bat:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {yetToBat.map(p => (
                              <span key={p.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                                  {p.name}
                              </span>
                          ))}
                      </div>
                  </div>
              )}
            </div>
          </AnimatedSection>

          {/* BOWLER STATS */}
          <AnimatedSection>
            <div className="glass-panel hover-lift" style={{ padding: '1.5rem', overflowX: 'auto' }}>
              <h3 className="gradient-text" style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>Bowling</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '400px' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ paddingBottom: '0.5rem', paddingLeft: '0.5rem' }}>Bowler</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>O</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>M</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>R</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>W</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'right', paddingRight: '0.5rem' }}>ECO</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInningsBowling.map(card => {
                      const isBowling = details.currentBowler?.id === card.player.id;
                      return (
                        <tr key={card.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isBowling ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                          <td style={{ padding: '0.8rem 0.5rem', fontWeight: isBowling ? 'bold' : 'normal', color: isBowling ? '#fbbf24' : '#fff' }}>
                            {card.player.name} {isBowling ? '•' : ''}
                          </td>
                          <td style={{ textAlign: 'center' }}>{card.overs}</td>
                          <td style={{ textAlign: 'center' }}>{card.maidens}</td>
                          <td style={{ textAlign: 'center' }}>{card.runs}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{card.wickets}</td>
                          <td style={{ textAlign: 'right', paddingRight: '0.5rem' }}>{card.overs > 0 ? (card.runs / ((Math.floor(card.overs) * 6 + Math.round((card.overs % 1)*10)) / 6)).toFixed(1) : '0.0'}</td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
            </div>
          </AnimatedSection>

        </div>



        {/* RECENT FORM (TIMELINE) */}
        <AnimatedSection>
          <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="gradient-text" style={{ margin: 0, fontSize: '1.2rem', marginRight: '1rem' }}>Recent Balls: </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {details.lastSixBalls.length === 0 ? <span style={{ color: '#94a3b8' }}>First ball incoming...</span> : null}
                {details.lastSixBalls.map((b, i) => {
                  let bgColor = '#1e293b'; // dot ball
                  if (b === 'W') bgColor = '#ef4444'; // wicket red
                  else if (b === '4') bgColor = '#3b82f6'; // four blue
                  else if (b === '6') bgColor = '#8b5cf6'; // six purple
                  else if (b !== '0' && b.length === 1) bgColor = '#10b981'; // runs green
                  else if (b.length > 1) bgColor = '#f59e0b'; // extras warning
                  
                  return (
                    <div key={i} style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', backgroundColor: bgColor, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {b}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default LiveMatch;
