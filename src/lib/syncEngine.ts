import { writable, derived } from "svelte/store";

const OFFSET_SAMPLES = 5;
const BUFFER_GRACE_MS = 750;

export function createSyncEngine(video: HTMLVideoElement) {
  // ---------- private state ----------
  let ws: WebSocket | null = null;
  let _username = "";
  let offset = 0;
  let syncCount = 0;
  let offsetSum = 0;
  let masterPlaybackState: {
    action: "play" | "pause";
    position: number;
    serverTimestamp: number;
  } | null = null;
  let videoReady = false;
  let pendingAction: { action: string; position: number } | null = null;
  let buffering = false;
  let reportedBuffering = false;
  let manualPlaybackRate = 1.0;
  let suppressEvents = 0;
  let _waitlocked = false; // synchronous mirror

  // ---------- timers ----------
  let playbackTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let driftTimer: ReturnType<typeof setInterval> | null = null;
  let bufferGraceTimer: ReturnType<typeof setTimeout> | null = null;
  let positionReportTimer: ReturnType<typeof setInterval> | null = null;

  // ---------- stores ----------
  const syncStatusText = writable("Offset: -- ms | Syncing…");
  const waitersStore = writable<string[]>([]);
  const usernameStore = writable("");
  const wsConnected = writable(false);

  // Derived stores for external use only
  const waitlocked = derived(waitersStore, ($w) => $w.length > 0);
  const othersWaiting = derived([waitersStore, usernameStore], ([$w, $u]) =>
    $w.filter((w) => w !== $u),
  );

  // reactive status line
  const statusLine = derived(
    [syncStatusText, waitlocked, othersWaiting, wsConnected],
    ([$txt, $locked, $others, $connected]) => {
      if (!$connected) return "Disconnected";
      if ($locked && $others.length > 0)
        return `⏸ Waiting for ${$others.join(", ")}…`;
      if (reportedBuffering) return `⏳ Buffering…`;
      return $txt;
    },
  );

  // ---------- helpers ----------
  const suppress = (fn: () => void) => {
    suppressEvents++;
    try {
      fn();
    } finally {
      setTimeout(() => suppressEvents--, 80);
    }
  };

  const suppressSeek = (fn: () => void) => {
    suppressEvents++;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      video.removeEventListener("seeked", release);
      suppressEvents--;
    };
    video.addEventListener("seeked", release, { once: true });
    setTimeout(release, 1500);
    try {
      fn();
    } catch {
      release();
    }
  };

  function send(msg: object) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  // ---------- playback actions ----------
  function scheduleAction(
    action: string,
    position: number,
    serverTimestamp: number,
  ) {
    if (action === "play" || action === "pause") {
      masterPlaybackState = { action, position, serverTimestamp };
    } else if (action === "seek" && masterPlaybackState) {
      masterPlaybackState = {
        ...masterPlaybackState,
        position,
        serverTimestamp,
      };
    }
    const targetLocal = serverTimestamp - offset;
    const delay = targetLocal - performance.now();
    if (playbackTimer) {
      clearTimeout(playbackTimer);
      playbackTimer = null;
    }
    if (delay <= 0) {
      applyImmediately(action, position, Math.abs(delay));
    } else {
      playbackTimer = setTimeout(
        () => applyImmediately(action, position, 0),
        delay,
      );
      syncStatusText.set(
        `Offset: ${offset.toFixed(1)} ms | Scheduled ${action} in ${(delay / 1000).toFixed(2)}s`,
      );
    }
  }

  function applyImmediately(action: string, position: number, lateByMs = 0) {
    if (!videoReady) {
      pendingAction = { action, position };
      return;
    }
    if (action === "play") {
      suppressSeek(() => {
        video.currentTime = position + lateByMs / 1000;
      });
      suppress(() => {
        video.play().catch(() => {});
        video.playbackRate = manualPlaybackRate;
      });
    } else if (action === "pause") {
      suppress(() => {
        video.pause();
        video.playbackRate = manualPlaybackRate;
      });
    } else if (action === "seek") {
      suppressSeek(() => {
        video.currentTime = position + lateByMs / 1000;
      });
    }
  }

  // ---------- drift correction ----------
  function startDriftCorrection() {
    if (driftTimer) clearInterval(driftTimer);
    driftTimer = setInterval(() => {
      if (
        !videoReady ||
        !masterPlaybackState ||
        !video ||
        buffering ||
        _waitlocked || // use the synchronous variable
        syncCount === 0
      ) {
        if (video) video.playbackRate = manualPlaybackRate;
        return;
      }
      if (video.paused) {
        if (masterPlaybackState.action === "play") {
          suppressSeek(() => {
            video.currentTime = masterPlaybackState!.position;
          });
          suppress(() => {
            video.play().catch(() => {});
          });
        }
        video.playbackRate = manualPlaybackRate;
        return;
      }
      if (masterPlaybackState.action !== "play") return;
      const serverNow = performance.now() + offset;
      const expected =
        masterPlaybackState.position +
        (serverNow - masterPlaybackState.serverTimestamp) / 1000;
      const drift = expected - video.currentTime;
      if (Math.abs(drift) > 1.0) {
        suppressSeek(() => {
          video.currentTime = expected;
        });
        video.playbackRate = manualPlaybackRate;
        syncStatusText.set(
          `Drift large (${(drift * 1000).toFixed(0)}ms)! Hard-syncing…`,
        );
      } else if (drift > 0.03) {
        video.playbackRate = manualPlaybackRate * 1.02;
        syncStatusText.set(
          `Lagging by ${(drift * 1000).toFixed(0)}ms | Speeding up…`,
        );
      } else if (drift < -0.03) {
        video.playbackRate = manualPlaybackRate * 0.98;
        syncStatusText.set(
          `Leading by ${Math.abs(drift * 1000).toFixed(0)}ms | Slowing down…`,
        );
      } else {
        video.playbackRate = manualPlaybackRate;
        syncStatusText.set(`Offset: ${offset.toFixed(1)} ms | In sync (<30ms)`);
      }
    }, 2000);
  }

  function startPositionReporter() {
    if (positionReportTimer) clearInterval(positionReportTimer);
    positionReportTimer = setInterval(() => {
      if (!_waitlocked) return;
      if (!videoReady || !ws || ws.readyState !== WebSocket.OPEN) return;
      send({ type: "position_report", position: video.currentTime });
    }, 2000);
  }

  // ---------- video event listeners ----------
  function onPlay() {
    if (suppressEvents) return;
    if (_waitlocked) {
      suppress(() => video.pause());
      return;
    }
    send({ type: "playback", action: "play", position: video.currentTime });
  }

  function onPause() {
    if (!suppressEvents) {
      send({ type: "playback", action: "pause", position: video.currentTime });
    }
  }

  function onSeeked() {
    if (!suppressEvents && !buffering) {
      send({ type: "playback", action: "seek", position: video.currentTime });
    }
  }

  function onWaiting() {
    buffering = true;
    if (bufferGraceTimer) clearTimeout(bufferGraceTimer);
    bufferGraceTimer = setTimeout(() => {
      bufferGraceTimer = null;
      if (
        buffering &&
        !reportedBuffering &&
        ws?.readyState === WebSocket.OPEN
      ) {
        reportedBuffering = true;
        send({ type: "buffer_start", position: video.currentTime });
      }
    }, BUFFER_GRACE_MS);
  }

  function onPlaying() {
    buffering = false;
    if (bufferGraceTimer) {
      clearTimeout(bufferGraceTimer);
      bufferGraceTimer = null;
    }
    if (reportedBuffering && ws?.readyState === WebSocket.OPEN) {
      reportedBuffering = false;
      send({ type: "buffer_end", position: video.currentTime });
    }
  }

  function onCanPlay() {
    videoReady = true;
    if (pendingAction) {
      let lateMs = 0;
      if (masterPlaybackState) {
        const serverNow = performance.now() + offset;
        lateMs = Math.max(0, serverNow - masterPlaybackState.serverTimestamp);
      }
      applyImmediately(pendingAction.action, pendingAction.position, lateMs);
      pendingAction = null;
    }
    if (reportedBuffering && ws?.readyState === WebSocket.OPEN) {
      reportedBuffering = false;
      send({ type: "buffer_end", position: video.currentTime });
    }
  }

  function onRateChange() {
    if (suppressEvents) return;
    const r = video.playbackRate;
    if (r < 0.97 || r > 1.03) manualPlaybackRate = r;
  }

  // ---------- WebSocket logic ----------
  function connect(roomId: string, name: string, streamUrl?: string) {
    disconnect();
    _username = name;
    usernameStore.set(name);
    offset = 0;
    syncCount = 0;
    offsetSum = 0;
    waitersStore.set([]);
    _waitlocked = false;
    reportedBuffering = false;
    syncStatusText.set("Connecting…");

    const socket = new WebSocket(`wss://rtc.reold.workers.dev/room/${roomId}`);
    ws = socket;
    wsConnected.set(true);

    socket.onopen = () => {
      send({ type: "join", name, clientId: crypto.randomUUID() });
      for (let i = 0; i < OFFSET_SAMPLES; i++) {
        setTimeout(() => {
          if (socket.readyState === WebSocket.OPEN) {
            send({ type: "sync_request", clientTs: performance.now() });
          }
        }, i * 200);
      }
      if (streamUrl) {
        send({ type: "stream", url: streamUrl });
      }
      startDriftCorrection();
      startPositionReporter();
    };

    socket.onmessage = (e) => {
      let data: any;
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }
      if (!data?.type) return;

      switch (data.type) {
        case "sync_reply": {
          if (
            typeof data.serverTs !== "number" ||
            typeof data.clientTs !== "number"
          )
            break;
          const localPerfNow = performance.now();
          const roundTrip = localPerfNow - data.clientTs;
          const estimatedServerNow = data.serverTs + roundTrip / 2;
          const sample = estimatedServerNow - localPerfNow;
          offsetSum += sample;
          syncCount++;
          offset = offsetSum / syncCount;
          syncStatusText.set(
            `Offset: ${offset.toFixed(1)} ms | Synced ${syncCount} samples`,
          );
          break;
        }
        case "playback": {
          if (
            typeof data.action !== "string" ||
            typeof data.position !== "number" ||
            typeof data.timestamp !== "number"
          )
            break;
          scheduleAction(data.action, data.position, data.timestamp);
          break;
        }
        case "waitlock": {
          const w = Array.isArray(data.waiters) ? data.waiters : [];
          waitersStore.set(w);
          _waitlocked = w.length > 0;
          if (_waitlocked) {
            if (playbackTimer) {
              clearTimeout(playbackTimer);
              playbackTimer = null;
            }
            if (videoReady && !video.paused) {
              suppress(() => video.pause());
            }
          }
          break;
        }
        case "stream": {
          if (typeof data.url === "string" && data.url) {
            video.dispatchEvent(
              new CustomEvent("sync-stream-change", { detail: data.url }),
            );
          }
          break;
        }
      }
    };

    socket.onerror = () => syncStatusText.set("Connection error");
    socket.onclose = () => {
      if (ws === socket) {
        ws = null;
        wsConnected.set(false);
      }
      syncStatusText.set("Disconnected");
      clearTimers();
      waitersStore.set([]);
      _waitlocked = false;
    };

    heartbeatTimer = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        send({ type: "ping" });
      }
    }, 30000);
  }

  function disconnect() {
    clearTimers();
    if (ws) {
      try {
        ws.close();
      } catch {}
      ws = null;
    }
    wsConnected.set(false);
    masterPlaybackState = null;
    manualPlaybackRate = 1.0;
    if (video) video.playbackRate = 1.0;
    waitersStore.set([]);
    _waitlocked = false;
    reportedBuffering = false;
  }

  function clearTimers() {
    if (playbackTimer) {
      clearTimeout(playbackTimer);
      playbackTimer = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (driftTimer) {
      clearInterval(driftTimer);
      driftTimer = null;
    }
    if (bufferGraceTimer) {
      clearTimeout(bufferGraceTimer);
      bufferGraceTimer = null;
    }
    if (positionReportTimer) {
      clearInterval(positionReportTimer);
      positionReportTimer = null;
    }
  }

  function shareStream(streamUrl: string) {
    if (ws?.readyState === WebSocket.OPEN) {
      send({ type: "stream", url: streamUrl });
    }
  }

  function resetReady() {
    videoReady = false;
    pendingAction = null;
  }

  function destroy() {
    disconnect();
    video.removeEventListener("play", onPlay);
    video.removeEventListener("pause", onPause);
    video.removeEventListener("seeked", onSeeked);
    video.removeEventListener("waiting", onWaiting);
    video.removeEventListener("playing", onPlaying);
    video.removeEventListener("canplay", onCanPlay);
    video.removeEventListener("stalled", onWaiting);
    video.removeEventListener("ratechange", onRateChange);
  }

  // attach listeners
  video.addEventListener("play", onPlay);
  video.addEventListener("pause", onPause);
  video.addEventListener("seeked", onSeeked);
  video.addEventListener("waiting", onWaiting);
  video.addEventListener("playing", onPlaying);
  video.addEventListener("canplay", onCanPlay);
  video.addEventListener("stalled", onWaiting);
  video.addEventListener("ratechange", onRateChange);

  return {
    connect,
    disconnect,
    shareStream,
    destroy,
    resetReady,
    syncStatusText,
    waiters: waitersStore,
    wsConnected,
    username: usernameStore,
    waitlocked,
    othersWaiting,
    statusLine,
  };
}
