interface Source {
  quality: string;
  url: string;
}

interface Subtitle {
  url: string;
  lang: string;
  language: string;
}

interface VideasyResult {
  sources: Source[];
  subtitles: Subtitle[];
}

const HEADERS = {
  Accept: "*/*",
  Origin: "https://cineby.sc",
  Referer: "https://cineby.sc/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
};

export async function fetchMovieStreamUrl(movie: {
  title: string;
  year: string;
  tmdbId: number;
  imdbId: string;
}): Promise<{ sources: Source[]; subtitles: Subtitle[] }> {
  const doubleEncodedTitle = encodeURIComponent(
    encodeURIComponent(movie.title),
  );
  const server = "cdn";

  const videasyUrl = `https://api.videasy.net/${server}/sources-with-title?title=${doubleEncodedTitle}&mediaType=movie&year=${movie.year}&tmdbId=${movie.tmdbId}&imdbId=${movie.imdbId}`;

  const encRes = await fetch(videasyUrl, { headers: HEADERS });
  const encText = await encRes.text();

  const decRes = await fetch("https://enc-dec.app/api/dec-videasy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: encText, id: movie.tmdbId.toString() }),
  });
  const decData = await decRes.json();
  if (decData.status !== 200)
    throw new Error("Decryption failed: " + decData.error);

  return {
    sources: decData.result?.sources ?? [],
    subtitles: decData.result?.subtitles ?? [],
  };
}
