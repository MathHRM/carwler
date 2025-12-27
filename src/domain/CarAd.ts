/**
 * Modelo de domínio normalizado para anúncios de carros
 * Todos os scrapers devem adaptar seus dados para este modelo
 */
export interface CarAd {
  /** ID único do anúncio no site de origem */
  id: string;
  /** Nome/título do anúncio */
  title: string;
  /** Preço do veículo em centavos (para evitar problemas com ponto flutuante) */
  price: number;
  /** Ano do veículo */
  year: number | null;
  /** Quilometragem do veículo */
  mileage: number | null;
  /** Cor do veículo */
  color: string | null;
  /** Combustível (gasolina, etanol, flex, diesel, elétrico, etc.) */
  fuel: string | null;
  /** Transmissão (manual, automático, etc.) */
  transmission: string | null;
  /** Marca do veículo */
  brand: string | null;
  /** Modelo do veículo */
  model: string | null;
  /** Cidade onde o veículo está localizado */
  city: string | null;
  /** Estado onde o veículo está localizado */
  state: string | null;
  /** URL do anúncio */
  url: string;
  /** URL da imagem principal do anúncio */
  imageUrl: string | null;
  /** Data de publicação do anúncio */
  publishedAt: Date | null;
  /** Site de origem (olx, webmotors, facebook, etc.) */
  source: string;
  /** Motor do veículo */
  engine: string | null;
  /** Tipo de veículo */
  carType: string | null;
  /** Dados adicionais específicos do site (opcional) */
  metadata?: Record<string, unknown>;
}

/**
 * Valida se um objeto é um CarAd válido
 */
export function isValidCarAd(ad: unknown): ad is CarAd {
  if (!ad || typeof ad !== 'object') {
    return false;
  }

  const carAd = ad as Partial<CarAd>;

  return (
    typeof carAd.id === 'string' &&
    carAd.id.length > 0 &&
    typeof carAd.title === 'string' &&
    carAd.title.length > 0 &&
    typeof carAd.price === 'number' &&
    carAd.price >= 0 &&
    typeof carAd.url === 'string' &&
    carAd.url.length > 0 &&
    typeof carAd.source === 'string' &&
    carAd.source.length > 0
  );
}

