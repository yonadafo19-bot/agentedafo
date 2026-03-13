/**
 * Brave Search - Búsqueda web privada usando Brave Search API
 * Plan gratuito: 2,000 requests por mes
 */

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface BraveSearchResponse {
  web?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  };
}

/**
 * Realiza una búsqueda web usando Brave Search API
 */
export async function braveSearch(
  query: string,
  numResults: number = 5
): Promise<{ results: SearchResult[] }> {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    throw new Error('BRAVE_API_KEY no está configurada en .env');
  }

  try {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.append('q', query);
    url.searchParams.append('count', Math.min(numResults, 20).toString());
    url.searchParams.append('text_decorations', 'false');
    url.searchParams.append('search_lang', 'es');
    url.searchParams.append('result_filter', 'web');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey
      }
    });

    const data = (await response.json()) as BraveSearchResponse;

    if (!response.ok) {
      throw new Error(`Error en Brave Search: ${response.status} ${response.statusText}`);
    }

    const results: SearchResult[] = (data.web?.results || []).map(item => ({
      title: item.title,
      link: item.url,
      snippet: item.description
    }));

    return { results };

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al realizar búsqueda: ${error.message}`);
    }
    throw new Error('Error desconocido al realizar búsqueda');
  }
}
