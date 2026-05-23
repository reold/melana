interface ProxyData {
  url: string;
  origin: string;
  referer: string;
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

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch("https://melana.onrender.com/");
  return res.json();
}
