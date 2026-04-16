import React, { useState } from 'react';
import { Mail, MapPin, Youtube, Facebook, Twitter, Linkedin, Instagram, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ContactService } from '../../services/api';

const Footer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openContactModal = (e: React.MouseEvent, subject: string) => {
    e.preventDefault();
    setContactSubject(subject);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await ContactService.submitContactForm({
        name: formData.name,
        email: formData.email,
        message: formData.message
      });

      if (response.status === 200) {
        toast.success(response.data.message || 'Message sent successfully!');
        setIsModalOpen(false);
        setFormData({ name: '', mobile: '', email: '', message: '' });
      } else {
        toast.error(response.data.message || 'Failed to send message');
      }
    } catch (err: any) {
      // The API interceptor might have already shown a toast, but this acts as an ultimate fallback for this specific action
      if (!err.response || err.response.status !== 429) { // Avoid duplicate toasts if the interceptor handled standard errors
         // const errorMsg = err.response?.data?.message || 'Connection error. Please try again later.';
         // toast.error(errorMsg); // Optional if we consider the interceptor covers everything
      }
      console.error("Contact Form Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <footer style={{ background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid var(--glass-border)', padding: '3rem 1.5rem 2rem 1.5rem', marginTop: 'auto', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
          
          {/* Contact Us Options */}
          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '1.2rem', fontSize: '1.2rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li><a href="#" onClick={(e) => openContactModal(e, 'General Inquiry')} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.color='var(--primary)'} onMouseOut={e => e.currentTarget.style.color='inherit'}>Contact Us</a></li>
              <li><a href="#" onClick={(e) => openContactModal(e, 'Sponsorship Inquiry')} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.color='var(--primary)'} onMouseOut={e => e.currentTarget.style.color='inherit'}>Contact for Sponsorship</a></li>
              <li><a href="#" onClick={(e) => openContactModal(e, 'Join Tournament / Play')} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.color='var(--primary)'} onMouseOut={e => e.currentTarget.style.color='inherit'}>Join Tournament / Play Inquiry</a></li>
            </ul>
          </div>

          {/* Basic Details */}
          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '1.2rem', fontSize: '1.2rem' }}>Contact Details</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                <MapPin size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <span>Siddha Cricket Ground, Near Kali Mata Mandir,<br/>Nandaur Bazar, Madhuban Mau - 221603, Uttar Pradesh</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Mail size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <a href="mailto:mnsyd24@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>mnsyd24@gmail.com</a>
              </li>
            </ul>
          </div>

          {/* Social Media Links */}
          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '1.2rem', fontSize: '1.2rem' }}>Follow Us</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {/* REPLACE '#' WITH YOUR YOUTUBE LINK BELOW */}
              <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} className="social-icon hover-lift">
                <Youtube size={22} />
              </a>
              {/* REPLACE '#' WITH YOUR FACEBOOK LINK BELOW */}
              <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} className="social-icon hover-lift">
                <Facebook size={22} />
              </a>
              {/* REPLACE '#' WITH YOUR TWITTER (X) LINK BELOW */}
              <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} className="social-icon hover-lift">
                <Twitter size={22} />
              </a>
              {/* REPLACE '#' WITH YOUR INSTAGRAM LINK BELOW */}
              <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} className="social-icon hover-lift">
                <Instagram size={22} />
              </a>
              {/* REPLACE '#' WITH YOUR LINKEDIN LINK BELOW (KEPT LAST AS REQUESTED) */}
              <a href="https://www.linkedin.com/in/manish024/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} className="social-icon hover-lift">
                <Linkedin size={22} />
              </a>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} SPL. All Rights Reserved.
        </div>
        
        <style>{`
          .social-icon:hover {
             background: var(--primary) !important;
             color: #fff !important;
          }
        `}</style>
      </footer>

      {/* FIXED CONTACT MODAL (UI ONLY) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} className="hover-lift" />
            </button>
            <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Contact Us</h2>
            <form onSubmit={handleContactSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input 
                  type="text" 
                  name="name"
                  className="form-input" 
                  required 
                  placeholder="Enter your full name" 
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input 
                  type="tel" 
                  name="mobile"
                  className="form-input" 
                  required 
                  placeholder="Enter mobile number" 
                  value={formData.mobile}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  name="email"
                  className="form-input" 
                  required 
                  placeholder="Enter your email address" 
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input type="text" className="form-input" readOnly value={contactSubject} style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Message / Description</label>
                <textarea 
                  name="message"
                  className="form-input" 
                  required 
                  placeholder="Type your message here..." 
                  rows={4} 
                  style={{ resize: 'vertical' }}
                  value={formData.message}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
