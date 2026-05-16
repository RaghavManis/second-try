import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { TeamService, MatchService, PlayerService, PointsService, MatchScoringService } from '../services/api';
import { Users, Calendar, Trophy, ArrowRight, Shield, MapPin, Clock, Star, Edit2, Check, X, Crown, Activity } from 'lucide-react';
import type { Team, Match, Player, PointsTableEntry } from '../types';
import { AnimatedSection } from '../components/AnimatedSection';
import { AutoScrollContainer } from '../components/AutoScrollContainer';
import SEO from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ teams: 0, matches: 0, completedMatches: 0 });

  // Preview Data State
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [standings, setStandings] = useState<PointsTableEntry[]>([]);
  
  // Tournament Champion & POTS
  const [allPlayersList, setAllPlayersList] = useState<Player[]>([]);
  const [finalMatch, setFinalMatch] = useState<Match | null>(null);
  const [isEditingPots, setIsEditingPots] = useState(false);
  const [newPotsId, setNewPotsId] = useState<number | ''>('');
  const [isUpdatingPots, setIsUpdatingPots] = useState(false);
  
  const [showPotsPerformance, setShowPotsPerformance] = useState(false);
  const [potsStats, setPotsStats] = useState<any>(null);
  const [loadingPotsStats, setLoadingPotsStats] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [teamsRes, matchesRes, playersRes, pointsRes, perfRes] = await Promise.all([
          TeamService.getAllTeams(),
          MatchService.getAllMatches(),
          PlayerService.getAllPlayers(),
          PointsService.getPointsTable(),
          PointsService.getTopPerformers()
        ]);

        const allMatches = Array.isArray(matchesRes.data) ? matchesRes.data : [];
        const completed = allMatches.filter((m: Match) => m.status === 'COMPLETED').length;
        const tournamentTeams = Array.isArray(teamsRes.data) ? teamsRes.data.filter((t: Team) => t.teamType === 'TOURNAMENT' || t.teamType == null) : [];

        setStats({
          teams: tournamentTeams.length,
          matches: allMatches.length,
          completedMatches: completed,
        });

        const allPlayers = Array.isArray(playersRes.data) ? playersRes.data : [];
        setAllPlayersList(allPlayers);
        
        const theFinal = allMatches.find(m => m.matchType === 'FINAL');
        setFinalMatch(theFinal || null);

        // Slice previews
        setTeams(tournamentTeams); // all tournament teams
        setRecentMatches(allMatches.slice(0, 5)); // up to 5 recent matches
        setStandings((pointsRes.data.TOURNAMENT || []).slice(0, 4)); // top 4 standings

        // Compute Star Athletes (Shuffled from both Tournament and Practice)
        const tourneyTopScorers = perfRes.data.TOURNAMENT?.topRunScorers || [];
        const tourneyTopWickets = perfRes.data.TOURNAMENT?.topWicketTakers || [];
        const pracTopScorers = perfRes.data.PRACTICE?.topRunScorers || [];
        const pracTopWickets = perfRes.data.PRACTICE?.topWicketTakers || [];

        // We only have player names in the perf array. We map names back to Player objects.
        const perfNames = new Set([
          ...tourneyTopScorers.map((p: any) => p.playerName),
          ...tourneyTopWickets.map((p: any) => p.playerName),
          ...pracTopScorers.map((p: any) => p.playerName),
          ...pracTopWickets.map((p: any) => p.playerName)
        ]);

        let starSubset = allPlayers.filter(p => perfNames.has(p.name));
        // Fallback: if no matches or no perf data, just take the first 8
        if (starSubset.length === 0) starSubset = allPlayers.slice(0, 8);

        // Shuffle the stars array
        for (let i = starSubset.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [starSubset[i], starSubset[j]] = [starSubset[j], starSubset[i]];
        }

        setPlayers(starSubset.slice(0, 8)); // lock to max 8 random stars

      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleViewPotsPerformance = async () => {
    if (potsStats) {
      setShowPotsPerformance(true);
      return;
    }
    if (!finalMatch?.playerOfTheSeries?.id) return;
    try {
      setLoadingPotsStats(true);
      const res = await PlayerService.getPlayerById(finalMatch.playerOfTheSeries.id);
      setPotsStats(res.data.tournamentStats || {});
      setShowPotsPerformance(true);
    } catch (err) {
      toast.error('Failed to load performance data');
    } finally {
      setLoadingPotsStats(false);
    }
  };

  const handleUpdatePots = async () => {
    if (!newPotsId || !finalMatch?.id) return;
    try {
      setIsUpdatingPots(true);
      await MatchScoringService.updatePlayerOfTheSeries(finalMatch.id, Number(newPotsId));
      toast.success('Player of the Series updated!');
      setIsEditingPots(false);
      
      // Update local state to reflect the change immediately
      const selectedPlayer = allPlayersList.find(p => p.id === Number(newPotsId));
      if (selectedPlayer) {
        setFinalMatch(prev => prev ? { ...prev, playerOfTheSeries: selectedPlayer } : null);
        setPotsStats(null); // Reset stats when player changes
        setShowPotsPerformance(false);
      }
    } catch (err) {
      toast.error('Failed to update Player of the Series');
    } finally {
      setIsUpdatingPots(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '#3b82f6';
      case 'ONGOING': return '#f59e0b';
      case 'COMPLETED': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'BATSMAN': return '#3b82f6';
      case 'BOWLER': return '#ef4444';
      case 'ALL_ROUNDER': return '#10b981';
      case 'WICKETKEEPER': return '#f59e0b';
      default: return '#8b5cf6';
    }
  };

  const getRandomAvatar = (id: number) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`;
  const getRandomLogo = (id: number) => `https://api.dicebear.com/7.x/identicon/svg?seed=Team${id}&backgroundColor=1e293b`;

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading Dashboard Experience...</div>;

  return (
    <div className="dashboard-wrapper">
      <SEO 
        canonicalUrl="https://splcricket.live"
      />


      {/* SECTION 1: PARALLAX HERO */}
      <div className="parallax-hero" style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundAttachment: 'fixed',
        backgroundImage: 'url("/dashboard-hero.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        marginTop: '0', 
        paddingTop: '80px'
      }}>
        <div className="hero-overlay" style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%)',
          zIndex: 1 
        }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem', position: 'relative', width: '100%' }}>
          
          <div style={{ display: 'inline-block', marginBottom: '1.5rem', padding: '0.5rem 1.5rem', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '30px', backdropFilter: 'blur(10px)', color: '#fff', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Official Tournament Portal
          </div>
          
          <h1 className="spl-title" style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 5rem)', 
            fontWeight: 900, 
            marginBottom: '0.5rem', 
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 20px 40px rgba(0,0,0,0.8)',
            position: 'relative',
            whiteSpace: 'pre-line'
          }}>
            <span style={{ display: 'block' }}>SIDDHA PREMIER LEAGUE (SPL),</span><span className="league-text" style={{ fontSize: '0.7em', display: 'block' }}>MADHUBAN MAU</span>
          </h1>
          
          <h2 style={{
             color: 'var(--primary)',
             fontSize: 'clamp(1.5rem, 4vw, 2.8rem)',
             fontWeight: 800,
             marginBottom: '2rem',
             textTransform: 'uppercase',
             letterSpacing: '0.1em',
             textShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
          }}>Season 2026</h2>

          <p style={{ 
            color: '#f8fafc', 
            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', 
            fontWeight: 400,
            maxWidth: '800px', 
            margin: '0 auto 3rem auto', 
            lineHeight: 1.6,
            textShadow: '0 4px 15px rgba(0,0,0,0.9)'
          }}>
            Experience the most electrifying cricket tournament. Track live fixtures, witness the rise of star athletes, and feel the adrenaline in real-time.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
             <button onClick={() => document.getElementById('action-center')?.scrollIntoView({ behavior: 'smooth' })} className="btn hover-lift" style={{ 
               padding: '1.2rem 3.5rem', 
               fontSize: '1.2rem', 
               fontWeight: 700,
               borderRadius: '50px',
               background: 'linear-gradient(135deg, var(--primary) 0%, #047857 100%)',
               color: '#fff',
               boxShadow: '0 10px 30px rgba(16, 185, 129, 0.5)',
               border: 'none',
               textTransform: 'uppercase',
               letterSpacing: '1px',
               display: 'inline-flex',
               alignItems: 'center',
               gap: '0.75rem'
             }}>
               Live Action <ArrowRight size={22} />
             </button>
             <button onClick={() => document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' })} className="btn hover-lift" style={{ 
               padding: '1.2rem 3.5rem', 
               fontSize: '1.2rem', 
               fontWeight: 700,
               borderRadius: '50px',
               background: 'rgba(15, 23, 42, 0.6)',
               color: '#fff',
               border: '2px solid rgba(255,255,255,0.2)',
               backdropFilter: 'blur(10px)',
               textTransform: 'uppercase',
               letterSpacing: '1px'
             }}>
               View Stats
             </button>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">

        {/* TOURNAMENT CHAMPION & POTS PRESENTATION */}
        {finalMatch?.status === 'COMPLETED' && (
          <AnimatedSection className="bg-section-5">
             <div style={{ padding: '3rem 1rem', background: 'var(--surface-color)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                   <Crown size={36} color="#f59e0b" style={{ margin: '0 auto 0.5rem auto' }} className="animate-pulse" />
                   <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>Season 2026 Results</h2>
                   <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>The conclusion of an epic tournament.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', justifyContent: 'center' }}>
                   
                   {/* CHAMPION CARD */}
                   <div className="hover-lift" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(15,23,42,0.9) 100%)', borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center', border: '1px solid rgba(245,158,11,0.4)', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 30px rgba(0,0,0,0.5)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'rgba(245,158,11,0.2)', borderRadius: '50%', filter: 'blur(25px)' }}></div>
                      <Trophy size={48} color="#fcd34d" style={{ margin: '0 auto 1rem auto', filter: 'drop-shadow(0 0 12px rgba(245,158,11,0.8))' }} />
                      <h3 style={{ fontSize: '1rem', color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem', fontWeight: 700 }}>Tournament Champions</h3>
                      
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <div style={{ position: 'absolute', inset: -5, background: 'linear-gradient(45deg, #f59e0b, #fcd34d, #f59e0b)', borderRadius: '50%', zIndex: 0, opacity: 0.5, filter: 'blur(5px)' }} className="animate-pulse"></div>
                        <img src={finalMatch.winnerTeam?.teamLogo || getRandomLogo(finalMatch.winnerTeam?.id || 1)} alt="Champion Logo" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '3px solid #fcd34d', margin: '0 auto 1rem auto', objectFit: 'cover', background: '#fff', padding: '5px', position: 'relative', zIndex: 1 }} />
                      </div>

                      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{finalMatch.winnerTeam?.teamName || 'N/A'}</h2>
                      <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(245,158,11,0.25)', borderRadius: '20px', color: '#fde68a', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 0 10px rgba(245,158,11,0.2)' }}>Winner of SPL 2026</div>
                   </div>

                   {/* PLAYER OF THE SERIES CARD */}
                   <div className="hover-lift" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(15,23,42,0.9) 100%)', borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center', border: '1px solid rgba(16,185,129,0.4)', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 30px rgba(0,0,0,0.5)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                      <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '120px', height: '120px', background: 'rgba(16,185,129,0.2)', borderRadius: '50%', filter: 'blur(25px)' }}></div>
                      <Star size={48} color="#6ee7b7" style={{ margin: '0 auto 1rem auto', filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.8))' }} />
                      <h3 style={{ fontSize: '1rem', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem', fontWeight: 700 }}>Player of the Series</h3>
                      
                      {finalMatch.playerOfTheSeries ? (
                         <>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                               <div style={{ position: 'absolute', inset: -5, background: 'linear-gradient(45deg, #10b981, #6ee7b7, #10b981)', borderRadius: '50%', zIndex: 0, opacity: 0.5, filter: 'blur(5px)' }} className="animate-pulse"></div>
                               <img src={finalMatch.playerOfTheSeries.playerImage || getRandomAvatar(finalMatch.playerOfTheSeries.id || 1)} alt="Player of the Series" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '3px solid #6ee7b7', margin: '0 auto 1rem auto', objectFit: 'cover', background: 'var(--surface-color)', position: 'relative', zIndex: 1 }} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{finalMatch.playerOfTheSeries.name}</h2>
                            <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(16,185,129,0.25)', borderRadius: '20px', color: '#a7f3d0', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 0 10px rgba(16,185,129,0.2)', marginBottom: '1rem' }}>MVP of SPL 2026</div>

                            <div style={{ position: 'relative', zIndex: 10 }}>
                               {showPotsPerformance && potsStats ? (
                                  <div className="animate-slide-up" style={{ textAlign: 'left', background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(15,23,42,0.8) 100%)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.4)', marginBottom: '1rem', color: '#fff', fontSize: '0.9rem', boxShadow: 'inset 0 0 20px rgba(16,185,129,0.1)' }}>
                                      <h4 style={{ color: '#6ee7b7', borderBottom: '1px solid rgba(16,185,129,0.3)', paddingBottom: '0.5rem', marginBottom: '0.8rem', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}><Activity size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Tournament Stats</h4>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                         <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Matches</span> <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{potsStats.matchesPlayed || 0}</strong></div>
                                         <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Runs</span> <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{potsStats.runsScored || 0}</strong></div>
                                         <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Wickets</span> <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{potsStats.wickets || 0}</strong></div>
                                         <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Strike Rate</span> <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{potsStats.ballsFaced > 0 ? ((potsStats.runsScored / potsStats.ballsFaced) * 100).toFixed(1) : '0.0'}</strong></div>
                                         <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>4s / 6s</span> <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{potsStats.fours || 0} / {potsStats.sixes || 0}</strong></div>
                                         <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Economy</span> <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{potsStats.oversBowled > 0 ? (potsStats.runsConceded / potsStats.oversBowled).toFixed(1) : '0.0'}</strong></div>
                                      </div>
                                      <button className="btn hover-lift" onClick={() => setShowPotsPerformance(false)} style={{ marginTop: '1rem', width: '100%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(110,231,183,0.5)', color: '#6ee7b7', padding: '0.5rem', borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s' }}>Close Stats</button>
                                  </div>
                               ) : (
                                  <button className="btn btn-outline hover-lift" onClick={handleViewPotsPerformance} disabled={loadingPotsStats} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: 'rgba(16,185,129,0.5)', color: '#6ee7b7', padding: '0.5rem 1.2rem', fontSize: '0.85rem', background: 'rgba(16,185,129,0.1)', marginBottom: '1rem', borderRadius: '30px' }}>
                                      <Activity size={14} /> {loadingPotsStats ? 'Loading...' : 'View Performance'}
                                  </button>
                               )}
                            </div>
                         </>
                      ) : (
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                            <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.3)', margin: '0 auto 1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                               <Users size={32} color="rgba(255,255,255,0.4)" />
                            </div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Not announced yet</h2>
                         </div>
                      )}

                      {isAuthenticated && (
                         <div style={{ marginTop: '1.5rem', position: 'relative', zIndex: 10 }}>
                            {isEditingPots ? (
                               <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                  <select className="form-input" value={newPotsId} onChange={(e) => setNewPotsId(Number(e.target.value))} style={{ marginBottom: '0.75rem', width: '100%', fontSize: '0.9rem', padding: '0.5rem' }}>
                                     <option value="">Select Player...</option>
                                     {allPlayersList.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                     ))}
                                  </select>
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                     <button className="btn" onClick={() => setIsEditingPots(false)} style={{ background: 'transparent', border: '1px solid #64748b', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} disabled={isUpdatingPots}><X size={14}/> Cancel</button>
                                     <button className="btn btn-primary" onClick={handleUpdatePots} disabled={!newPotsId || isUpdatingPots} style={{ background: '#10b981', color: '#000', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                        {isUpdatingPots ? 'Saving...' : <><Check size={14}/> Save MVP</>}
                                     </button>
                                  </div>
                               </div>
                            ) : (
                               <button className="btn btn-outline hover-lift" onClick={() => { setIsEditingPots(true); setNewPotsId(finalMatch.playerOfTheSeries?.id || ''); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: '#10b981', color: '#10b981', padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(16,185,129,0.1)' }}>
                                  <Edit2 size={14} /> {finalMatch.playerOfTheSeries ? 'Change MVP' : 'Select MVP'}
                               </button>
                            )}
                         </div>
                      )}
                   </div>

                </div>
             </div>
           </div>
          </AnimatedSection>
        )}

        {/* SECTION SEO: TOURNAMENT INFO & INTERNAL LINKS */}
        <AnimatedSection id="seo-content-section" className="bg-section-6">
          <div style={{ padding: '3rem 1.5rem', background: 'var(--bg-color)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>Welcome to the Siddha Premier League (SPL)</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.1rem', marginBottom: '2rem' }}>
              The <strong>Siddha Premier League</strong> (SPL) is the most celebrated <strong>village cricket league in Siddha Ahilaspur</strong>, bringing together the finest talent from the region. Experience high-octane <strong>Madhuban Mau cricket tournament</strong> action, live scores, and thrilling match highlights.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <NavLink to="/matches" className="seo-internal-link" style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#e2e8f0', textDecoration: 'none', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>Live SPL Matches</NavLink>
              <NavLink to="/teams" className="seo-internal-link" style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#e2e8f0', textDecoration: 'none', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>Siddha League Teams</NavLink>
              <NavLink to="/points-table" className="seo-internal-link" style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#e2e8f0', textDecoration: 'none', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>SPL Points Table</NavLink>
              <NavLink to="/highlights" className="seo-internal-link" style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#e2e8f0', textDecoration: 'none', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>Tournament Highlights</NavLink>
            </div>
            
            <style>{`
              .seo-internal-link:hover {
                background: rgba(255,255,255,0.1) !important;
                border-color: var(--primary) !important;
                color: var(--primary) !important;
              }
            `}</style>
            </div>
          </div>
        </AnimatedSection>

        {/* SECTION 2: TOURNAMENT STATS */}
        <AnimatedSection id="stats-section" className="bg-section-1 theme-dark">
          <h2 className="scroll-section-title gradient-text">Tournament at a Glance</h2>
          <p className="scroll-section-subtitle">Key metrics driving the competition right now.</p>

          <div className="dashboard-grid">
            <div className="stat-card glass-panel hover-lift">
              <div className="stat-icon-wrapper blue"><Users size={24} /></div>
              <div className="stat-content">
                <h3>Registered Teams</h3>
                <p className="stat-number">{stats.teams}</p>
              </div>
            </div>

            <div className="stat-card glass-panel hover-lift">
              <div className="stat-icon-wrapper green"><Calendar size={24} /></div>
              <div className="stat-content">
                <h3>Total Matches</h3>
                <p className="stat-number">{stats.matches}</p>
              </div>
            </div>

            <div className="stat-card glass-panel hover-lift">
              <div className="stat-icon-wrapper purple"><Trophy size={24} /></div>
              <div className="stat-content">
                <h3>Completed Matches</h3>
                <p className="stat-number">{stats.completedMatches}</p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* SECTION 3: RECENT MATCHES CAROUSEL */}
        {recentMatches.length > 0 && (
          <AnimatedSection id="action-center" className="bg-section-2 theme-light">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
              <div>
                <h2 className="scroll-section-title gradient-text" style={{ marginBottom: 0, textAlign: 'left' }}>Action Center</h2>
                <p className="scroll-section-subtitle" style={{ marginBottom: 0, textAlign: 'left' }}>Latest and upcoming fixtures.</p>
              </div>
              <NavLink to="/matches" className="btn btn-secondary hover-lift">View All <ArrowRight size={16} /></NavLink>
            </div>

            <AutoScrollContainer className="horizontal-scroller">
              {recentMatches.map(match => {
                let team1 = match.teamA;
                let team2 = match.teamB;
                let team1Info = null;
                let team2Info = null;

                if (match.status !== 'SCHEDULED' && match.battingTeam && match.bowlingTeam) {
                  if (match.currentInnings === 1) {
                    team1 = match.battingTeam;
                    team2 = match.bowlingTeam;
                    team1Info = `${match.currentScore}/${match.currentWickets}`;
                    team2Info = `Yet to bat`;
                  } else {
                    team1 = match.bowlingTeam;
                    team2 = match.battingTeam;
                    if (match.firstInningsScore !== undefined && match.firstInningsWickets !== undefined) {
                      team1Info = `${match.firstInningsScore}/${match.firstInningsWickets}`;
                    } else if (match.targetScore !== undefined) {
                      team1Info = `${match.targetScore - 1}`;
                    }
                    team2Info = `${match.currentScore}/${match.currentWickets}`;
                  }
                }

                return (
                  <div key={match.id} className="glass-panel hover-lift" style={{ 
                      padding: 0, 
                      position: 'relative', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      minWidth: '340px', 
                      borderTop: `4px solid ${getStatusColor(match.status)}`,
                      background: 'linear-gradient(145deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      overflow: 'hidden'
                   }}>
                    <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        <Clock size={16} color="var(--primary)" /> {new Date(match.matchDateTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {match.matchType === 'FINAL' && (
                          <div style={{
                            background: '#ef444420', color: '#ef4444', border: '1px solid #ef444450',
                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase'
                          }}>
                            FINAL
                          </div>
                        )}
                        <div style={{
                          background: `${getStatusColor(match.status)}15`, color: getStatusColor(match.status),
                          padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase'
                        }}>
                          {match.status}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem 1.5rem', position: 'relative' }}>
                      <div style={{ textAlign: 'center', width: '40%', zIndex: 2 }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'var(--primary)', filter: 'blur(20px)', opacity: 0.2, borderRadius: '50%' }}></div>
                          <img src={team1.teamLogo || getRandomLogo(team1.id || 0)} alt={team1.teamName} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', position: 'relative', border: '2px solid rgba(255,255,255,0.1)' }} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.75rem', marginBottom: '0.25rem', color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>{team1.teamName}</h3>
                        {(match.status === 'COMPLETED' || match.status === 'ONGOING') && team1Info && (
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{team1Info}</div>
                        )}
                      </div>
                      
                      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                          VS
                        </div>
                      </div>

                      <div style={{ textAlign: 'center', width: '40%', zIndex: 2 }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                           <div style={{ position: 'absolute', inset: 0, background: 'var(--primary)', filter: 'blur(20px)', opacity: 0.2, borderRadius: '50%' }}></div>
                           <img src={team2.teamLogo || getRandomLogo(team2.id || 0)} alt={team2.teamName} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', position: 'relative', border: '2px solid rgba(255,255,255,0.1)' }} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.75rem', marginBottom: '0.25rem', color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>{team2.teamName}</h3>
                        {(match.status === 'COMPLETED' || match.status === 'ONGOING') && team2Info && (
                           <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{team2Info}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                      {match.status === 'COMPLETED' && match.result ? (
                        <div style={{ color: '#34d399', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{match.result}</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                          <MapPin size={14} color="var(--primary)" /> {match.overs} Overs Match • {match.matchType === 'TOURNAMENT' ? 'League' : match.matchType === 'FINAL' ? 'Final' : 'Practice'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </AutoScrollContainer>
          </AnimatedSection>
        )}

        {/* SECTION 4: TEAMS OVERVIEW */}
        {teams.length > 0 && (
          <AnimatedSection className="bg-section-3 theme-dark">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
              <div>
                <h2 className="scroll-section-title gradient-text" style={{ marginBottom: 0, textAlign: 'left' }}>The Contenders</h2>
                <p className="scroll-section-subtitle" style={{ marginBottom: 0, textAlign: 'left' }}>Franchises battling for the cup.</p>
              </div>
              <NavLink to="/teams" className="btn btn-secondary hover-lift">View All <ArrowRight size={16} /></NavLink>
            </div>

            <AutoScrollContainer className="horizontal-scroller">
              {teams.map(team => (
                <div key={team.id} className="glass-panel hover-lift" style={{ 
                    padding: '1.5rem', 
                    cursor: 'pointer', 
                    position: 'relative', 
                    overflow: 'hidden', 
                    minWidth: '280px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.8) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)'
                 }} onClick={() => navigate(`/teams/${team.id}`)}>
                  <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, pointerEvents: 'none', transform: 'rotate(-15deg)' }}>
                     <img src={team.teamLogo || getRandomLogo(team.id || 0)} alt="watermark" style={{ width: '150px', height: '150px', objectFit: 'cover' }} />
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '68px', height: '68px', borderRadius: '16px', padding: '3px', background: 'linear-gradient(135deg, var(--primary), #3b82f6)', boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}>
                      <img src={team.teamLogo || getRandomLogo(team.id || 0)} alt={team.teamName} style={{ width: '100%', height: '100%', borderRadius: '14px', objectFit: 'cover', background: 'var(--bg-color)' }} />
                    </div>
                  </div>

                  <div style={{ zIndex: 1, paddingRight: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#fff', letterSpacing: '-0.01em' }}>{team.teamName}</h3>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>
                      <Shield size={12} color="var(--primary)" /> {team.coachName}
                    </div>
                  </div>
                </div>
              ))}
            </AutoScrollContainer>
          </AnimatedSection>
        )}

        {/* SECTION 5: STAR PLAYERS */}
        {players.length > 0 && (
          <AnimatedSection className="bg-section-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
              <div>
                <h2 className="scroll-section-title gradient-text" style={{ marginBottom: 0, textAlign: 'left' }}>Star Athletes</h2>
                <p className="scroll-section-subtitle" style={{ marginBottom: 0, textAlign: 'left' }}>The talent lighting up the tournament.</p>
              </div>
              <NavLink to="/players" className="btn btn-secondary hover-lift">View All <ArrowRight size={16} /></NavLink>
            </div>

            <AutoScrollContainer className="horizontal-scroller">
              {players.map(player => (
                <div key={player.id} className="hover-lift" style={{ 
                    cursor: 'pointer', 
                    padding: '2.5rem 1.5rem 1.5rem 1.5rem', 
                    position: 'relative', 
                    marginTop: '2.5rem', 
                    minWidth: '220px',
                    borderRadius: '20px',
                    background: 'linear-gradient(180deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.8) 100%)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                 }} onClick={() => navigate(`/players/${player.id}`)}>
                  
                  <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)' }}>
                    <div style={{ position: 'absolute', inset: '-5px', background: `${getRoleColor(player.role)}`, filter: 'blur(15px)', opacity: 0.4, borderRadius: '50%' }}></div>
                    <img src={player.playerImage || getRandomAvatar(player.id || 0)} alt={player.name} style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #1e293b', background: '#1e293b', position: 'relative', zIndex: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem', marginTop: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {player.name}
                  </h3>
                  
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: getRoleColor(player.role), background: `${getRoleColor(player.role)}15`, padding: '4px 12px', borderRadius: '20px', border: `1px solid ${getRoleColor(player.role)}30` }}>
                     {player.role.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </AutoScrollContainer>
          </AnimatedSection>
        )}

        {/* SECTION 6: STANDINGS PREVIEW */}
        {standings.length > 0 && (
          <AnimatedSection className="bg-section-5">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
              <div>
                <h2 className="scroll-section-title gradient-text" style={{ marginBottom: 0, textAlign: 'left' }}>Leaderboard</h2>
                <p className="scroll-section-subtitle" style={{ marginBottom: 0, textAlign: 'left' }}>Current Top 4 Teams.</p>
              </div>
              <NavLink to="/points-table" className="btn btn-secondary hover-lift">Full Table <ArrowRight size={16} /></NavLink>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflowX: 'auto', marginBottom: '4rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>Pts</th>
                    <th>NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((pt, index) => {
                    const teamObj = teams.find(t => t.id === pt.teamId);
                    return (
                      <tr key={pt.teamId}>
                        <td className="font-bold">{index + 1}</td>
                        <td className="team-name">
                          {index === 0 && <Trophy size={16} color="#fbbf24" style={{ marginRight: '0.5rem' }} />}
                          <img src={(teamObj && teamObj.teamLogo) || getRandomLogo(pt.teamId || 0)} alt={pt.teamName} style={{ width: 24, height: 24, borderRadius: '50%', marginRight: '10px', objectFit: 'cover' }} />
                          {pt.teamName}
                        </td>
                        <td>{pt.matchesPlayed}</td>
                        <td className="text-green">{pt.wins}</td>
                        <td className="font-bold text-primary">{pt.points}</td>
                        <td>{pt.netRunRate ? pt.netRunRate.toFixed(2) : '0.00'}</td>
                      </tr>
                    )
                  }
                  )}
                </tbody>
              </table>
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
