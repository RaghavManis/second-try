import React, { useState, useEffect } from 'react';
import { TeamService, UploadService, PlayerService } from '../services/api';
import type { Team } from '../types';
import { UserPlus, Shield, Users, Edit, Upload, Trash2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { AnimatedSection } from '../components/AnimatedSection';
import { AutoScrollContainer } from '../components/AutoScrollContainer';
import SEO from '../components/common/SEO';


const Teams: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<(Team & { captainName?: string, viceCaptainName?: string })[]>([]);
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
      const teamsData = Array.isArray(res.data) ? res.data : [];
      
      const enhancedTeams = await Promise.all(teamsData.map(async (team) => {
        try {
          const playersRes = await PlayerService.getPlayersByTeam(team.id!);
          const captain = playersRes.data.find(p => p.isCaptain);
          const viceCaptain = playersRes.data.find(p => p.isViceCaptain);
          return { 
            ...team, 
            captainName: captain ? captain.name : 'TBD',
            viceCaptainName: viceCaptain ? viceCaptain.name : 'TBD'
          };
        } catch {
          return { ...team, captainName: 'TBD', viceCaptainName: 'TBD' };
        }
      }));
      setTeams(enhancedTeams);
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
      <SEO 
        title="Tournament Teams" 
        description="Meet the franchises and teams competing for the championship in the Siddha Premier League (SPL). Track squad details and team information."
      />

      {/* SECTION 1: HERO */}
      {/* SECTION 1: HERO - COMMENTED OUT AS PER REQUEST
      <div className="parallax-hero" style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("/teams-bg.jpg")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '0', paddingTop: '80px'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.5) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem' }}>
          <div style={{ display: 'inline-block', marginBottom: '1rem', padding: '0.5rem 1.5rem', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '30px', backdropFilter: 'blur(10px)', color: '#fff', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
            League Contenders
          </div>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            Tournament Teams
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: 1.6, textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}>
            Meet the franchises competing for the championship.
          </p>
          <button onClick={() => document.getElementById('teams-content')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary hover-lift" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', borderRadius: '30px', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)' }}>
            View Squads <Users size={20} style={{ marginLeft: '8px' }}/>
          </button>
        </div>
      </div>
      */}

      <div id="teams-content" className="dashboard-sections" style={{ paddingTop: '80px' }}>
        
        {/* SECTION 2: FEATURED TEAMS */}
        {featuredTeams.length > 0 && (
        <AnimatedSection className="bg-section-2 theme-light">
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Featured Franchises</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>The top contenders drawing the crowds.</p>
          <AutoScrollContainer className="horizontal-scroller">
            {featuredTeams.map(team => (
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
                   <img src={getLogo(team)} alt="watermark" style={{ width: '150px', height: '150px', objectFit: 'cover' }} />
                </div>
                
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '68px', height: '68px', borderRadius: '16px', padding: '3px', background: 'linear-gradient(135deg, var(--primary), #3b82f6)', boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}>
                    <img src={getLogo(team)} alt={team.teamName} style={{ width: '100%', height: '100%', borderRadius: '14px', objectFit: 'cover', background: 'var(--bg-color)' }} />
                  </div>
                </div>

                <div style={{ zIndex: 1, paddingRight: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#fff', letterSpacing: '-0.01em' }}>{team.teamName}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600, width: 'fit-content' }}>
                      <User size={10} color="var(--primary)" /> C: {team.captainName}
                    </div>
                    {team.viceCaptainName !== 'TBD' && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600, width: 'fit-content' }}>
                        <User size={10} color="#fbbf24" /> VC: {team.viceCaptainName}
                      </div>
                    )}
                  </div>
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
                <div key={team.id} className="hover-lift" style={{ 
                    position: 'relative', cursor: 'pointer', borderRadius: '24px', overflow: 'hidden',
                    background: 'linear-gradient(180deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.95) 100%)',
                    border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', paddingBottom: '2rem'
                 }} onClick={() => navigate(`/teams/${team.id}`)}>
                  
                  {/* Background Accents */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '140px', background: 'linear-gradient(180deg, var(--primary) 0%, transparent 100%)', opacity: 0.1 }}></div>
                  <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', opacity: 0.05, pointerEvents: 'none' }}>
                     <img src={getLogo(team)} alt="watermark" style={{ width: '200px', height: '200px', objectFit: 'cover' }} />
                  </div>

                  {isAuthenticated && (
                    <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px', zIndex: 10, background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(team); }} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex' }} title="Edit"><Edit size={16} /></button>
                      <button onClick={(e) => handleDeleteTeam(e, team.id!)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  )}

                  <div style={{ marginTop: '3rem', zIndex: 1, position: 'relative', width: '100%' }}>
                    <div style={{ width: '90px', height: '90px', borderRadius: '22px', padding: '4px', background: 'linear-gradient(135deg, var(--primary), #3b82f6)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', margin: '0 auto 1.5rem auto' }}>
                      <img src={getLogo(team)} alt={team.teamName} style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover', background: 'var(--bg-color)' }} />
                    </div>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: '#fff', letterSpacing: '-0.02em', padding: '0 1rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{team.teamName}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                        <User size={14} color="var(--primary)" /> Captain: {team.captainName}
                      </div>
                      {team.viceCaptainName !== 'TBD' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                          <User size={14} color="#fbbf24" /> VC: {team.viceCaptainName}
                        </div>
                      )}
                    </div>
                  </div>

                  <button className="btn hover-lift" style={{ background: 'var(--primary)', color: '#fff', fontWeight: 700, borderRadius: '30px', padding: '0.7rem 2.5rem', border: 'none', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)', zIndex: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/teams/${team.id}`); }}>
                    <Users size={18} style={{marginRight: '8px'}} /> View Squad
                  </button>
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
              <div className="form-group" style={{ display: 'none' }}>
                <label className="form-label">Coach Name</label>
                <input type="text" className="form-input" 
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
