import { fetchSeasonEpisodes, type CastMember, type Movie } from "./tmdb";
import type { EpisodeHashRequest } from "./appTypes";
import {
  fetchMovieSelectionDetails,
  fetchTVSelectionDetails,
} from "./mediaDetails";

export type MediaHashRoute =
  | { kind: "movie"; id: number }
  | { kind: "tv"; id: number }
  | {
      kind: "episode";
      tvId: number;
      seasonNumber: number;
      episodeNumber: number;
    };

export type MediaSelection = {
  movie: Movie;
  cast: CastMember[];
  selectedEpisodeId: number | null;
  selectedSeasonNumber: number | null;
};

export function parseMediaHash(hashValue: string): MediaHashRoute | null {
  const hash = hashValue.startsWith("#") ? hashValue.slice(1) : hashValue;
  if (!hash) return null;

  const movieMatch = hash.match(/^m(\d+)$/);
  if (movieMatch) {
    return { kind: "movie", id: Number(movieMatch[1]) };
  }

  const tvMatch = hash.match(/^t(\d+)$/);
  if (tvMatch) {
    return { kind: "tv", id: Number(tvMatch[1]) };
  }

  const episodeMatch = hash.match(/^e(\d+)s(\d+)e(\d+)$/);
  if (episodeMatch) {
    return {
      kind: "episode",
      tvId: Number(episodeMatch[1]),
      seasonNumber: Number(episodeMatch[2]),
      episodeNumber: Number(episodeMatch[3]),
    };
  }

  return null;
}

export function toMediaHash(movie: Movie): string {
  return movie.media_type === "tv" ? `t${movie.id}` : `m${movie.id}`;
}

export function toEpisodeHash(episode: EpisodeHashRequest): string {
  return `e${episode.tmdbId}s${episode.season}e${episode.episodeNumber}`;
}

export function clearLocationHash() {
  history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
}

export async function loadMediaSelectionFromRoute(
  route: MediaHashRoute,
): Promise<MediaSelection | null> {
  if (route.kind === "movie") {
    const { movie, cast } = await fetchMovieSelectionDetails(route.id);

    return {
      movie,
      cast,
      selectedEpisodeId: null,
      selectedSeasonNumber: null,
    };
  }

  if (route.kind === "tv") {
    const { movie, cast } = await fetchTVSelectionDetails(route.id);

    return {
      movie,
      cast,
      selectedEpisodeId: null,
      selectedSeasonNumber: null,
    };
  }

  const { movie, cast } = await fetchTVSelectionDetails(route.tvId);
  const seasonEpisodes = await fetchSeasonEpisodes(
    route.tvId,
    route.seasonNumber,
  );
  const selectedEpisode = seasonEpisodes.find(
    (episode) => episode.episode_number === route.episodeNumber,
  );

  return {
    movie,
    cast,
    selectedEpisodeId: selectedEpisode?.id ?? null,
    selectedSeasonNumber: route.seasonNumber,
  };
}
