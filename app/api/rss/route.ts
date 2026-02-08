/**
 * API: RSS Feed
 * 
 * Génère un flux RSS/Atom pour le blog.
 * Permet aux agrégateurs et aux moteurs de recherche
 * de découvrir automatiquement les nouveaux articles.
 * 
 * URL: /api/rss
 */

import { NextResponse } from 'next/server';
import { SEO_CONFIG } from '@/lib/seo/config';

export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  const BASE_URL = SEO_CONFIG.siteUrl;
  
  let articles: Array<{
    slug: string;
    title: string;
    meta_description: string;
    published_at: string;
    updated_at: string;
    tags: string[];
  }> = [];

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data } = await supabase
      .from('blog_articles')
      .select('slug, title, meta_description, published_at, updated_at, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    articles = data || [];
  } catch (error) {
    console.error('RSS feed error:', error);
  }

  const rssItems = articles
    .map(
      (article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${BASE_URL}/blog/${article.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${article.slug}</guid>
      <description><![CDATA[${article.meta_description}]]></description>
      <pubDate>${new Date(article.published_at).toUTCString()}</pubDate>
      ${article.tags?.map((tag: string) => `<category>${tag}</category>`).join('\n      ') || ''}
    </item>`
    )
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${SEO_CONFIG.siteName} - Blog Décoration Intérieure</title>
    <link>${BASE_URL}/blog</link>
    <description>${SEO_CONFIG.siteDescription}</description>
    <language>fr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/api/rss" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/og-image.png</url>
      <title>${SEO_CONFIG.siteName}</title>
      <link>${BASE_URL}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
