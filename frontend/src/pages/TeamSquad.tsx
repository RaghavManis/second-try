import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { TeamService, PlayerService } from '../services/api';
import type { Team, Player } from '../types';
import { ArrowLeft, Trash2, Shield, User, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TeamSquad: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Manage Squad Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [globalPlayers, setGlobalPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);

  useEffect(() => {
    if (teamId) {
      fetchTeamAndPlayers(parseInt(teamId));
    }
  }, [teamId]);

  const fetchTeamAndPlayers = async (id: number) => {
    try {
      const [teamRes, playersRes] = await Promise.all([
        TeamService.getTeamById(id),
        PlayerService.getPlayersByTeam(id)
      ]);
      setTeam(teamRes.data);
      setPlayers(playersRes.data);
    } catch (e) {
      console.error('Failed to load squad data', e);
      toast.error('Failed to load team details.');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const openManageModal = async () => {
    try {
      const res = await PlayerService.getAllPlayers();
      setGlobalPlayers(res.data);
      setSelectedPlayerIds(players.map(p => p.id!));
      setIsManageModalOpen(true);
    } catch (err) {
      toast.error('Failed to load global players');
    }
  };

  const handleSaveSquad = async () => {
    if (!team) return;
    setIsSaving(true);
    try {
      const res = await TeamService.assignPlayers(team.id!, selectedPlayerIds);
      toast.success('Squad updated successfully!');
      setIsManageModalOpen(false);
      setPlayers(res.data.players || []); // Assuming the API returns the updated team with players
      // Re-fetch to be safe
      fetchTeamAndPlayers(team.id!);
    } catch (err) {
      console.error('Failed to save squad', err);
      toast.error('Failed to update squad.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePlayer = async (playerId: number) => {
    if (!team) return;
    if (window.confirm("Remove this player from the squad?")) {
      try {
        const updatedPlayerIds = players.filter(p => p.id !== playerId).map(p => p.id!);
        await TeamService.assignPlayers(team.id!, updatedPlayerIds);
        setPlayers(players.filter(p => p.id !== playerId));
        toast.success('Player removed from squad.');
      } catch (err) {
        console.error('Failed to remove player', err);
        toast.error('Failed to remove player.');
      }
    }
  };

  const togglePlayerSelection = (playerId: number) => {
    setSelectedPlayerIds(prev => 
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'BATSMAN': return '#3b82f6'; // blue
      case 'BOWLER': return '#ef4444'; // red
      case 'ALL_ROUNDER': return '#10b981'; // green
      case 'WICKETKEEPER': return '#f59e0b'; // amber
      default: return '#8b5cf6'; // purple
    }
  };

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Squad...</div>;
  if (!team) return null;

  const captain = players.find(p => p.isCaptain);
  const captainDisplay = captain ? captain.name : 'Not Assigned';

  const getLogo = (id?: number) => `https://api.dicebear.com/7.x/identicon/svg?seed=Team${id || 0}&backgroundColor=1e293b`;
  const teamBgImage = team.teamLogo || getLogo(team.id);

  return (
    <div className="page-container">
      <div className="hero-banner animate-slide-up" style={{ 
          borderRadius: '24px', 
          overflow: 'hidden', 
          marginBottom: '2rem', 
          position: 'relative',
          backgroundImage: `url('/teams-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
        <div className="hero-overlay" style={{ 
           position: 'absolute', inset: 0, 
           background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
           backdropFilter: 'blur(4px)' 
        }}></div>

        {/* Epic Team Watermark */}
        <div style={{ position: 'absolute', right: '-5%', top: '-20%', opacity: 0.15, pointerEvents: 'none', zIndex: 1, transform: 'rotate(-15deg)' }}>
           <img src={teamBgImage} alt="watermark" style={{ width: '450px', height: '450px', objectFit: 'contain', filter: 'grayscale(100%) brightness(150%)' }} />
        </div>
        <div className="hero-content" style={{ padding: '3rem 2rem', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          
          <div style={{ width: '120px', height: '120px', borderRadius: '24px', padding: '6px', background: 'linear-gradient(135deg, var(--primary), #3b82f6)', boxShadow: '0 15px 35px rgba(0,0,0,0.5)', flexShrink: 0 }}>
             <img src={teamBgImage} alt={team.teamName} style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover', background: 'var(--bg-color)' }} />
          </div>

          <div style={{ flex: 1, minWidth: '250px' }}>
            <button className="btn btn-secondary hover-lift" onClick={() => navigate('/teams')} style={{ marginBottom: '1rem', padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', borderRadius: '20px' }}>
              <ArrowLeft size={14} /> Back to Teams
            </button>
            <h1 className="page-title gradient-text" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '0.5rem', letterSpacing: '-0.02em', textShadow: '0 4px 15px rgba(0,0,0,0.5)', lineHeight: 1.1 }}>{team.teamName}</h1>
            <div style={{ display: 'flex', gap: '1rem', color: '#cbd5e1', fontSize: '0.9rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}><Shield size={14} color="var(--primary)" /> Coach: <strong style={{color: '#fff'}}>{team.coachName}</strong></span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}><User size={14} color="var(--primary)" /> Captain: <strong style={{color: '#fff'}}>{captainDisplay}</strong></span>
            </div>
          </div>
          
          {isAuthenticated && (
            <div style={{ alignSelf: 'flex-start' }}>
              <button className="btn btn-primary hover-lift" onClick={openManageModal} style={{ padding: '0.8rem 1.5rem', fontSize: '1rem', fontWeight: '800', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.4)', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} /> Manage Squad
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="animate-slide-up delay-100" style={{ textAlign: 'center', margin: '3rem 0 2rem 0' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '-0.02em', fontWeight: 900 }}>Let's Meet the Stars</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>The elite athletes fighting for {team.teamName}'s ultimate glory.</p>
      </div>

      <div className="dashboard-grid animate-slide-up delay-100" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {players.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
            <User size={40} color="var(--text-secondary)" style={{marginBottom: '0.5rem', opacity: 0.5}}/>
            <h3 style={{color: 'var(--text-secondary)'}}>No players assigned yet.</h3>
          </div>
        ) : (
          [...players].sort((a, b) => {
            if (a.isCaptain && !b.isCaptain) return -1;
            if (!a.isCaptain && b.isCaptain) return 1;
            if (a.isViceCaptain && !b.isViceCaptain) return -1;
            if (!a.isViceCaptain && b.isViceCaptain) return 1;
            return a.name.localeCompare(b.name);
          }).map((player, idx) => (
            <div 
              key={player.id} 
              className={`player-card role-${player.role.toLowerCase()} animate-card-entry`} 
              style={{ animationDelay: `${idx * 100}ms`, padding: '1rem 0.5rem' }}
              onClick={() => navigate(`/players/${player.id}`)}
            >
              {player.isCaptain && <div className="captain-badge">CAPTAIN</div>}
              {player.isViceCaptain && <div className="vc-badge">VC</div>}
              
              {/* Decorative Role Circle */}
              <div style={{ 
                position: 'absolute', top: '8px', left: '8px', 
                width: '10px', height: '10px', borderRadius: '50%', 
                background: getRoleColor(player.role),
                boxShadow: `0 0 8px ${getRoleColor(player.role)}`,
                zIndex: 5
              }}></div>

              {isAuthenticated && (
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 10 }}>
                   <button 
                     className="btn btn-secondary" 
                     style={{ padding: '0.3rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', border: '1px solid rgba(239, 68, 68, 0.2)' }} 
                     onClick={(e) => { e.stopPropagation(); player.id && handleRemovePlayer(player.id); }}
                   >
                     <Trash2 size={12} />
                   </button>
                </div>
              )}
              
              <div className="player-avatar-wrapper" style={{ marginBottom: '0.5rem' }}>
                <img 
                  src={player.playerImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id || 0}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`} 
                  alt={player.name} 
                  className="player-avatar"
                  style={{ width: '70px', height: '70px' }}
                  onClick={(e) => { e.stopPropagation(); setViewImage(player.playerImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id || 0}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`); }}
                />
                <div className="jersey-number" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>{player.jerseyNumber || '-'}</div>
              </div>

              <div className="player-info" style={{ marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{player.name}</h3>
                <div className="role-badge" style={{ padding: '4px 10px', fontSize: '0.65rem' }}>
                  <Shield size={12} /> {player.role.replace('_', ' ')}
                </div>
              </div>
              
              <div style={{ marginTop: '0.75rem', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                 <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Batting</div>
                    <div style={{ fontWeight: '700', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{player.battingStyle || 'N/A'}</div>
                 </div>
                 <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Bowling</div>
                    <div style={{ fontWeight: '700', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{player.bowlingStyle || 'N/A'}</div>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isManageModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <h2 className="modal-title">Manage {team.teamName} Squad</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Select players from the global player pool to assign to this team.
            </p>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
              {globalPlayers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No players found in the database. Please add players from the Tournament Players page first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {globalPlayers.map(p => {
                    const isSelected = selectedPlayerIds.includes(p.id!);
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => togglePlayerSelection(p.id!)}
                        style={{ 
                          display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', 
                          background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-lighter)', 
                          border: `1px solid ${isSelected ? '#3b82f6' : 'var(--glass-border)'}`,
                          borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => {}} // handled by parent div click
                          style={{ marginRight: '1rem', cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: 'var(--background)' }}>
                            {p.playerImage ? (
                              <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <User size={20} style={{ margin: '6px' }} color="var(--text-secondary)" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                            <div style={{ fontSize: '0.75rem', color: getRoleColor(p.role) }}>{p.role.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsManageModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveSquad} disabled={isSaving}>
                {isSaving ? 'Saving...' : `Save Squad (${selectedPlayerIds.length})`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {viewImage && createPortal(
        <div 
          onClick={() => setViewImage(null)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out' }}
        >
           <img src={viewImage} alt="Fullscreen Preview" style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} />
        </div>,
        document.body
      )}
    </div>
  );
};

export default TeamSquad;
