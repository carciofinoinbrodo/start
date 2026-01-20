/**
 * Application configuration loaded from environment variables.
 *
 * For production, ensure VITE_API_BASE_URL is set in .env or build environment.
 * The fallback to localhost is for development only.
 */
export const config = {
  /** Base URL for API requests */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',

  /**
   * Extract the host (origin) from API URL for error messages.
   * Example: "http://localhost:8000/api" -> "http://localhost:8000"
   */
  get apiHost(): string {
    try {
      const url = new URL(this.apiBaseUrl);
      return url.origin;
    } catch {
      return 'http://localhost:8000';
    }
  },

  /** Check if running in development mode */
  isDevelopment: import.meta.env.DEV,

  /** Check if running in production mode */
  isProduction: import.meta.env.PROD,
} as const;
