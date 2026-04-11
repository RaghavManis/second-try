import React, { useEffect, useState } from 'react';
import { MatchScoringService } from '../services/api';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import type { LiveMatchDetailsDto, Match, ScorecardBatting, ScorecardBowling, Player } from '../types';
import { AnimatedSection } from '../components/AnimatedSection';
import { Activity, Circle } from 'lucide-react';
import SEO from '../components/common/SEO';


const LiveMatch: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [details, setDetails] = useState<LiveMatchDetailsDto | null>(null);
  const [battingCards, setBattingCards] = useState<ScorecardBatting[]>([]);
  const [bowlingCards, setBowlingCards] = useState<ScorecardBowling[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Live');
  const [boundaryAnim, setBoundaryAnim] = useState<'four' | 'six' | null>(null);
  const lastDeliveriesHash = React.useRef<string | null>(null);
  const boundaryTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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
    
    const fetchLiveDetails = async () => {
      try {
        const res = await MatchScoringService.getLiveDetails(selectedMatchId);
        
        // Strict Boundary Animation Logic
        if (res.data) {
          const currentHash = JSON.stringify(res.data.thisOverBalls);
          if (lastDeliveriesHash.current !== null && currentHash !== lastDeliveriesHash.current) {
             if (res.data.thisOverBalls.length > 0) {
               const lastBall = res.data.thisOverBalls[res.data.thisOverBalls.length - 1];
                 if (lastBall === '4' || lastBall === '6') {
                    setBoundaryAnim(lastBall === '4' ? 'four' : 'six');
                    
                    if (lastBall === '4') {
                        // Light celebration: single spray from center bottom
                        confetti({
                            particleCount: 120,
                            spread: 100,
                            origin: { y: 0.9 },
                            zIndex: 9999998,
                            colors: ['#3b82f6', '#60a5fa', '#ffffff', '#10b981']
                        });
                    } else {
                        // Strong celebration: Continuous firecracker burst from corners for 2.5s
                        const duration = 2500;
                        const end = Date.now() + duration;

                        (function frame() {
                            confetti({
                                particleCount: 7,
                                angle: 60,
                                spread: 55,
                                origin: { x: 0, y: 0.8 },
                                zIndex: 9999998,
                                colors: ['#8b5cf6', '#c084fc', '#f59e0b', '#ef4444', '#ffffff']
                            });
                            confetti({
                                particleCount: 7,
                                angle: 120,
                                spread: 55,
                                origin: { x: 1, y: 0.8 },
                                zIndex: 9999998,
                                colors: ['#8b5cf6', '#c084fc', '#f59e0b', '#ef4444', '#ffffff']
                            });

                            if (Date.now() < end) {
                                requestAnimationFrame(frame);
                            }
                        }());
                    }

                    if (boundaryTimeoutRef.current) clearTimeout(boundaryTimeoutRef.current);
                    boundaryTimeoutRef.current = setTimeout(() => {
                        setBoundaryAnim(null);
                    }, 2800);
                 }
             }
          }
          lastDeliveriesHash.current = currentHash;
        }
        
        setDetails(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchScorecards = async () => {
      try {
        const cardRes = await MatchScoringService.getCompleteScorecard(selectedMatchId);
        setBattingCards(cardRes.data.batting);
        setBowlingCards(cardRes.data.bowling);
      } catch (err) {
        console.error('Failed fetching scorecard components', err);
      }
    };

    const initData = async () => {
      await fetchLiveDetails();
      await fetchScorecards();
      setLoading(false);
    };
    
    initData();
    const detailsInterval = setInterval(fetchLiveDetails, 5000); // 5s fast poll for live details
    const scorecardInterval = setInterval(fetchScorecards, 15000); // 15s slow poll for full scorecard
    
    return () => {
        clearInterval(detailsInterval);
        clearInterval(scorecardInterval);
        if (boundaryTimeoutRef.current) clearTimeout(boundaryTimeoutRef.current);
    };
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

  const firstInningsBatting = battingCards.filter(c => c.innings === 1);
  const firstInningsBowling = bowlingCards.filter(c => c.innings === 1);
  const secondInningsBatting = battingCards.filter(c => c.innings === 2);
  const secondInningsBowling = bowlingCards.filter(c => c.innings === 2);
  
  // Derive "Yet to bat"
  const battingSquad: Player[] = currentBattingTeam?.id === details.match.teamA.id 
    ? (details.match.playingXiTeamA || []) 
    : (details.match.playingXiTeamB || []);
  
  const roleOrder: Record<string, number> = { 'BATSMAN': 1, 'ALL_ROUNDER': 2, 'WICKET_KEEPER': 3, 'BOWLER': 4 };
  const yetToBat = battingSquad
    .filter(p => !currentInningsBatting.some(bc => bc.player.id === p.id) && p.id !== details.currentStriker?.id && p.id !== details.currentNonStriker?.id)
    .sort((a, b) => {
      const rA = roleOrder[a.role] || 99;
      const rB = roleOrder[b.role] || 99;
      if (rA !== rB) return rA - rB;
      return a.name.localeCompare(b.name);
    });

    const getRandomLogo = (id: number) => `https://api.dicebear.com/7.x/identicon/svg?seed=Team${id}&backgroundColor=1e293b`;


    const renderTimeline = () => {
      if (!details) return null;
      return (
        <AnimatedSection>

          {boundaryAnim && createPortal(
            <div className={`super-boundary-overlay ${boundaryAnim === 'six' ? 'anim-six' : 'anim-four'}`} style={{
              background: boundaryAnim === 'six' ? 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 60%)' : 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 60%)',
              animation: 'fadeInOut 2.8s forwards'
            }}>
              <div style={{
                transform: 'scale(1)',
                color: boundaryAnim === 'six' ? '#8b5cf6' : '#3b82f6',
                animation: boundaryAnim === 'six' ? 'boomSix 2.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' : 'slideBoundary 2.8s forwards'
              }}>
                {boundaryAnim === 'six' ? '6' : '4'}
                <div style={{fontSize: 'clamp(1.5rem, 6vw, 3.5rem)', textAlign: 'center', marginTop: '-10px', textTransform: 'uppercase'}}>{boundaryAnim === 'six' ? 'SIX!!' : 'FOUR!'}</div>
              </div>
            </div>,
            document.body
          )}

          <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.25rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <h3 className="gradient-text" style={{ margin: 0, fontSize: '1.2rem', marginRight: '1rem', minWidth: '100px' }}>This Over: </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {details.thisOverBalls.length === 0 ? <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>New Over Started</span> : null}
                {details.thisOverBalls.map((b, i) => {
                  let bgColor = '#1e293b'; // dot ball
                  if (b === 'W') bgColor = '#ef4444'; // wicket red
                  else if (b === '4') bgColor = '#3b82f6'; // four blue
                  else if (b === '6') bgColor = '#8b5cf6'; // six purple
                  else if (b !== '0' && b.length === 1) bgColor = '#10b981'; // runs green
                  else if (b.length > 1) bgColor = '#f59e0b'; // extras warning
                  
                  return (
                    <div key={i} style={{ 
                      flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgColor, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', 
                      fontSize: b.length > 3 ? '0.7rem' : b.length > 2 ? '0.8rem' : '1.1rem',
                      lineHeight: 1, padding: '2px', boxSizing: 'border-box', overflow: 'hidden', textAlign: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.1)'
                    }}>
                      {b}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#94a3b8', marginRight: '1rem', minWidth: '100px' }}>Recent: </h3>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {details.recentBalls.length === 0 ? <span style={{ color: '#64748b', fontSize: '0.9rem' }}>No recent balls</span> : null}
                {details.recentBalls.map((b, i) => {
                  let bgColor = 'rgba(255,255,255,0.05)'; // default muted
                  let color = '#94a3b8';
                  if (b === 'W') { bgColor = 'rgba(239, 68, 68, 0.2)'; color = '#ef4444'; }
                  else if (b === '4') { bgColor = 'rgba(59, 130, 246, 0.2)'; color = '#3b82f6'; }
                  else if (b === '6') { bgColor = 'rgba(139, 92, 246, 0.2)'; color = '#8b5cf6'; }
                  else if (b !== '0' && b.length === 1) { bgColor = 'rgba(16, 185, 129, 0.2)'; color = '#10b981'; }
                  else if (b.length > 1) { bgColor = 'rgba(245, 158, 11, 0.2)'; color = '#f59e0b'; }
                  
                  return (
                    <div key={i} style={{ 
                      flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: bgColor, color: color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', 
                      fontSize: b.length > 3 ? '0.55rem' : b.length > 2 ? '0.65rem' : '0.9rem',
                      lineHeight: 1, padding: '2px', boxSizing: 'border-box', overflow: 'hidden', textAlign: 'center',
                      border: `1px solid ${color}40`
                    }}>
                      {b}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </AnimatedSection>
      );
    };


  return (
    <div className="dashboard-wrapper" style={{ paddingBottom: '4rem' }}>
      <SEO 
        title="Live Match Score & Commentary" 
        description="Real-time ball-by-ball commentary, live scores, and detailed statistics for the Siddha Premier League (SPL). Stay updated with every delivery."
      />

      
      <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
        
        {/* MATCH SELECTOR IF MULTIPLE */}
        {liveMatches.length > 1 && (
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            {liveMatches.map(m => (
              <button 
                key={m.id}
                onClick={() => setSelectedMatchId(m.id!)}
                className={`btn ${selectedMatchId === m.id ? 'btn-primary' : ''}`}
                style={{ whiteSpace: 'nowrap', borderRadius: '30px', border: selectedMatchId !== m.id ? '1px solid var(--glass-border)' : 'none', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                {m.teamA.teamName} vs {m.teamB.teamName}
              </button>
            ))}
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingTop: '0.1rem', paddingBottom: '0.4rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {['Live', '1st Innings', '2nd Innings', 'Playing XI', 'Match Info'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ flexShrink: 0, borderRadius: '20px', padding: '0.3rem 0.8rem', fontSize: '0.85rem', minHeight: '32px', lineHeight: '1' }}>
              {tab}
            </button>
          ))}
        </div>

      {activeTab === 'Live' && (
      <>
      {/* SECTION 1: LIVE HERO SCOREBOARD */}
      <div className="parallax-hero fade-in" style={{ 
        minHeight: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', paddingTop: '0.4rem', paddingBottom: '1rem',
        borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem', width: '100%', maxWidth: '800px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', width: '100%', zIndex: 10 }}>
            {details.match.status === 'COMPLETED' ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.3rem 0.75rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                MATCH COMPLETED
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.3rem 0.75rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                <Circle size={8} className="animate-pulse" style={{ fill: '#ef4444', marginRight: '6px' }} /> LIVE
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
             <img src={details.match.teamA.teamLogo || getRandomLogo(details.match.teamA.id || 0)} alt={details.match.teamA.teamName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
             <h3 style={{ fontSize: '1rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
               {details.match.teamA.teamName} vs {details.match.teamB.teamName}
             </h3>
             <img src={details.match.teamB.teamLogo || getRandomLogo(details.match.teamB.id || 0)} alt={details.match.teamB.teamName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          </div>

          {details.match.tossWinner && details.match.tossDecision && (
             <div style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1rem', fontStyle: 'italic' }}>
               {details.match.tossWinner.teamName} won the toss and elected to {details.match.tossDecision.toLowerCase().replace('batting', 'bat').replace('bowling', 'bowl')}
             </div>
          )}

          {details.match.status === 'COMPLETED' && details.match.result && (
              <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 800 }}>
                  {details.match.result}
              </h2>
          )}

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', backdropFilter: 'blur(16px)', width: '100%', boxSizing: 'border-box', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
            
            {/* Line 1: 1st Innings Info (Conditional) */}
            {details.match.currentInnings === 2 && (
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    1st Innings ({details.match.bowlingTeam?.teamName}): <span style={{ color: '#fff', fontWeight: 'bold', marginLeft: '8px' }}>{details.match.firstInningsScore}-{details.match.firstInningsWickets}</span>
                  </div>
               </div>
            )}

            {/* Line 2: Balanced Current Score & Overs */}
            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{details.currentScore}</span>
                <span style={{ fontSize: '1.6rem', color: '#cbd5e1', fontWeight: 700 }}>- {Math.min(10, details.currentWickets)}</span>
              </div>
              <div style={{ fontSize: '1rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: '600' }}>
                {details.currentOvers} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal' }}>Overs</span>
              </div>
            </div>

            {/* Line 3: Technical Data (Batsman Left | Bowler Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
              {/* Left Column: Batsmen */}
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
                {details.currentStriker && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 'bold' }}>
                      {details.currentStriker.name} <span style={{ color: '#fbbf24' }}>*</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>
                      {details.strikerRuns}<span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '2px' }}>({details.strikerBalls})</span>
                    </div>
                  </div>
                )}
                {details.currentNonStriker && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                      {details.currentNonStriker.name}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      {details.nonStrikerRuns}<span style={{ fontSize: '0.75rem', color: '#475569', marginLeft: '2px' }}>({details.nonStrikerBalls})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Bowler (Removed "Bowling" Label) */}
              <div style={{ textAlign: 'right' }}>
                {details.currentBowler && (
                  <>
                    <div style={{ fontSize: '0.95rem', color: '#fbbf24', fontWeight: 'bold', marginBottom: '2px' }}>{details.currentBowler.name}</div>
                    <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>
                      {details.bowlerWickets}-{details.bowlerRuns} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal' }}>({details.bowlerOvers})</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Line 4: Unified Analytical Footer (Innings Conditional) */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', gap: '4px' }}>
              {details.match.currentInnings === 2 ? (
                <>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>CRR</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>{details.currentRunRate.toFixed(2)}</div>
                  </div>
                  <div style={{ height: '24px', width: '1px', background: 'rgba(16, 185, 129, 0.3)' }}></div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '2px' }}>REQ</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fbbf24' }}>{details.requiredRunRate?.toFixed(2)}</div>
                  </div>
                  <div style={{ height: '24px', width: '1px', background: 'rgba(16, 185, 129, 0.3)' }}></div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Target</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>{details.targetScore}</div>
                  </div>
                </>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', fontWeight: 'bold', opacity: 0.8 }}>Projected Score</div>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '4px' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap', marginBottom: '2px' }}>at {details.currentRunRate.toFixed(1)} RR</div>
                      <div style={{ fontSize: '1rem', fontWeight: '900', color: '#3b82f6' }}>{Math.round(details.currentRunRate * (details.match.overs || 20))}</div>
                    </div>
                    <div style={{ height: '20px', width: '1px', background: 'rgba(59, 130, 246, 0.2)' }}></div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap', marginBottom: '2px' }}>at {(details.currentRunRate + 2).toFixed(1)}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>{Math.round((details.currentRunRate + 2) * (details.match.overs || 20))}</div>
                    </div>
                    <div style={{ height: '20px', width: '1px', background: 'rgba(59, 130, 246, 0.2)' }}></div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap', marginBottom: '2px' }}>at {(details.currentRunRate + 4).toFixed(1)}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>{Math.round((details.currentRunRate + 4) * (details.match.overs || 20))}</div>
                    </div>
                    <div style={{ height: '20px', width: '1px', background: 'rgba(59, 130, 246, 0.2)' }}></div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap', marginBottom: '2px' }}>at {(details.currentRunRate + 6).toFixed(1)}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>{Math.round((details.currentRunRate + 6) * (details.match.overs || 20))}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {renderTimeline()}
      </>
      )}

        {/* TAB: Match Info */}
        {activeTab === 'Match Info' && (
          <AnimatedSection>
            <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', marginBottom: '2rem' }}>
               <h3 className="gradient-text" style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Match Information</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: '#94a3b8' }}>Tournament</span>
                     <span>Cricket Tournament League</span>
                  </div>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '0' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: '#94a3b8' }}>Format</span>
                     <span>{details.match.overs} Overs</span>
                  </div>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '0' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: '#94a3b8' }}>Toss</span>
                     <span>{details.match.tossWinner?.teamName || 'TBA'} {details.match.tossDecision ? `(${details.match.tossDecision})` : ''}</span>
                  </div>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '0' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: '#94a3b8' }}>Date & Time</span>
                     <span>{new Date(details.match.matchDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '0' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: '#94a3b8' }}>{details.match.teamA.teamName} Captain</span>
                     <span>{details.match.playingXiTeamA?.find(p => p.isCaptain)?.name || 'TBA'}</span>
                  </div>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '0' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: '#94a3b8' }}>{details.match.teamB.teamName} Captain</span>
                     <span>{details.match.playingXiTeamB?.find(p => p.isCaptain)?.name || 'TBA'}</span>
                  </div>
               </div>
            </div>
          </AnimatedSection>
        )}

        {/* TAB: Playing XI */}
        {activeTab === 'Playing XI' && (details.match.playingXiTeamA?.length || details.match.playingXiTeamB?.length) ? (
          <AnimatedSection>
            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
              <h3 className="gradient-text" style={{ margin: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>Playing XI</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                 <div>
                    <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{details.match.teamA.teamName}</h4>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {details.match.playingXiTeamA?.map((p: Player) => (
                         <li key={p.id}>• {p.name} {p.isCaptain ? '(C)' : ''} {p.isViceCaptain ? '(VC)' : ''} {p.role === 'WICKETKEEPER' ? '(WK)' : ''}</li>
                       ))}
                       {(!details.match.playingXiTeamA || details.match.playingXiTeamA.length === 0) && <li style={{color: '#64748b'}}>Not announced</li>}
                    </ul>
                 </div>
                 <div>
                    <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{details.match.teamB.teamName}</h4>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {details.match.playingXiTeamB?.map((p: Player) => (
                         <li key={p.id}>• {p.name} {p.isCaptain ? '(C)' : ''} {p.isViceCaptain ? '(VC)' : ''} {p.role === 'WICKETKEEPER' ? '(WK)' : ''}</li>
                       ))}
                       {(!details.match.playingXiTeamB || details.match.playingXiTeamB.length === 0) && <li style={{color: '#64748b'}}>Not announced</li>}
                    </ul>
                 </div>
              </div>
            </div>
          </AnimatedSection>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '100%' }}>
          
          {/* TAB: 1st Innings */}
          {activeTab === '1st Innings' && firstInningsBatting.length > 0 && (
            <div style={{ marginBottom: '1rem', opacity: 0.8, width: '100%', maxWidth: '100%' }}>
                <AnimatedSection>
                    <div className="glass-panel" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
                        <h3 className="gradient-text" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.2rem)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span>1st Innings - {details.match.currentInnings === 2 ? details.match.bowlingTeam?.teamName : details.match.battingTeam?.teamName} Batting</span>

                            {details.targetScore ? <span>Total: {details.targetScore - 1}</span> : null}
                        </h3>
                        <div style={{ overflowX: 'auto', width: '100%' }}>
                          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '400px' }}>
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
                                {firstInningsBatting.map(card => (
                                    <tr key={card.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.5rem', color: '#fff' }}>{card.player.name} {card.howOut === 'not out' ? '*' : ''}</td>
                                        <td data-label="Status" style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>{card.howOut}</td>
                                        <td data-label="R" style={{ textAlign: 'center', fontWeight: 'bold' }}>{card.runs}</td>
                                        <td data-label="B" style={{ textAlign: 'center' }}>{card.balls}</td>
                                        <td data-label="4s" style={{ textAlign: 'center' }}>{card.fours}</td>
                                        <td data-label="6s" style={{ textAlign: 'center' }}>{card.sixes}</td>
                                        <td data-label="SR" style={{ textAlign: 'right', paddingRight: '0.5rem' }}>{card.balls > 0 ? ((card.runs / card.balls) * 100).toFixed(1) : '0.0'}</td>
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
                                {firstInningsBowling.map(card => (
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
                    </div>
                </AnimatedSection>
            </div>
          )}

          {/* TAB: 2nd Innings */}
          {activeTab === '2nd Innings' && (
             details.match.currentInnings === 1 ? (
                <AnimatedSection>
                  <div className="glass-panel text-center" style={{ padding: '3rem 1rem', color: '#cbd5e1', fontSize: '1.2rem' }}>
                     Second innings yet to begin.
                  </div>
                </AnimatedSection>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <AnimatedSection>
                    <div className="glass-panel hover-lift" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
                      <h3 className="gradient-text" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.4rem)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span>2nd Innings - {currentBattingTeam?.teamName} Batting</span>
                        <span>{details.currentScore}-{details.currentWickets} ({details.currentOvers})</span>
                      </h3>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '400px' }}>
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
                  {secondInningsBatting.map(card => {
                      const isStriker = details.currentStriker?.id === card.player.id;
                      const isNonStriker = details.currentNonStriker?.id === card.player.id;
                      const isAtCrease = isStriker || isNonStriker;
                      
                      return (
                        <tr key={card.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isAtCrease ? 'rgba(56, 189, 248, 0.05)' : 'transparent' }}>
                          <td style={{ padding: '0.8rem 0.5rem', fontWeight: isAtCrease ? 'bold' : 'normal', color: isAtCrease ? 'var(--primary)' : '#fff' }}>
                            {card.player.name} {isStriker ? '*' : ''}
                          </td>
                          <td data-label="Status" style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            {card.howOut}
                          </td>
                          <td data-label="R" style={{ textAlign: 'center', fontWeight: 'bold' }}>{card.runs}</td>
                          <td data-label="B" style={{ textAlign: 'center' }}>{card.balls}</td>
                          <td data-label="4s" style={{ textAlign: 'center' }}>{card.fours}</td>
                          <td data-label="6s" style={{ textAlign: 'center' }}>{card.sixes}</td>
                          <td data-label="SR" style={{ textAlign: 'right', paddingRight: '0.5rem' }}>{card.balls > 0 ? ((card.runs / card.balls) * 100).toFixed(1) : '0.0'}</td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
             </div>

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
            <div className="glass-panel hover-lift" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
              <h3 className="gradient-text" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.4rem)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>Bowling</h3>
              <div style={{ overflowX: 'auto', width: '100%' }}>
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
                  {secondInningsBowling.map(card => {
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
            </div>
          </AnimatedSection>
         </div>
         ))}

        </div>


      </div>
    </div>
  );
};

export default LiveMatch;
