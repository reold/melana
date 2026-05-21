export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null; // ← missing, needed by MoviePopup
  release_date: string;
  vote_average: number;
  overview: string;
  imdb_id?: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface TMDBResponse {
  results: Movie[];
}

const API_KEY = "2f18d14add10afdea38c92446b35bce0";
const API_BASE = "https://api.themoviedb.org/3";

export async function fetchPopularMovies(): Promise<Movie[]> {
  const res = await fetch(
    `${API_BASE}/movie/popular?api_key=${API_KEY}&page=1`,
  );
  const data: TMDBResponse = await res.json();
  return data.results.slice(0, 20);
}

export async function searchMovies(query: string): Promise<Movie[]> {
  if (!query.trim()) return fetchPopularMovies();
  const res = await fetch(
    `${API_BASE}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`,
  );
  const data: TMDBResponse = await res.json();
  return data.results.slice(0, 20);
}

export async function fetchMovieDetails(
  movieId: number,
): Promise<Movie & { credits?: { cast: CastMember[] } }> {
  const res = await fetch(
    `${API_BASE}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`,
  );
  return res.json();
}

export async function fetchMovieCredits(
  movieId: number,
): Promise<CastMember[]> {
  const details = await fetchMovieDetails(movieId);
  return details.credits?.cast ?? [];
}

export type { Movie, CastMember };
