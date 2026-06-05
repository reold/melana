import type {
  EpisodePlayRequest,
  StreamSource,
  SubtitleTrack,
} from "./appTypes";
import { createProxyUrl } from "./proxy";
import { fetchMovieDetails, type Movie } from "./tmdb";
import { fetchEpisodeStreamUrl, fetchMovieStreamUrl } from "./videasy";
import {
  fetchMovieStreamUrlVidlink,
  fetchEpisodeStreamUrlVidlink,
} from "./vidlink";

export type WatchPayload = {
  movie: Movie;
  streamUrl: string;
  subtitles: SubtitleTrack[];
  sources: StreamSource[];
  episodeId?: number;
  seasonNumber?: number;
  tvShowId?: number;
};

type ProgressReporter = (message: string) => void;
type RawSource = { quality: string; url: string };
type RawSubtitle = { url: string; lang: string; language: string };

const PLAYER_BOOT_DELAY_MS = 400;

async function proxifyStreamResult({
  movie,
  sources,
  subtitles,
  onProgress,
  proxyOrigin,
}: {
  movie: Movie;
  sources: RawSource[];
  subtitles: RawSubtitle[];
  onProgress: ProgressReporter;
  proxyOrigin: string;
}): Promise<WatchPayload> {
  onProgress("Proxying stream...");
  const bestSource = sources.find((s) => s.quality === "1080p") ?? sources[0];
  if (!bestSource) throw new Error("No stream found");

  // Route everything through the proxy safely
  const proxiedSources = sources.map((s) => ({
    quality: s.quality,
    url: createProxyUrl(s.url, proxyOrigin),
  }));

  const proxiedSubtitles = dedupeSubtitles(
    subtitles.map((sub) => ({
      ...sub,
      url: createProxyUrl(sub.url, proxyOrigin),
    })),
  );

  await new Promise((r) => setTimeout(r, PLAYER_BOOT_DELAY_MS));

  return {
    movie,
    streamUrl: createProxyUrl(bestSource.url, proxyOrigin),
    sources: proxiedSources,
    subtitles: proxiedSubtitles,
  };
}

export async function buildMovieWatchPayload(
  movie: Movie,
  onProgress = () => {},
  source = "videasy",
) {
  onProgress("Fetching movie details...");
  const details = await fetchMovieDetails(movie.id);
  if (!details.imdb_id) throw new Error("Missing imdb_id");

  onProgress("Finding best stream...");
  const isVidlink = source === "vidlink";
  const proxyOrigin = isVidlink ? "https://vidlink.pro" : "https://cineby.sc";

  const result = isVidlink
    ? await fetchMovieStreamUrlVidlink({ tmdbId: details.id })
    : await fetchMovieStreamUrl({
        title: details.title,
        year: details.release_date?.slice(0, 4) ?? "",
        tmdbId: details.id,
        imdbId: details.imdb_id,
      });

  return proxifyStreamResult({
    movie: details,
    sources: result.sources,
    subtitles: result.subtitles,
    onProgress,
    proxyOrigin,
  });
}

export async function buildEpisodeWatchPayload(
  episodeData: EpisodePlayRequest,
  onProgress = () => {},
  source = "videasy",
) {
  onProgress("Finding best stream...");
  const isVidlink = source === "vidlink";
  const proxyOrigin = isVidlink ? "https://vidlink.pro" : "https://cineby.sc";

  const result = isVidlink
    ? await fetchEpisodeStreamUrlVidlink({
        tmdbId: episodeData.tmdbId,
        season: episodeData.season,
        episode: episodeData.episodeNumber,
      })
    : await fetchEpisodeStreamUrl({
        title: episodeData.showTitle,
        year: episodeData.year,
        tmdbId: episodeData.tmdbId,
        season: episodeData.season,
        episode: episodeData.episodeNumber,
      });

  const movie: Movie = {
    id: episodeData.episodeId,
    title: `${episodeData.showTitle} - S${String(episodeData.season).padStart(2, "0")}E${String(episodeData.episodeNumber).padStart(2, "0")} ${episodeData.episodeName}`,
    poster_path: null,
    backdrop_path: null,
    release_date: episodeData.year,
    vote_average: 0,
    overview: "",
    media_type: "tv",
  };

  const payload = await proxifyStreamResult({
    movie,
    sources: result.sources,
    subtitles: result.subtitles,
    onProgress,
    proxyOrigin,
  });

  payload.episodeId = episodeData.episodeId;
  payload.seasonNumber = episodeData.season;
  payload.tvShowId = episodeData.tmdbId;
  return payload;
}

export async function buildCustomWatchPayload(
  rawUrl: string,
  rawOrigin: string,
  onProgress: ProgressReporter = () => {},
): Promise<WatchPayload> {
  const url = rawUrl.trim();
  const origin = rawOrigin.trim();
  if (!url.endsWith(".m3u8")) throw new Error("Invalid .m3u8 URL");
  const streamUrl = createProxyUrl(url, origin);
  return {
    movie: {
      id: 0,
      title: "Custom Stream",
      poster_path: null,
      backdrop_path: null,
      release_date: "",
      vote_average: 0,
      overview: "",
      media_type: "movie",
    },
    streamUrl,
    sources: [{ quality: "Custom", url: streamUrl }],
    subtitles: [],
  };
}

export function dedupeSubtitles(s: SubtitleTrack[]) {
  const seen = new Set();
  return s.filter((x) => {
    const k = x.language.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
