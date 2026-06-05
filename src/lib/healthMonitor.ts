import { writable } from "svelte/store";
import { fetchHealth, type HealthInfo } from "./proxy";

export type HealthMonitorState = {
  healthInfo: HealthInfo | null;
  cacheJustUpdated: boolean;
  proxyStarting: boolean;
};

const INITIAL_STATE: HealthMonitorState = {
  healthInfo: null,
  cacheJustUpdated: false,
  proxyStarting: true,
};

export function createHealthMonitor() {
  const { subscribe, set } = writable<HealthMonitorState>(INITIAL_STATE);

  let state = INITIAL_STATE;
  let interval: ReturnType<typeof setInterval> | null = null;
  let cacheUpdateTimer: ReturnType<typeof setTimeout> | null = null;
  let inflight = false;

  function setState(nextState: HealthMonitorState) {
    state = nextState;
    set(state);
  }

  async function refresh() {
    if (inflight) return;
    inflight = true;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch("https://melana.onrender.com/", {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`health ${response.status}`);
      const nextHealthInfo: HealthInfo = await response.json();

      const cacheChanged = Boolean(
        state.healthInfo &&
        nextHealthInfo.cache.utilization_percent !==
          state.healthInfo.cache.utilization_percent,
      );

      setState({
        healthInfo: nextHealthInfo,
        cacheJustUpdated: cacheChanged ? true : state.cacheJustUpdated,
        proxyStarting: false,
      });

      if (cacheChanged) {
        if (cacheUpdateTimer) clearTimeout(cacheUpdateTimer);
        cacheUpdateTimer = setTimeout(() => {
          setState({ ...state, cacheJustUpdated: false });
          cacheUpdateTimer = null;
        }, 1500);
      }
    } catch {
      setState({
        ...state,
        proxyStarting: true,
      });
    } finally {
      inflight = false;
    }
  }

  function start(intervalMs = 10_000) {
    void refresh();
    if (interval) clearInterval(interval);
    interval = setInterval(refresh, intervalMs);
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }

    if (cacheUpdateTimer) {
      clearTimeout(cacheUpdateTimer);
      cacheUpdateTimer = null;
    }
  }

  return {
    subscribe,
    refresh,
    start,
    stop,
  };
}
