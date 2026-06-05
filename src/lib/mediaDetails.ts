import {
  fetchMovieCredits,
  fetchMovieDetails,
  fetchTVCredits,
  fetchTVDetails,
  type CastMember,
  type Movie,
} from "./tmdb";

export function isTVMovie(movie: Movie): boolean {
  return movie.media_type === "tv";
}

export async function fetchCastForMedia(movie: Movie): Promise<CastMember[]> {
  return isTVMovie(movie)
    ? fetchTVCredits(movie.id)
    : fetchMovieCredits(movie.id);
}

export function movieDetailsToMovie(details: any): Movie {
  return {
    id: details.id,
    title: details.title,
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    release_date: details.release_date,
    vote_average: details.vote_average,
    overview: details.overview,
    imdb_id: details.imdb_id,
    media_type: "movie",
  };
}

export function tvDetailsToMovie(details: any): Movie {
  return {
    id: details.id,
    title: details.name,
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    release_date: details.first_air_date,
    vote_average: details.vote_average,
    overview: details.overview,
    media_type: "tv",
  };
}

export async function fetchMovieSelectionDetails(id: number): Promise<{
  movie: Movie;
  cast: CastMember[];
}> {
  const details = await fetchMovieDetails(id);
  const cast = await fetchMovieCredits(id);

  return {
    movie: movieDetailsToMovie(details),
    cast,
  };
}

export async function fetchTVSelectionDetails(id: number): Promise<{
  movie: Movie;
  cast: CastMember[];
}> {
  const details = await fetchTVDetails(id);
  const cast = await fetchTVCredits(id);

  return {
    movie: tvDetailsToMovie(details),
    cast,
  };
}
