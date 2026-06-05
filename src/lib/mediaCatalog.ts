import {
  fetchDiscover,
  searchMovies,
  searchTV,
  type MediaType,
  type Movie,
  type SortOption,
  type TMDBPaginatedResponse,
} from "./tmdb";

export type CatalogPageRequest = {
  query: string;
  mediaType: MediaType;
  sort: SortOption;
  page: number;
};

export const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Popularity", value: "popularity.desc" },
  { label: "Rating", value: "vote_average.desc" },
  { label: "Date", value: "release_date.desc" },
  { label: "Title A‑Z", value: "original_title.asc" },
];

export async function fetchCatalogPage({
  query,
  mediaType,
  sort,
  page,
}: CatalogPageRequest): Promise<TMDBPaginatedResponse<Movie>> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return fetchDiscover(mediaType, sort, page);
  }

  return mediaType === "movie"
    ? searchMovies(trimmedQuery, page)
    : searchTV(trimmedQuery, page);
}

export function mergeUniqueMovies(
  existingMovies: Movie[],
  incomingMovies: Movie[],
): Movie[] {
  const existingIds = new Set(existingMovies.map((movie) => movie.id));
  const uniqueIncoming = incomingMovies.filter(
    (movie) => !existingIds.has(movie.id),
  );

  return [...existingMovies, ...uniqueIncoming];
}
