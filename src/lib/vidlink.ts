interface Source {
  quality: string;
  url: string;
}
interface Subtitle {
  url: string;
  lang: string;
  language: string;
}

const GENERIC_PROXY = "https://melana.onrender.com/proxy"; // "http://localhost:8000/proxy";

async function encryptTmdbId(tmdbId: number): Promise<string> {
  const res = await fetch(`https://enc-dec.app/api/enc-vidlink?text=${tmdbId}`);
  const data = await res.json();
  if (data.status !== 200) {
    throw new Error(data.error || "Vidlink encryption failed");
  }
  return data.result;
}

async function fetchVidlinkApi(apiUrl: string) {
  const params = new URLSearchParams({
    url: apiUrl,
    h_Origin: "https://vidlink.pro",
    h_Referer: "https://vidlink.pro/",
    h_User_Agent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  });

  const res = await fetch(`${GENERIC_PROXY}?${params.toString()}`);
  const data = await res.json();

  // Explicitly reject non-M3U8 responses (like the MP4 qualities edge case)
  if (!data.stream?.playlist || !data.stream.playlist.includes(".m3u8")) {
    throw new Error("Stream is not playable (HLS format not available).");
  }

  return {
    sources: [{ quality: "Auto", url: data.stream.playlist }],
    subtitles: (data.stream.captions || []).map((c: any) => ({
      url: c.url,
      lang: c.label || c.language || "Unknown",
      language: c.label || c.language || "Unknown",
    })),
  };
}

export const fetchMovieStreamUrlVidlink = async (movie: { tmdbId: number }) => {
  const id = await encryptTmdbId(movie.tmdbId);
  return fetchVidlinkApi(`https://vidlink.pro/api/b/movie/${id}`);
};

export const fetchEpisodeStreamUrlVidlink = async (ep: {
  tmdbId: number;
  season: number;
  episode: number;
}) => {
  const id = await encryptTmdbId(ep.tmdbId);
  return fetchVidlinkApi(
    `https://vidlink.pro/api/b/tv/${id}/${ep.season}/${ep.episode}`,
  );
};
