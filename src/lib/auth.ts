import { writable, derived, get } from "svelte/store";

export interface UserData {
  id: string;
  username: string;
  avatar: string | null;
  email?: string;
  email_verified?: boolean;
  provider: string;
}

interface AuthPlatform {
  token: string;
  user: UserData;
}

export interface AuthState {
  [provider: string]: AuthPlatform;
}

/* ---------- localStorage ---------- */
function getAuthFromStorage(): AuthState {
  try {
    const raw = localStorage.getItem("auth");
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

function setAuthToStorage(state: AuthState) {
  localStorage.setItem("auth", JSON.stringify(state));
}

/* ---------- store ---------- */
export const authState = writable<AuthState>(getAuthFromStorage());

export const currentUser = derived(authState, ($auth) => {
  const providers = Object.keys($auth);
  if (providers.length === 0) return null;
  const primary = providers[0]; // first logged‑in provider
  return { ...$auth[primary].user, provider: primary };
});

authState.subscribe((state) => setAuthToStorage(state));

/* ---------- helpers ---------- */
const AUTH_SERVER = "https://auth.reold.workers.dev";
const ALLOWED_ORIGIN = "https://auth.reold.workers.dev";

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/* ---------- public API ---------- */

/** Silently verify an existing token on app mount */
export async function initAuth(): Promise<void> {
  const state = get(authState);
  const providers = Object.keys(state);
  if (providers.length === 0) return;

  const provider = providers[0];
  const { token } = state[provider];

  try {
    const res = await fetch(`${AUTH_SERVER}/discord/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      // invalid / expired → clear
      authState.update((s) => {
        delete s[provider];
        return s;
      });
      return;
    }
    const user = await res.json();
    // refresh with server data
    authState.update((s) => {
      s[provider] = {
        token,
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          email: user.email,
          email_verified: user.email_verified,
          provider,
        },
      };
      return s;
    });
  } catch {
    // network error – keep existing, could retry later
    console.warn("Auth verification failed, using cached data");
  }
}

/** Store credentials from a successful popup flow */
export function handlePopupAuth(token: string, user: UserData) {
  authState.update((s) => {
    s[user.provider] = { token, user };
    return s;
  });
}

/** Log out a provider */
export function logout(provider: string) {
  authState.update((s) => {
    delete s[provider];
    return s;
  });
}

/** Opens the Discord auth popup and resolves when logged in, rejects if closed */
export function startDiscordAuthPopup(): Promise<void> {
  return new Promise((resolve, reject) => {
    const origin = window.location.origin;
    const popupUrl = `${AUTH_SERVER}/discord?popup=1&origin=${encodeURIComponent(origin)}`;

    const popup = window.open(popupUrl, "discord-auth", "width=500,height=650");
    if (!popup) {
      // Popup blocked → fallback to full redirect
      window.location.href = `${AUTH_SERVER}/discord`;
      return reject(new Error("Popup blocked"));
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== ALLOWED_ORIGIN) return;
      const data = event.data;
      if (data && data.type === "discord-auth" && data.token && data.user) {
        handlePopupAuth(data.token, data.user);
        popup.close();
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve();
      }
    };
    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        // If we get here without resolving, the user closed the popup
        reject(new Error("Popup closed by user"));
      }
    }, 500);
  });
}
