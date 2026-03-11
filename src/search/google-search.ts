/**
 * Google Search - Búsqueda web usando Google Custom Search API
 */

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

interface GoogleSearchResponse {
  items: Array<{
    title: string;
    link: string;
    snippet: string;
    displayLink?: string;
  }>;
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
}

/**
 * Realiza una búsqueda web usando Google Custom Search API
 * Usa el programa gratuito que no requiere configuración compleja
 */
export async function googleSearch(
  query: string,
  numResults: number = 5
): Promise<{ results: SearchResult[]; totalResults?: string; searchTime?: number }> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY no está configurada en .env');
  }

  if (!searchEngineId) {
    throw new Error('GOOGLE_SEARCH_ENGINE_ID no está configurado en .env');
  }

  // Usar el endpoint del programa gratuito
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.append('key', apiKey);
  url.searchParams.append('cx', searchEngineId);
  url.searchParams.append('q', query);
  url.searchParams.append('num', Math.min(numResults, 10).toString());

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      }
    });

    const data = (await response.json()) as GoogleSearchResponse;

    if (!response.ok) {
      const errorMsg = (data as any).error?.message || JSON.stringify(data);
      throw new Error(`Error en Google Search: ${errorMsg}`);
    }

    const results: SearchResult[] = (data.items || []).map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink
    }));

    return {
      results,
      totalResults: data.searchInformation?.totalResults,
      searchTime: data.searchInformation?.searchTime
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al realizar búsqueda: ${error.message}`);
    }
    throw new Error('Error desconocido al realizar búsqueda');
  }
}
