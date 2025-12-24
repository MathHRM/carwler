/**
 * Tipos específicos para dados brutos da OLX
 */

export interface OlxRawAd {
  title: string;
  price: string | number | null;
  location: string | null;
  url: string;
  imageUrl: string | null;
  mileage: string | null;
  color: string | null;
  engine: string | null;
  carType: string | null;
  year: string | null;
}

