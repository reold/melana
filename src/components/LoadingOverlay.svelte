<script lang="ts">
  export let message = "Loading...";
</script>

<div class="loading-overlay">
  <div class="loading-card">
    <p class="progress-text">{message}</p>
    <div class="progress-bar" aria-hidden="true">
      <div class="progress-fill"></div>
    </div>
  </div>
</div>

<style>
  .loading-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(20px);
  }

  .loading-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 32px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    min-width: 280px;
  }

  .progress-text {
    font-size: 15px;
    color: var(--color-text-secondary);
    font-weight: 500;
    margin: 0;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    width: 40%;
    background: linear-gradient(90deg, var(--color-accent-blue), #5e9eff);
    border-radius: 2px;
    animation: progress-indeterminate 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes progress-indeterminate {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(300%);
    }
  }
</style>
