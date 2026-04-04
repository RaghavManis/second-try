import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayerService } from '../services/api';
import type { PlayerProfileDto } from '../types';
import { User, ArrowLeft, Edit3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PlayerProfile: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [profile, setProfile] = useState<PlayerProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'batting' | 'bowling'>('info');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (playerId) {
      fetchPlayer(parseInt(playerId));
    }
  }, [playerId]);

  const fetchPlayer = async (id: number) => {
    try {
      const res = await PlayerService.getPlayerById(id);
      setProfile(res.data);
      // setEditForm(res.data.player); // Removed for now due to complex structure
    } catch (error) {
      console.error('Failed to fetch player', error);
      toast.error('Player not found');
      navigate('/players');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.player || !profile.player.id) return;
    
    try {
      // Just basic info
      const res = await PlayerService.updatePlayer(profile.player.id, editForm as any); 
      setProfile({...profile, player: res.data});
      setIsEditModalOpen(false);
      toast.success('Player basic info updated successfully!');
    } catch (error) {
       console.error('Failed to update stats', error);
       toast.error('Failed to update stats');
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

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading profile...</div>;
  if (!profile) return null;
  const player = profile.player;

  return (
    <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Profile Header */}
      <div className="glass-panel profile-header" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative' }}>
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={16} /> Back
        </button>
        
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${getRoleColor(player.role)}`, overflow: 'hidden', flexShrink: 0 }}>
            {player.playerImage ? (
                <img src={player.playerImage} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <User size={48} color="var(--text-secondary)" />
            )}
        </div>
        
        <div className="profile-header-info" style={{ flex: 1 }}>
            <h1 className="gradient-text profile-header-text" style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {player.name}
              {player.isCaptain && <span style={{color: 'var(--primary)', fontSize: '1.2rem'}}>(C)</span>}
              {player.isViceCaptain && <span style={{color: 'var(--text-secondary)', fontSize: '1.2rem'}}>(VC)</span>}
            </h1>
            <p className="profile-header-text" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ color: getRoleColor(player.role), fontWeight: 'bold' }}>{player.role.replace('_', ' ')}</span> &nbsp;|&nbsp;
              Jersey: {player.jerseyNumber || 'N/A'}
            </p>
        </div>
        
        {isAuthenticated && (
           <div style={{ alignSelf: 'center' }}>
             <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(true)}>
               <Edit3 size={18} /> Edit Basic Info
             </button>
           </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
        {['info', 'batting', 'bowling'].map((tab) => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab as any)}
             style={{
               flex: 1, padding: '1rem', background: 'transparent', border: 'none', 
               borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
               color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
               fontWeight: activeTab === tab ? 'bold' : 'normal',
               fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s',
               textTransform: 'capitalize'
             }}
           >
             {tab.replace('info', 'Player Info').replace('batting', 'Batting Stats').replace('bowling', 'Bowling Stats')}
           </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass-panel" style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
        
        {activeTab === 'info' && (
          <div className="profile-info-grid">
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)' }}>Basic Details</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</span>
                <span style={{ fontWeight: '600' }}>{player.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Role</span>
                <span style={{ fontWeight: '600' }}>{player.role.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Jersey Number</span>
                <span style={{ fontWeight: '600' }}>{player.jerseyNumber || 'Unassigned'}</span>
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)' }}>Style</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Batting Style</span>
                <span style={{ fontWeight: '600' }}>{player.battingStyle || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bowling Style</span>
                <span style={{ fontWeight: '600' }}>{player.bowlingStyle || 'Unknown'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'batting' && (
          <div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', marginTop: '0.5rem' }}>Batting Stats</h3>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="table stats-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                    <th>Type</th>
                    <th>Matches</th>
                    <th>Runs</th>
                    <th>Balls</th>
                    <th>Avg</th>
                    <th>SR</th>
                    <th>50s/100s</th>
                    <th>4s/6s</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Overall', data: profile.overallStats },
                    { label: 'Tournament', data: profile.tournamentStats },
                    { label: 'Practice', data: profile.practiceStats }
                  ].map(({label, data}) => {
                    const avg = data?.out === true || (data?.runsScored && data.runsScored > 0) ? (data.runsScored / (data.inningsPlayed || 1)) : 0;
                    const sr = data?.ballsFaced > 0 ? (data.runsScored * 100 / data.ballsFaced) : 0;
                    return (
                      <tr key={label}>
                        <td style={{ fontWeight: 'bold' }}>{label}</td>
                        <td>{data?.matchesPlayed || 0}</td>
                        <td>{data?.runsScored || 0}</td>
                        <td>{data?.ballsFaced || 0}</td>
                        <td>{avg.toFixed(2)}</td>
                        <td>{sr.toFixed(2)}</td>
                        <td>{data?.fifties || 0} / {data?.hundreds || 0}</td>
                        <td>{data?.fours || 0} / {data?.sixes || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bowling' && (
          <div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', marginTop: '0.5rem' }}>Bowling Stats</h3>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="table stats-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                  <th>Type</th>
                  <th>Matches</th>
                  <th>Overs</th>
                  <th>Runs</th>
                  <th>Wickets</th>
                  <th>Econ</th>
                  <th>Avg</th>
                  <th>Maidens</th>
                </tr>
              </thead>
              <tbody>
                {[
                    { label: 'Overall', data: profile.overallStats },
                    { label: 'Tournament', data: profile.tournamentStats },
                    { label: 'Practice', data: profile.practiceStats }
                  ].map(({label, data}) => {
                    const econ = data?.oversBowled > 0 ? (data.runsConceded / data.oversBowled) : 0;
                    const avg = data?.wickets > 0 ? (data.runsConceded / data.wickets) : 0;
                    return (
                      <tr key={label}>
                        <td style={{ fontWeight: 'bold' }}>{label}</td>
                        <td>{data?.matchesPlayed || 0}</td>
                        <td>{(data?.oversBowled || 0).toFixed(1)}</td>
                        <td>{data?.runsConceded || 0}</td>
                        <td>{data?.wickets || 0}</td>
                        <td>{econ.toFixed(2)}</td>
                        <td>{avg.toFixed(2)}</td>
                        <td>{data?.maidens || 0}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
           </div>
         </div>
        )}

      </div>

      {isEditModalOpen && isAuthenticated && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Edit {player.name}'s Stats</h2>
            <form onSubmit={handleUpdateBasicInfo} style={{ marginTop: '1.5rem' }}>
              
              <h4 style={{marginTop: '1rem', color: 'var(--primary)'}}>Basic Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div className="form-group">
                   <label className="form-label">Batting Style</label>
                   <input type="text" className="form-input" value={editForm.battingStyle || ''} onChange={e => setEditForm({...editForm, battingStyle: e.target.value})} />
                 </div>
                 <div className="form-group">
                   <label className="form-label">Bowling Style</label>
                   <input type="text" className="form-input" value={editForm.bowlingStyle || ''} onChange={e => setEditForm({...editForm, bowlingStyle: e.target.value})} />
                 </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlayerProfile;
