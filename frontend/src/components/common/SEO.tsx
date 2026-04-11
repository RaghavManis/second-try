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
}

const SEO: React.FC<SEOProps> = ({
  title = "Siddha Premier League (SPL) | Live Cricket Tournament",
  description = "Siddha Premier League (SPL) is a village-level cricket tournament based in Siddha Ahilaspur, Madhuban Mau. Follow live scores, match schedules, team updates, and player statistics of SPL cricket.",
  keywords = "Siddha Premier League, SPL Cricket, Siddha Ahilaspur, Madhuban Mau, Village Cricket Tournament, Live Cricket Score",
  ogTitle,
  ogDescription,
  ogImage = "https://splcricket.live/logo.png",
  ogUrl = "https://splcricket.live",
}) => {
  const siteTitle = title.includes("SPL") ? title : `${title} | SPL Cricket`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

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
    </Helmet>
  );
};

export default SEO;
