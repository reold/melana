<script lang="ts">
  export let query: string = "";
  export let onSearch: () => void = () => {};
  export let searchInput: HTMLInputElement | undefined = undefined;
</script>

<header class="topbar">
  <div class="logo">Melana</div>
  <div class="search-container">
    <input
      bind:this={searchInput}
      bind:value={query}
      placeholder="Search Movies"
      aria-label="Search movies"
      class="search-input"
    />
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
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter",
      sans-serif;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--color-text-primary);
    background: linear-gradient(
      135deg,
      var(--color-accent-blue),
      var(--color-accent-pink)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    flex-shrink: 0;
  }

  .search-container {
    display: flex;
    gap: 8px;
    align-items: center;
    flex: 1;
    max-width: 420px;
  }

  .search-input {
    flex: 1;
    padding: 10px 16px;
    border-radius: 20px;
    border: none;
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    outline: none;
    font-size: 15px;
    font-weight: 500;
    transition: background 0.2s;
    backdrop-filter: blur(10px);
  }

  .search-input::placeholder {
    color: var(--color-text-tertiary);
  }

  .search-input:focus {
    background: #3a3a3c;
    box-shadow: 0 0 0 2px var(--color-accent-blue);
  }

  .search-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: none;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      background 0.2s,
      transform 0.1s;
  }

  .search-button:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .search-button:active {
    transform: scale(0.95);
  }

  .search-icon {
    width: 20px;
    height: 20px;
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
