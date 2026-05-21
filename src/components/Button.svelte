<script lang="ts">
  type ButtonVariant = "primary" | "secondary" | "success" | "danger";
  type ButtonSize = "sm" | "md" | "lg";

  export let variant: ButtonVariant = "primary";
  export let size: ButtonSize = "md";
  export let disabled: boolean = false;
  export let onClick: () => void = () => {};
</script>

<button class={`btn btn-${variant} btn-${size}`} {disabled} on:click={onClick}>
  <span class="btn-content">
    <slot />
  </span>
</button>

<style>
  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    font-weight: 600;
    letter-spacing: -0.2px;
    border-radius: 10px;
    transition: all 0.2s var(--timing-ease-out);
    transform: scale(1);
    box-shadow: none;
  }

  .btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  /* Sizes */
  .btn-sm {
    padding: 6px 12px;
    font-size: 13px;
  }

  .btn-md {
    padding: 10px 18px;
    font-size: 15px;
  }

  .btn-lg {
    padding: 14px 24px;
    font-size: 17px;
  }

  /* Variants */
  .btn-primary {
    background: var(--color-accent-blue);
    color: #fff;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0070e9;
    transform: scale(1.02);
  }

  .btn-primary:active:not(:disabled) {
    transform: scale(0.98);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.02);
  }

  .btn-secondary:active:not(:disabled) {
    transform: scale(0.98);
  }

  .btn-success {
    background: var(--color-accent-green);
    color: #fff;
  }

  .btn-success:hover:not(:disabled) {
    background: #30b94e;
    transform: scale(1.02);
  }

  .btn-success:active:not(:disabled) {
    transform: scale(0.98);
  }

  .btn-danger {
    background: var(--color-accent-pink);
    color: #fff;
  }

  .btn-danger:hover:not(:disabled) {
    background: #e02545;
    transform: scale(1.02);
  }

  .btn-danger:active:not(:disabled) {
    transform: scale(0.98);
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
</style>
