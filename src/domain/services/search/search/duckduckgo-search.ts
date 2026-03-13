/**
 * DuckDuckGo Search - Búsqueda web gratuita y sin API key
 * Usa DuckDuckGo Instant Answer API
 */

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface DuckDuckGoResponse {
  AbstractText?: string;
  AbstractURL?: string;
  AbstractSource?: string;
  RelatedTopics?: Array<{
    Text?: string;
    FirstURL?: string;
  }>;
}

/**
 * Realiza una búsqueda web usando DuckDuckGo (gratis, sin API key)
 */
export async function duckDuckGoSearch(
  query: string,
  numResults: number = 5
): Promise<{ results: SearchResult[] }> {
  try {
    // DuckDuckGo Instant Answer API
    const url = new URL('https://api.duckduckgo.com/');
    url.searchParams.append('q', query);
    url.searchParams.append('format', 'json');
    url.searchParams.append('no_html', '1');
    url.searchParams.append('skip_disambig', '1');

    const response = await fetch(url.toString());
    const data = (await response.json()) as DuckDuckGoResponse;

    const results: SearchResult[] = [];

    // Añadir respuesta principal si existe
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.AbstractSource || 'Resumen',
        link: data.AbstractURL,
        snippet: data.AbstractText
      });
    }

    // Añadir temas relacionados
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics) {
        if (topic.Text && topic.FirstURL && results.length < numResults) {
          // Limpiar el texto (DuckDuckGo incluye HTML)
          const cleanText = topic.Text.replace(/<[^>]*>/g, '').substring(0, 200);
          results.push({
            title: cleanText.split(' - ')[0] || 'Resultado',
            link: topic.FirstURL,
            snippet: cleanText
          });
        }
      }
    }

    // Si no hay resultados, hacer una búsqueda web simple
    if (results.length === 0) {
      return {
        results: [{
          title: 'Búsqueda en DuckDuckGo',
          link: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: `No se encontraron resultados instantáneos. Haz clic para ver los resultados completos en DuckDuckGo.`
        }]
      };
    }

    return { results };

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al realizar búsqueda: ${error.message}`);
    }
    throw new Error('Error desconocido al realizar búsqueda');
  }
}
