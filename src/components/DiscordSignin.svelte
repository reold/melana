<script lang="ts">
  import { handlePopupAuth, logout } from "../lib/auth";
  import type { UserData } from "../lib/auth";

  export let user: UserData | null = null;

  const AUTH_SERVER = "https://auth.reold.workers.dev";
  const ALLOWED_ORIGIN = "https://auth.reold.workers.dev";

  let popup: Window | null = null;
  let messageHandler: ((e: MessageEvent) => void) | null = null;
  let checkInterval: number | null = null;

  function cleanup() {
    if (messageHandler) {
      window.removeEventListener("message", messageHandler);
      messageHandler = null;
    }
    if (checkInterval !== null) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    popup = null;
  }

  function startPopupFlow() {
    const origin = window.location.origin;
    const popupUrl = `${AUTH_SERVER}/discord?popup=1&origin=${encodeURIComponent(origin)}`;

    popup = window.open(popupUrl, "discord-auth", "width=500,height=650");

    if (!popup) {
      window.location.href = `${AUTH_SERVER}/discord`;
      return;
    }

    messageHandler = (event: MessageEvent) => {
      if (event.origin !== ALLOWED_ORIGIN) return;
      const data = event.data;
      if (data && data.type === "discord-auth" && data.token && data.user) {
        handlePopupAuth(data.token, data.user);
        cleanup();
        popup?.close();
      }
    };
    window.addEventListener("message", messageHandler);

    checkInterval = window.setInterval(() => {
      if (popup && popup.closed) cleanup();
    }, 500);
  }
</script>

{#if user && user.provider === "discord"}
  <!-- Connected state -->
  <div class="discord-connected">
    {#if user.avatar}
      <img
        src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
        alt=""
        class="avatar"
      />
    {:else}
      <div class="avatar placeholder">?</div>
    {/if}
    <span class="label">
      Connected as <strong>{user.username}</strong>
    </span>
    <button class="disconnect-btn" on:click={() => logout("discord")}>
      Disconnect
    </button>
  </div>
{:else}
  <!-- Sign‑in button -->
  <button class="discord-btn" on:click={startPopupFlow}>
    <svg
      class="discord-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -28.5 256 256"
      preserveAspectRatio="xMidYMid"
    >
      <path
        d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
        fill="#5865F2"
        fill-rule="nonzero"
      />
    </svg>
    <span class="btn-text">Continue with Discord</span>
  </button>
{/if}

<style>
  /* ── Sign‑in button (matches reold.github.io) ── */
  .discord-btn {
    display: flex;
    align-items: center;
    background: black;
    color: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 0.5rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    font-family: "Courier New", monospace;
    cursor: pointer;
    transition:
      background 0.15s,
      box-shadow 0.15s;
  }
  .discord-btn:hover {
    background: #111;
  }
  .discord-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.5);
  }
  .discord-icon {
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 0.5rem;
  }
  .btn-text {
    font-family: "Courier New", monospace;
  }

  /* ── Connected state ── */
  .discord-connected {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-family: "Courier New", monospace;
    color: #d1d5db;
  }
  .avatar {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 9999px;
  }
  .avatar.placeholder {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 9999px;
    background: #4b5563;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    color: white;
  }
  .label {
    color: #d1d5db;
  }
  .disconnect-btn {
    background: none;
    border: none;
    color: #f87171;
    text-decoration: underline;
    cursor: pointer;
    font-family: "Courier New", monospace;
  }
  .disconnect-btn:hover {
    color: #fca5a5;
  }
</style>
