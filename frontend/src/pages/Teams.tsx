import React, { useState, useEffect } from 'react';
import { TeamService, UploadService } from '../services/api';
import type { Team } from '../types';
import { UserPlus, Shield, Users, Edit, Upload, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { AnimatedSection } from '../components/AnimatedSection';
import { AutoScrollContainer } from '../components/AutoScrollContainer';

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState<{ teamName: string, coachName: string, teamType: 'TOURNAMENT' | 'PRACTICE', teamLogo?: string }>({ teamName: '', coachName: '', teamType: 'TOURNAMENT' });
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await TeamService.getAllTeams();
      setTeams(res.data);
    } catch (e) {
      console.error('Failed to fetch teams', e);
    } finally {
      setLoading(false);
    }
  };

  const getLogo = (team: Team) => team.teamLogo || `https://api.dicebear.com/7.x/identicon/svg?seed=Team${team.id}&backgroundColor=1e293b`;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload a valid image'); return; }
    
    setUploading(true);
    try {
      const res = await UploadService.uploadImage(file);
      setNewTeam(prev => ({ ...prev, teamLogo: res.data.url }));
      toast.success('Logo uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRegisterOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingTeam) {
        await TeamService.updateTeam(editingTeam.id!, { ...editingTeam, ...newTeam });
        toast.success('Team updated successfully!');
      } else {
        await TeamService.createTeam(newTeam as any);
        toast.success('Team registered successfully!');
      }
      setShowModal(false);
      setEditingTeam(null);
      setNewTeam({ teamName: '', coachName: '', teamType: 'TOURNAMENT', teamLogo: '' });
      fetchTeams();
    } catch (error) {
      console.error('Failed to save team', error);
      // Let the global interceptor handle the toast, unless specific logic is needed
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this team? All its players will be deleted permanently. This action cannot be undone.")) {
      try {
        await TeamService.deleteTeam(id);
        toast.success("Team deleted successfully!");
        fetchTeams();
      } catch (error: any) {
        console.error('Failed to delete team', error);
        toast.error(error.response?.data?.message || "Failed to delete team! This team is likely used in matches.");
      }
    }
  };

  const openEditModal = (t: Team) => {
    setEditingTeam(t);
    setNewTeam({ teamName: t.teamName, coachName: t.coachName, teamType: t.teamType || 'TOURNAMENT', teamLogo: t.teamLogo || '' });
    setShowModal(true);
  };

  const openRegisterModal = () => {
    setEditingTeam(null);
    setNewTeam({ teamName: '', coachName: '', teamType: 'TOURNAMENT', teamLogo: '' });
    setShowModal(true);
  };

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading teams...</div>;

  const featuredTeams = teams.filter(t => t.teamType === 'TOURNAMENT' || t.teamType == null);

  return (
    <div className="dashboard-wrapper">
      {/* SECTION 1: HERO */}
      <div className="parallax-hero" style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("https://images.unsplash.com/photo-1593341646782-e0be10cd2bc4?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '-80px'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem' }}>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Tournament Teams
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            Meet the franchises competing for the championship.
          </p>
          <button onClick={() => document.getElementById('teams-content')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary hover-lift" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', borderRadius: '30px' }}>
            View Squads <Users size={20} style={{ marginLeft: '8px' }}/>
          </button>
        </div>
      </div>

      <div id="teams-content" className="dashboard-sections">
        
        {/* SECTION 2: FEATURED TEAMS */}
        {featuredTeams.length > 0 && (
        <AnimatedSection className="bg-section-2 theme-light">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Featured Franchises</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>The top contenders drawing the crowds.</p>
          <AutoScrollContainer className="horizontal-scroller">
            {featuredTeams.map(team => (
              <div key={team.id} className="glass-panel hover-lift" style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }} onClick={() => navigate(`/teams/${team.id}`)}>
                <img src={getLogo(team)} alt={team.teamName} style={{ width: 80, height: 80, borderRadius: '16px', marginBottom: '1rem', objectFit: 'cover' }} />
                <h3 className="gradient-text" style={{ fontSize: '1.3rem', textAlign: 'center', marginBottom: '0.5rem' }}>{team.teamName}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Shield size={14} color="var(--primary)" /> Coach: {team.coachName}
                </div>
              </div>
            ))}
          </AutoScrollContainer>
        </AnimatedSection>
        )}

        {/* SECTION 3: ALL TEAMS DIRECTORY */}
        <AnimatedSection className="bg-section-3 theme-dark">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="scroll-section-title gradient-text" style={{ marginBottom: 0, textAlign: 'left' }}>Team Roster</h2>
              <p className="scroll-section-subtitle" style={{ marginBottom: 0, textAlign: 'left' }}>Complete tournament roster.</p>
            </div>
            {isAuthenticated && (
              <button className="btn btn-primary hover-lift" onClick={openRegisterModal}>
                <UserPlus size={18} /> Register Team
              </button>
            )}
          </div>

          <div className="dashboard-grid">
            {teams.length === 0 ? (
              <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                <UsersIcon size={48} color="var(--text-secondary)" style={{marginBottom: '1rem'}} />
                <h3 style={{color: 'var(--text-secondary)'}}>No teams registered yet.</h3>
                {isAuthenticated && (
                   <button className="btn btn-primary" onClick={openRegisterModal} style={{ marginTop: '1rem' }}>Register a Team</button>
                )}
              </div>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="glass-panel hover-lift" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                  {isAuthenticated && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 10 }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(team); }}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        title="Edit Team"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteTeam(e, team.id!)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Delete Team"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                  <img src={getLogo(team)} alt={team.teamName} style={{ width: 64, height: 64, borderRadius: '12px', marginBottom: '1rem', objectFit: 'cover' }} />
                  <h3 className="gradient-text" style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1rem', width: '100%' }}>
                    {team.teamName}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Shield size={16} color="var(--primary)" />
                      <span>Coach: <strong style={{color: 'var(--text-primary)'}}>{team.coachName}</strong></span>
                    </div>
                    <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }} 
                      onClick={() => navigate(`/teams/${team.id}`)}>
                      <Users size={16} /> View Squad
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </AnimatedSection>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <h2>{editingTeam ? 'Edit Team' : 'Register New Team'}</h2>
            <form onSubmit={handleRegisterOrUpdate} style={{ marginTop: '1.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <div style={{ width: 80, height: 80, borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', border: '1px dashed var(--glass-border)' }}>
                     {newTeam.teamLogo ? (
                         <img src={newTeam.teamLogo} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     ) : (
                         <Shield size={32} color="#64748b" />
                     )}
                 </div>
                 <input type="file" id="team-logo-upload" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                 <label htmlFor="team-logo-upload" style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative', zIndex: 100 }}>
                     <Upload size={14} /> {uploading ? 'Uploading...' : (newTeam.teamLogo ? 'Change Logo (Optional)' : 'Upload Logo (Optional)')}
                 </label>
              </div>

              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input required type="text" className="form-input" 
                  value={newTeam.teamName} onChange={e => setNewTeam({...newTeam, teamName: e.target.value})} 
                  placeholder="e.g. Royal Challengers" />
              </div>
              <div className="form-group">
                <label className="form-label">Coach Name</label>
                <input required type="text" className="form-input" 
                  value={newTeam.coachName} onChange={e => setNewTeam({...newTeam, coachName: e.target.value})} 
                  placeholder="Coach Full Name" />
              </div>
              <div className="form-group">
                <label className="form-label">Team Type</label>
                <select className="form-input" value={newTeam.teamType} onChange={e => setNewTeam({...newTeam, teamType: e.target.value as 'TOURNAMENT' | 'PRACTICE'})}>
                  <option value="TOURNAMENT">Tournament Team</option>
                  <option value="PRACTICE">Practice Team</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading || isSubmitting}>
                  {editingTeam ? (isSubmitting ? 'Saving...' : 'Save Changes') : (isSubmitting ? 'Registering...' : 'Register')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Temp
const UsersIcon = UserPlus;

export default Teams;
