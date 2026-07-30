import { Product, SearchResult } from './index';

export interface GetProductResponse {
  product: Product | null;
}

export interface SearchProductsResponse {
  searchProducts: Product[];
}

export interface SearchResponse {
  searchProducts: SearchResult[];
}
