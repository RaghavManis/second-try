import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { PlayerService, UploadService, PointsService } from '../services/api';
import type { Player, PlayerRole } from '../types';
import { User, UserPlus, Edit, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { AnimatedSection } from '../components/AnimatedSection';
import { AutoScrollContainer } from '../components/AutoScrollContainer';

const PlayersList: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [topPerformers, setTopPerformers] = useState<any>(null);

  // Modal State for Player Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [newPlayer, setNewPlayer] = useState({ name: '', role: 'BATSMAN' as PlayerRole, jerseyNumber: '', isCaptain: false, isViceCaptain: false, battingStyle: '', bowlingStyle: '', playerImage: '' });
  const [uploading, setUploading] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const playersRes = await PlayerService.getAllPlayers();
      const rawPlayers = Array.isArray(playersRes.data) ? playersRes.data : [];
      setPlayers([...rawPlayers].sort((a, b) => a.name.localeCompare(b.name)));
      
      try {
        const performersRes = await PointsService.getTopPerformers();
        if (performersRes.data && performersRes.data.TOURNAMENT) {
          setTopPerformers(performersRes.data.TOURNAMENT);
        }
      } catch (perfErr) {
        console.warn('Leaderboard data currently unavailable', perfErr);
      }
    } catch (error) {
      console.error('Critical failure: Could not fetch players list', error);
      toast.error('Failed to load players directory');
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
    try {
      const playerData: Player = {
        name: newPlayer.name,
        role: newPlayer.role,
        jerseyNumber: newPlayer.jerseyNumber ? parseInt(newPlayer.jerseyNumber as string) : undefined,
        isCaptain: newPlayer.isCaptain,
        isViceCaptain: newPlayer.isViceCaptain,
        battingStyle: newPlayer.battingStyle,
        bowlingStyle: newPlayer.bowlingStyle,
        playerImage: newPlayer.playerImage
      };
      
      if (editingPlayerId) {
        const res = await PlayerService.updatePlayer(editingPlayerId, playerData); // ensure we use updatePlayerBasicInfo here since backend defined it as such or updatePlayer? Wait, backend has updatePlayerBasicInfo
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

  const handleRemovePlayer = async (e: React.MouseEvent, playerId: number) => {
    e.stopPropagation();
    if (window.confirm("Delete this player completely from the database? This action cannot be undone.")) {
      try {
        await PlayerService.removePlayer(playerId);
        setPlayers(players.filter(p => p.id !== playerId));
        toast.success('Player deleted successfully.');
      } catch (err: any) {
        console.error('Failed to delete player', err);
        toast.error(err.response?.data?.message || 'Failed to delete player! They might belong to a team.');
      }
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

  const PlayerCard = ({ player }: { player: Player }) => {
    if (!player || !player.id) return null;
    return (
    <div className="hover-lift" style={{ 
        cursor: 'pointer', 
        padding: '3rem 1.5rem 1.5rem 1.5rem', 
        position: 'relative', 
        marginTop: '2.5rem', 
        height: 'calc(100% - 2.5rem)',
        borderRadius: '24px',
        background: 'linear-gradient(180deg, rgba(30,41,59,0.3) 0%, rgba(15,23,42,0.9) 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
     }} onClick={() => navigate(`/players/${player.id}`)}>
      
      {isAuthenticated && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
           <button className="btn" style={{padding: '0.4rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none'}} onClick={(e) => { e.stopPropagation(); openEditModal(player); }}>
             <Edit size={14} />
           </button>
           <button className="btn" style={{padding: '0.4rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none'}} onClick={(e) => player.id && handleRemovePlayer(e, player.id)}>
             <Trash2 size={14} />
           </button>
        </div>
      )}

      <div style={{ position: 'absolute', top: '10px', right: '10px', background: `${getRoleColor(player.role)}20`, width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: `1px solid ${getRoleColor(player.role)}50`, color: getRoleColor(player.role), fontSize: '0.8rem', zIndex: 10 }}>
        {player.jerseyNumber || '-'}
      </div>
      
      <div style={{ position: 'absolute', top: '-45px', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
        <div style={{ position: 'absolute', inset: '-5px', background: `${getRoleColor(player.role)}`, filter: 'blur(20px)', opacity: 0.35, borderRadius: '50%' }}></div>
        <img 
          src={player.playerImage || getRandomAvatar(player.id || 0)} 
          alt={player.name} 
          onClick={(e) => { e.stopPropagation(); setViewImage(player.playerImage || getRandomAvatar(player.id || 0)); }}
          style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #0f172a', background: '#1e293b', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', cursor: 'zoom-in', transition: 'transform 0.3s' }} 
        />
      </div>

      <div style={{ marginTop: 'auto', width: '100%' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player.name}
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          {player.isCaptain && <span style={{color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800, border: '1px solid rgba(251, 191, 36, 0.3)'}}>CAPTAIN</span>}
          {player.isViceCaptain && <span style={{color: '#94a3b8', background: 'rgba(148, 163, 184, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800, border: '1px solid rgba(148, 163, 184, 0.3)'}}>VICE CAPTAIN</span>}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: getRoleColor(player.role), background: `${getRoleColor(player.role)}15`, padding: '6px 14px', borderRadius: '20px', border: `1px solid ${getRoleColor(player.role)}30`, width: '100%' }}>
           {player.role.replace('_', ' ')}
        </div>
      </div>
    </div>
    );
  };

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading players...</div>;

  // Extraction Logic for Sections
  const getPlayerFromStat = (stat: any) => stat?.player;
  const uniquePlayers = (list: Player[]) => {
     const seen = new Set();
     return list.filter(p => {
       if (!p || seen.has(p.id)) return false;
       seen.add(p.id);
       return true;
     });
  };

  const orangeCap = (topPerformers?.topRunScorers || []).map(getPlayerFromStat).filter(Boolean);
  const purpleCap = (topPerformers?.topWicketTakers || []).map(getPlayerFromStat).filter(Boolean);
  const sixHitters = (topPerformers?.topSixHitters || []).map(getPlayerFromStat).filter(Boolean);
  const fourHitters = (topPerformers?.topFourHitters || []).map(getPlayerFromStat).filter(Boolean);
  const catchTakers = (topPerformers?.topCatchTakers || []).map(getPlayerFromStat).filter(Boolean);

  // Fallback: Captains and Vice Captains if no stats
  const leadershipFallback = players.filter(p => p.isCaptain || p.isViceCaptain);

  // Section 2: Star Players (Top 1 from each category, randomized)
  let starPlayers = uniquePlayers([
    orangeCap[0], purpleCap[0], sixHitters[0], fourHitters[0], catchTakers[0]
  ].filter(Boolean));
  
  if (starPlayers.length === 0) starPlayers = leadershipFallback.slice(0, 6);
  else starPlayers = [...starPlayers].sort(() => Math.random() - 0.5);

  // Section 3: Top Batsmen (Orange Cap)
  let batsmenSection = orangeCap.length > 0 ? orangeCap.slice(0, 8) : players.filter(p => p.role === 'BATSMAN').slice(0, 8);
  if (batsmenSection.length === 0) batsmenSection = leadershipFallback.filter(p => p.role === 'BATSMAN');

  // Section 4: Key Bowlers (Purple Cap)
  let bowlersSection = purpleCap.length > 0 ? purpleCap.slice(0, 8) : players.filter(p => p.role === 'BOWLER').slice(0, 8);
  if (bowlersSection.length === 0) bowlersSection = leadershipFallback.filter(p => p.role === 'BOWLER');

  // Section 5: Game Changers (6/4/Catch)
  let gameChangers = uniquePlayers([
    ...sixHitters.slice(0, 3), 
    ...fourHitters.slice(0, 3), 
    ...catchTakers.slice(0, 3)
  ]);
  if (gameChangers.length === 0) gameChangers = leadershipFallback.filter(p => p.role === 'ALL_ROUNDER' || p.role === 'WICKETKEEPER');

  return (
    <div className="dashboard-wrapper">
      {/* SECTION 1: HERO - COMMENTED OUT AS PER REQUEST
      <div className="parallax-hero" style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("/players-bg.jpg")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '0', paddingTop: '80px'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.5) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem' }}>
          <div style={{ display: 'inline-block', marginBottom: '1rem', padding: '0.5rem 1.5rem', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '30px', backdropFilter: 'blur(10px)', color: '#fff', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Star Athletes
          </div>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            Tournament Players
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: 1.6, textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}>
            Explore the athletes powering the competition.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => document.getElementById('players-content')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary hover-lift" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', borderRadius: '30px', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)' }}>
              Discover Talent <Star size={20} style={{ marginLeft: '8px' }}/>
            </button>
            {isAuthenticated && (
              <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary hover-lift" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', borderRadius: '30px', background: 'var(--primary)', border: 'none', color: '#fff' }}>
                Add Player <UserPlus size={20} style={{ marginLeft: '8px' }}/>
              </button>
            )}
          </div>
        </div>
      </div>
      */}

      <div id="players-content" className="dashboard-sections" style={{ paddingTop: '80px' }}>
        
        {/* ADD PLAYER BUTTON FOR ADMIN (WHEN HERO IS REMOVED) */}
        {isAuthenticated && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', padding: '0 2rem' }}>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary hover-lift" style={{ padding: '0.75rem 1.5rem', borderRadius: '20px', fontSize: '0.9rem' }}>
              <UserPlus size={18} style={{ marginRight: '8px' }}/> Add New Player
            </button>
          </div>
        )}
        
        {/* SECTION 2: STAR PLAYERS */}
        {starPlayers.length > 0 && (
        <AnimatedSection className="bg-section-2 theme-light">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Star Players</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>Athletes making headlines right now.</p>
          <AutoScrollContainer className="horizontal-scroller">
            {starPlayers.map(player => (
              <div key={player.id} style={{ height: '100%' }}>
                <PlayerCard player={player} />
              </div>
            ))}
          </AutoScrollContainer>
        </AnimatedSection>
        )}

        {/* SECTION 3: TOP BATSMEN */}
        {batsmenSection.length > 0 && (
        <AnimatedSection className="bg-section-3 theme-dark">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Top Batsmen</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>{orangeCap.length > 0 ? 'Orange Cap contenders.' : 'The run machines of the tournament.'}</p>
          <AutoScrollContainer className="horizontal-scroller">
            {batsmenSection.map((player: Player) => (
              <div key={player.id} style={{ height: '100%' }}>
                <PlayerCard player={player} />
              </div>
            ))}
          </AutoScrollContainer>
        </AnimatedSection>
        )}

        {/* SECTION 4: KEY BOWLERS */}
        {bowlersSection.length > 0 && (
        <AnimatedSection className="bg-section-4 theme-light">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Key Bowlers</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>{purpleCap.length > 0 ? 'Purple Cap leaders.' : 'Taking wickets and restricting runs.'}</p>
          <AutoScrollContainer className="horizontal-scroller">
            {bowlersSection.map((player: Player) => (
              <div key={player.id} style={{ height: '100%' }}>
                <PlayerCard player={player} />
              </div>
            ))}
          </AutoScrollContainer>
        </AnimatedSection>
        )}

        {/* SECTION 5: ALL-ROUNDERS (GAME CHANGERS) */}
        {gameChangers.length > 0 && (
        <AnimatedSection className="bg-section-5 theme-dark">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Game Changers</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>{sixHitters.length > 0 ? 'Leading the charts in Sixes, Fours, and Catches.' : 'The ultimate match winners.'}</p>
          <AutoScrollContainer className="horizontal-scroller">
            {gameChangers.map((player: Player) => (
              <div key={player.id} style={{ height: '100%' }}>
                <PlayerCard player={player} />
              </div>
            ))}
          </AutoScrollContainer>
        </AnimatedSection>
        )}

        {/* SECTION 6: FULL DIRECTORY */}
        <AnimatedSection className="bg-section-1 theme-dark">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Full Directory</h2>
            <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '0' }}>Every registered player in the database.</p>
          </div>
          
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {players.length === 0 ? (
              <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                <User size={48} color="var(--text-secondary)" style={{marginBottom: '1rem'}} />
                <h3 style={{color: 'var(--text-secondary)'}}>No players registered yet.</h3>
              </div>
            ) : (
              players.map(player => (
                <div key={player.id}>
                  <PlayerCard player={player} />
                </div>
              ))
            )}
          </div>
        </AnimatedSection>
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="modal-title">{editingPlayerId ? 'Edit Player' : 'Register Global Player'}</h2>
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
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>{editingPlayerId ? 'Update Player' : 'Save Global Player'}</button>
              </div>
            </form>
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

export default PlayersList;
