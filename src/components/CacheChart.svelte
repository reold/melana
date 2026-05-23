<script lang="ts">
  import { afterUpdate, tick } from "svelte";
  import type { HealthInfo } from "../lib/proxy";

  export let healthInfo: HealthInfo;

  let canvas: HTMLCanvasElement;

  $: if (healthInfo) tick().then(() => drawChart());

  async function drawChart() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const logicalSize = 100; // smaller pie
    canvas.width = logicalSize * dpr;
    canvas.height = logicalSize * dpr;
    canvas.style.width = logicalSize + "px";
    canvas.style.height = logicalSize + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = logicalSize / 2,
      cy = logicalSize / 2,
      r = logicalSize / 2 - 6;
    const percent = healthInfo.cache.utilization_percent;
    const angle = (percent / 100) * 2 * Math.PI;

    ctx.clearRect(0, 0, logicalSize, logicalSize);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + angle);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    gradient.addColorStop(0, "#007aff");
    gradient.addColorStop(1, "#ff2d55");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 14px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(percent.toFixed(1) + "%", cx, cy - 6);
    ctx.font = "400 9px -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("used", cx, cy + 10);
  }
</script>

<div class="cache-card">
  <canvas bind:this={canvas} class="pie"></canvas>
  <div class="cache-info">
    <p class="cache-title">Cache</p>
    <p class="cache-stat">
      {healthInfo.cache.current_bytes
        ? (healthInfo.cache.current_bytes / 1e9).toFixed(1)
        : "0"} / {healthInfo.cache.max_gb.toFixed(1)} GB
    </p>
    <p class="cache-stat">{healthInfo.cache.entries} entries</p>
  </div>
</div>

<style>
  .cache-card {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--color-bg-surface);
    border-radius: 12px;
    padding: 8px 12px;
    box-shadow: var(--shadow-card);
  }
  .pie {
    width: 60px;
    height: 60px;
    flex-shrink: 0;
    display: block;
  }
  .cache-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .cache-title {
    font-size: 13px;
    font-weight: 600;
    margin: 0;
  }
  .cache-stat {
    font-size: 11px;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.3;
  }
</style>
