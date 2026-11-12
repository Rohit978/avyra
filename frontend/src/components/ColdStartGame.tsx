"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface FallingItem {
  x: number;
  y: number;
  speed: number;
  type: "popcorn" | "drink" | "ticket" | "tomato";
  symbol: string;
  points: number;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

export default function ColdStartGame() {
  const [serverState, setServerState] = useState<"checking" | "cold_starting" | "online">("checking");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Game states
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const basketXRef = useRef<number>(200);
  const keysPressedRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const itemsRef = useRef<FallingItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const livesRef = useRef<number>(3);
  const scoreRef = useRef<number>(0);
  const gameOverRef = useRef<boolean>(false);
  const gameStartedRef = useRef<boolean>(false);
  const lastSpawnRef = useRef<number>(0);

  // Sync refs with states
  useEffect(() => {
    livesRef.current = lives;
    scoreRef.current = score;
    gameOverRef.current = gameOver;
    gameStartedRef.current = gameStarted;
  }, [lives, score, gameOver, gameStarted]);

  // Load High Score
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cineverse_popcorn_high_score");
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch { }
  }, []);

  // Listen for custom trigger event to open game anytime from Navbar
  useEffect(() => {
    const handleOpenGame = () => {
      setIsGameOpen(true);
      setIsDismissed(false);
    };
    window.addEventListener("open-cineverse-game", handleOpenGame);
    return () => window.removeEventListener("open-cineverse-game", handleOpenGame);
  }, []);

  // Backend Wake-Up / Health Check Poller
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let secondsTimer: NodeJS.Timeout;
    let isCancelled = false;

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2800);

        // Probe local proxy or direct API
        const res = await fetch("/api/v1/health", {
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timeoutId);

        if (res.ok && !isCancelled) {
          setServerState("online");
          return;
        }
      } catch {
        // Cold start or offline
      }

      if (!isCancelled) {
        setServerState("cold_starting");
        // Poll again every 3.5s
        timer = setTimeout(checkHealth, 3500);
      }
    };

    checkHealth();

    // Elapsed timer while cold starting
    secondsTimer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      clearInterval(secondsTimer);
    };
  }, []);

  // Spawn falling objects
  const spawnItem = useCallback((canvasWidth: number) => {
    const rand = Math.random();
    let type: FallingItem["type"] = "popcorn";
    let symbol = "🍿";
    let points = 10;
    let speed = 2.4 + Math.random() * 2.2;

    if (rand < 0.22) {
      type = "tomato";
      symbol = "🍅";
      points = -1;
      speed = 2.8 + Math.random() * 2.6;
    } else if (rand < 0.38) {
      type = "drink";
      symbol = "🥤";
      points = 25;
      speed = 3.0 + Math.random() * 2.0;
    } else if (rand < 0.48) {
      type = "ticket";
      symbol = "🎟️";
      points = 50;
      speed = 3.8 + Math.random() * 2.5;
    }

    itemsRef.current.push({
      x: 30 + Math.random() * (canvasWidth - 60),
      y: -20,
      speed,
      type,
      symbol,
      points,
      size: 28,
    });
  }, []);

  // Trigger celebration particles
  const addParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0,
        maxLife: 20 + Math.random() * 15,
      });
    }
  };

  // Main Canvas Game Loop
  useEffect(() => {
    if (!isGameOpen) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = 440);
    let height = (canvas.height = 540);
    basketXRef.current = width / 2;

    const basketWidth = 72;
    const basketHeight = 44;
    const basketY = height - 55;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Clear Canvas
      ctx.fillStyle = "#0c0d12";
      ctx.fillRect(0, 0, width, height);

      // Starfield / subtle cinema dots
      ctx.fillStyle = "#1e2230";
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 73 + now * 0.02) % width);
        const sy = ((i * 97) % height);
        ctx.fillRect(sx, sy, 2, 2);
      }

      if (gameStartedRef.current && !gameOverRef.current) {
        // Keyboard controls
        if (keysPressedRef.current.left) {
          basketXRef.current = Math.max(basketWidth / 2, basketXRef.current - 400 * dt);
        }
        if (keysPressedRef.current.right) {
          basketXRef.current = Math.min(width - basketWidth / 2, basketXRef.current + 400 * dt);
        }

        // Spawn items
        if (now - lastSpawnRef.current > 750) {
          spawnItem(width);
          lastSpawnRef.current = now;
        }

        // Update items
        const currentItems = itemsRef.current;
        for (let i = currentItems.length - 1; i >= 0; i--) {
          const item = currentItems[i];
          item.y += item.speed * 60 * dt;

          // Catch collision test
          const bx = basketXRef.current;
          const hitX = item.x >= bx - basketWidth / 2 - 10 && item.x <= bx + basketWidth / 2 + 10;
          const hitY = item.y >= basketY - 15 && item.y <= basketY + 25;

          if (hitX && hitY) {
            // Collision!
            if (item.type === "tomato") {
              addParticles(item.x, item.y, "#ef4444");
              const nextLives = livesRef.current - 1;
              livesRef.current = nextLives;
              setLives(nextLives);
              if (nextLives <= 0) {
                gameOverRef.current = true;
                setGameOver(true);
              }
            } else {
              const pts = item.points;
              const nextScore = scoreRef.current + pts;
              scoreRef.current = nextScore;
              setScore(nextScore);
              addParticles(item.x, item.y, item.type === "ticket" ? "#fbbf24" : "#fef08a");
              if (nextScore > highScore) {
                setHighScore(nextScore);
                try {
                  localStorage.setItem("cineverse_popcorn_high_score", nextScore.toString());
                } catch { }
              }
            }
            currentItems.splice(i, 1);
            continue;
          }

          // Offscreen
          if (item.y > height + 20) {
            currentItems.splice(i, 1);
          }
        }

        // Update particles
        const currentParticles = particlesRef.current;
        for (let i = currentParticles.length - 1; i >= 0; i--) {
          const p = currentParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          if (p.life > p.maxLife) {
            currentParticles.splice(i, 1);
          }
        }
      }

      // Render Falling Items
      for (const item of itemsRef.current) {
        ctx.font = `${item.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.symbol, item.x, item.y);
      }

      // Render Particles
      for (const p of particlesRef.current) {
        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Render Popcorn Basket
      const bx = basketXRef.current;
      // Basket Body
      ctx.save();
      ctx.translate(bx, basketY);

      // Popcorn bucket illustration
      ctx.fillStyle = "#e11d48"; // CineVerse red
      ctx.beginPath();
      ctx.moveTo(-basketWidth / 2, 0);
      ctx.lineTo(basketWidth / 2, 0);
      ctx.lineTo(basketWidth / 2 - 8, basketHeight);
      ctx.lineTo(-basketWidth / 2 + 8, basketHeight);
      ctx.closePath();
      ctx.fill();

      // White Stripes
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-14, 0, 8, basketHeight - 2);
      ctx.fillRect(6, 0, 8, basketHeight - 2);

      // Gold rim
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(-basketWidth / 2 - 2, -4, basketWidth + 4, 6);

      // Top Popcorn Overflow in basket
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🍿", 0, -6);
      ctx.restore();

      // Ground border
      ctx.fillStyle = "#27272a";
      ctx.fillRect(0, height - 10, width, 10);

      // Request next frame
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isGameOpen, spawnItem, highScore]);

  // Controls handling (Touch & Keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keysPressedRef.current.left = true;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keysPressedRef.current.right = true;
      }
      if ((e.key === " " || e.key === "Enter") && !gameStartedRef.current) {
        startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keysPressedRef.current.left = false;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keysPressedRef.current.right = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const clientX = e.clientX - rect.left;
    basketXRef.current = Math.max(36, Math.min(canvas.width - 36, clientX * scale));
  };

  const startGame = () => {
    itemsRef.current = [];
    particlesRef.current = [];
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <>
      {/* 1. Cold-Starting Floating Banner / Pill */}
      {serverState === "cold_starting" && !isDismissed && !isGameOpen && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-sm animate-bounce-subtle">
          <div className="bg-neutral-900/95 backdrop-blur-xl border border-rose-500/40 rounded-2xl p-4 shadow-2xl shadow-rose-950/40 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Render Cold Starting ({elapsedSeconds}s)
                </span>
              </div>
              <button
                onClick={() => setIsDismissed(true)}
                className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Render free tier spins down when idle. Your backend is waking up right now (~30-50s). Play our retro arcade game while you wait!
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setIsGameOpen(true);
                  if (!gameStarted) startGame();
                }}
                className="flex-1 bg-gradient-to-r from-primary to-rose-600 hover:from-primary-hover hover:to-rose-500 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5"
              >
                <span>🍿 Play Popcorn Catcher 🎮</span>
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium py-2 px-3 rounded-xl border border-neutral-700 transition-colors"
              >
                Wait
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Arcade Game Modal */}
      {isGameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[460px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header with Live Status & Controls */}
            <div className="p-3 sm:p-4 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🍿</span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Popcorn Catcher
                    <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                      ARCADE
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className={`w-2 h-2 rounded-full ${serverState === "online"
                          ? "bg-emerald-400 animate-pulse"
                          : "bg-amber-400 animate-ping"
                        }`}
                    />
                    <span
                      className={
                        serverState === "online"
                          ? "text-emerald-400 font-semibold"
                          : "text-amber-400 font-medium"
                      }
                    >
                      {serverState === "online"
                        ? "Server is ONLINE! 🚀"
                        : `Backend Waking Up... (${elapsedSeconds}s)`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGameOpen(false)}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-sm"
                  aria-label="Close game"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Score & Lives HUD */}
            <div className="px-4 py-2 bg-neutral-900/40 border-b border-neutral-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold">
                  Score: <span className="text-amber-400 font-mono text-sm">{score}</span>
                </span>
                <span className="text-neutral-400 font-medium">
                  Best: <span className="text-white font-mono">{highScore}</span>
                </span>
              </div>

              <div className="flex items-center gap-1 text-sm">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={i < lives ? "opacity-100" : "opacity-25 grayscale"}>
                    ❤️
                  </span>
                ))}
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full aspect-[44/54] bg-[#0c0d12] flex items-center justify-center overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                onPointerMove={handlePointerMove}
                className="w-full h-full cursor-ew-resize"
              />

              {/* Start Overlay */}
              {!gameStarted && !gameOver && (
                <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div className="text-5xl animate-bounce">🍿</div>
                  <h4 className="text-xl font-black text-white tracking-wide">
                    POPCORN CATCHER
                  </h4>
                  <p className="text-xs text-neutral-300 max-w-xs leading-relaxed">
                    Catch popcorn 🍿 (+10), soda 🥤 (+25), and golden tickets 🎟️ (+50).
                    <br />
                    <span className="text-rose-400 font-semibold">Dodge rotten tomatoes 🍅!</span>
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Controls: Drag screen or use Left/Right arrow keys
                  </p>
                  <button
                    onClick={startGame}
                    className="mt-2 bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-105"
                  >
                    Start Catching 🎮
                  </button>
                </div>
              )}

              {/* Game Over Overlay */}
              {gameOver && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center gap-3 animate-fade-in">
                  <div className="text-4xl">🍅💥</div>
                  <h4 className="text-2xl font-black text-rose-500 tracking-wide">
                    GAME OVER
                  </h4>
                  <div className="text-sm text-neutral-300">
                    Final Score: <span className="font-bold text-amber-400 text-lg">{score}</span>
                  </div>
                  {score >= highScore && score > 0 && (
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      🏆 New High Score!
                    </span>
                  )}
                  <button
                    onClick={startGame}
                    className="mt-2 bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105"
                  >
                    Play Again 🔄
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Status / Stream Callout */}
            <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-3">
              {serverState === "online" ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <span>🚀 Server is ready to stream!</span>
                  </div>
                  <Link
                    href="/movies"
                    onClick={() => setIsGameOpen(false)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-md transition-all hover:scale-105"
                  >
                    Watch Movies &rarr;
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full text-xs text-neutral-400">
                  <span>Free-tier spins up automatically</span>
                  <span className="font-mono text-amber-400 font-semibold">{elapsedSeconds}s</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

