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
      return toast.error('Please select openers for the next innings first below.');
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
      await MatchScoringService.completeMatch(parseInt(matchId), winnerId);
      toast.success('Match completed and scorecard saved!');
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
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
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
            <select className="form-input" value={strikerId} onChange={e => setStrikerId(Number(e.target.value))}>
              <option value="">Select Player</option>
              {(tossDecision === 'BATTING' ? (tossWinnerId === match.teamA.id ? teamASquad.filter(p => playingXiTeamA.includes(p.id!)) : teamBSquad.filter(p => playingXiTeamB.includes(p.id!))) : (tossWinnerId === match.teamA.id ? teamBSquad.filter(p => playingXiTeamB.includes(p.id!)) : teamASquad.filter(p => playingXiTeamA.includes(p.id!)))).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Opening Non-Striker</label>
            <select className="form-input" value={nonStrikerId} onChange={e => setNonStrikerId(Number(e.target.value))}>
              <option value="">Select Player</option>
              {(tossDecision === 'BATTING' ? (tossWinnerId === match.teamA.id ? teamASquad.filter(p => playingXiTeamA.includes(p.id!)) : teamBSquad.filter(p => playingXiTeamB.includes(p.id!))) : (tossWinnerId === match.teamA.id ? teamBSquad.filter(p => playingXiTeamB.includes(p.id!)) : teamASquad.filter(p => playingXiTeamA.includes(p.id!)))).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
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

  const isOverComplete = ((details.currentOvers * 10) % 10) === 0 && details.currentOvers > 0;

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* LIVE MINI BAR */}
      <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      <div className="glass-panel">
        <h3 className="gradient-text text-center">Control Panel</h3>
        <p className="text-center" style={{ color: '#ef4444', fontWeight: 'bold' }}>Caution: Actions are permanent.</p>

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
            {/* RUNS */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[0, 1, 2, 3, 4, 6].map(r => (
                <button 
                  key={r} 
                  className={`btn ${runs === r && !isWicket ? 'btn-primary' : ''}`}
                  onClick={() => { setRuns(r); setIsWicket(false); setExtraType(''); }}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '1.4rem', fontWeight: 'bold', border: runs !== r ? '1px solid var(--glass-border)' : 'none' }}>
                  {r}
                </button>
              ))}
            </div>

            {/* EXTRAS */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {['WIDE', 'NO_BALL', 'BYE', 'LEG_BYE'].map(ex => (
                <button 
                  key={ex} 
                  className={`btn ${extraType === ex ? 'btn-primary' : ''}`}
                  onClick={() => setExtraType(ex === extraType ? '' : ex)}
                  style={{ borderRadius: '30px', border: extraType !== ex ? '1px solid var(--glass-border)' : 'none' }}>
                  {ex.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* WICKET TOGGLE */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1rem', background: isWicket ? 'rgba(239, 68, 68, 0.1)' : 'transparent', borderRadius: '12px', border: isWicket ? '1px solid #ef4444' : 'none' }}>
              <button 
                className="btn" 
                onClick={() => setIsWicket(!isWicket)}
                style={{ background: isWicket ? '#ef4444' : 'transparent', color: isWicket ? '#fff' : '#ef4444', border: '1px solid #ef4444' }}>
                WICKET LOGIC {isWicket ? 'ENABLED' : 'DISABLED'}
              </button>

              {isWicket && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <select className="form-input" style={{ width: 'auto' }} value={wicketType} onChange={e => setWicketType(e.target.value)}>
                    <option value="BOWLED">Bowled</option>
                    <option value="CAUGHT">Caught</option>
                    <option value="LBW">LBW</option>
                    <option value="RUN_OUT">Run Out</option>
                    <option value="STUMPED">Stumped</option>
                    <option value="HIT_WICKET">Hit Wicket</option>
                  </select>
                  
                  <select className="form-input" style={{ width: 'auto' }} value={playerOutId} onChange={e => setPlayerOutId(Number(e.target.value))}>
                    <option value="">Who is out?</option>
                    <option value={details.currentStriker?.id}>{details.currentStriker?.name}</option>
                    <option value={details.currentNonStriker?.id}>{details.currentNonStriker?.name}</option>
                  </select>

                  <select className="form-input" style={{ width: 'auto' }} value={nextBatsmanId} onChange={e => setNextBatsmanId(Number(e.target.value))}>
                    <option value="">Next Batsman In</option>
                    {battingSquad.filter(p => 
                      p.id !== details.currentStriker?.id && 
                      p.id !== details.currentNonStriker?.id && 
                      !battingScorecard.find(card => card.player.id === p.id && card.howOut && card.howOut.toLowerCase() !== 'not out')
                    ).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button className="btn btn-primary" onClick={submitBall} style={{ width: '100%', height: '60px', fontSize: '1.2rem', fontWeight: 'bold' }}>Record Delivery</button>
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

      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <h3 className="gradient-text">Match Operations</h3>
        
        {!details.currentStriker && details.match.currentInnings === 2 ? (
            <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <h4 className="gradient-text" style={{ marginBottom: '1rem' }}>Start 2nd Innings</h4>
                <p style={{ marginBottom: '1.5rem' }}>Select the openers for the 2nd Innings to begin the run chase.</p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <select className="form-input" style={{ flex: 1 }} value={strikerId} onChange={e => setStrikerId(Number(e.target.value))}>
                      <option value="">Striker</option>
                      {battingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="form-input" style={{ flex: 1 }} value={nonStrikerId} onChange={e => setNonStrikerId(Number(e.target.value))}>
                      <option value="">Non-Striker</option>
                      {battingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="form-input" style={{ flex: 1 }} value={bowlerId} onChange={e => setBowlerId(Number(e.target.value))}>
                      <option value="">Opening Bowler</option>
                      {bowlingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={endInnings} style={{ width: '100%' }}>Start Chase</button>
            </div>
        ) : details.match.currentInnings === 1 ? (
          <div style={{ marginTop: '1rem' }}>
             <p>To end innings early, select the openers for the next innings, then click End Innings.</p>
             <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <select className="form-input" style={{ flex: 1 }} value={strikerId} onChange={e => setStrikerId(Number(e.target.value))}>
                  <option value="">Next Striker</option>
                  {bowlingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="form-input" style={{ flex: 1 }} value={nonStrikerId} onChange={e => setNonStrikerId(Number(e.target.value))}>
                  <option value="">Next Non-Striker</option>
                  {bowlingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="form-input" style={{ flex: 1 }} value={bowlerId} onChange={e => setBowlerId(Number(e.target.value))}>
                  <option value="">Next Opening Bowler</option>
                  {battingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>
             <button className="btn" style={{ background: '#f59e0b', color: '#fff' }} onClick={endInnings}>Complete 1st Innings</button>
          </div>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            <p>Once the target is chased or all wickets fall, finalize the match to save statistics to the database.</p>
            <button className="btn" style={{ background: '#10b981', color: '#fff' }} onClick={completeMatchBtn}>Complete Match & Save Stats</button>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminScoringPanel;
