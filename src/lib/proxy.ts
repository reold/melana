interface ProxyData {
  url: string;
  origin: string;
  referer: string;
  src: boolean;
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  // Convert to binary string, then base64
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createProxyUrl(streamUrl: string): string {
  const proxyData: ProxyData = {
    url: streamUrl,
    origin: "https://cineby.sc",
    referer: "https://cineby.sc/",
    src: true,
  };
  const json = JSON.stringify(proxyData);
  const base64url = toBase64Url(json);
  return `https://melana.onrender.com/url/${base64url}.m3u8`;
}
