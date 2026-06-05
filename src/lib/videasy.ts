interface Source {
  quality: string;
  url: string;
}

interface Subtitle {
  url: string;
  lang: string;
  language: string;
}

const GENERIC_PROXY = "https://melana.onrender.com/proxy";

async function fetchEncryptedVideasy(params: {
  title: string;
  year: string;
  tmdbId: number;
  imdbId: string;
  mediaType: string;
  season?: number;
  episode?: number;
}): Promise<string> {
  // Build the Videasy URL exactly as before
  const doubleEncoded = encodeURIComponent(encodeURIComponent(params.title));
  const query = new URLSearchParams({
    title: doubleEncoded,
    mediaType: params.mediaType,
    year: params.year,
    tmdbId: params.tmdbId.toString(),
    imdbId: params.imdbId,
  });
  if (params.mediaType === "tv" && params.season && params.episode) {
    query.set("season", params.season.toString());
    query.set("episode", params.episode.toString());
  }
  const videasyUrl = `https://api.videasy.net/cdn/sources-with-title?${query.toString()}`;

  // Route through proxy with the required headers
  const proxyParams = new URLSearchParams({
    url: videasyUrl,
    h_Origin: "https://cineby.sc",
    h_Referer: "https://cineby.sc/",
    "h_User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  });

  const res = await fetch(`${GENERIC_PROXY}?${proxyParams.toString()}`);
  if (!res.ok) {
    throw new Error(`Videasy proxy fetch failed: ${res.status}`);
  }
  return res.text();
}

export async function fetchMovieStreamUrl(movie: {
  title: string;
  year: string;
  tmdbId: number;
  imdbId: string;
}): Promise<{ sources: Source[]; subtitles: Subtitle[] }> {
  const encText = await fetchEncryptedVideasy({
    title: movie.title,
    year: movie.year,
    tmdbId: movie.tmdbId,
    imdbId: movie.imdbId,
    mediaType: "movie",
  });

  // Decrypt (no CORS issues with enc‑dec.app)
  const decRes = await fetch("https://enc-dec.app/api/dec-videasy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: encText, id: movie.tmdbId.toString() }),
  });
  const decData = await decRes.json();
  if (decData.status !== 200) {
    throw new Error(decData.error || "Decryption failed");
  }

  return {
    sources: decData.result?.sources ?? [],
    subtitles: decData.result?.subtitles ?? [],
  };
}

export async function fetchEpisodeStreamUrl(episode: {
  title: string;
  year: string;
  tmdbId: number;
  imdbId?: string;
  season: number;
  episode: number;
}): Promise<{ sources: Source[]; subtitles: Subtitle[] }> {
  const encText = await fetchEncryptedVideasy({
    title: episode.title,
    year: episode.year,
    tmdbId: episode.tmdbId,
    imdbId: episode.imdbId ?? "",
    mediaType: "tv",
    season: episode.season,
    episode: episode.episode,
  });

  const decRes = await fetch("https://enc-dec.app/api/dec-videasy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: encText, id: episode.tmdbId.toString() }),
  });
  const decData = await decRes.json();
  if (decData.status !== 200) {
    throw new Error(decData.error || "Decryption failed");
  }

  return {
    sources: decData.result?.sources ?? [],
    subtitles: decData.result?.subtitles ?? [],
  };
}
