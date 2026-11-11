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
  const [skipFeedback, setSkipFeedback] = useState<{
    side: "left" | "right";
    label: string;
    key: number;
  } | null>(null);

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
            {playback.embed_sources.map((source, idx) => {
              const label =
                source.name === "Server 1" || source.name === "Server 2"
                  ? source.name
                  : `Server ${idx + 1}`;
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
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Skip Buttons & Fullscreen Toggle */}
        <div className="flex items-center gap-1.5">
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
    </div>
  );
}
