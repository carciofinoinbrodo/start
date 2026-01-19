const API_BASE = 'http://localhost:8000/api';

export interface BrandResponse {
  id: string;
  name: string;
  type: string;
  color: string;
  visibility: number;
  avgPosition: number;
  trend: string;
  sentiment: string;
}

export interface PromptBrandMentionResponse {
  brandId: string;
  brandName: string;
  position: number;
  mentioned: boolean;
  sentiment: string;
}

export interface SourceInPromptResponse {
  domain: string;
  url: string;
  title: string | null;
  description: string | null;
  publishedDate: string | null;
  citationOrder: number;
}

export interface RunResponse {
  id: number;
  runNumber: number;
  scrapedAt: string;
  visibility: number;
  avgPosition: number;
  totalMentions: number;
  brands: PromptBrandMentionResponse[];
  responseText: string | null;
  sources: SourceInPromptResponse[];
}

export interface PromptResponse {
  id: string;
  query: string;
  visibility: number;
  avgPosition: number;
  totalMentions: number;
  totalRuns: number;
  brands: PromptBrandMentionResponse[];
}

export interface PromptDetailResponse extends PromptResponse {
  runs: RunResponse[];
}

export interface SourceResponse {
  domain: string;
  usage: number;
  avgCitations: number;
}

export interface MetricResponse {
  value: number;
  change: number;
}

export interface DashboardMetricsResponse {
  visibility: MetricResponse;
  totalPrompts: MetricResponse;
  totalSources: MetricResponse;
  avgPosition: MetricResponse;
}

export interface DailyVisibilityResponse {
  date: string;
  shopify: number | null;
  woocommerce: number | null;
  bigcommerce: number | null;
  wix: number | null;
  squarespace: number | null;
}

async function fetchJson<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function fetchBrands(): Promise<BrandResponse[]> {
  return fetchJson<BrandResponse[]>('/brands');
}

export async function fetchPrompts(): Promise<PromptResponse[]> {
  return fetchJson<PromptResponse[]>('/prompts');
}

export async function fetchPromptDetail(promptId: number): Promise<PromptDetailResponse> {
  return fetchJson<PromptDetailResponse>(`/prompts/${promptId}`);
}

export async function fetchSources(): Promise<SourceResponse[]> {
  return fetchJson<SourceResponse[]>('/sources');
}

export async function fetchMetrics(): Promise<DashboardMetricsResponse> {
  return fetchJson<DashboardMetricsResponse>('/metrics');
}

export async function fetchVisibilityData(): Promise<DailyVisibilityResponse[]> {
  return fetchJson<DailyVisibilityResponse[]>('/visibility');
}
