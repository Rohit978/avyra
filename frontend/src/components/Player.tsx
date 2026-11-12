"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface EmbedSource {
  id: string;
  name: string;
  embed_url: string;
  domain: string;
  is_primary: boolean;
}

export interface PlaybackOptions {
  media_id: string;
  media_type: string;
  title: string;
  has_stream: boolean;
  tmdb_id?: string | null;
  season_number?: number | null;
  episode_number?: number | null;
  embed_sources: EmbedSource[];
  sandbox_policy: string;
  referrer_policy: string;
  reason?: string | null;
}

interface PlayerProps {
  playback: PlaybackOptions;
}

export default function Player({ playback }: PlayerProps) {
  const [activeSourceId, setActiveSourceId] = useState<string>(() => {
    const primary = playback.embed_sources.find((s) => s.is_primary);
    return primary ? primary.id : playback.embed_sources[0]?.id || "";
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [adShieldActive, setAdShieldActive] = useState(true);
  const [showAdBlockModal, setShowAdBlockModal] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [adBlockDetected, setAdBlockDetected] = useState<boolean | null>(null);

  // Live probe to verify if user's browser or DNS is blocking ad networks
  useEffect(() => {
    let isCancelled = false;
    const testAdFilter = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1800);
        await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        // If fetch succeeded, the ad network was reached (adblocker/DNS is not active)
        if (!isCancelled) setAdBlockDetected(false);
      } catch {
        // Network blocked/aborted = adblocker or AdGuard DNS sinkhole is actively working!
        if (!isCancelled) setAdBlockDetected(true);
      }
    };
    testAdFilter();
    return () => {
      isCancelled = true;
    };
  }, []);

  const [skipFeedback, setSkipFeedback] = useState<{
    side: "left" | "right";
    label: string;
    key: number;
  } | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch {}
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; side: "left" | "right" }>({
    time: 0,
    side: "left",
  });

  const activeSource =
    playback.embed_sources.find((s) => s.id === activeSourceId) ||
    playback.embed_sources[0];

  // 1. Listen for player time updates and duration changes via postMessage
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "timeupdate" && Number.isFinite(e.data.time)) {
        currentTimeRef.current = e.data.time;
      }
      if (e.data.type === "durationchange" && Number.isFinite(e.data.duration)) {
        durationRef.current = e.data.duration;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // 2. Active Window Popup & Tab Hijack Interceptor
  useEffect(() => {
    if (!adShieldActive || typeof window === "undefined") return;

    const originalOpen = window.open;
    (window as any).open = function (...args: any[]) {
      console.log("🛡️ CineVerse Ad Shield: Blocked unauthorized pop-up", args);
      return null;
    };

    return () => {
      window.open = originalOpen;
    };
  }, [adShieldActive]);

  // 2. Auto Landscape lock and unlock on Fullscreen change
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isFs = Boolean(
        document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);

      if (isFs) {
        // Automatically switch to landscape orientation in full screen mode
        try {
          if (typeof window !== "undefined" && window.screen?.orientation) {
            if (typeof (window.screen.orientation as any).lock === "function") {
              await (window.screen.orientation as any).lock("landscape");
            }
          } else if ((window.screen as any)?.lockOrientation) {
            (window.screen as any).lockOrientation("landscape");
          }
        } catch (err) {
          // Some desktop browsers or restrictive user agents require user permission
          console.log("Screen orientation landscape lock notice:", err);
        }
      } else {
        // Unlock screen orientation when leaving fullscreen
        try {
          if (typeof window !== "undefined" && window.screen?.orientation) {
            if (typeof (window.screen.orientation as any).unlock === "function") {
              (window.screen.orientation as any).unlock();
            }
          } else if ((window.screen as any)?.unlockOrientation) {
            (window.screen as any).unlockOrientation();
          }
        } catch (err) {
          // Ignore
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // 3. Skip 10s Forward or Backward
  const seekDelta = useCallback((deltaSeconds: number) => {
    const cur = currentTimeRef.current || 0;
    const dur = durationRef.current || 0;
    let target = cur + deltaSeconds;
    if (target < 0) target = 0;
    if (dur > 0 && target > dur) target = dur;

    currentTimeRef.current = target;

    // Send seek commands to embedded iframe
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        // Vidbolt schema: { type: "seek", time: target }
        iframe.contentWindow.postMessage({ type: "seek", time: target }, "*");
        // Standard video embed / JW / Plyr schema:
        iframe.contentWindow.postMessage({ type: "seek", value: target }, "*");
        iframe.contentWindow.postMessage(
          { context: "player", event: "command", func: "seekTo", args: [target, true] },
          "*"
        );
      } catch (e) {
        // Cross-domain postMessage safety
      }
    }

    // Trigger visual skip feedback overlay
    const side = deltaSeconds > 0 ? "right" : "left";
    const label = deltaSeconds > 0 ? "+10s" : "-10s";
    setSkipFeedback({ side, label, key: Date.now() });

    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
    }
    skipTimeoutRef.current = setTimeout(() => {
      setSkipFeedback(null);
    }, 750);
  }, []);

  // 4. Double tap gesture detector on touch / pointer
  const handleGestureTap = (side: "left" | "right", e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const prev = lastTapRef.current;

    if (prev.side === side && now - prev.time < 350) {
      // Double tap confirmed on this side!
      seekDelta(side === "right" ? 10 : -10);
      lastTapRef.current = { time: 0, side };
    } else {
      lastTapRef.current = { time: now, side };
    }
  };

  // 5. Toggle Fullscreen mode with auto landscape
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    const isFs = Boolean(
      document.fullscreenElement || (document as any).webkitFullscreenElement
    );

    if (!isFs) {
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
      } catch (e) {
        console.warn("Fullscreen request error:", e);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } catch (e) {
        console.warn("Exit fullscreen error:", e);
      }
    }
  };

  // 6. Keyboard shortcuts (Left Arrow, Right Arrow, F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(activeTag)) return;

      if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") {
        seekDelta(-10);
      } else if (e.key === "ArrowRight" || e.key === "l" || e.key === "L") {
        seekDelta(10);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [seekDelta]);

  if (!playback.has_stream || !activeSource) {
    return (
      <div className="relative w-full aspect-video bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col items-center justify-center p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Stream Unavailable</h3>
        <p className="text-sm text-neutral-400 max-w-md">
          {playback.reason ||
            "No streaming embed provider is currently mapped for this title."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Stream Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {/* Server Switchers */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">
            Server:
          </span>
          <div className="flex items-center gap-1.5">
            {playback.embed_sources.map((source) => {
              return (
                <button
                  key={source.id}
                  onClick={() => setActiveSourceId(source.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                    activeSource.id === source.id
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "bg-surface-elevated text-neutral-300 hover:bg-neutral-800 border border-surface-border"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeSource.id === source.id ? "bg-white" : "bg-neutral-500"
                    }`}
                  />
                  {source.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Skip Buttons, Ad Shield & Fullscreen Toggle */}
        <div className="flex items-center gap-1.5">
          {/* Ad Shield Button with Live Network AdBlock Detection */}
          <button
            onClick={() => setShowAdBlockModal(true)}
            title="Ad Blocker & AdGuard DNS Shield Diagnostics"
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 ${
              adBlockDetected === true
                ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 shadow-sm"
                : adBlockDetected === false
                ? "bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/80 shadow-sm"
                : adShieldActive
                ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 shadow-sm"
                : "bg-surface-elevated border-surface-border text-neutral-400 hover:text-white"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                adBlockDetected === true
                  ? "bg-emerald-400 animate-pulse"
                  : adBlockDetected === false
                  ? "bg-amber-400 animate-ping"
                  : adShieldActive
                  ? "bg-emerald-400"
                  : "bg-neutral-500"
              }`}
            />
            <span className="hidden sm:inline">AdBlock:</span>
            <span>
              {adBlockDetected === true
                ? "ACTIVE"
                : adBlockDetected === false
                ? "NOT DETECTED"
                : adShieldActive
                ? "SHIELD ON"
                : "OFF"}
            </span>
            <span className="text-[10px]">🛡️</span>
          </button>

          <button
            onClick={() => seekDelta(-10)}
            title="Double-tap left or click to skip 10s backward"
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-elevated hover:bg-neutral-800 text-neutral-300 hover:text-white border border-surface-border transition-colors flex items-center gap-1 active:scale-95"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
            </svg>
            <span>-10s</span>
          </button>

          <button
            onClick={() => seekDelta(10)}
            title="Double-tap right or click to skip 10s forward"
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-elevated hover:bg-neutral-800 text-neutral-300 hover:text-white border border-surface-border transition-colors flex items-center gap-1 active:scale-95"
          >
            <span>+10s</span>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
            </svg>
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen (Auto Landscape)"}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 active:scale-95 ${
              isFullscreen
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-surface-elevated hover:bg-neutral-800 text-neutral-300 hover:text-white border-surface-border"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isFullscreen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              )}
            </svg>
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit" : "Landscape"}
            </span>
          </button>
        </div>
      </div>

      {/* Video Player Container */}
      <div
        ref={containerRef}
        className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-neutral-800 shadow-2xl group select-none ${
          isFullscreen ? "fixed inset-0 z-50 rounded-none border-0 w-screen h-screen" : ""
        }`}
      >
        {/* Primary Video Embed */}
        <iframe
          ref={iframeRef}
          src={activeSource.embed_url}
          title={`${playback.title} Player`}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
          referrerPolicy="origin"
          sandbox={
            adShieldActive && !activeSource.domain.includes("vidbolt")
              ? "allow-scripts allow-same-origin allow-forms allow-presentation"
              : undefined
          }
          className="absolute inset-0 w-full h-full border-0 z-0"
          allowFullScreen
        />

        {/* Double-Tap Skip Gesture Zones (Overlaid on left 35% and right 35%, leaving center 30% and bottom 70px clear for native controls) */}
        <div
          onClick={(e) => handleGestureTap("left", e)}
          onTouchEnd={(e) => handleGestureTap("left", e)}
          className="absolute top-0 left-0 w-[35%] bottom-[70px] z-20 cursor-pointer bg-transparent transition-opacity"
          aria-label="Double tap to skip 10 seconds backward"
        />

        <div
          onClick={(e) => handleGestureTap("right", e)}
          onTouchEnd={(e) => handleGestureTap("right", e)}
          className="absolute top-0 right-0 w-[35%] bottom-[70px] z-20 cursor-pointer bg-transparent transition-opacity"
          aria-label="Double tap to skip 10 seconds forward"
        />

        {/* Animated Double-Tap Skip Feedback (Left -10s) */}
        {skipFeedback && skipFeedback.side === "left" && (
          <div
            key={skipFeedback.key}
            className="absolute left-0 top-0 bottom-0 w-[45%] z-30 pointer-events-none flex items-center justify-center bg-gradient-to-r from-primary/30 via-primary/10 to-transparent rounded-r-full animate-pulse"
          >
            <div className="flex flex-col items-center justify-center gap-1 bg-black/75 backdrop-blur-md px-5 py-4 rounded-full border border-primary/40 shadow-2xl transform -translate-x-3">
              <svg
                className="w-8 h-8 fill-primary animate-ping"
                viewBox="0 0 24 24"
              >
                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
              </svg>
              <span className="text-white text-sm font-black tracking-wide">
                -10 SEC
              </span>
            </div>
          </div>
        )}

        {/* Animated Double-Tap Skip Feedback (Right +10s) */}
        {skipFeedback && skipFeedback.side === "right" && (
          <div
            key={skipFeedback.key}
            className="absolute right-0 top-0 bottom-0 w-[45%] z-30 pointer-events-none flex items-center justify-center bg-gradient-to-l from-primary/30 via-primary/10 to-transparent rounded-l-full animate-pulse"
          >
            <div className="flex flex-col items-center justify-center gap-1 bg-black/75 backdrop-blur-md px-5 py-4 rounded-full border border-primary/40 shadow-2xl transform translate-x-3">
              <svg
                className="w-8 h-8 fill-primary animate-ping"
                viewBox="0 0 24 24"
              >
                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
              </svg>
              <span className="text-white text-sm font-black tracking-wide">
                +10 SEC
              </span>
            </div>
          </div>
        )}

        {/* Subtle Gesture Hint Overlay on Hover / Initial View */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur text-[11px] text-neutral-300 font-medium px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Double-tap left/right to skip 10s • F for Landscape Fullscreen</span>
        </div>
      </div>

      {/* Notice when user switches to Vidbolt */}
      {activeSource.domain.includes("vidbolt") && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⚠️</span>
            <p className="leading-snug">
              <strong>Notice:</strong> Vidbolt actively disables security sandboxing to inject pop-up ads. For a clean, pop-up blocked player, switch to <strong>Server 1 (Fast & Clean)</strong> or enable <strong>AdGuard DNS</strong>.
            </p>
          </div>
          <button
            onClick={() => {
              const s1 = playback.embed_sources[0];
              if (s1) setActiveSourceId(s1.id);
            }}
            className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors text-xs text-center"
          >
            Switch to Server 1
          </button>
        </div>
      )}

      {/* Ad Shield & AdGuard DNS Configuration Modal */}
      {showAdBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Ad Shield & AdGuard DNS
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                      ACTIVE
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Why ads occur on Server 1 & how to eliminate them 100%
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAdBlockModal(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Live AdBlock Diagnostic Card */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  adBlockDetected === true
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                    : adBlockDetected === false
                    ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                    : "bg-surface-elevated border-surface-border text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">
                    {adBlockDetected === true ? "✅" : adBlockDetected === false ? "⚠️" : "🔍"}
                  </span>
                  <div>
                    <div className="font-bold text-white text-xs">
                      {adBlockDetected === true
                        ? "AdBlock / DNS Active"
                        : adBlockDetected === false
                        ? "AdBlock NOT Detected"
                        : "Checking AdBlocker..."}
                    </div>
                    <div className="text-[11px] opacity-80">
                      {adBlockDetected === true
                        ? "Your browser or DNS is actively dropping ad network traffic."
                        : adBlockDetected === false
                        ? "Ad network scripts are still reachable. Follow the methods below to block all ads."
                        : "Detecting network filter..."}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    adBlockDetected === true
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {adBlockDetected === true ? "Protected" : "Vulnerable"}
                </span>
              </div>

              {/* Way 1: Switch to Server 1 (VidLink HD - Cleanest Stream) */}
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border space-y-2">
                <div className="font-semibold text-white flex items-center justify-between text-sm">
                  <span>⚡ Way 1: Use Server 1 (VidLink - No Ads)</span>
                  <button
                    onClick={() => {
                      const s1 = playback.embed_sources[0];
                      if (s1) setActiveSourceId(s1.id);
                      setShowAdBlockModal(false);
                    }}
                    className="px-2.5 py-1 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Switch to Server 1
                  </button>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  We added <strong>VidLink</strong> as our primary player. Unlike older embed providers (Vidbolt/VidSrc), VidLink runs a clean modern UI with <strong>no popunder redirect loops</strong>.
                </p>
              </div>

              {/* Way 2: Browser Extension (uBlock Origin - 100% Effective) */}
              <div className="p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-2.5">
                <div className="font-bold text-white flex items-center justify-between text-sm">
                  <span>🛡️ Way 2: Install uBlock Origin (Guaranteed Block)</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  Browser extensions have full authority to kill hidden click overlays, popunders, and iframe trackers that regular websites cannot touch due to cross-origin restrictions.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-[11px] border border-neutral-700 transition-colors flex items-center gap-1.5"
                  >
                    <span>Get for Chrome / Edge / Brave ↗</span>
                  </a>
                  <a
                    href="https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-[11px] border border-neutral-700 transition-colors flex items-center gap-1.5"
                  >
                    <span>Get for Firefox ↗</span>
                  </a>
                </div>
              </div>

              {/* Way 3: AdGuard DNS (Network & Browser DoH) */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/30 space-y-3">
                <div className="font-bold text-white flex items-center gap-1.5 text-sm">
                  <span>🌐 Way 3: AdGuard DNS (dns.adguard-dns.com)</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  AdGuard DNS drops connection to ad networks before scripts even start loading.
                  <br />
                  <strong className="text-amber-300">⚠️ Why didn&apos;t Windows DNS block Chrome ads?</strong> Chrome and Edge have internal &quot;Secure DNS&quot; enabled that <em>overrides your Windows DNS</em>! You must set it in Chrome directly:
                </p>

                {/* DNS Endpoints with 1-Click Copy */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-neutral-800">
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase font-semibold">Chrome / Edge / Brave (DoH URL)</div>
                      <div className="font-mono text-emerald-300 text-xs font-bold truncate max-w-[210px] sm:max-w-xs">
                        https://dns.adguard-dns.com/dns-query
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard("https://dns.adguard-dns.com/dns-query", "doh")}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-medium transition-colors"
                    >
                      {copiedText === "doh" ? "Copied! ✓" : "Copy"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-neutral-800">
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase font-semibold">Android Private DNS Hostname</div>
                      <div className="font-mono text-emerald-300 text-xs font-bold">dns.adguard-dns.com</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard("dns.adguard-dns.com", "private-dns")}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-medium transition-colors"
                    >
                      {copiedText === "private-dns" ? "Copied! ✓" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="pt-2 border-t border-neutral-800/80 space-y-1.5 text-[11px] text-neutral-300">
                  <div className="font-semibold text-white">How to enable in Chrome / Edge (Crucial):</div>
                  <ul className="list-disc pl-4 space-y-1 text-neutral-400">
                    <li>Open <strong>Settings</strong> &rarr; <strong>Privacy and security</strong> &rarr; <strong>Security</strong>.</li>
                    <li>Scroll down to <strong>Use secure DNS</strong> &rarr; select <strong>Custom</strong>.</li>
                    <li>Paste: <code className="text-emerald-400">https://dns.adguard-dns.com/dns-query</code></li>
                  </ul>
                  <div className="font-semibold text-white pt-1">On Android:</div>
                  <ul className="list-disc pl-4 space-y-1 text-neutral-400">
                    <li>Settings &rarr; Network / Connections &rarr; More connection settings &rarr; Private DNS &rarr; enter <code className="text-emerald-400">dns.adguard-dns.com</code>.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                Tip: You can also switch to Server 2 or Server 3 anytime.
              </span>
              <button
                onClick={() => setShowAdBlockModal(false)}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
