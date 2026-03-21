import React, { useEffect, useState } from 'react';
import type { GalleryImage } from '../types';
import { GalleryService, UploadService } from '../services/api';
import { useAuth } from '../context/AuthContext';

import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const Gallery: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await GalleryService.getAllImages();
      setImages(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load gallery images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
       toast.error('Please upload a valid image file');
       return;
    }

    if (file.size > 5 * 1024 * 1024) {
       toast.error('Image size must be less than 5MB');
       return;
    }

    setUploading(true);
    try {
       const uploadRes = await UploadService.uploadImage(file);
       const url = uploadRes.data.url;
       
       await GalleryService.addImage({ imageUrl: url });
       toast.success('Image added to gallery!');
       fetchImages();
    } catch (err) {
       console.error(err);
       toast.error('Failed to upload image. Ensure Cloudinary is configured.');
    } finally {
       setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await GalleryService.deleteImage(id);
      toast.success('Image deleted');
      fetchImages();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete image');
    }
  };

  if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '20vh' }}>Loading Gallery...</div>;

  return (
    <div className="dashboard-wrapper" style={{ paddingBottom: '4rem' }}>
      <div className="parallax-hero" style={{ 
        height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        backgroundAttachment: 'fixed', backgroundImage: 'url("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', marginTop: '-80px'
      }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 1) 100%)' }}></div>
        <div className="hero-content text-center animate-slide-up" style={{ zIndex: 2, padding: '2rem' }}>
          <ImageIcon size={64} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
          <h1 className="gradient-text" style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 800 }}>Tournament Gallery</h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>Historic moments from the field</p>
        </div>
      </div>

      <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', marginTop: '2rem' }}>
        
        {isAuthenticated && (
          <div className="glass-panel text-center" style={{ marginBottom: '3rem', padding: '2rem' }}>
             <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Upload New Moment</h3>
             <input 
                 type="file" 
                 accept="image/*" 
                 onChange={handleFileUpload} 
                 style={{ display: 'none' }} 
                 id="gallery-upload"
                 disabled={uploading}
             />
             <label htmlFor="gallery-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', opacity: uploading ? 0.7 : 1, position: 'relative', zIndex: 100 }}>
                 {uploading ? 'Uploading...' : <><Upload size={20} /> Select Image</>}
             </label>
          </div>
        )}

        {images.length === 0 ? (
          <div className="text-center" style={{ color: '#94a3b8', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
            No images in the gallery yet.
          </div>
        ) : (
          <div className="gallery-masonry" style={{ padding: '0 0.5rem' }}>
            {images.map((img, i) => (
              <div 
                key={img.id} 
                className="gallery-masonry-item animate-slide-up hover-lift" 
                style={{ 
                  animationDelay: `${(i % 10) * 100}ms`,
                  position: 'relative', borderRadius: '12px', overflow: 'hidden', 
                  border: '1px solid var(--glass-border)', cursor: 'pointer', background: 'rgba(255,255,255,0.05)'
                }}
              >
                <img src={img.imageUrl} alt="Gallery Match Moment" style={{ width: '100%', display: 'block', transition: 'transform 0.5s ease' }} 
                     onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
                     onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                />
                {isAuthenticated && (
                  <button 
                    onClick={() => handleDelete(img.id!)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                    title="Delete Image"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
