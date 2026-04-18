import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchScoringService } from '../services/api';
import type { LiveMatchDetailsDto } from '../types';
import { Activity, ArrowLeft, Play, Pause, Maximize, Minimize2 } from 'lucide-react';

import BroadcastScoreboard from './BroadcastScoreboard';

const LiveStreamOverlay: React.FC = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const navigate = useNavigate();
    const [details, setDetails] = useState<LiveMatchDetailsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [overlayVisible, setOverlayVisible] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isYouTubeStream, setIsYouTubeStream] = useState(false);
    const [isDirectVideoStream, setIsDirectVideoStream] = useState(false);
    const [videoLoadFailed, setVideoLoadFailed] = useState(false);

    const playerContainerRef = React.useRef<HTMLDivElement | null>(null);
    const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);

    const matchIdNum = parseInt(matchId || '0');

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

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

        const detailsInterval = setInterval(fetchLiveDetails, 5 * 1000);
        
        return () => {
            clearInterval(detailsInterval);
            if (delayTimer) clearTimeout(delayTimer);
        };
    }, [matchIdNum]);

    // Format YouTube URL (convert regular URL to embed to be safe)
    const getEmbedUrl = (url?: string) => {
        if (!url) return null;

        const origin = encodeURIComponent(window.location.origin);
        if (url.includes('youtube.com/embed/')) return url;
        
        // Handle youtu.be links
        if (url.includes('youtu.be/')) {
            const id = url.split('youtu.be/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&modestbranding=1&showinfo=0&rel=0&playsinline=1&enablejsapi=1&origin=${origin}`;
        }
        
        // Handle youtube.com/watch?v= links
        if (url.includes('youtube.com/watch')) {
             const urlParams = new URL(url).searchParams;
             const id = urlParams.get('v');
             return id ? `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&modestbranding=1&showinfo=0&rel=0&playsinline=1&enablejsapi=1&origin=${origin}` : null;
        }
        
        return url; 
    };

    const handleVideoTap = () => {
        setOverlayVisible(prev => !prev);
    };

    const sendYouTubeCommand = (func: 'playVideo' | 'pauseVideo') => {
        if (!iframeRef.current?.contentWindow) return;

        iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
                event: 'command',
                func,
                args: [],
            }),
            '*'
        );
    };

    const togglePlayPause = () => {
        if (isYouTubeStream) {
            if (isPlaying) {
                sendYouTubeCommand('pauseVideo');
                setIsPlaying(false);
            } else {
                sendYouTubeCommand('playVideo');
                setIsPlaying(true);
            }
            return;
        }

        if (isDirectVideoStream && videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch((playError) => console.error('Failed to play video:', playError));
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await playerContainerRef.current?.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (fullscreenError) {
            console.error('Failed to toggle fullscreen:', fullscreenError);
        }
    };

    const embedUrl = getEmbedUrl(details?.streamUrl);

    useEffect(() => {
        const isYouTube = Boolean(embedUrl && embedUrl.includes('youtube.com/embed/'));
        const isDirectVideo = Boolean(
            embedUrl &&
            !isYouTube &&
            /\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(embedUrl)
        );

        setIsYouTubeStream(isYouTube);
        setIsDirectVideoStream(isDirectVideo);
        setIsPlaying(true);
        setIframeLoading(true);
        setVideoLoadFailed(false);
    }, [embedUrl]);

    useEffect(() => {
        if (!embedUrl || !iframeLoading) return;

        const timer = setTimeout(() => {
            setVideoLoadFailed(true);
        }, 10000);

        return () => clearTimeout(timer);
    }, [embedUrl, iframeLoading]);

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

    return (
        <div ref={playerContainerRef} style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 9999, overflow: 'hidden' }}>
             
             {/* Back button layer */}
             <button onClick={() => navigate('/live-match')} style={{
                 position: 'absolute', top: '16px', left: '16px', zIndex: 9600,
                 background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                 padding: '8px', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(4px)'
             }}>
                 <ArrowLeft size={24} />
             </button>

             {/* Video Layer Container */}
             {embedUrl ? (
                <div onClick={handleVideoTap} style={{ position: 'absolute', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                     {iframeLoading && (
                         <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9001 }}>
                             <Activity size={48} className="animate-pulse" style={{ color: '#64748b' }} />
                         </div>
                     )}
                     <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {isDirectVideoStream ? (
                         <video
                             ref={videoRef}
                             src={embedUrl}
                             style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                             autoPlay
                             playsInline
                             controls={false}
                             onLoadedData={() => {
                                 setIframeLoading(false);
                                 setVideoLoadFailed(false);
                             }}
                             onError={() => {
                                 setIframeLoading(false);
                                 setVideoLoadFailed(true);
                             }}
                         />
                     ) : (
                         <iframe 
                             ref={iframeRef}
                             src={embedUrl} 
                             style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none', maxWidth: '100vw', maxHeight: '100vh' }} 
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                             allowFullScreen
                             onLoad={() => {
                                 setIframeLoading(false);
                                 setVideoLoadFailed(false);
                             }}
                         />
                     )}
                     </div>
                </div>
             ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', zIndex: 9000 }}>
                     Stream failed to load.
                </div>
             )}

                 {videoLoadFailed && (
                     <div style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 9300,
                          background: 'rgba(15,23,42,0.85)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          color: '#e2e8f0',
                          textAlign: 'center',
                          maxWidth: '90vw',
                          backdropFilter: 'blur(8px)'
                     }}>
                          <div style={{ fontWeight: 700, marginBottom: '6px' }}>Unable to load stream in player</div>
                          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>The video provider may be blocking embed on this device/network.</div>
                     </div>
                 )}

             {/* UI Toggle Hint */}
             {overlayVisible && (
                <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 9100, color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', pointerEvents: 'none' }}>
                    Tap screen to toggle UI
                </div>
             )}

             {/* Playback + Fullscreen Controls (Hotstar-style compact dock) */}
             {overlayVisible && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9600,
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    background: 'rgba(15,23,42,0.72)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    borderRadius: '999px',
                    padding: '8px 10px',
                    backdropFilter: 'blur(8px)'
                }}>
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            togglePlayPause();
                        }}
                        disabled={!isYouTubeStream && !isDirectVideoStream}
                        title={isPlaying ? 'Pause stream' : 'Resume stream'}
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: (!isYouTubeStream && !isDirectVideoStream) ? 'rgba(100,116,139,0.4)' : 'rgba(30,41,59,0.9)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (!isYouTubeStream && !isDirectVideoStream) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                    </button>

                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            toggleFullscreen();
                        }}
                        title={isFullscreen ? 'Minimize' : 'Full screen'}
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(30,41,59,0.9)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize size={18} />}
                    </button>
                </div>
             )}

             {/* Professional TV-Style Scoreboard Overlay */}
             <BroadcastScoreboard details={details} visible={overlayVisible} />
        </div>
    );
};

export default LiveStreamOverlay;
