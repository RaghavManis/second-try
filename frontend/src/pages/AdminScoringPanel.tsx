import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchService, MatchScoringService, PlayerService } from '../services/api';
import type { Match, Player, LiveMatchDetailsDto, ScorecardBatting } from '../types';
import toast from 'react-hot-toast';

const AdminScoringPanel: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [details, setDetails] = useState<LiveMatchDetailsDto | null>(null);
  
  const [teamASquad, setTeamASquad] = useState<Player[]>([]);
  const [teamBSquad, setTeamBSquad] = useState<Player[]>([]);
  
  const [battingScorecard, setBattingScorecard] = useState<ScorecardBatting[]>([]);

  // Playing XI Selection
  const [playingXiTeamA, setPlayingXiTeamA] = useState<number[]>([]);
  const [playingXiTeamB, setPlayingXiTeamB] = useState<number[]>([]);

  // Setup state
  const [tossWinnerId, setTossWinnerId] = useState<number | ''>('');
  const [tossDecision, setTossDecision] = useState<'BATTING' | 'BOWLING'>('BATTING');
  const [strikerId, setStrikerId] = useState<number | ''>('');
  const [nonStrikerId, setNonStrikerId] = useState<number | ''>('');
  const [bowlerId, setBowlerId] = useState<number | ''>('');

  // Ball submission state
  // Ball submission state
  const [runs, setRuns] = useState<number>(0);
  const [extraType, setExtraType] = useState<string>(''); // '', WIDE, NO_BALL, BYE, LEG_BYE
  const [isWicket, setIsWicket] = useState<boolean>(false);
  const [wicketType, setWicketType] = useState<string>('BOWLED');
  const [playerOutId, setPlayerOutId] = useState<number | ''>('');
  const [nextBatsmanId, setNextBatsmanId] = useState<number | ''>('');
  const [nextBowlerId, setNextBowlerId] = useState<number | ''>('');
  const [manOfTheMatchId, setManOfTheMatchId] = useState<number | ''>('');
  useEffect(() => {
    if (matchId) {
      loadMatchData(parseInt(matchId));
    }
  }, [matchId]);

  const loadMatchData = async (id: number) => {
    try {
      const matchRes = await MatchService.getMatchById(id);
      setMatch(matchRes.data);
      if (matchRes.data.status === 'ONGOING') {
        const detailsRes = await MatchScoringService.getLiveDetails(id);
        setDetails(detailsRes.data);
        const cardRes = await MatchScoringService.getCompleteScorecard(id);
        setBattingScorecard(cardRes.data.batting.filter(c => c.innings === detailsRes.data.match.currentInnings));
      }
      
      if (matchRes.data.teamA.id && matchRes.data.teamB.id) {
        const squadARes = await PlayerService.getPlayersByTeam(matchRes.data.teamA.id);
        const squadBRes = await PlayerService.getPlayersByTeam(matchRes.data.teamB.id);
        setTeamASquad(squadARes.data);
        setTeamBSquad(squadBRes.data);
      }
    } catch (err) {
      toast.error('Failed to load match data');
    }
  };

  const startLiveScoring = async () => {
    if (!matchId || tossWinnerId === '' || strikerId === '' || nonStrikerId === '' || bowlerId === '') {
      return toast.error('Please complete all setup fields');
    }
    if (playingXiTeamA.length !== 11 || playingXiTeamB.length !== 11) {
      return toast.error('Please select exactly 11 players for both teams');
    }
    if (strikerId === nonStrikerId) {
      return toast.error('Striker and Non-Striker cannot be the same player');
    }

    try {
      await MatchScoringService.startLiveScoring(parseInt(matchId), {
        tossWinnerId: Number(tossWinnerId),
        tossDecision,
        strikerId: Number(strikerId),
        nonStrikerId: Number(nonStrikerId),
        openingBowlerId: Number(bowlerId),
        totalOvers: match?.overs || 20,
        playingXiTeamAIds: playingXiTeamA,
        playingXiTeamBIds: playingXiTeamB
      });
      toast.success('Match Started!');
      loadMatchData(parseInt(matchId));
    } catch (err) {
      toast.error('Failed to start match');
    }
  };

  const submitBall = async () => {
    if (!matchId) return;
    if (isWicket) {
      if (!wicketType || !playerOutId || !nextBatsmanId) {
        return toast.error("Validation Error: Wicket Type, Out Batsman, and Next Batsman are all strictly required to record a wicket.");
      }
    }
    
    try {
      await MatchScoringService.recordBall(parseInt(matchId), {
        runs,
        extraType: extraType !== '' ? extraType : undefined,
        isWicket,
        wicketType: isWicket ? wicketType : undefined,
        playerOutId: isWicket ? Number(playerOutId) : undefined,
        nextBatsmanId: (isWicket && nextBatsmanId !== '') ? Number(nextBatsmanId) : undefined,
        nextBowlerId: nextBowlerId !== '' ? Number(nextBowlerId) : undefined
      });
      toast.success('Ball Recorded');
      // Reset form
      setRuns(0); setExtraType(''); setIsWicket(false);
      setWicketType('BOWLED'); setPlayerOutId(''); setNextBatsmanId(''); setNextBowlerId('');
      
      loadMatchData(parseInt(matchId));
    } catch (err) {
      toast.error('Failed to record ball');
    }
  };

  const confirmBowler = async () => {
    if (!matchId || nextBowlerId === '') return;
    try {
      await MatchScoringService.updateBowler(parseInt(matchId), Number(nextBowlerId));
      toast.success('New Bowler Confirmed');
      setNextBowlerId('');
      loadMatchData(parseInt(matchId));
    } catch (err) {
      toast.error('Failed to update bowler');
    }
  };

  const [forceBowlerId, setForceBowlerId] = useState<number | ''>('');
  const [showForceBowler, setShowForceBowler] = useState<boolean>(false);

  const forceConfirmBowler = async () => {
    if (!matchId || forceBowlerId === '') return;
    try {
      await MatchScoringService.updateBowler(parseInt(matchId), Number(forceBowlerId));
      toast.success('Bowler changed mid-over successfully!');
      setForceBowlerId('');
      setShowForceBowler(false);
      loadMatchData(parseInt(matchId));
    } catch (err) {
      toast.error('Failed to change bowler');
    }
  };

  const handleUndo = async () => {
    if (!matchId) return;
    const confirmUndo = window.confirm("Undo the last recorded ball?");
    if (!confirmUndo) return;
    
    try {
      await MatchScoringService.undoLastBall(parseInt(matchId));
      toast.success('Last ball undone successfully');
      loadMatchData(parseInt(matchId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to undo ball');
    }
  };

  const endInnings = async () => {
    if (!matchId || !details) return;
    if (strikerId === '' || nonStrikerId === '' || bowlerId === '') {
      return toast.error('Validation Error: Please select openers and bowler for the next innings first.');
    }
    if (strikerId === nonStrikerId) {
      return toast.error('Validation Error: Striker and Non-Striker cannot be the same player!');
    }
    
    // Auto calculate target: current score + 1
    const targetScore = details.currentScore + 1;
    
    try {
      await MatchScoringService.endInnings(parseInt(matchId), {
        strikerId: Number(strikerId),
        nonStrikerId: Number(nonStrikerId),
        bowlerId: Number(bowlerId),
        targetScore
      });
      toast.success('Innings ended. Swapped teams!');
      setStrikerId(''); setNonStrikerId(''); setBowlerId('');
      loadMatchData(parseInt(matchId));
    } catch (err) {
      toast.error('Failed to end innings');
    }
  };

  const completeMatchBtn = async () => {
    if (!matchId || !details) return;
    try {
      // Very simple auto winner determine
      let winnerId = undefined;
      if (details.match.currentInnings === 2 && details.targetScore !== undefined) {
         if (details.currentScore >= details.targetScore) winnerId = details.match.battingTeam?.id;
         else if (details.currentScore < details.targetScore - 1) winnerId = details.match.bowlingTeam?.id;
         // else tie
      }
      if (!manOfTheMatchId) {
         return toast.error('Validation Error: You must formally select a Man of the Match before finalizing scoring!');
      }
      await MatchScoringService.completeMatch(parseInt(matchId), winnerId, Number(manOfTheMatchId));
      toast.success('Match completed and scorecard finalized!');
      navigate('/matches');
    } catch (err) {
      toast.error('Failed to complete match');
    }
  };

  if (!match) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading...</div>;

  if (match.status === 'SCHEDULED') {
    return (
      <div className="page-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="page-title gradient-text text-center">Setup Scoring</h1>
        <div className="glass-panel">
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>{match.teamA.teamName} vs {match.teamB.teamName}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem' }}>{match.teamA.teamName} Playing XI ({playingXiTeamA.length}/11)</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px' }}>
                {teamASquad.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={playingXiTeamA.includes(p.id!)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (playingXiTeamA.length < 11) setPlayingXiTeamA([...playingXiTeamA, p.id!]);
                          else toast.error('11 players already selected');
                        } else {
                          setPlayingXiTeamA(playingXiTeamA.filter(id => id !== p.id));
                          // Reset opener selections if they are unselected from XI
                          if (strikerId === p.id) setStrikerId('');
                          if (nonStrikerId === p.id) setNonStrikerId('');
                          if (bowlerId === p.id) setBowlerId('');
                        }
                      }}
                    />
                    {p.name} <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>({p.role})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem' }}>{match.teamB.teamName} Playing XI ({playingXiTeamB.length}/11)</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px' }}>
                {teamBSquad.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={playingXiTeamB.includes(p.id!)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (playingXiTeamB.length < 11) setPlayingXiTeamB([...playingXiTeamB, p.id!]);
                          else toast.error('11 players already selected');
                        } else {
                          setPlayingXiTeamB(playingXiTeamB.filter(id => id !== p.id));
                          if (strikerId === p.id) setStrikerId('');
                          if (nonStrikerId === p.id) setNonStrikerId('');
                          if (bowlerId === p.id) setBowlerId('');
                        }
                      }}
                    />
                    {p.name} <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>({p.role})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--glass-border)', margin: '2rem 0' }} />

          <div className="form-group">
            <label>Toss Won By</label>
            <select className="form-input" value={tossWinnerId} onChange={e => setTossWinnerId(Number(e.target.value))}>
              <option value="">Select Team</option>
              <option value={match.teamA.id}>{match.teamA.teamName}</option>
              <option value={match.teamB.id}>{match.teamB.teamName}</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Decision</label>
            <select className="form-input" value={tossDecision} onChange={e => setTossDecision(e.target.value as any)}>
              <option value="BATTING">Batting</option>
              <option value="BOWLING">Bowling</option>
            </select>
          </div>

          <hr style={{ borderColor: 'var(--glass-border)', margin: '2rem 0' }} />

          <div className="form-group">
            <label>Opening Striker</label>
            <select className="form-input" value={strikerId} onChange={e => { setStrikerId(Number(e.target.value)); if (Number(e.target.value) === nonStrikerId) setNonStrikerId(''); }}>
              <option value="">Select Player</option>
              {(tossDecision === 'BATTING' ? (tossWinnerId === match.teamA.id ? teamASquad.filter(p => playingXiTeamA.includes(p.id!)) : teamBSquad.filter(p => playingXiTeamB.includes(p.id!))) : (tossWinnerId === match.teamA.id ? teamBSquad.filter(p => playingXiTeamB.includes(p.id!)) : teamASquad.filter(p => playingXiTeamA.includes(p.id!)))).map(p => (
                <option key={p.id} value={p.id} disabled={p.id === nonStrikerId}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Opening Non-Striker</label>
            <select className="form-input" value={nonStrikerId} onChange={e => { setNonStrikerId(Number(e.target.value)); if (Number(e.target.value) === strikerId) setStrikerId(''); }}>
              <option value="">Select Player</option>
              {(tossDecision === 'BATTING' ? (tossWinnerId === match.teamA.id ? teamASquad.filter(p => playingXiTeamA.includes(p.id!)) : teamBSquad.filter(p => playingXiTeamB.includes(p.id!))) : (tossWinnerId === match.teamA.id ? teamBSquad.filter(p => playingXiTeamB.includes(p.id!)) : teamASquad.filter(p => playingXiTeamA.includes(p.id!)))).map(p => (
                <option key={p.id} value={p.id} disabled={p.id === strikerId}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Opening Bowler</label>
            <select className="form-input" value={bowlerId} onChange={e => setBowlerId(Number(e.target.value))}>
              <option value="">Select Player</option>
              {(tossDecision === 'BATTING' ? (tossWinnerId === match.teamA.id ? teamBSquad.filter(p => playingXiTeamB.includes(p.id!)) : teamASquad.filter(p => playingXiTeamA.includes(p.id!))) : (tossWinnerId === match.teamA.id ? teamASquad.filter(p => playingXiTeamA.includes(p.id!)) : teamBSquad.filter(p => playingXiTeamB.includes(p.id!)))).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button onClick={startLiveScoring} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Start Match</button>
        </div>
      </div>
    );
  }

  if (match.status === 'COMPLETED') {
    return <div className="page-container text-center"><h1 className="page-title gradient-text">Match is already completed.</h1><button className="btn" onClick={() => navigate('/matches')}>Back to Matches</button></div>;
  }

  // ONGOING STATE
  if (!details) return <div className="loader text-center">Loading details...</div>;

  // Use the established Playing XI from the backend now during scoring
  const battingSquad = details.match.battingTeam?.id === match.teamA.id 
    ? (details.match.playingXiTeamA && details.match.playingXiTeamA.length > 0 ? details.match.playingXiTeamA : teamASquad) 
    : (details.match.playingXiTeamB && details.match.playingXiTeamB.length > 0 ? details.match.playingXiTeamB : teamBSquad);
    
  const bowlingSquad = details.match.bowlingTeam?.id === match.teamA.id 
    ? (details.match.playingXiTeamA && details.match.playingXiTeamA.length > 0 ? details.match.playingXiTeamA : teamASquad) 
    : (details.match.playingXiTeamB && details.match.playingXiTeamB.length > 0 ? details.match.playingXiTeamB : teamBSquad);

  const roleOrder: Record<string, number> = { 'BATSMAN': 1, 'ALL_ROUNDER': 2, 'WICKET_KEEPER': 3, 'BOWLER': 4 };
  const sortedBatters = [...battingSquad].sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));

  const isOverComplete = ((details.currentOvers * 10) % 10) === 0 && details.currentOvers > 0;
  
  const isMatchOverWarning = details.match.currentInnings === 2 && (details.currentWickets >= 10 || (details.match.overs && details.currentOvers >= details.match.overs) || (details.targetScore && details.currentScore >= details.targetScore));
  const isAwaitingSecondInnings = !details.currentStriker && details.match.currentInnings === 2;

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* LIVE MINI BAR */}
      <div className="glass-panel sticky-top" style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{details.match.battingTeam?.teamName} <span style={{ color: 'var(--primary)' }}>{details.currentScore} - {details.currentWickets}</span></h2>
          <p style={{ margin: 0, color: '#94a3b8' }}>Overs: {details.currentOvers} | CRR: {details.currentRunRate.toFixed(2)}</p>
          {details.targetScore && <p style={{ margin: 0, color: '#fbbf24', fontWeight: 'bold' }}>Target: {details.targetScore} | REQ: {details.requiredRunRate?.toFixed(2)}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Striker: <strong>{details.currentStriker?.name}</strong> {details.strikerRuns}({details.strikerBalls})</div>
          <div>Non: <strong>{details.currentNonStriker?.name}</strong> {details.nonStrikerRuns}({details.nonStrikerBalls})</div>
          <div style={{ color: 'var(--primary)', marginTop: '0.4rem' }}>Bowler: <strong>{details.currentBowler ? details.currentBowler.name : 'AWAITING NEXT OVER'}</strong> {details.bowlerRuns}-{details.bowlerWickets}</div>
        </div>
      </div>

      {isAwaitingSecondInnings && !isMatchOverWarning && (
         <div className="glass-panel text-center animate-slide-up" style={{ marginTop: '2rem', border: '2px solid var(--primary)', padding: '2.5rem' }}>
            <h2 className="gradient-text gradient-secondary" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>1st Innings Complete!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>The target for {details.match.battingTeam!.teamName} is <strong style={{color: '#fff', fontSize: '1.2rem'}}>{details.targetScore} runs</strong>. Setup the chase below.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Opening Striker</label>
                  <select className="form-input" value={strikerId} onChange={e => { setStrikerId(Number(e.target.value)); if (Number(e.target.value) === nonStrikerId) setNonStrikerId(''); }}>
                    <option value="">Striker</option>
                    {sortedBatters.map(p => <option key={p.id} value={p.id} disabled={p.id === nonStrikerId}>{p.name} ({p.role.replace('_', ' ')})</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Opening Non-Striker</label>
                  <select className="form-input" value={nonStrikerId} onChange={e => { setNonStrikerId(Number(e.target.value)); if (Number(e.target.value) === strikerId) setStrikerId(''); }}>
                    <option value="">Non-Striker</option>
                    {sortedBatters.map(p => <option key={p.id} value={p.id} disabled={p.id === strikerId}>{p.name} ({p.role.replace('_', ' ')})</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Opening Bowler</label>
                  <select className="form-input" value={bowlerId} onChange={e => setBowlerId(Number(e.target.value))}>
                    <option value="">Bowler</option>
                    {bowlingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
            </div>
            
            <button className="btn btn-primary" onClick={endInnings} style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}>Start 2nd Innings</button>
         </div>
      )}

      {isMatchOverWarning && (
         <div className="glass-panel text-center animate-slide-up" style={{ marginTop: '2rem', border: '2px solid #10b981', padding: '2.5rem' }}>
            <h2 className="gradient-text gradient-success" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Match Completed!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>Finalize the scoring data and select the standout performer of the game.</p>
            
            <div className="form-group" style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto 2rem auto' }}>
              <label>Assign Man of the Match</label>
              <select className="form-input" value={manOfTheMatchId} onChange={e => setManOfTheMatchId(Number(e.target.value))}>
                 <option value="">-- Choose Player --</option>
                 <optgroup label={match.teamA.teamName}>
                   {teamASquad.filter(p => match.playingXiTeamA?.some(xi => xi.id === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </optgroup>
                 <optgroup label={match.teamB.teamName}>
                   {teamBSquad.filter(p => match.playingXiTeamB?.some(xi => xi.id === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </optgroup>
              </select>
            </div>

            <button className="btn btn-primary" style={{ background: '#10b981', color: '#fff', width: '100%', padding: '1rem', fontSize: '1.2rem' }} onClick={completeMatchBtn}>Save Match Verdict</button>
         </div>
      )}

      {!isAwaitingSecondInnings && !isMatchOverWarning && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="gradient-text" style={{ margin: 0 }}>Control Panel</h3>
            <button 
               onClick={() => setShowForceBowler(!showForceBowler)}
               className="btn" 
               style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: showForceBowler ? 'rgba(59, 130, 246, 0.2)' : 'transparent', border: '1px solid #3b82f6', color: '#3b82f6' }}>
               {showForceBowler ? 'Cancel Change' : 'Change Bowler'}
            </button>
          </div>
          
          <p className="text-center" style={{ color: '#ef4444', fontWeight: 'bold' }}>Caution: Actions are permanent.</p>

          {showForceBowler && (
            <div className="animate-slide-up" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center' }}>
              <h4 style={{ color: '#3b82f6', margin: '0 0 1rem 0' }}>Change Bowler Mid-Over</h4>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                Use this if a bowler is injured or needs to be swapped. The active over count will resume normally.
              </p>
              <select className="form-input" value={forceBowlerId} onChange={e => setForceBowlerId(Number(e.target.value))} style={{ maxWidth: '300px', margin: '0 auto 1rem auto' }}>
                <option value="">Select Replacement Bowler</option>
                {bowlingSquad.filter(p => p.id !== details.currentBowler?.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="btn btn-primary" onClick={forceConfirmBowler} disabled={forceBowlerId === ''} style={{ background: '#3b82f6' }}>Confirm Swap</button>
            </div>
          )}

          {isOverComplete && !details.currentBowler ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center' }}>
              <h4 style={{ color: '#ef4444' }}>Over Completed. Select Next Bowler to Continue</h4>
              <select className="form-input" value={nextBowlerId} onChange={e => setNextBowlerId(Number(e.target.value))} style={{ maxWidth: '300px', margin: '1rem auto' }}>
                <option value="">Select Bowler</option>
                {bowlingSquad.filter(p => p.id !== details.currentBowler?.id && p.id !== details.previousBowlerId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="btn btn-primary" onClick={confirmBowler} disabled={nextBowlerId === ''}>Confirm Bowler</button>
              <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#94a3b8' }}>Since the over is complete, the strike has automatically rotated.</p>
            </div>
          ) : (
          <>
            <div className="sticky-bottom-action-bar">
              {/* RUNS */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {[0, 1, 2, 3, 4, 6].map(r => (
                  <button 
                    key={r} 
                    className={`btn ${runs === r && !isWicket ? 'btn-primary' : ''}`}
                    onClick={() => { setRuns(r); setIsWicket(false); setExtraType(''); }}
                    style={{ width: '55px', height: '55px', padding: '0', borderRadius: '50%', fontSize: '1.4rem', fontWeight: 'bold', border: runs !== r ? '1px solid var(--glass-border)' : 'none' }}>
                    {r}
                  </button>
                ))}
              </div>

              {/* EXTRAS */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {['WIDE', 'NO_BALL', 'BYE', 'LEG_BYE'].map(ex => (
                  <button 
                    key={ex} 
                    className={`btn ${extraType === ex ? 'btn-primary' : ''}`}
                    onClick={() => setExtraType(ex === extraType ? '' : ex)}
                    style={{ borderRadius: '30px', padding: '0.5rem 1rem', border: extraType !== ex ? '1px solid var(--glass-border)' : 'none' }}>
                    {ex.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* WICKET TOGGLE */}
              <div style={{ textAlign: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: isWicket ? 'rgba(239, 68, 68, 0.1)' : 'transparent', borderRadius: '12px', border: isWicket ? '1px solid #ef4444' : 'none' }}>
                <button 
                  className="btn" 
                  onClick={() => setIsWicket(!isWicket)}
                  style={{ background: isWicket ? '#ef4444' : 'transparent', color: isWicket ? '#fff' : '#ef4444', border: '1px solid #ef4444', width: '100%' }}>
                  WICKET LOGIC {isWicket ? 'ENABLED' : 'DISABLED'}
                </button>

                {isWicket && (
                  <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                    <select className="form-input" value={wicketType} onChange={e => setWicketType(e.target.value)}>
                      <option value="BOWLED">Bowled</option>
                      <option value="CAUGHT">Caught</option>
                      <option value="LBW">LBW</option>
                      <option value="RUN_OUT">Run Out</option>
                      <option value="STUMPED">Stumped</option>
                      <option value="HIT_WICKET">Hit Wicket</option>
                    </select>
                    
                    <select className="form-input" value={playerOutId} onChange={e => setPlayerOutId(Number(e.target.value))}>
                      <option value="">Who is out?</option>
                      <option value={details.currentStriker?.id}>{details.currentStriker?.name}</option>
                      <option value={details.currentNonStriker?.id}>{details.currentNonStriker?.name}</option>
                    </select>

                    <select className="form-input" value={nextBatsmanId} onChange={e => setNextBatsmanId(Number(e.target.value))}>
                      <option value="">Next Batsman In</option>
                      {sortedBatters.filter(p => 
                        p.id !== details.currentStriker?.id && 
                        p.id !== details.currentNonStriker?.id && 
                        !battingScorecard.find(card => card.player.id === p.id && card.howOut && card.howOut.toLowerCase() !== 'not out')
                      ).map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.role.replace('_', ' ')})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button className="btn btn-primary" onClick={submitBall} style={{ width: '100%', height: '54px', fontSize: '1.2rem', fontWeight: 'bold' }}>Record Delivery</button>
            </div>
            
            {/* Spacer to prevent content from hiding behind sticky action bar on mobile */}
            <div className="mobile-spacer" style={{ height: '320px' }}></div>
          </>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button 
               className="btn" 
               onClick={handleUndo} 
               disabled={details.currentOvers === 0}
               style={{ 
                 background: 'transparent', 
                 color: (details.currentOvers === 0) ? 'var(--glass-border)' : '#fbbf24', 
                 border: `1px solid ${(details.currentOvers === 0) ? 'var(--glass-border)' : '#fbbf24'}` 
               }}>
               Undo Last Ball
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminScoringPanel;
