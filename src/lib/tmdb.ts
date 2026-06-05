export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
  imdb_id?: string;
  media_type?: "movie" | "tv";
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TMDBPaginatedResponse {
  results: Movie[];
  page: number;
  total_pages: number;
  total_results: number;
}

export type SortOption =
  | "popularity.desc"
  | "vote_average.desc"
  | "release_date.desc"
  | "original_title.asc";

export type MediaType = "movie" | "tv";

const API_KEY = "2f18d14add10afdea38c92446b35bce0";
const API_BASE = "https://api.themoviedb.org/3";

function normalizeMediaItem(raw: any, mediaType?: "movie" | "tv"): Movie {
  return {
    id: raw.id,
    title: raw.title ?? raw.name ?? "",
    poster_path: raw.poster_path,
    backdrop_path: raw.backdrop_path,
    release_date: raw.release_date ?? raw.first_air_date ?? "",
    vote_average: raw.vote_average,
    overview: raw.overview,
    imdb_id: raw.imdb_id,
    media_type: raw.media_type ?? mediaType ?? "movie",
  };
}

function normalizeResponse(
  data: TMDBPaginatedResponse,
  mediaType?: "movie" | "tv",
): TMDBPaginatedResponse {
  return {
    ...data,
    results: data.results.map((item) => normalizeMediaItem(item, mediaType)),
  };
}

export async function fetchDiscover(
  media: MediaType,
  sort_by: SortOption = "popularity.desc",
  page = 1,
): Promise<TMDBPaginatedResponse> {
  const endpoint = media === "movie" ? "movie" : "tv";
  const res = await fetch(
    `${API_BASE}/discover/${endpoint}?api_key=${API_KEY}&sort_by=${sort_by}&page=${page}`,
  );
  if (!res.ok) throw new Error(`Discover request failed: ${res.status}`);
  const data: TMDBPaginatedResponse = await res.json();
  return normalizeResponse(data, media);
}

export async function fetchPopularMovies(
  page = 1,
): Promise<TMDBPaginatedResponse> {
  const res = await fetch(
    `${API_BASE}/movie/popular?api_key=${API_KEY}&page=${page}`,
  );
  if (!res.ok) throw new Error(`Popular movies request failed: ${res.status}`);
  const data: TMDBPaginatedResponse = await res.json();
  return normalizeResponse(data, "movie");
}

export async function searchMovies(
  query: string,
  page = 1,
): Promise<TMDBPaginatedResponse> {
  if (!query.trim()) return fetchPopularMovies(page);
  const res = await fetch(
    `${API_BASE}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`,
  );
  if (!res.ok) throw new Error(`Search movies request failed: ${res.status}`);
  const data: TMDBPaginatedResponse = await res.json();
  return normalizeResponse(data, "movie");
}

export async function searchTV(
  query: string,
  page = 1,
): Promise<TMDBPaginatedResponse> {
  const res = await fetch(
    `${API_BASE}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`,
  );
  if (!res.ok) throw new Error(`Search TV request failed: ${res.status}`);
  const data: TMDBPaginatedResponse = await res.json();
  return normalizeResponse(data, "tv");
}

export async function fetchMovieDetails(
  movieId: number,
): Promise<Movie & { credits?: { cast: CastMember[] } }> {
  const res = await fetch(
    `${API_BASE}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`,
  );
  if (!res.ok) throw new Error(`Movie details request failed: ${res.status}`);
  return res.json();
}

export async function fetchMovieCredits(
  movieId: number,
): Promise<CastMember[]> {
  const details = await fetchMovieDetails(movieId);
  return details.credits?.cast ?? [];
}

// TV Specific Interfaces
export interface SeasonSummary {
  id: number;
  season_number: number;
  name: string;
  episode_count: number | null;
  poster_path: string | null;
  air_date: string | null;
  overview: string | null;
  vote_average: number | null;
}

export interface TVDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  genres: { id: number; name: string }[];
  networks: { id: number; name: string; logo_path: string | null }[];
  created_by: { id: number; name: string; profile_path: string | null }[];
  last_episode_to_air: Episode | null;
  next_episode_to_air: Episode | null;
  seasons: SeasonSummary[];
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  episode_number: number;
  season_number: number;
  vote_average: number;
  runtime: number | null;
  crew: {
    id: number;
    name: string;
    job: string;
    profile_path: string | null;
  }[];
  guest_stars: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
  }[];
  vote_count: number;
  production_code: string | null;
}

export async function fetchTVDetails(tvId: number): Promise<TVDetails> {
  const res = await fetch(`${API_BASE}/tv/${tvId}?api_key=${API_KEY}`);
  if (!res.ok) throw new Error(`TV details request failed: ${res.status}`);
  return res.json();
}

export async function fetchSeasonEpisodes(
  tvId: number,
  seasonNumber: number,
): Promise<Episode[]> {
  const res = await fetch(
    `${API_BASE}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`,
  );
  if (!res.ok) throw new Error(`Season episodes request failed: ${res.status}`);
  const data = await res.json();
  return data.episodes ?? [];
}

export async function fetchTVCredits(tvId: number): Promise<CastMember[]> {
  const res = await fetch(
    `${API_BASE}/tv/${tvId}/aggregate_credits?api_key=${API_KEY}`,
  );
  if (!res.ok) throw new Error(`TV credits request failed: ${res.status}`);
  const data = await res.json();
  return (data.cast ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    character: c.roles?.[0]?.character ?? "",
    profile_path: c.profile_path,
  }));
}

// Helper function to check if a season has actual episode data
export function seasonHasEpisodes(season: SeasonSummary): boolean {
  return season.episode_count !== null && season.episode_count > 0;
}

export type { Movie, CastMember };
