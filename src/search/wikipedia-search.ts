/**
 * Wikipedia Search - Búsqueda en Wikipedia (gratis, sin API key)
 */

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface WikipediaSearchResponse {
  query: {
    search: Array<{
      title: string;
      pageid: number;
      snippet: string;
    }>;
  };
}

/**
 * Realiza una búsqueda en Wikipedia
 */
export async function wikipediaSearch(
  query: string,
  numResults: number = 5,
  language: string = 'es'
): Promise<{ results: SearchResult[] }> {
  try {
    // Buscar artículos en Wikipedia
    const searchUrl = new URL(`https://${language}.wikipedia.org/w/api.php`);
    searchUrl.searchParams.append('action', 'query');
    searchUrl.searchParams.append('list', 'search');
    searchUrl.searchParams.append('srsearch', query);
    searchUrl.searchParams.append('format', 'json');
    searchUrl.searchParams.append('srlimit', Math.min(numResults, 10).toString());
    searchUrl.searchParams.append('origin', '*');

    const searchResponse = await fetch(searchUrl.toString());
    const searchData = (await searchResponse.json()) as WikipediaSearchResponse;

    if (!searchResponse.ok) {
      throw new Error('Error al buscar en Wikipedia');
    }

    const results: SearchResult[] = [];

    // Obtener resúmenes de los artículos encontrados
    for (const item of searchData.query.search) {
      try {
        const summaryUrl = new URL(`https://${language}.wikipedia.org/w/api.php`);
        summaryUrl.searchParams.append('action', 'query');
        summaryUrl.searchParams.append('prop', 'extracts|pageprops');
        summaryUrl.searchParams.append('exintro', '1');
        summaryUrl.searchParams.append('explaintext', '1');
        summaryUrl.searchParams.append('pageids', item.pageid.toString());
        summaryUrl.searchParams.append('format', 'json');
        summaryUrl.searchParams.append('origin', '*');

        const summaryResponse = await fetch(summaryUrl.toString());
        const summaryData = (await summaryResponse.json()) as any;

        const page = summaryData.query.pages[item.pageid.toString()];
        if (page) {
          results.push({
            title: item.title,
            link: `https://${language}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
            snippet: (page.extract || 'Sin descripción').substring(0, 300)
          });
        }
      } catch {
        // Si falla obtener el resumen, usar el snippet de búsqueda
        results.push({
          title: item.title,
          link: `https://${language}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
          snippet: item.snippet.replace(/<[^>]*>/g, '').substring(0, 300)
        });
      }
    }

    return { results };

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al realizar búsqueda: ${error.message}`);
    }
    throw new Error('Error desconocido al realizar búsqueda');
  }
}
