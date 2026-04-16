import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchScoringService } from '../services/api';
import type { LiveMatchDetailsDto } from '../types';
import { Activity, Circle, ArrowLeft } from 'lucide-react';

const LiveStreamOverlay: React.FC = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const navigate = useNavigate();
    const [details, setDetails] = useState<LiveMatchDetailsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [overlayVisible, setOverlayVisible] = useState(true);

    const matchIdNum = parseInt(matchId || '0');

    // Polling logic with stream delay support
    useEffect(() => {
        if (!matchIdNum) return;
        let delayTimer: ReturnType<typeof setTimeout> | null = null;
        
        const fetchLiveDetails = async () => {
            try {
                const res = await MatchScoringService.getLiveDetails(matchIdNum);
                
                // If there's a strict delay configured, wait before setting UI
                const delay = res.data.streamDelaySeconds || 0;
                
                if (delay > 0) {
                    if (delayTimer) clearTimeout(delayTimer);
                    delayTimer = setTimeout(() => {
                        setDetails(res.data);
                        setLoading(false);
                        // Hide stream error if it recovers
                        if (error === 'Failed to sync score') setError(null);
                    }, delay * 1000);
                } else {
                    setDetails(res.data);
                    setLoading(false);
                    if (error === 'Failed to sync score') setError(null);
                }
            } catch (err) {
                console.error("Live Details Polling Error:", err);
                if (!details) {
                    setError('Failed to load match details.');
                    setLoading(false);
                } else {
                    // Soft error, keep showing last known UI
                    setError('Failed to sync score');
                }
            }
        };

        // Initial fetch ignores delay to show UI immediately
        MatchScoringService.getLiveDetails(matchIdNum).then(res => {
            setDetails(res.data);
            setLoading(false);
        }).catch(() => {
            setError('Failed to load match details.');
            setLoading(false);
        });

        const detailsInterval = setInterval(fetchLiveDetails, 5000);
        
        return () => {
            clearInterval(detailsInterval);
            if (delayTimer) clearTimeout(delayTimer);
        };
    }, [matchIdNum]);

    // Format YouTube URL (convert regular URL to embed to be safe)
    const getEmbedUrl = (url?: string) => {
        if (!url) return null;
        if (url.includes('youtube.com/embed/')) return url;
        
        // Handle youtu.be links
        if (url.includes('youtu.be/')) {
            const id = url.split('youtu.be/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${id}?autoplay=1`;
        }
        
        // Handle youtube.com/watch?v= links
        if (url.includes('youtube.com/watch')) {
             const urlParams = new URL(url).searchParams;
             const id = urlParams.get('v');
             return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
        }
        
        return url; // fallback, assuming they entered an iframe or generic url
    };

    const handleVideoTap = () => {
        setOverlayVisible(prev => !prev);
    };

    if (loading) {
        return (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 9999 }}>
                <Activity size={48} className="animate-pulse" style={{ color: '#ef4444', marginBottom: '1rem' }} />
                <h2 style={{ fontFamily: "'Outfit', sans-serif" }}>Loading Live Stream...</h2>
            </div>
        );
    }

    if (!details || (!details.streamUrl && !error)) {
         return (
             <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 9999 }}>
                <Activity size={48} style={{ color: '#94a3b8', marginBottom: '1rem', opacity: 0.5 }} />
                <h2 style={{ fontFamily: "'Outfit', sans-serif", color: '#cbd5e1' }}>Live stream not available</h2>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>No video feed is configured for this match.</p>
                <button onClick={() => navigate('/live-match')} className="btn" style={{ padding: '0.8rem 2rem', borderRadius: '30px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }}>
                    <ArrowLeft size={18} style={{ display: 'inline', marginRight: '8px' }}/> Go Back to Score
                </button>
             </div>
         );
    }

    const embedUrl = getEmbedUrl(details.streamUrl);
    
    // Derived Calculations 
    const isBatting2nd = details.match.currentInnings === 2;
    const runsRequired = details.targetScore != null ? details.targetScore - details.currentScore : 0;
    const totalOvers = details.match.overs || 20;
    const oversFloat = typeof details.currentOvers === 'number' ? details.currentOvers : parseFloat(String(details.currentOvers));
    const ballsRemaining = (totalOvers * 6) - (Math.floor(oversFloat) * 6 + Math.round((oversFloat % 1) * 10));

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 9999, overflow: 'hidden' }}>
             
             {/* Back button layer */}
             <button onClick={() => navigate('/live-match')} style={{
                 position: 'absolute', top: '16px', left: '16px', zIndex: 9200,
                 background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                 padding: '8px', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(4px)'
             }}>
                 <ArrowLeft size={24} />
             </button>

             {/* Video Layer Container */}
             {embedUrl ? (
                <div onClick={handleVideoTap} style={{ position: 'absolute', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {iframeLoading && (
                         <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9001 }}>
                             <Activity size={48} className="animate-pulse" style={{ color: '#64748b' }} />
                         </div>
                     )}
                     <iframe 
                         src={embedUrl} 
                         style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} // Disable pointer events so tap works on container
                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                         allowFullScreen
                         onLoad={() => setIframeLoading(false)}
                     />
                </div>
             ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', zIndex: 9000 }}>
                     Stream failed to load.
                </div>
             )}

             {/* UI Toggle Hint */}
             {overlayVisible && (
                <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 9100, color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', pointerEvents: 'none' }}>
                    Tap screen to hide UI
                </div>
             )}

             {/* Minimal TV-Style Bottom Overlay */}
             <div style={{
                 position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 9100,
                 background: 'rgba(15, 23, 42, 0.85)',
                 backdropFilter: 'blur(16px)',
                 borderTop: '1px solid rgba(255,255,255,0.1)',
                 padding: '12px 16px',
                 transform: overlayVisible ? 'translateY(0)' : 'translateY(100%)',
                 transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                 display: 'flex',
                 flexDirection: 'column',
                 fontFamily: "'Outfit', sans-serif"
             }}>
                 {/* Top Row: Teams & LIVE Badge */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <div style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                             <Circle size={6} className="animate-pulse" style={{ fill: '#fff' }}/> LIVE
                         </div>
                         <h3 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                              {details.match.teamA.teamName} <span style={{ color: '#64748b' }}>vs</span> {details.match.teamB.teamName}
                         </h3>
                     </div>
                     {error && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>Sync Error</span>}
                 </div>

                 {/* Middle Row: Main Score & Key Metrics */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                     <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                         <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>{details.currentScore}</span>
                         <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#cbd5e1' }}>- {details.currentWickets}</span>
                         <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>({details.currentOvers})</span>
                     </div>

                     <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                         {isBatting2nd && (
                             <>
                                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                     <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Required</span>
                                     <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>{runsRequired} <span style={{color: '#64748b', fontSize: '0.75rem', fontWeight: 400}}>in</span> {ballsRemaining}</span>
                                 </div>
                                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
                                     <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>RRR</span>
                                     <span style={{ fontSize: '0.9rem', color: '#f87171', fontWeight: 700 }}>{details.requiredRunRate?.toFixed(2)}</span>
                                 </div>
                             </>
                         )}
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
                             <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>CRR</span>
                             <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>{details.currentRunRate?.toFixed(2)}</span>
                         </div>
                     </div>
                 </div>

                 {/* Bottom Row: Micro details (Batsman/Bowler/This Over) */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        {details.currentStriker && (
                            <span style={{ color: '#fff' }}>{details.currentStriker.name} <span style={{ color: '#cbd5e1' }}>{details.strikerRuns}({details.strikerBalls})</span></span>
                        )}
                        {details.currentBowler && (
                            <span style={{ color: '#fbbf24' }}>{details.currentBowler.name} <span style={{ color: '#cbd5e1' }}>{details.bowlerWickets}-{details.bowlerRuns}</span></span>
                        )}
                    </div>
                    {/* Compact Over */}
                    {details.thisOverBalls && details.thisOverBalls.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontSize: '0.7rem' }}>O:</span>
                            {details.thisOverBalls.map((b, i) => {
                                let c = '#94a3b8';
                                if (b==='W') c = '#ef4444';
                                else if (b==='4') c = '#3b82f6';
                                else if (b==='6') c = '#8b5cf6';
                                return <span key={i} style={{ color: c, fontWeight: 700, fontSize: '0.75rem' }}>{b}</span>
                            })}
                        </div>
                    )}
                 </div>
             </div>
        </div>
    );
};

export default LiveStreamOverlay;
