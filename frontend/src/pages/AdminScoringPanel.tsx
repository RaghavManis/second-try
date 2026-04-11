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
  const [fielderId, setFielderId] = useState<number | ''>('');
  const [nextBatsmanId, setNextBatsmanId] = useState<number | ''>('');
  const [nextBowlerId, setNextBowlerId] = useState<number | ''>('');
  const [manOfTheMatchId, setManOfTheMatchId] = useState<number | ''>('');
  
  // Interaction Safety State
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (matchId) {
      loadMatchData(parseInt(matchId));
    }
  }, [matchId]);

  const loadMatchData = async (id: number, force: boolean = false) => {
    try {
      const detailsRes = await MatchScoringService.getLiveDetails(id, force);
      const detailsData = detailsRes.data;
      applyDetailsUpdate(detailsData);
      
      // Load full squads for playing XI selection (only if needed/initial load)
      if (detailsData.match.teamA.id && detailsData.match.teamB.id) {
        const [squadA, squadB] = await Promise.all([
          PlayerService.getPlayersByTeam(detailsData.match.teamA.id),
          PlayerService.getPlayersByTeam(detailsData.match.teamB.id)
        ]);
        setTeamASquad(squadA.data);
        setTeamBSquad(squadB.data);
      }
    } catch (err) {
      toast.error('Failed to load match data');
    }
  };

  const applyDetailsUpdate = async (detailsData: LiveMatchDetailsDto) => {
    if (!detailsData || !detailsData.match) {
      console.warn('Received incomplete match details, falling back to full refresh...');
      if (matchId) loadMatchData(parseInt(matchId), true);
      return;
    }

    setDetails(detailsData);
    setMatch(detailsData.match);
    
    // Background fetch for the full scorecard if ongoing
    if (detailsData.match.status === 'ONGOING') {
      try {
        const cardRes = await MatchScoringService.getCompleteScorecard(detailsData.match.id!);
        setBattingScorecard(cardRes.data.batting.filter(c => c.innings === detailsData.match.currentInnings));
      } catch (err) {
        console.error('Failed to update background scorecard', err);
      }
    }
  };

  const startLiveScoring = async () => {
    if (isSubmitting) return;
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
      setIsSubmitting(true);
      const res = await MatchScoringService.startLiveScoring(parseInt(matchId), {
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
      await applyDetailsUpdate(res.data);
    } catch (err) {
      toast.error('Failed to start match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitBall = async () => {
    if (isSubmitting) return;
    if (!matchId) return;
    if (isWicket) {
      if (!wicketType || !playerOutId || (!nextBatsmanId && details?.currentWickets !== 9)) {
        return toast.error("Validation Error: Wicket Type, Out Batsman, and Next Batsman are all strictly required to record a wicket (unless it is the 10th wicket).");
      }
      if (['CAUGHT', 'RUN_OUT', 'STUMPED'].includes(wicketType) && !fielderId) {
        return toast.error(`Validation Error: Please select the fielder for ${wicketType.replace('_', ' ')}.`);
      }
    }
    
    try {
      setIsSubmitting(true);
      const res = await MatchScoringService.recordBall(parseInt(matchId), {
        runs,
        extraType: extraType !== '' ? extraType : undefined,
        isWicket,
        wicketType: isWicket ? wicketType : undefined,
        playerOutId: isWicket ? Number(playerOutId) : undefined,
        fielderId: (isWicket && ['CAUGHT', 'RUN_OUT', 'STUMPED'].includes(wicketType)) ? Number(fielderId) : undefined,
        nextBatsmanId: (isWicket && nextBatsmanId !== '') ? Number(nextBatsmanId) : undefined,
        nextBowlerId: nextBowlerId !== '' ? Number(nextBowlerId) : undefined
      });
      toast.success('Ball Recorded');
      // Reset form
      setRuns(0); setExtraType(''); setIsWicket(false);
      setWicketType('BOWLED'); setPlayerOutId(''); setFielderId(''); setNextBatsmanId(''); setNextBowlerId('');
      
      await applyDetailsUpdate(res.data);
    } catch (err) {
      toast.error('Failed to record ball');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmBowler = async () => {
    if (isSubmitting) return;
    if (!matchId || nextBowlerId === '') return;
    try {
      setIsSubmitting(true);
      const res = await MatchScoringService.updateBowler(parseInt(matchId), Number(nextBowlerId));
      toast.success('New Bowler Confirmed');
      setNextBowlerId('');
      await applyDetailsUpdate(res.data);
    } catch (err) {
      toast.error('Failed to update bowler');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [forceBowlerId, setForceBowlerId] = useState<number | ''>('');
  const [showForceBowler, setShowForceBowler] = useState<boolean>(false);

  const forceConfirmBowler = async () => {
    if (isSubmitting) return;
    if (!matchId || forceBowlerId === '') return;
    try {
      setIsSubmitting(true);
      const res = await MatchScoringService.updateBowler(parseInt(matchId), Number(forceBowlerId));
      toast.success('Bowler changed mid-over successfully!');
      setForceBowlerId('');
      setShowForceBowler(false);
      await applyDetailsUpdate(res.data);
    } catch (err) {
      toast.error('Failed to change bowler');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (isSubmitting) return;
    if (!matchId) return;
    const confirmUndo = window.confirm("Undo the last recorded ball?");
    if (!confirmUndo) return;
    
    try {
      setIsSubmitting(true);
      const res = await MatchScoringService.undoLastBall(parseInt(matchId));
      toast.success('Last ball undone successfully');
      await applyDetailsUpdate(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to undo ball');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwapBatsmen = async () => {
    if (isSubmitting) return;
    if (!matchId) return;
    const confirmSwap = window.confirm("Swap striker and non-striker?");
    if (!confirmSwap) return;
    try {
      setIsSubmitting(true);
      const res = await MatchScoringService.swapBatsmen(parseInt(matchId));
      toast.success('Batsmen swapped successfully');
      await applyDetailsUpdate(res.data);
    } catch (err) {
      toast.error('Failed to swap batsmen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const endInnings = async () => {
    if (isSubmitting) return;
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
      setIsSubmitting(true);
      const res = await MatchScoringService.endInnings(parseInt(matchId), {
        strikerId: Number(strikerId),
        nonStrikerId: Number(nonStrikerId),
        bowlerId: Number(bowlerId),
        targetScore
      });
      toast.success('Innings ended. Swapped teams!');
      setStrikerId(''); setNonStrikerId(''); setBowlerId('');
      await applyDetailsUpdate(res.data);
    } catch (err) {
      toast.error('Failed to end innings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeMatchBtn = async () => {
    if (isSubmitting) return;
    if (!matchId || !details) return;
    
    const isConfirmed = window.confirm("Are you absolutely sure you want to Complete this Match? This will archive the scorecards and finalize the winner permanently. This action cannot be officially reversed.");
    if (!isConfirmed) return;
    try {
      setIsSubmitting(true);
      // Very simple auto winner determine
      let winnerId = undefined;
      if (details.match.currentInnings === 2 && details.targetScore !== undefined) {
         if (details.currentScore >= details.targetScore) winnerId = details.match.battingTeam?.id;
         else if (details.currentScore < details.targetScore - 1) winnerId = details.match.bowlingTeam?.id;
         // else tie
      }
      if (!manOfTheMatchId) {
         setIsSubmitting(false);
         return toast.error('Validation Error: You must formally select a Man of the Match before finalizing scoring!');
      }
      await MatchScoringService.completeMatch(parseInt(matchId), winnerId, Number(manOfTheMatchId));
      toast.success('Match completed and scorecard finalized!');
      navigate('/matches');
    } catch (err) {
      toast.error('Failed to complete match');
    } finally {
      setIsSubmitting(false);
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

          <button onClick={startLiveScoring} disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>{isSubmitting ? 'Starting...' : 'Start Match'}</button>
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
      
      {/* LIVE MINI BAR - NOW NON-STICKY */}
      <div className="glass-panel" style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
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
            
            <button className="btn btn-primary" onClick={endInnings} disabled={isSubmitting} style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}>{isSubmitting ? 'Processing...' : 'Start 2nd Innings'}</button>
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
                   {teamASquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </optgroup>
                 <optgroup label={match.teamB.teamName}>
                   {teamBSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </optgroup>
              </select>
            </div>

            <button className="btn btn-primary" disabled={isSubmitting} style={{ background: isSubmitting ? '#94a3b8' : '#10b981', color: '#fff', width: '100%', padding: '1rem', fontSize: '1.2rem' }} onClick={completeMatchBtn}>{isSubmitting ? 'Finalizing Data...' : 'Save Match Verdict'}</button>
         </div>
      )}

      {!isAwaitingSecondInnings && !isMatchOverWarning && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="gradient-text" style={{ margin: 0 }}>Control Panel</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <button 
                   onClick={handleSwapBatsmen}
                   disabled={isSubmitting}
                   className="btn" 
                   style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid #10b981', color: '#10b981', opacity: isSubmitting ? 0.5 : 1 }}>
                   Swap Batsmen
                </button>
                <button 
                   onClick={() => setShowForceBowler(!showForceBowler)}
                   disabled={isSubmitting}
                   className="btn" 
                   style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: showForceBowler ? 'rgba(59, 130, 246, 0.2)' : 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', opacity: isSubmitting ? 0.5 : 1 }}>
                   {showForceBowler ? 'Cancel Change' : 'Change Bowler'}
                </button>
                <button 
                   onClick={handleUndo} 
                   disabled={details.currentOvers === 0 || isSubmitting}
                   className="btn"
                   style={{ 
                     padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'transparent', 
                     color: (details.currentOvers === 0 || isSubmitting) ? 'var(--glass-border)' : '#fbbf24', 
                     border: `1px solid ${(details.currentOvers === 0 || isSubmitting) ? 'var(--glass-border)' : '#fbbf24'}` 
                   }}>
                   Undo Last Ball
                </button>
            </div>
          </div>
          
          {/* BALL BY BALL: THIS OVER DETAILS */}
          <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', 
              borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', flexWrap: 'wrap' 
          }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#94a3b8', marginRight: '1rem', minWidth: '80px' }}>This Over: </h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {details.thisOverBalls.length === 0 ? <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>New Over Started</span> : null}
              {details.thisOverBalls.map((b, i) => {
                let bgColor = '#1e293b'; // dot ball
                if (b === 'W') bgColor = '#ef4444'; // wicket red
                else if (b === '4') bgColor = '#3b82f6'; // four blue
                else if (b === '6') bgColor = '#8b5cf6'; // six purple
                else if (b !== '0' && b.length === 1) bgColor = '#10b981'; // runs green
                else if (b.length > 1) bgColor = '#f59e0b'; // extras warning
                
                return (
                  <div key={i} style={{ 
                    flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', backgroundColor: bgColor, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', 
                    fontSize: b.length > 3 ? '0.65rem' : b.length > 2 ? '0.75rem' : '0.95rem',
                    lineHeight: 1, padding: '2px', boxSizing: 'border-box', overflow: 'hidden', textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {b}
                  </div>
                )
              })}
            </div>
          </div>

          {/* RECENT FORM (TIMELINE) */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '0 1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#94a3b8', marginRight: '1rem', minWidth: '80px' }}>Recent: </h4>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {details.recentBalls.length === 0 ? <span style={{ color: '#64748b', fontSize: '0.9rem' }}>No recent balls</span> : null}
              {details.recentBalls.map((b, i) => {
                let bgColor = 'rgba(255,255,255,0.05)'; // default muted
                let color = '#94a3b8';
                if (b === 'W') { bgColor = 'rgba(239, 68, 68, 0.2)'; color = '#ef4444'; }
                else if (b === '4') { bgColor = 'rgba(59, 130, 246, 0.2)'; color = '#3b82f6'; }
                else if (b === '6') { bgColor = 'rgba(139, 92, 246, 0.2)'; color = '#8b5cf6'; }
                else if (b !== '0' && b.length === 1) { bgColor = 'rgba(16, 185, 129, 0.2)'; color = '#10b981'; }
                else if (b.length > 1) { bgColor = 'rgba(245, 158, 11, 0.2)'; color = '#f59e0b'; }
                
                return (
                  <div key={i} style={{ 
                    flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%', backgroundColor: bgColor, color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', 
                    fontSize: b.length > 3 ? '0.55rem' : b.length > 2 ? '0.65rem' : '0.85rem',
                    lineHeight: 1, padding: '2px', boxSizing: 'border-box', overflow: 'hidden', textAlign: 'center',
                    border: `1px solid ${color}40`
                  }}>
                    {b}
                  </div>
                )
              })}
            </div>
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
              <button className="btn btn-primary" onClick={forceConfirmBowler} disabled={forceBowlerId === '' || isSubmitting} style={{ background: '#3b82f6' }}>{isSubmitting ? 'Swapping...' : 'Confirm Swap'}</button>
            </div>
          )}

          {isOverComplete && !details.currentBowler ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center' }}>
              <h4 style={{ color: '#ef4444' }}>Over Completed. Select Next Bowler to Continue</h4>
              <select className="form-input" value={nextBowlerId} onChange={e => setNextBowlerId(Number(e.target.value))} style={{ maxWidth: '300px', margin: '1rem auto' }}>
                <option value="">Select Bowler</option>
                {bowlingSquad.filter(p => p.id !== details.currentBowler?.id && p.id !== details.previousBowlerId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="btn btn-primary" onClick={confirmBowler} disabled={nextBowlerId === '' || isSubmitting}>{isSubmitting ? 'Confirming...' : 'Confirm Bowler'}</button>
              <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#94a3b8' }}>Since the over is complete, the strike has automatically rotated.</p>
            </div>
          ) : (
          <>
            <div className="action-bar-panel" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
              {/* RUNS */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {[0, 1, 2, 3, 4, 5, 6].map(r => (
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

                    {['CAUGHT', 'RUN_OUT', 'STUMPED'].includes(wicketType) && (
                        <select className="form-input" value={fielderId} onChange={e => setFielderId(Number(e.target.value))}>
                          <option value="">{wicketType === 'CAUGHT' ? 'Caught By' : wicketType === 'STUMPED' ? 'Stumped By' : 'Run Out By'} (Fielder)</option>
                          {bowlingSquad.filter(p => wicketType !== 'STUMPED' || p.id !== details.currentBowler?.id).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                    )}

                    {details.currentWickets < 9 && (
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
                    )}
                  </div>
                )}
              </div>

              <button className="btn btn-primary" disabled={isSubmitting} onClick={submitBall} style={{ width: '100%', height: '54px', fontSize: '1.2rem', fontWeight: 'bold' }}>{isSubmitting ? 'Recording...' : 'Record Delivery'}</button>
            </div>
            
            <div className="mobile-spacer" style={{ height: '420px' }}></div>
          </>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminScoringPanel;
