interface ProxyData {
  url: string;
  origin: string;
  src: boolean;
}

export interface HealthInfo {
  status: string;
  service: string;
  version: string;
  endpoint: string;
  cache: {
    entries: number;
    current_bytes: number;
    max_bytes: number;
    max_gb: number;
    utilization_percent: number;
  };
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Build a proxied .m3u8 URL.
 *
 * The backend proxy automatically derives the Referer header from
 * `origin + "/"`, so we only need to send `url` and `origin`.
 */
export function createProxyUrl(
  streamUrl: string,
  origin: string = "https://cineby.sc",
): string {
  const proxyData: ProxyData = {
    url: streamUrl,
    origin,
    src: true,
  };
  const json = JSON.stringify(proxyData);
  const base64url = toBase64Url(json);
  return `https://melana.onrender.com/url/${base64url}.m3u8`;
}

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch("https://melana.onrender.com/");
  if (!res.ok) throw new Error(`health ${res.status}`);
  return res.json();
}
