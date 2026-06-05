<script lang="ts">
  export let onclose: () => void = () => {};
</script>

<div class="overlay" on:click={onclose}>
  <div class="card" on:click|stopPropagation>
    <slot />
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
  }
  .card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
