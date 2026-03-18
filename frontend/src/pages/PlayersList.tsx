import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerService } from '../services/api';
import type { Player } from '../types';
import { User, Shield, Star } from 'lucide-react';
import { AnimatedSection } from '../components/AnimatedSection';

const PlayersList: React.FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await PlayerService.getAllPlayers();
      setPlayers(res.data);
    } catch (error) {
      console.error('Failed to fetch players', error);
    } finally {
      setLoading(false);
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

  const getRoleDisplay = (role: string) => {
    return role.replace('_', ' ');
  };

  const getRandomAvatar = (id: number) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`;

  const PlayerCard = ({ player }: { player: Player }) => (
    <div className="glass-panel hover-lift" style={{ padding: '1.25rem', cursor: 'pointer', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }} onClick={() => navigate(`/players/${player.id}`)}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--background)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: `1px solid ${getRoleColor(player.role)}`, color: getRoleColor(player.role) }}>
        {player.jerseyNumber || '-'}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <img src={getRandomAvatar(player.id || 0)} alt={player.name} style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
            {player.name}
            {player.isCaptain && <span style={{color: 'var(--primary)', marginLeft: '6px', fontSize: '0.8rem'}}>(C)</span>}
            {player.isViceCaptain && <span style={{color: 'var(--text-secondary)', marginLeft: '6px', fontSize: '0.8rem'}}>(VC)</span>}
          </h3>
          <div style={{ 
            fontSize: '0.75rem', color: getRoleColor(player.role), background: `${getRoleColor(player.role)}20`, 
            padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '4px', fontWeight: 600
          }}>
            {getRoleDisplay(player.role)}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
        <Shield size={14} color="var(--primary)" />
        <span style={{ fontSize: '0.9rem' }}>{player.team.teamName}</span>
      </div>
    </div>
  );

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading players...</div>;

  const starPlayers = players.slice(0, 6);
  const batsmen = players.filter(p => p.role === 'BATSMAN');
  const bowlers = players.filter(p => p.role === 'BOWLER');
  const allRounders = players.filter(p => p.role === 'ALL_ROUNDER');

  return (
    <div className="dashboard-wrapper">
      {/* SECTION 1: HERO */}
      <div className="parallax-hero" style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '-80px'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem' }}>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Tournament Players
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            Explore the athletes powering the competition.
          </p>
          <button onClick={() => document.getElementById('players-content')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary hover-lift" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', borderRadius: '30px' }}>
            Discover Talent <Star size={20} style={{ marginLeft: '8px' }}/>
          </button>
        </div>
      </div>

      <div id="players-content" className="page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* SECTION 2: STAR PLAYERS */}
        {starPlayers.length > 0 && (
        <AnimatedSection>
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Featured Stars</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>Athletes making headlines right now.</p>
          <div className="horizontal-scroller">
            {starPlayers.map(player => (
              <div key={player.id} style={{ width: '300px', flex: '0 0 auto' }}>
                <PlayerCard player={player} />
              </div>
            ))}
          </div>
        </AnimatedSection>
        )}

        {/* SECTION 3: ROLE BASED (BATSMEN) */}
        {batsmen.length > 0 && (
        <AnimatedSection>
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Top Batsmen</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>The run machines of the tournament.</p>
          <div className="horizontal-scroller">
            {batsmen.map(player => (
              <div key={player.id} style={{ width: '280px', flex: '0 0 auto' }}>
                <PlayerCard player={player} />
              </div>
            ))}
          </div>
        </AnimatedSection>
        )}

        {/* SECTION 3.5: ROLE BASED (BOWLERS) */}
        {bowlers.length > 0 && (
        <AnimatedSection>
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Key Bowlers</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>Taking wickets and restricting runs.</p>
          <div className="horizontal-scroller">
            {bowlers.map(player => (
              <div key={player.id} style={{ width: '280px', flex: '0 0 auto' }}>
                <PlayerCard player={player} />
              </div>
            ))}
          </div>
        </AnimatedSection>
        )}

        {/* SECTION 3.75: ROLE BASED (ALL ROUNDERS) */}
        {allRounders.length > 0 && (
        <AnimatedSection>
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>All Rounders</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>The ultimate match winners.</p>
          <div className="horizontal-scroller">
            {allRounders.map(player => (
              <div key={player.id} style={{ width: '280px', flex: '0 0 auto' }}>
                <PlayerCard player={player} />
              </div>
            ))}
          </div>
        </AnimatedSection>
        )}

        {/* SECTION 4: ALL PLAYERS DIRECTORY */}
        <AnimatedSection>
          <h2 className="scroll-section-title gradient-text" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Full Directory</h2>
          <p className="scroll-section-subtitle" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>Every registered player in the database.</p>
          
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {players.length === 0 ? (
              <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                <User size={48} color="var(--text-secondary)" style={{marginBottom: '1rem'}} />
                <h3 style={{color: 'var(--text-secondary)'}}>No players registered yet.</h3>
              </div>
            ) : (
              players.map(player => (
                <PlayerCard key={player.id} player={player} />
              ))
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default PlayersList;
