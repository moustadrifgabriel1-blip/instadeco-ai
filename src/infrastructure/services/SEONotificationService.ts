/**
 * Service: SEONotificationService
 * 
 * Implémentation du port ISEONotificationService.
 * Notifie les moteurs de recherche des nouvelles URLs.
 */

import {
  ISEONotificationService,
  SEONotificationResult,
} from '../../domain/ports/services/ISEONotificationService';

export class SEONotificationService implements ISEONotificationService {
  private indexNowKey: string;
  private siteUrl: string;
  private indexNowEndpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ];

  constructor() {
    this.indexNowKey = process.env.INDEXNOW_KEY || '';
    this.siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://instadeco.app';

    if (!this.indexNowKey) {
      console.warn('INDEXNOW_KEY non configurée - les notifications SEO seront limitées');
    }
  }

  async notifyAll(url: string): Promise<SEONotificationResult[]> {
    const results: SEONotificationResult[] = [];

    // Exécuter toutes les notifications en parallèle
    const [indexNowResult, googleResult, bingResult] = await Promise.allSettled([
      this.notifyIndexNow(url),
      this.pingGoogle(),
      this.pingBing(),
    ]);

    if (indexNowResult.status === 'fulfilled') {
      results.push(indexNowResult.value);
    } else {
      results.push({
        service: 'indexnow',
        success: false,
        error: indexNowResult.reason?.message || 'Unknown error',
      });
    }

    if (googleResult.status === 'fulfilled') {
      results.push(googleResult.value);
    } else {
      results.push({
        service: 'google',
        success: false,
        error: googleResult.reason?.message || 'Unknown error',
      });
    }

    if (bingResult.status === 'fulfilled') {
      results.push(bingResult.value);
    } else {
      results.push({
        service: 'bing',
        success: false,
        error: bingResult.reason?.message || 'Unknown error',
      });
    }

    return results;
  }

  async notifyIndexNow(url: string): Promise<SEONotificationResult> {
    if (!this.indexNowKey) {
      return {
        service: 'indexnow',
        success: false,
        error: 'INDEXNOW_KEY non configurée',
      };
    }

    const host = new URL(url).host;

    // Essayer chaque endpoint IndexNow
    for (const endpoint of this.indexNowEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host,
            key: this.indexNowKey,
            keyLocation: `${this.siteUrl}/${this.indexNowKey}.txt`,
            urlList: [url],
          }),
        });

        // IndexNow retourne 200, 202, ou 204 pour succès
        if (response.ok || response.status === 202 || response.status === 204) {
          console.log(`IndexNow notifié via ${endpoint}: ${url}`);
          return {
            service: 'indexnow',
            success: true,
            statusCode: response.status,
          };
        }
      } catch (error) {
        console.warn(`Échec IndexNow ${endpoint}:`, (error as Error).message);
        continue;
      }
    }

    return {
      service: 'indexnow',
      success: false,
      error: 'Tous les endpoints IndexNow ont échoué',
    };
  }

  async pingGoogle(sitemapUrl?: string): Promise<SEONotificationResult> {
    const sitemap = sitemapUrl || `${this.siteUrl}/sitemap.xml`;

    try {
      const response = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
        {
          method: 'GET',
          headers: { 'User-Agent': 'InstaDeco-SEO-Bot/1.0' },
        }
      );

      if (response.ok) {
        console.log('Google ping réussi');
        return {
          service: 'google',
          success: true,
          statusCode: response.status,
        };
      }

      return {
        service: 'google',
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        service: 'google',
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async pingBing(sitemapUrl?: string): Promise<SEONotificationResult> {
    const sitemap = sitemapUrl || `${this.siteUrl}/sitemap.xml`;

    try {
      const response = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
        {
          method: 'GET',
          headers: { 'User-Agent': 'InstaDeco-SEO-Bot/1.0' },
        }
      );

      if (response.ok) {
        console.log('Bing ping réussi');
        return {
          service: 'bing',
          success: true,
          statusCode: response.status,
        };
      }

      return {
        service: 'bing',
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        service: 'bing',
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async notifyBatch(urls: string[]): Promise<SEONotificationResult> {
    if (!this.indexNowKey || urls.length === 0) {
      return {
        service: 'indexnow',
        success: false,
        error: 'INDEXNOW_KEY non configurée ou liste vide',
      };
    }

    const host = new URL(urls[0]).host;

    for (const endpoint of this.indexNowEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host,
            key: this.indexNowKey,
            keyLocation: `${this.siteUrl}/${this.indexNowKey}.txt`,
            urlList: urls.slice(0, 10), // Max 10 URLs par requête
          }),
        });

        if (response.ok || response.status === 202 || response.status === 204) {
          console.log(`IndexNow batch notifié via ${endpoint}: ${urls.length} URLs`);
          return {
            service: 'indexnow',
            success: true,
            statusCode: response.status,
          };
        }
      } catch (error) {
        console.warn(`Échec IndexNow batch ${endpoint}:`, (error as Error).message);
        continue;
      }
    }

    return {
      service: 'indexnow',
      success: false,
      error: 'Tous les endpoints IndexNow ont échoué',
    };
  }

  isConfigured(): boolean {
    return !!this.indexNowKey;
  }
}
