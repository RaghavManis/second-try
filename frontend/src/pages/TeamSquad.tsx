import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TeamService, PlayerService, UploadService } from '../services/api';
import type { Team, Player, PlayerRole } from '../types';
import { ArrowLeft, UserPlus, Trash2, Shield, User, Edit, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TeamSquad: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [newPlayer, setNewPlayer] = useState({ name: '', role: 'BATSMAN' as PlayerRole, jerseyNumber: '', isCaptain: false, isViceCaptain: false, battingStyle: '', bowlingStyle: '', playerImage: '' });
  const [uploading, setUploading] = useState(false);

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

  const openEditModal = (player: Player) => {
    setEditingPlayerId(player.id || null);
    setNewPlayer({
      name: player.name,
      role: player.role,
      jerseyNumber: player.jerseyNumber ? player.jerseyNumber.toString() : '',
      isCaptain: player.isCaptain || false,
      isViceCaptain: player.isViceCaptain || false,
      battingStyle: player.battingStyle || '',
      bowlingStyle: player.bowlingStyle || '',
      playerImage: player.playerImage || ''
    });
    setIsModalOpen(true);
  };

  const closeForm = () => {
    setIsModalOpen(false);
    setEditingPlayerId(null);
    setNewPlayer({ name: '', role: 'BATSMAN', jerseyNumber: '', isCaptain: false, isViceCaptain: false, battingStyle: '', bowlingStyle: '', playerImage: '' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload a valid image'); return; }
    
    setUploading(true);
    try {
      const res = await UploadService.uploadImage(file);
      setNewPlayer(prev => ({ ...prev, playerImage: res.data.url }));
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    try {
      const playerData: Player = {
        name: newPlayer.name,
        role: newPlayer.role,
        jerseyNumber: newPlayer.jerseyNumber ? parseInt(newPlayer.jerseyNumber as string) : undefined,
        isCaptain: newPlayer.isCaptain,
        isViceCaptain: newPlayer.isViceCaptain,
        battingStyle: newPlayer.battingStyle,
        bowlingStyle: newPlayer.bowlingStyle,
        playerImage: newPlayer.playerImage,
        team: team
      };
      
      if (editingPlayerId) {
        const res = await PlayerService.updatePlayer(editingPlayerId, playerData);
        setPlayers(players.map(p => p.id === editingPlayerId ? res.data : p));
        toast.success('Player updated successfully!');
      } else {
        const res = await PlayerService.addPlayer(playerData);
        setPlayers([...players, res.data]);
        toast.success('Player added successfully!');
      }
      closeForm();
    } catch (err) {
      console.error('Failed to save player', err);
      toast.error('Failed to save player.');
    }
  };

  const handleRemovePlayer = async (playerId: number) => {
    if (window.confirm("Remove this player from the squad?")) {
      try {
        await PlayerService.removePlayer(playerId);
        setPlayers(players.filter(p => p.id !== playerId));
        toast.success('Player removed.');
      } catch (err) {
        console.error('Failed to remove player', err);
        toast.error('Failed to remove player.');
      }
    }
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
            <button className="btn btn-primary hover-lift" onClick={() => { setEditingPlayerId(null); setIsModalOpen(true); }}>
              <UserPlus size={18} /> Add Player
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-grid animate-slide-up delay-100" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {players.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <User size={48} color="var(--text-secondary)" style={{marginBottom: '1rem', opacity: 0.5}}/>
            <h3 style={{color: 'var(--text-secondary)'}}>No players registered yet.</h3>
          </div>
        ) : (
          players.map((player, idx) => (
            <div key={player.id} className={`glass-panel hover-lift delay-${(idx % 3 + 1) * 100}`} style={{ position: 'relative', overflow: 'hidden' }}>
              {isAuthenticated && (
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <button className="btn btn-secondary" style={{padding: '0.3rem', background: '#3b82f620', color: '#3b82f6'}} onClick={() => openEditModal(player)}>
                     <Edit size={16} />
                   </button>
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="modal-title">{editingPlayerId ? 'Edit Player' : 'Register Player'}</h2>
            <form onSubmit={handleSavePlayer}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', border: '1px dashed var(--glass-border)' }}>
                     {newPlayer.playerImage ? (
                         <img src={newPlayer.playerImage} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     ) : (
                         <User size={32} color="#64748b" />
                     )}
                 </div>
                 <input type="file" id="player-image-upload" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                 <label htmlFor="player-image-upload" style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative', zIndex: 100 }}>
                     <Upload size={14} /> {uploading ? 'Uploading...' : (newPlayer.playerImage ? 'Change Image (Optional)' : 'Upload Profile (Optional)')}
                 </label>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" required 
                  value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" required 
                  value={newPlayer.role} onChange={e => setNewPlayer({...newPlayer, role: e.target.value as PlayerRole})}>
                  <option value="BATSMAN">Batsman</option>
                  <option value="BOWLER">Bowler</option>
                  <option value="ALL_ROUNDER">All-Rounder</option>
                  <option value="WICKETKEEPER">Wicketkeeper</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jersey Number (Optional)</label>
                <input type="number" className="form-input" 
                  value={newPlayer.jerseyNumber} onChange={e => setNewPlayer({...newPlayer, jerseyNumber: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Batting Style</label>
                  <select className="form-input" value={newPlayer.battingStyle} onChange={e => setNewPlayer({...newPlayer, battingStyle: e.target.value})}>
                    <option value="">Select Style</option>
                    <option value="Right Hand Bat">Right Hand Bat</option>
                    <option value="Left Hand Bat">Left Hand Bat</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bowling Style</label>
                  <select className="form-input" value={newPlayer.bowlingStyle} onChange={e => setNewPlayer({...newPlayer, bowlingStyle: e.target.value})}>
                    <option value="">Select Style</option>
                    <option value="Right Arm Fast">Right Arm Fast</option>
                    <option value="Right Arm Medium">Right Arm Medium</option>
                    <option value="Right Arm Offbreak">Right Arm Offbreak</option>
                    <option value="Right Arm Legbreak">Right Arm Legbreak</option>
                    <option value="Left Arm Fast">Left Arm Fast</option>
                    <option value="Left Arm Orthodox">Left Arm Orthodox</option>
                    <option value="Left Arm Chinaman">Left Arm Chinaman</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newPlayer.isCaptain} 
                    onChange={e => setNewPlayer({...newPlayer, isCaptain: e.target.checked})} />
                  Is Captain
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newPlayer.isViceCaptain} 
                    onChange={e => setNewPlayer({...newPlayer, isViceCaptain: e.target.checked})} />
                  Is Vice Captain
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>{editingPlayerId ? 'Update Player' : 'Save Player'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSquad;
