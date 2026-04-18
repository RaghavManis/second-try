import React from 'react';
import type { LiveMatchDetailsDto } from '../types';

interface BroadcastScoreboardProps {
    details: LiveMatchDetailsDto;
    visible: boolean;
}

const BroadcastScoreboard: React.FC<BroadcastScoreboardProps> = ({ details, visible }) => {
    if (!details) return null;

    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

    React.useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Derived values
    const battingTeamAbbr = details.match.battingTeam?.teamName?.substring(0, 5).toUpperCase() || 'TEAM';
    const inningsText = details.match.currentInnings === 1 ? "1st Inning" : "2nd Inning";
    
    // Formatting bowler figures: W-R (O)
    const bowlerFigures = `${details.bowlerWickets || 0}-${details.bowlerRuns || 0} (${details.bowlerOvers || 0})`;

    const shortName = (name?: string) => {
        if (!name) return 'Player';
        const firstName = name.split(' ')[0];
        return firstName.length > (isMobile ? 6 : 10) ? `${firstName.slice(0, isMobile ? 6 : 10)}…` : firstName;
    };

    const thisOverBalls = Array.isArray(details.thisOverBalls) ? details.thisOverBalls : [];
    const visibleBalls = isMobile ? thisOverBalls.slice(-4) : thisOverBalls;

    return (
        <div style={{
            position: 'absolute',
            bottom: isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 78px)' : '24px',
            left: isMobile ? '8px' : '50%',
            right: isMobile ? '8px' : 'auto',
            transform: isMobile
                ? (visible ? 'translateY(0)' : 'translateY(140%)')
                : `translateX(-50%) ${visible ? 'translateY(0)' : 'translateY(150%)'}`,
            width: isMobile ? 'auto' : '95%',
            maxWidth: isMobile ? 'none' : '1000px',
            zIndex: 9500,
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: "'Outfit', sans-serif",
            pointerEvents: 'none',
            paddingBottom: isMobile ? '4px' : '0px'
        }}>
            {/* Top row: Innings & Target Indicator */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-2px', gap: '6px', paddingRight: isMobile ? '8px' : '12%' }}>
                <div style={{
                    background: 'linear-gradient(to bottom, #334155, #1e293b)',
                    color: '#fff',
                    padding: isMobile ? '3px 10px' : '4px 14px',
                    fontSize: isMobile ? '0.62rem' : '0.7rem',
                    fontWeight: 800,
                    borderRadius: '6px 6px 0 0',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderBottom: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    {inningsText}
                </div>
                {details.match.currentInnings === 2 && details.targetScore != null && (
                    <div style={{
                        background: 'linear-gradient(to bottom, #b91c1c, #991b1b)',
                        color: '#fff',
                        padding: isMobile ? '3px 10px' : '4px 14px',
                        fontSize: isMobile ? '0.62rem' : '0.7rem',
                        fontWeight: 800,
                        borderRadius: '6px 6px 0 0',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderBottom: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        TARGET: {details.targetScore}
                    </div>
                )}
            </div>

            {/* Main Broadcast Bar */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1.2fr 1fr' : '1.2fr 1.6fr 1.2fr',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 1) 100%)',
                borderRadius: isMobile ? '12px' : '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
                minHeight: isMobile ? '88px' : '80px',
                position: 'relative'
            }}>
                {/* 1. Batsmen Section (Left) */}
                <div style={{ 
                    padding: isMobile ? '8px' : '8px 16px', 
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(255,255,255,0.02)',
                    minWidth: 0
                }}>
                    {/* Striker */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <img 
                                src={details.match.battingTeam?.teamLogo || `https://api.dicebear.com/7.x/identicon/svg?seed=${details.match.battingTeam?.id}&backgroundColor=1e293b`} 
                                style={{ width: isMobile ? '18px' : '22px', height: isMobile ? '18px' : '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} 
                                alt="logo"
                           />
                           <span style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '0.78rem' : '0.92rem', letterSpacing: '0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {shortName(details.currentStriker?.name)} <span style={{ color: '#fbbf24', marginLeft: '2px' }}>*</span>
                           </span>
                        </div>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: isMobile ? '0.9rem' : '1.05rem', marginLeft: '6px', whiteSpace: 'nowrap' }}>
                            {details.strikerRuns || 0} <span style={{ fontSize: isMobile ? '0.62rem' : '0.75rem', fontWeight: 600, color: '#94a3b8' }}>({details.strikerBalls || 0})</span>
                        </span>
                    </div>
                    {/* Non-Striker */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: isMobile ? '4px' : '30px', minWidth: 0 }}>
                           <span style={{ color: '#cbd5e1', fontWeight: 500, fontSize: isMobile ? '0.72rem' : '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {shortName(details.currentNonStriker?.name)}
                           </span>
                        </div>
                        <span style={{ color: '#cbd5e1', fontWeight: 700, fontSize: isMobile ? '0.78rem' : '0.9rem', marginLeft: '6px', whiteSpace: 'nowrap' }}>
                            {details.nonStrikerRuns || 0} <span style={{ fontSize: isMobile ? '0.62rem' : '0.75rem', fontWeight: 500, color: '#64748b' }}>({details.nonStrikerBalls || 0})</span>
                        </span>
                    </div>
                </div>

                {/* 2. Team Score Section (Center) */}
                <div style={{ 
                    padding: isMobile ? '0 8px' : '0 20px', 
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? '6px' : '10px' }}>
                        <span style={{ color: '#cbd5e1', fontWeight: 900, fontSize: isMobile ? '0.92rem' : '1.2rem', textTransform: 'uppercase' }}>{battingTeamAbbr}</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                            <span style={{ color: '#fbbf24', fontWeight: 950, fontSize: isMobile ? '1.95rem' : '2.2rem', lineHeight: 1 }}>{details.currentScore}</span>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.2rem' : '1.4rem' }}>-{details.currentWickets}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                             <span style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? '1rem' : '1.1rem', lineHeight: 1 }}>{details.currentOvers}</span>
                             <span style={{ color: '#64748b', fontSize: isMobile ? '0.58rem' : '0.65rem', fontWeight: 700 }}>OVERS</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: isMobile ? '8px' : '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <div style={{ color: '#94a3b8', fontSize: isMobile ? '0.68rem' : '0.75rem', fontWeight: 800, marginTop: '2px' }}>
                            CRR: <span style={{ color: '#fff' }}>{details.currentRunRate?.toFixed(2) || '0.00'}</span>
                        </div>
                        {details.match.currentInnings === 2 && (
                            <div style={{ color: '#94a3b8', fontSize: isMobile ? '0.68rem' : '0.75rem', fontWeight: 800, marginTop: '2px' }}>
                                RRR: <span style={{ color: '#f87171' }}>{details.requiredRunRate?.toFixed(2) || '0.00'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Bowler & Over Summary Section (Right) */}
                <div style={{ 
                    padding: isMobile ? '8px' : '10px 16px', 
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '4px',
                    background: 'rgba(255,255,255,0.01)',
                    minWidth: 0
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ background: '#fbbf24', width: '3px', height: '14px', borderRadius: '3px' }}></div>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '0.78rem' : '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {shortName(details.currentBowler?.name)}
                            </span>
                         </div>
                         <span style={{ color: '#fbbf24', fontWeight: 900, fontSize: isMobile ? '0.86rem' : '1.05rem', marginLeft: '6px', whiteSpace: 'nowrap' }}>{bowlerFigures}</span>
                    </div>
                    
                    {/* This Over Dots - Broadcast Style */}
                    <div style={{ 
                        display: 'flex', 
                        gap: isMobile ? '4px' : '6px', 
                        alignItems: 'center', 
                        marginTop: '4px',
                        background: 'rgba(0,0,0,0.2)',
                        padding: isMobile ? '3px 6px' : '4px 8px',
                        borderRadius: '20px',
                        width: 'fit-content'
                    }}>
                        <span style={{ color: '#475569', fontSize: isMobile ? '0.52rem' : '0.6rem', fontWeight: 900, marginRight: '2px' }}>OVER</span>
                        {visibleBalls.map((ball, idx) => {
                            let dotColor = 'rgba(255,255,255,0.05)';
                            let textColor = '#fff';
                            if (ball === 'W') { dotColor = '#ef4444'; }
                            else if (ball === '4') { dotColor = '#3b82f6'; }
                            else if (ball === '6') { dotColor = '#8b5cf6'; }
                            else if (ball !== '0' && ball !== '.') { dotColor = '#10b981'; }

                            return (
                                <div key={idx} style={{
                                    width: isMobile ? '16px' : '18px',
                                    height: isMobile ? '16px' : '18px',
                                    borderRadius: '50%',
                                    background: dotColor,
                                    color: textColor,
                                    fontSize: isMobile ? '0.62rem' : '0.7rem',
                                    fontWeight: 900,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: ball === '0' || ball === '.' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                }}>
                                    {ball === '0' || ball === '.' ? '' : ball}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Glow / Reflection Effect */}
            <div style={{
                height: '4px',
                width: '80%',
                margin: '0 auto',
                background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)',
                filter: 'blur(4px)',
                borderRadius: '50%',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.6s'
            }}></div>
        </div>
    );
};

export default BroadcastScoreboard;
