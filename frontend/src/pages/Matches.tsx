import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { MatchService, TeamService } from '../services/api';
import type { Match, Team } from '../types';
import { CalendarPlus, MapPin, Clock, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { AnimatedSection } from '../components/AnimatedSection';
import { AutoScrollContainer } from '../components/AutoScrollContainer';
import SEO from '../components/common/SEO';


const Matches: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newMatch, setNewMatch] = useState({ 
    teamAId: '', 
    teamBId: '', 
    matchDate: '', 
    overs: 20,
    status: 'SCHEDULED' as const,
    matchType: 'TOURNAMENT' as 'TOURNAMENT' | 'PRACTICE'
  });
  


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // No-op for now unless teams fetched
  }, [newMatch.teamAId]);

  useEffect(() => {
    // No-op for now
  }, [newMatch.teamBId]);

  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes] = await Promise.all([
        MatchService.getAllMatches(),
        TeamService.getAllTeams()
      ]);
      setMatches(matchesRes.data);
      setTeams(teamsRes.data);
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (newMatch.teamAId === newMatch.teamBId) {
      toast.error("A team cannot play against itself.");
      return;
    }
    
    // Convert datetime-local string to LocalDate format (YYYY-MM-DD) expected by backend
    const dateOnly = newMatch.matchDate.split('T')[0];
    
    const teamA = teams.find(t => t.id === Number(newMatch.teamAId));
    const teamB = teams.find(t => t.id === Number(newMatch.teamBId));
    
    if (!teamA || !teamB) return;

    setIsSubmitting(true);
    try {
      const matchData = {
        teamA,
        teamB,
        matchDate: dateOnly,
        overs: newMatch.overs,
        status: newMatch.status,
        matchType: newMatch.matchType
      };

      if (editingMatchId) {
        await MatchService.updateMatch(editingMatchId, matchData as any);
        toast.success('Match updated successfully!');
      } else {
        await MatchService.scheduleMatch(matchData as any);
        toast.success('Match scheduled successfully!');
      }
      
      setShowModal(false);
      setNewMatch({ teamAId: '', teamBId: '', matchDate: '', overs: 20, status: 'SCHEDULED', matchType: 'TOURNAMENT' });
      setEditingMatchId(null);
      fetchData();
    } catch (error: any) {
      console.error(editingMatchId ? 'Failed to update match' : 'Failed to schedule match', error);
      toast.error(error.response?.data?.message || (editingMatchId ? "Failed to update match." : "Failed to schedule match."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    setEditingMatchId(match.id!);
    
    let dateStr = match.matchDate as string;
    if (dateStr && !dateStr.includes('T')) {
       dateStr = `${dateStr}T09:00`;
    }
    
    setNewMatch({ 
      teamAId: match.teamA.id!.toString(), 
      teamBId: match.teamB.id!.toString(), 
      matchDate: dateStr, 
      overs: match.overs,
      status: match.status as any,
      matchType: match.matchType as any
    });
    setShowModal(true);
  };

  const handleDeleteMatch = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this match? All related scorecards, ball events, and playing XI will be deleted permanently. This action cannot be undone.")) {
      try {
        await MatchService.deleteMatch(id);
        toast.success("Match deleted successfully!");
        fetchData();
      } catch (error: any) {
        console.error('Failed to delete match', error);
        toast.error(error.response?.data?.message || "Failed to delete match.");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'SCHEDULED': return '#3b82f6';
      case 'ONGOING': return '#f59e0b';
      case 'COMPLETED': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRandomLogo = (id: number) => `https://api.dicebear.com/7.x/identicon/svg?seed=Team${id}&backgroundColor=1e293b`;

  const MatchCard = ({ match, showActions = false, onDelete, onEdit }: { match: Match; showActions?: boolean, onDelete?: (e: React.MouseEvent, id: number) => void, onEdit?: (e: React.MouseEvent, match: Match) => void }) => {
    let team1 = match.teamA;
    let team2 = match.teamB;
    let team1Info = null;
    let team2Info = null;
    
    // Innings Order Display Logic
    if (match.status !== 'SCHEDULED' && match.battingTeam && match.bowlingTeam) {
       if (match.currentInnings === 1) {
           team1 = match.battingTeam;
           team2 = match.bowlingTeam;
           team1Info = `${match.currentScore}/${match.currentWickets}`;
           team2Info = `Yet to bat`;
       } else {
           // Innings 2 or Completed
           // The team that is CURRENTLY bowling was the batting team in Innings 1.
           // So team1 (first to bat) = bowlingTeam
           team1 = match.bowlingTeam;
           team2 = match.battingTeam;
           
           if (match.firstInningsScore !== undefined && match.firstInningsWickets !== undefined) {
               team1Info = `${match.firstInningsScore}/${match.firstInningsWickets}`;
           } else if (match.targetScore !== undefined) {
               // Fallback if data is missing
               team1Info = `${match.targetScore - 1}`;
           }
           
           team2Info = `${match.currentScore}/${match.currentWickets}`;
       }
    }

    return (
    <div className="glass-panel hover-lift" style={{ padding: '1.5rem', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10 }}>
        <div style={{ 
          background: `${getStatusColor(match.status)}20`, 
          color: getStatusColor(match.status), 
          padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
          {match.status}
        </div>
        {match.matchType === 'PRACTICE' && (
          <div style={{ background: '#8b5cf620', color: '#8b5cf6', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
            PRACTICE
          </div>
        )}
        {showActions && isAuthenticated && onEdit && match.status === 'SCHEDULED' && (
          <button 
            onClick={(e) => onEdit(e, match)}
            style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Edit Match"
          >
            <Edit size={14} />
          </button>
        )}
        {showActions && isAuthenticated && onDelete && (
          <button 
            onClick={(e) => onDelete(e, match.id!)}
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Delete Match"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <img src={team1.teamLogo || getRandomLogo(team1.id || 0)} alt={team1.teamName} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
          <h3 className="gradient-text" style={{ fontSize: '1.1rem', margin: 0 }}>{team1.teamName}</h3>
          {(match.status === 'COMPLETED' || match.status === 'ONGOING') && (
             <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff', marginTop: '0.2rem' }}>
                {team1Info}
             </div>
          )}
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '0 1rem' }}>VS</div>
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <img src={team2.teamLogo || getRandomLogo(team2.id || 0)} alt={team2.teamName} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
          <h3 className="gradient-text" style={{ fontSize: '1.1rem', margin: 0 }}>{team2.teamName}</h3>
          {(match.status === 'COMPLETED' || match.status === 'ONGOING') && (
             <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff', marginTop: '0.2rem' }}>
                {team2Info}
             </div>
          )}
        </div>
      </div>
      
      {match.status === 'COMPLETED' && match.result && (
        <div style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem', color: '#10b981', fontSize: '0.9rem', fontWeight: 'bold' }}>
          {match.result}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <Clock size={16} />
          <span>{match.matchDate}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <MapPin size={16} />
          <span>{match.overs} Overs Match</span>
        </div>
      </div>

      {showActions && isAuthenticated && (match.status === 'SCHEDULED' || match.status === 'ONGOING') && (
        <NavLink to={`/matches/${match.id}/score-live`} className={`btn ${match.status === 'ONGOING' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}>
          <Edit size={16} /> {match.status === 'ONGOING' ? 'Resume Scoring' : 'Start Scoring'}
        </NavLink>
      )}
      {showActions && match.status === 'COMPLETED' && (
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
           <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
             {match.winnerTeam ? `Winner: ${match.winnerTeam.teamName}` : 'Match Tied'}
           </div>
           <NavLink to={`/matches/${match.id}/scorecard`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
             View Scorecard
           </NavLink>
        </div>
      )}
      {!showActions && match.status === 'COMPLETED' && (
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
           <NavLink to={`/matches/${match.id}/scorecard`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
             View Scorecard
           </NavLink>
        </div>
      )}
    </div>
  );
};

  const completedOrOngoing = matches.filter(m => m.status === 'COMPLETED');
  const upcoming = matches.filter(m => m.status === 'SCHEDULED');

  return (
    <div className="dashboard-wrapper">
      <SEO 
        title="Match Fixtures & Results" 
        description="Full schedule, live results, and scorecards for every match in the Siddha Premier League (SPL). Track upcoming fixtures and historical data."
      />

      {/* SECTION 1: HERO */}
      <div className="parallax-hero" style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("/matches-bg.jpg")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '0', paddingTop: '80px'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.5) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem' }}>
          <div style={{ display: 'inline-block', marginBottom: '1rem', padding: '0.5rem 1.5rem', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '30px', backdropFilter: 'blur(10px)', color: '#fff', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Fixtures & Results
          </div>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            Tournament Matches
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: 1.6, textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}>
            Track every fixture and result of the league.
          </p>
          <button onClick={() => document.getElementById('matches-content')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary hover-lift" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', borderRadius: '30px', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)' }}>
            View Matches <Clock size={20} style={{ marginLeft: '8px' }}/>
          </button>
        </div>
      </div>

      <div id="matches-content" className="dashboard-sections">
        
        {/* SECTION 2: MATCH HIGHLIGHTS */}
        {completedOrOngoing.length > 0 && (
        <AnimatedSection className="bg-section-2 theme-light">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Match Highlights</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>Latest completed and ongoing matches.</p>
          <AutoScrollContainer className="horizontal-scroller">
            {completedOrOngoing.slice(0, 10).map(match => (
              <div key={match.id} style={{ height: '100%' }}>
                <MatchCard match={match} />
              </div>
            ))}
          </AutoScrollContainer>
        </AnimatedSection>
        )}

        {/* SECTION 3: UPCOMING FIXTURES */}
        {upcoming.length > 0 && (
        <AnimatedSection className="bg-section-3 theme-dark">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Upcoming Fixtures</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>Scheduled matches eagerly awaited.</p>
          <AutoScrollContainer className="horizontal-scroller">
            {upcoming.slice(0, 10).map(match => (
              <div key={match.id} style={{ height: '100%' }}>
                <MatchCard match={match} />
              </div>
            ))}
          </AutoScrollContainer>
        </AnimatedSection>
        )}

        {/* SECTION 4: ALL MATCHES */}
        <AnimatedSection className="bg-section-4 theme-light">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="scroll-section-title gradient-text" style={{ marginBottom: 0, textAlign: 'left' }}>All Matches</h2>
              <p className="scroll-section-subtitle" style={{ marginBottom: 0, textAlign: 'left' }}>Full management directory.</p>
            </div>
            {isAuthenticated && (
              <button className="btn btn-primary hover-lift" onClick={() => {
                 setEditingMatchId(null);
                 setNewMatch({ teamAId: '', teamBId: '', matchDate: '', overs: 20, status: 'SCHEDULED', matchType: 'TOURNAMENT' });
                 setShowModal(true);
              }}>
                <CalendarPlus size={18} /> Schedule Match
              </button>
            )}
          </div>

          <div className="dashboard-grid">
            {matches.length === 0 ? (
              <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                <h3 style={{color: 'var(--text-secondary)'}}>No matches scheduled yet.</h3>
                {isAuthenticated && (
                   <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: '1rem' }}>Schedule Match</button>
                )}
              </div>
            ) : (
              matches.map((match) => (
                <MatchCard key={match.id} match={match} showActions={true} onDelete={handleDeleteMatch} onEdit={handleEditClick} />
              ))
            )}
          </div>
        </AnimatedSection>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <h2>{editingMatchId ? 'Edit Match' : 'Schedule Match'}</h2>
            <form onSubmit={handleSchedule} style={{ marginTop: '1.5rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Team A</label>
                  <select required className="form-input" 
                    value={newMatch.teamAId} onChange={e => setNewMatch({...newMatch, teamAId: e.target.value})}>
                    <option value="" disabled>Select Team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                  </select>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', fontWeight: 700 }}>VS</div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Team B</label>
                  <select required className="form-input" 
                    value={newMatch.teamBId} onChange={e => setNewMatch({...newMatch, teamBId: e.target.value})}>
                    <option value="" disabled>Select Team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Match Type</label>
                <select required className="form-input" 
                  value={newMatch.matchType} onChange={e => setNewMatch({...newMatch, matchType: e.target.value as 'TOURNAMENT' | 'PRACTICE'})}>
                  <option value="TOURNAMENT">Tournament (Fixed Teams)</option>
                  <option value="PRACTICE">Practice (Dynamic Teams)</option>
                </select>
              </div>



              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Date and Time</label>
                <input required type="datetime-local" className="form-input" 
                  value={newMatch.matchDate} onChange={e => setNewMatch({...newMatch, matchDate: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Overs per Innings</label>
                <input required type="number" min="1" className="form-input" 
                  value={newMatch.overs} onChange={e => setNewMatch({...newMatch, overs: parseInt(e.target.value)})} 
                  placeholder="e.g. 20" />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingMatchId(null); setNewMatch({ teamAId: '', teamBId: '', matchDate: '', overs: 20, status: 'SCHEDULED', matchType: 'TOURNAMENT' }); }} style={{ flex: 1 }} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? (editingMatchId ? 'Updating...' : 'Scheduling...') : (editingMatchId ? 'Update' : 'Schedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;
