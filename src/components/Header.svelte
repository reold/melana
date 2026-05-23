<script lang="ts">
  import SearchAutocomplete from "./SearchAutocomplete.svelte";

  export let query: string = "";
  export let onSearch: () => void = () => {};
  export let searchInput: HTMLInputElement | undefined = undefined;
</script>

<header class="topbar">
  <div class="logo">
    <!-- Aurora behind both icon and text -->
    <div class="aurora">
      <div class="aurora__item"></div>
      <div class="aurora__item"></div>
      <div class="aurora__item"></div>
      <div class="aurora__item"></div>
    </div>

    <svg
      class="logo-icon"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5"
      />
    </svg>

    <h1 class="logo-text">Melana</h1>
  </div>

  <div class="search-container">
    <SearchAutocomplete bind:query bind:searchInput onsearch={onSearch} />
  </div>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    gap: 20px;
  }

  .logo {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    background: var(--color-bg-dark);
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    color: #fff; /* white to blend with aurora */
    flex-shrink: 0;
    position: relative;
    z-index: 1; /* above aurora */
  }

  .logo-text {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter",
      sans-serif;
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -0.5px;
    margin: 0;
    color: #fff;
    position: relative;
    z-index: 1; /* above aurora */
  }

  /* Aurora – covers the whole .logo container */
  .aurora {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    mix-blend-mode: darken;
    pointer-events: none;
  }

  .aurora__item {
    overflow: hidden;
    position: absolute;
    width: 60vw;
    height: 60vw;
    border-radius: 37% 29% 27% 27% / 28% 25% 41% 37%;
    filter: blur(1rem);
    mix-blend-mode: overlay;
  }

  /* … unchanged animation definitions … */
  .aurora__item:nth-of-type(1) {
    background-color: #00c2ff;
    top: -50%;
    right: 0;
    animation:
      aurora-border 6s ease-in-out infinite,
      aurora-1 12s ease-in-out infinite alternate;
  }
  .aurora__item:nth-of-type(2) {
    background-color: #ffc640;
    right: 0;
    top: 0;
    animation:
      aurora-border 6s ease-in-out infinite,
      aurora-2 12s ease-in-out infinite alternate;
  }
  .aurora__item:nth-of-type(3) {
    background-color: #33ff8c;
    left: 0;
    bottom: 0;
    animation:
      aurora-border 6s ease-in-out infinite,
      aurora-3 8s ease-in-out infinite alternate;
  }
  .aurora__item:nth-of-type(4) {
    background-color: #e54cff;
    right: 0;
    bottom: -50%;
    animation:
      aurora-border 6s ease-in-out infinite,
      aurora-4 24s ease-in-out infinite alternate;
  }

  /* … keyframes unchanged … */
  @keyframes aurora-1 {
    0% {
      top: 0;
      right: 0;
    }
    50% {
      top: 100%;
      right: 75%;
    }
    75% {
      top: 100%;
      right: 25%;
    }
    100% {
      top: 0;
      right: 0;
    }
  }
  @keyframes aurora-2 {
    0% {
      top: -50%;
      left: 0%;
    }
    60% {
      top: 100%;
      left: 75%;
    }
    85% {
      top: 100%;
      left: 25%;
    }
    100% {
      top: -50%;
      left: 0%;
    }
  }
  @keyframes aurora-3 {
    0% {
      bottom: 0;
      left: 0;
    }
    40% {
      bottom: 100%;
      left: 75%;
    }
    65% {
      bottom: 40%;
      left: 50%;
    }
    100% {
      bottom: 0;
      left: 0;
    }
  }
  @keyframes aurora-4 {
    0% {
      bottom: -50%;
      right: 0;
    }
    50% {
      bottom: 0%;
      right: 40%;
    }
    90% {
      bottom: 50%;
      right: 25%;
    }
    100% {
      bottom: -50%;
      right: 0;
    }
  }
  @keyframes aurora-border {
    0% {
      border-radius: 37% 29% 27% 27% / 28% 25% 41% 37%;
    }
    25% {
      border-radius: 47% 29% 39% 49% / 61% 19% 66% 26%;
    }
    50% {
      border-radius: 57% 23% 47% 72% / 63% 17% 66% 33%;
    }
    75% {
      border-radius: 28% 49% 29% 100% / 93% 20% 64% 25%;
    }
    100% {
      border-radius: 37% 29% 27% 27% / 28% 25% 41% 37%;
    }
  }

  .search-container {
    display: flex;
    gap: 8px;
    align-items: center;
    flex: 1;
    max-width: 420px;
  }

  .search-container :global(input) {
    font-size: 16px !important;
  }

  @media (max-width: 768px) {
    .topbar {
      flex-direction: column;
      margin-bottom: 24px;
    }
    .search-container {
      width: 100%;
    }
  }
</style>
