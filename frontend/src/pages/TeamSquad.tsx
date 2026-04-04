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

  return (
    <div className="page-container">
      <div className="hero-banner animate-slide-up">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div>
            <button className="btn btn-secondary hover-lift" onClick={() => navigate('/teams')} style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.1)' }}>
              <ArrowLeft size={16} style={{marginRight: '0.5rem'}}/> Back to Teams
            </button>
            <h1 className="page-title gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{team.teamName} Squad</h1>
            <p className="page-subtitle" style={{ color: '#cbd5e1' }}>Coach: {team.coachName} | Captain: {captainDisplay}</p>
          </div>
          {isAuthenticated && (
            <button className="btn btn-primary hover-lift" onClick={openManageModal}>
              <Users size={18} /> Manage Squad
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-grid animate-slide-up delay-100" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {players.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <User size={48} color="var(--text-secondary)" style={{marginBottom: '1rem', opacity: 0.5}}/>
            <h3 style={{color: 'var(--text-secondary)'}}>No players assigned yet.</h3>
          </div>
        ) : (
          players.map((player, idx) => (
            <div key={player.id} className={`glass-panel hover-lift delay-${(idx % 3 + 1) * 100}`} style={{ position: 'relative', overflow: 'hidden' }}>
              {isAuthenticated && (
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <button className="btn btn-secondary" style={{padding: '0.3rem', background: '#ef444420', color: '#ef4444'}} onClick={() => player.id && handleRemovePlayer(player.id)}>
                     <Trash2 size={16} />
                   </button>
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%', 
                  background: 'var(--bg-lighter)', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', border: `2px solid ${getRoleColor(player.role)}`,
                  fontSize: '1.2rem', fontWeight: 'bold', overflow: 'hidden'
                }}>
                  {player.playerImage ? (
                    <img src={player.playerImage} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>{player.jerseyNumber || '-'}</>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                    {player.name}
                    {player.isCaptain && <span style={{color: 'var(--primary)', marginLeft: '8px', fontSize: '0.9rem'}}>(C)</span>}
                    {player.isViceCaptain && <span style={{color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '0.9rem'}}>(VC)</span>}
                  </h3>
                  <span style={{ 
                    fontSize: '0.8rem', color: getRoleColor(player.role), 
                    background: `${getRoleColor(player.role)}20`, padding: '2px 8px', 
                    borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                    marginTop: '4px'
                  }}>
                    <Shield size={12} /> {player.role.replace('_', ' ')}
                  </span>
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
    </div>
  );
};

export default TeamSquad;
