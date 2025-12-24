/**
 * Enum para identificar os sites disponíveis para scraping
 */
export enum SiteId {
  OLX = 'olx',
  WEBMOTORS = 'webmotors',
  FACEBOOK_MARKETPLACE = 'facebook-marketing',
}

/**
 * URLs base fixas para cada site
 */
export const SITE_URLS: Record<SiteId, string> = {
  [SiteId.OLX]: 'https://www.olx.com.br',
  [SiteId.WEBMOTORS]: 'https://www.webmotors.com.br',
  [SiteId.FACEBOOK_MARKETPLACE]: 'https://www.facebook.com/marketplace',
};

/**
 * Nomes amigáveis para cada site
 */
export const SITE_NAMES: Record<SiteId, string> = {
  [SiteId.OLX]: 'OLX',
  [SiteId.WEBMOTORS]: 'Webmotors',
  [SiteId.FACEBOOK_MARKETPLACE]: 'Facebook Marketplace',
};

/**
 * Converte string para SiteId enum
 */
export function parseSiteId(value: string): SiteId | null {
  const normalized = value.toLowerCase().trim();
  const siteId = Object.values(SiteId).find(
    (id) => id === normalized || id.replace('-', '') === normalized.replace('-', '')
  );
  return siteId || null;
}

/**
 * Retorna todos os SiteIds disponíveis
 */
export function getAllSiteIds(): SiteId[] {
  return Object.values(SiteId);
}

