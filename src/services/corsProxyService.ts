/**
 * CORS Proxy Service
 * Handles CORS issues when connecting to blockchain nodes from the browser
 */

export class CorsProxyService {
  private static instance: CorsProxyService;
  private proxyUrl: string = '';

  static getInstance(): CorsProxyService {
    if (!CorsProxyService.instance) {
      CorsProxyService.instance = new CorsProxyService();
    }
    return CorsProxyService.instance;
  }

  /**
   * Check if we need to use a proxy for the given URL
   */
  needsProxy(url: string): boolean {
    // Check if the URL is localhost/127.0.0.1 and we're in a browser
    const isLocalhost = url.includes('127.0.0.1') || url.includes('localhost');
    const isBrowser = typeof window !== 'undefined';
    
    return isLocalhost && isBrowser;
  }

  /**
   * Get the proxy URL for the given RPC URL
   */
  getProxyUrl(originalUrl: string): string {
    if (!this.needsProxy(originalUrl)) {
      return originalUrl;
    }

    // For now, return the original URL
    // In a production environment, you might want to use a CORS proxy service
    return originalUrl;
  }

  /**
   * Make a request through the proxy if needed
   */
  async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const finalUrl = this.getProxyUrl(url);
    
    if (finalUrl === url) {
      // No proxy needed, make direct request
      return fetch(url, options);
    } else {
      // Use proxy (implement if needed)
      return fetch(finalUrl, options);
    }
  }

  /**
   * Test if we can connect to a localhost URL
   */
  async testLocalhostConnection(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Localhost connection test failed:', error);
      return false;
    }
  }
}

export const corsProxyService = CorsProxyService.getInstance();
