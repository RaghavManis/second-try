import React from 'react';
import SEO from '../components/common/SEO';
import { Play } from 'lucide-react';
import { AnimatedSection } from '../components/AnimatedSection';

const Highlights: React.FC = () => {
  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <SEO 
        title="Match Highlights" 
        description="Watch the latest match highlights, top moments, and best video clips from the Siddha Premier League (SPL), Madhuban Mau."
        canonicalUrl="https://splcricket.live/highlights"
      />
      
      <AnimatedSection>
        <h1 className="page-title gradient-text text-center" style={{ marginBottom: '0.5rem' }}>Match Highlights</h1>
        <p className="page-subtitle text-center" style={{ marginBottom: '3rem', color: 'var(--text-secondary)' }}>
          Relive the best moments, spectacular catches, and massive sixes from SPL Madhuban Mau.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={48} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Video Highlights Coming Soon</h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', lineHeight: 1.6 }}>
            We're currently gathering the best action-packed clips from the tournament. Stay tuned for match highlights, player interviews, and exclusive behind-the-scenes footage from the Siddha Premier League!
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
};

export default Highlights;
