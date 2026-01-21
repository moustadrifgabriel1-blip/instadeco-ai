/**
 * Port: ISEONotificationService
 * 
 * Interface définissant le contrat pour les notifications SEO
 * (IndexNow, Google Ping, Bing Ping, etc.)
 */

export interface SEONotificationResult {
  /** Service notifié */
  service: 'indexnow' | 'google' | 'bing' | 'yandex';
  
  /** Succès de la notification */
  success: boolean;
  
  /** Code de statut HTTP */
  statusCode?: number;
  
  /** Message d'erreur éventuel */
  error?: string;
}

export interface ISEONotificationService {
  /**
   * Notifie tous les moteurs de recherche d'une nouvelle URL
   */
  notifyAll(url: string): Promise<SEONotificationResult[]>;

  /**
   * Notifie IndexNow (Bing, Yandex, etc.)
   */
  notifyIndexNow(url: string): Promise<SEONotificationResult>;

  /**
   * Ping Google avec le sitemap
   */
  pingGoogle(sitemapUrl?: string): Promise<SEONotificationResult>;

  /**
   * Ping Bing avec le sitemap
   */
  pingBing(sitemapUrl?: string): Promise<SEONotificationResult>;

  /**
   * Soumet plusieurs URLs en batch (IndexNow)
   */
  notifyBatch(urls: string[]): Promise<SEONotificationResult>;

  /**
   * Vérifie si le service est configuré et prêt
   */
  isConfigured(): boolean;
}
