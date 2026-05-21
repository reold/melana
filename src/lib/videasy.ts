const HEADERS = {
  Accept: "*/*",
  Origin: "https://cineby.sc",
  Referer: "https://cineby.sc/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
};

interface StreamResult {
  sources: { url: string; quality: string }[];
}

export async function fetchMovieStreamUrl(movie: {
  title: string;
  year: string;
  tmdbId: number;
  imdbId: string;
}): Promise<string> {
  // Double‑encode title as required by videasy
  const doubleEncodedTitle = encodeURIComponent(
    encodeURIComponent(movie.title),
  );
  const server = "cdn"; // default server

  const videasyUrl = `https://api.videasy.net/${server}/sources-with-title?title=${doubleEncodedTitle}&mediaType=movie&year=${movie.year}&tmdbId=${movie.tmdbId}&imdbId=${movie.imdbId}`;

  // 1. Fetch encrypted text
  const encRes = await fetch(videasyUrl, { headers: HEADERS });
  const encText = await encRes.text();

  // 2. Decrypt via enc‑dec.app
  const decRes = await fetch("https://enc-dec.app/api/dec-videasy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: encText, id: movie.tmdbId.toString() }),
  });
  const decData = await decRes.json();
  if (decData.status !== 200)
    throw new Error("Decryption failed: " + decData.error);

  const sources: { url: string }[] = decData.result?.sources ?? decData.result;
  const m3u8 = sources.find((s) => s.url.includes(".m3u8"))?.url;
  if (!m3u8) throw new Error("No m3u8 stream found");
  return m3u8;
}
