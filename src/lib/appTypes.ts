import type { Movie } from "./tmdb";

export type AppView = "home" | "watch";

export type SyncRoom = {
  roomId: string;
  username: string;
};

export type SubtitleTrack = {
  url: string;
  lang: string;
  language: string;
};

export type StreamSource = {
  quality: string;
  url: string;
};

export type WatchState = {
  movie: Movie | null;
  streamUrl: string | null;
  subtitles: SubtitleTrack[];
  sources: StreamSource[];
};

export type EpisodePlayRequest = {
  episodeId: number;
  showTitle: string;
  year: string;
  tmdbId: number;
  season: number;
  episodeNumber: number;
  episodeName: string;
};

export type EpisodeHashRequest = {
  tmdbId: number;
  season: number;
  episodeNumber: number;
};
