import { writable, get, derived } from "svelte/store";
import type { MediaType, Movie, SortOption } from "./tmdb";
import { fetchCatalogPage, mergeUniqueMovies } from "./mediaCatalog";

export type CatalogParams = {
  query: string;
  mediaType: MediaType;
  sort: SortOption;
  page: number;
};

export function createCatalogStore() {
  // ---------- state ----------
  const movies = writable<Movie[]>([]);
  const loading = writable(false);
  const loadingMore = writable(false);
  const hasMore = writable(true);
  const error = writable("");
  const currentPage = writable(1);
  const totalPages = writable(1);

  // For internal tracking
  let _currentPage = 1;
  currentPage.subscribe((v) => (_currentPage = v));

  // ---------- derived ----------
  const isSearching = derived(
    [loading, loadingMore],
    ([$loading, $loadingMore]) => $loading || $loadingMore,
  );

  // ---------- actions ----------

  async function loadFirstPage(params: CatalogParams) {
    loading.set(true);
    error.set("");
    try {
      const data = await fetchCatalogPage({
        query: params.query,
        mediaType: params.mediaType,
        sort: params.sort,
        page: 1,
      });
      movies.set(data.results);
      totalPages.set(data.total_pages ?? 1);
      hasMore.set(1 < (data.total_pages ?? 1));
      currentPage.set(1);
    } catch (err) {
      console.error("Failed to fetch catalog", err);
      movies.set([]);
      hasMore.set(false);
      totalPages.set(1);
      error.set("Failed to load movies. Please try again.");
    } finally {
      loading.set(false);
    }
  }

  async function loadMore(params: CatalogParams) {
    if (get(loadingMore) || !get(hasMore) || get(loading)) return;
    loadingMore.set(true);
    error.set("");
    const nextPage = _currentPage + 1;
    try {
      const data = await fetchCatalogPage({
        query: params.query,
        mediaType: params.mediaType,
        sort: params.sort,
        page: nextPage,
      });
      movies.update((existing) => mergeUniqueMovies(existing, data.results));
      currentPage.set(nextPage);
      totalPages.set(data.total_pages ?? 1);
      hasMore.set(nextPage < (data.total_pages ?? 1));
    } catch (err) {
      console.error("Failed to load more", err);
      error.set("Failed to load more movies.");
    } finally {
      loadingMore.set(false);
    }
  }

  function reset() {
    movies.set([]);
    loading.set(false);
    loadingMore.set(false);
    hasMore.set(true);
    error.set("");
    currentPage.set(1);
    totalPages.set(1);
  }

  return {
    // stores
    movies,
    loading,
    loadingMore,
    hasMore,
    error,
    isSearching,
    // actions
    loadFirstPage,
    loadMore,
    reset,
  };
}
