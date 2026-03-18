import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchService, ScoreService } from '../services/api';
import type { Match } from '../types';
import { Save, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ScoreEntry: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [team1Score, setTeam1Score] = useState({ runs: 0, wickets: 0, oversStr: '0.0' });
  const [team2Score, setTeam2Score] = useState({ runs: 0, wickets: 0, oversStr: '0.0' });

  useEffect(() => {
    if (matchId) {
      fetchMatchData(parseInt(matchId));
    }
  }, [matchId]);

  const fetchMatchData = async (id: number) => {
    try {
      const matchRes = await MatchService.getMatchById(id);
      setMatch(matchRes.data);
      
      try {
        const scoreRes = await ScoreService.getScoreByMatchId(id);
        const score = scoreRes.data;
        if (score) {
          setTeam1Score({ runs: score.teamARuns, wickets: score.teamAWickets, oversStr: score.oversPlayed.toString() });
          setTeam2Score({ runs: score.teamBRuns, wickets: score.teamBWickets, oversStr: score.oversPlayed.toString() });
        }
      } catch (scoreErr) {
        // Scores might not exist yet, which is fine
        console.log("No existing scores found.");
      }
    } catch (e) {
      console.error('Failed to fetch match', e);
      toast.error('Match not found.');
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScore = async () => {
    if (!match) return;
    
    try {
      await ScoreService.recordScore({
        match: match,
        teamARuns: team1Score.runs,
        teamAWickets: team1Score.wickets,
        teamBRuns: team2Score.runs,
        teamBWickets: team2Score.wickets,
        oversPlayed: parseFloat(team2Score.oversStr) || 0 // Assuming both completed
      });
      toast.success(`Match Score saved successfully!`);
    } catch (error) {
      console.error('Failed to save score', error);
      toast.error('Failed to save score. Please verify fields.');
    }
  };

  const handleCompleteMatch = async () => {
    if (!match || !match.id) return;
    if (window.confirm("Are you sure you want to complete this match? Standings will be updated.")) {
      try {
        await MatchService.updateMatchStatus(match.id, 'COMPLETED');
        toast.success('Match completed successfully!');
        navigate('/points-table');
      } catch (error) {
        console.error('Failed to complete match', error);
        toast.error('Failed to complete match.');
      }
    }
  };

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading match details...</div>;
  if (!match) return null;

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title gradient-text">Match Center</h1>
          <p className="page-subtitle">{match.teamA.teamName} vs {match.teamB.teamName}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/matches')}>
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '1rem' }}>Match Status</h3>
        <div style={{ 
          display: 'inline-block',
          background: match.status === 'COMPLETED' ? '#10b98120' : '#3b82f620',
          color: match.status === 'COMPLETED' ? '#10b981' : '#3b82f6',
          padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold' 
        }}>
          {match.status}
        </div>
      </div>

      <div className="dashboard-grid" style={{ gap: '2rem' }}>
        {/* Team 1 Score Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--primary)' }}>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{match.teamA.teamName}</h2>
          
          <div className="form-group">
            <label className="form-label">Runs</label>
            <input type="number" min="0" className="form-input" 
              value={team1Score.runs} onChange={e => setTeam1Score({...team1Score, runs: parseInt(e.target.value) || 0})} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Wickets (0-10)</label>
            <input type="number" min="0" max="10" className="form-input" 
              value={team1Score.wickets} onChange={e => setTeam1Score({...team1Score, wickets: parseInt(e.target.value) || 0})} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Overs (e.g., 19.4)</label>
            <input type="text" className="form-input" 
              value={team1Score.oversStr} onChange={e => setTeam1Score({...team1Score, oversStr: e.target.value})} />
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem', opacity: 0 }} disabled>
            <Save size={18} /> (Saved on overall save)
          </button>
        </div>

        {/* Team 2 Score Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--primary)' }}>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{match.teamB.teamName}</h2>
          
          <div className="form-group">
            <label className="form-label">Runs</label>
            <input type="number" min="0" className="form-input" 
              value={team2Score.runs} onChange={e => setTeam2Score({...team2Score, runs: parseInt(e.target.value) || 0})} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Wickets (0-10)</label>
            <input type="number" min="0" max="10" className="form-input" 
              value={team2Score.wickets} onChange={e => setTeam2Score({...team2Score, wickets: parseInt(e.target.value) || 0})} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Total Overs Played (e.g., 20.0)</label>
            <input type="text" className="form-input" 
              value={team2Score.oversStr} onChange={e => {
                setTeam2Score({...team2Score, oversStr: e.target.value});
                setTeam1Score({...team1Score, oversStr: e.target.value}); // Sync for visual matching currently
              }} />
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem', opacity: 0 }} disabled>
             <Save size={18} /> (Saved on overall save)
          </button>
        </div>
      </div>
      
      {match.status !== 'COMPLETED' && (
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
         <button className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', backgroundColor: '#3b82f6' }} 
            onClick={handleSaveScore}>
            <Save size={20} /> Save Overall Match Score
          </button>
      </div>
      )}

      {match.status !== 'COMPLETED' && (
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }} 
            onClick={handleCompleteMatch}>
            <CheckCircle size={20} /> Mark Match as Completed
          </button>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            Completing the match will lock the scores and update the global Points Table.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScoreEntry;
