import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = "Siddha Premier League (SPL) – Madhuban Mau Cricket Tournament",
  description = "Welcome to the Siddha Premier League (SPL), the premier village cricket league in Siddha Ahilaspur, Madhuban Mau. Catch live scores, teams, and tournament updates.",
  keywords = "siddha premier league, spl siddha madhuban, siddha cricket tournament mau, village cricket league siddha, spl cricket siddha, madhuban mau cricket",
  ogTitle,
  ogDescription,
  ogImage = "https://splcricket.live/logo.png",
  ogUrl = "https://splcricket.live",
  canonicalUrl,
}) => {
  // If a specific title is provided, ensure it retains SPL branding without being overwritten by Dashboard
  const siteTitle = title === "Siddha Premier League (SPL) – Madhuban Mau Cricket Tournament" 
    ? title 
    : title.includes("SPL") ? title : `${title} | Siddha Premier League (SPL)`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://splcricket.live/#organization",
        "name": "Siddha Premier League",
        "alternateName": ["SPL", "SPL Siddha Madhuban", "Siddha Cricket Tournament", "Village Cricket League Siddha"],
        "url": "https://splcricket.live",
        "logo": {
          "@type": "ImageObject",
          "url": "https://splcricket.live/logo.png",
          "width": 512,
          "height": 512
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://splcricket.live/#website",
        "url": "https://splcricket.live",
        "name": "Siddha Premier League (SPL)",
        "description": "The premier village cricket league in Siddha Ahilaspur, Madhuban Mau.",
        "publisher": {
          "@id": "https://splcricket.live/#organization"
        }
      },
      {
        "@type": "SportsEvent",
        "name": "Siddha Premier League 2026",
        "description": "Village-level cricket tournament based in Siddha Ahilaspur, Madhuban Mau. Featuring top village cricket talent.",
        "startDate": "2026-01-01T00:00:00+05:30",
        "location": {
          "@type": "Place",
          "name": "Siddha Cricket Ground",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Near Kali Mata Mandir, Nandaur Bazar",
            "addressLocality": "Madhuban Mau",
            "addressRegion": "Uttar Pradesh",
            "postalCode": "221603",
            "addressCountry": "IN"
          }
        },
        "organizer": {
          "@id": "https://splcricket.live/#organization"
        }
      }
    ]
  };

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={ogTitle || siteTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={ogUrl} />
      <meta property="twitter:title" content={ogTitle || siteTitle} />
      <meta property="twitter:description" content={ogDescription || description} />
      <meta property="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;
