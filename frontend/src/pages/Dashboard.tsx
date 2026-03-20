import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { TeamService, MatchService, PlayerService, PointsService } from '../services/api';
import { Users, Calendar, Trophy, ArrowRight, Shield, MapPin, Clock } from 'lucide-react';
import type { Team, Match, Player, PointsTableEntry } from '../types';
import { AnimatedSection } from '../components/AnimatedSection';
import { AutoScrollContainer } from '../components/AutoScrollContainer';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ teams: 0, matches: 0, completedMatches: 0 });
  
  // Preview Data State
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [standings, setStandings] = useState<PointsTableEntry[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [teamsRes, matchesRes, playersRes, pointsRes] = await Promise.all([
          TeamService.getAllTeams(),
          MatchService.getAllMatches(),
          PlayerService.getAllPlayers(),
          PointsService.getPointsTable()
        ]);
        
        const allMatches = matchesRes.data;
        const completed = allMatches.filter((m: Match) => m.status === 'COMPLETED').length;
        
        setStats({
          teams: teamsRes.data.length,
          matches: allMatches.length,
          completedMatches: completed,
        });

        // Slice previews
        setTeams(teamsRes.data.slice(0, 5)); // top 5 teams
        setRecentMatches(allMatches.slice(0, 5)); // up to 5 recent matches
        setPlayers(playersRes.data.slice(0, 8)); // up to 8 players for preview
        setStandings(pointsRes.data.slice(0, 4)); // top 4 standings
        
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'SCHEDULED': return '#3b82f6';
      case 'ONGOING': return '#f59e0b';
      case 'COMPLETED': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRandomAvatar = (id: number) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`;
  const getRandomLogo = (id: number) => `https://api.dicebear.com/7.x/identicon/svg?seed=Team${id}&backgroundColor=1e293b`;

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading Dashboard Experience...</div>;

  return (
    <div className="dashboard-wrapper">
      
      {/* SECTION 1: PARALLAX HERO */}
      <div className="parallax-hero" style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        backgroundAttachment: 'fixed',
        backgroundImage: 'url("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        marginTop: '-80px' // offset navbar slightly if needed
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ textAlign: 'center', zIndex: 2, padding: '2rem' }}>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Ultimate Cricket League
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            Experience the thrill of the tournament right from your dashboard. Track matches, teams, and star players in real-time.
          </p>
          <button onClick={() => document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary hover-lift" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', borderRadius: '30px' }}>
            Explore Tournament <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <div className="dashboard-sections">
        
        {/* SECTION 2: TOURNAMENT STATS */}
        <AnimatedSection id="stats-section" className="bg-section-1">
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
        <AnimatedSection className="bg-section-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
            <div>
              <h2 className="scroll-section-title gradient-text" style={{ marginBottom: 0, textAlign: 'left' }}>Action Center</h2>
              <p className="scroll-section-subtitle" style={{ marginBottom: 0, textAlign: 'left' }}>Latest and upcoming fixtures.</p>
            </div>
            <NavLink to="/matches" className="btn btn-secondary hover-lift">View All <ArrowRight size={16}/></NavLink>
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
              <div key={match.id} className="glass-panel hover-lift" style={{ padding: '1.5rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', 
                  background: `${getStatusColor(match.status)}20`, color: getStatusColor(match.status), 
                  padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                  {match.status}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1.5rem' }}>
                  <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={team1.teamLogo || getRandomLogo(team1.id || 0)} alt={team1.teamName} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                    <h3 className="gradient-text" style={{ fontSize: '1.1rem' }}>{team1.teamName}</h3>
                    {(match.status === 'COMPLETED' || match.status === 'ONGOING') && (
                       <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff', marginTop: '0.2rem' }}>
                          {team1Info}
                       </div>
                    )}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '0 1rem' }}>VS</div>
                  <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={team2.teamLogo || getRandomLogo(team2.id || 0)} alt={team2.teamName} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                    <h3 className="gradient-text" style={{ fontSize: '1.1rem' }}>{team2.teamName}</h3>
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
                    <Clock size={16} /> <span>{new Date(match.matchDate).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <MapPin size={16} /> <span>{match.overs} Overs Match</span>
                  </div>
                </div>
              </div>
              );
            })}
          </AutoScrollContainer>
        </AnimatedSection>
        )}

        {/* SECTION 4: TEAMS OVERVIEW */}
        {teams.length > 0 && (
        <AnimatedSection className="bg-section-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
            <div>
              <h2 className="scroll-section-title gradient-text" style={{ marginBottom: 0, textAlign: 'left' }}>The Contenders</h2>
              <p className="scroll-section-subtitle" style={{ marginBottom: 0, textAlign: 'left' }}>Franchises battling for the cup.</p>
            </div>
            <NavLink to="/teams" className="btn btn-secondary hover-lift">View All <ArrowRight size={16}/></NavLink>
          </div>

          <AutoScrollContainer className="horizontal-scroller">
            {teams.map(team => (
              <div key={team.id} className="glass-panel hover-lift" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => navigate(`/teams/${team.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <img src={team.teamLogo || getRandomLogo(team.id || 0)} alt={team.teamName} style={{ width: 56, height: 56, borderRadius: '12px', objectFit: 'cover' }} />
                  <div>
                    <h3 className="gradient-text" style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{team.teamName}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <Shield size={14} color="var(--primary)" /> Coach: {team.coachName}
                    </div>
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
            <NavLink to="/players" className="btn btn-secondary hover-lift">View All <ArrowRight size={16}/></NavLink>
          </div>

          <AutoScrollContainer className="horizontal-scroller">
            {players.map(player => (
              <div key={player.id} className="glass-panel hover-lift" style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={() => navigate(`/players/${player.id}`)}>
                <img src={player.playerImage || getRandomAvatar(player.id || 0)} alt={player.name} style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>{player.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>{player.role.replace('_', ' ')}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{player.team.teamName}</div>
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
            <NavLink to="/points-table" className="btn btn-secondary hover-lift">Full Table <ArrowRight size={16}/></NavLink>
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
                      {index === 0 && <Trophy size={16} color="#fbbf24" style={{marginRight: '0.5rem'}} />}
                      <img src={(teamObj && teamObj.teamLogo) || getRandomLogo(pt.teamId || 0)} alt={pt.teamName} style={{ width: 24, height: 24, borderRadius: '50%', marginRight: '10px', objectFit: 'cover' }} />
                      {pt.teamName}
                    </td>
                    <td>{pt.matchesPlayed}</td>
                    <td className="text-green">{pt.wins}</td>
                    <td className="font-bold text-primary">{pt.points}</td>
                    <td>{pt.netRunRate ? pt.netRunRate.toFixed(2) : '0.00'}</td>
                  </tr>
                )}
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
