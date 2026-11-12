"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface FallingItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  rotation: number;
  rotSpeed: number;
  type: "popcorn" | "drink" | "ticket" | "tomato" | "heart" | "reel";
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
  size: number;
  life: number;
  maxLife: number;
  shape?: "circle" | "star";
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

// 8-Bit Web Audio Synthesizer for Arcade Sounds
class ArcadeAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cineverse_game_sound");
        if (saved !== null) this.enabled = saved === "true";
      } catch { }
    }
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => { });
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem("cineverse_game_sound", val ? "true" : "false");
    } catch { }
  }

  public playPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch { }
  }

  public playDrink() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch { }
  }

  public playTicket() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        const t = now + idx * 0.05;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      });
    } catch { }
  }

  public playHeart() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        const t = now + idx * 0.06;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.14);
      });
    } catch { }
  }

  public playTomato() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(75, now + 0.22);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch { }
  }

  public playGameOver() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [350, 310, 260, 195];
      freqs.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        const t = now + i * 0.12;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch { }
  }
}

const audio = new ArcadeAudio();

export default function ColdStartGame() {
  const [serverState, setServerState] = useState<"checking" | "cold_starting" | "online">("checking");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Game states
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [feverActive, setFeverActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const basketXRef = useRef<number>(240);
  const basketSpeedRef = useRef<number>(0);
  const basketSquashRef = useRef<{ x: number; y: number }>({ x: 1, y: 1 });
  const shakeRef = useRef<number>(0);
  const feverTimerRef = useRef<number>(0);

  const keysPressedRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const itemsRef = useRef<FallingItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const nextItemIdRef = useRef<number>(1);

  const livesRef = useRef<number>(3);
  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const gameOverRef = useRef<boolean>(false);
  const gameStartedRef = useRef<boolean>(false);
  const lastSpawnRef = useRef<number>(0);

  // Sync refs with states
  useEffect(() => {
    livesRef.current = lives;
    scoreRef.current = score;
    comboRef.current = combo;
    gameOverRef.current = gameOver;
    gameStartedRef.current = gameStarted;
  }, [lives, score, combo, gameOver, gameStarted]);

  // Load High Score & Sound setting
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cineverse_popcorn_high_score");
      if (saved) setHighScore(parseInt(saved, 10) || 0);

      const savedSound = localStorage.getItem("cineverse_game_sound");
      if (savedSound !== null) {
        const isSnd = savedSound === "true";
        setSoundEnabled(isSnd);
        audio.setEnabled(isSnd);
      }
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
        timer = setTimeout(checkHealth, 3500);
      }
    };

    checkHealth();

    secondsTimer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      clearInterval(secondsTimer);
    };
  }, []);

  // Floating text spawn helper
  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    floatTextsRef.current.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: 38,
      scale: 1.4,
    });
  };

  // Particle explosion spawn helper
  const addParticles = (x: number, y: number, color: string, count: number = 10, isStar: boolean = false) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        color,
        size: isStar ? 3.5 + Math.random() * 2 : 2.5 + Math.random() * 2,
        life: 0,
        maxLife: 25 + Math.random() * 20,
        shape: isStar ? "star" : "circle",
      });
    }
  };

  // Spawn falling objects
  const spawnItem = useCallback((canvasWidth: number) => {
    const rand = Math.random();
    let type: FallingItem["type"] = "popcorn";
    let symbol = "🍿";
    let points = 10;
    let speed = 2.6 + Math.random() * 2.2;
    let size = 30;

    if (rand < 0.22) {
      type = "tomato";
      symbol = "🍅";
      points = -1;
      speed = 3.0 + Math.random() * 2.4;
      size = 32;
    } else if (rand < 0.38) {
      type = "drink";
      symbol = "🥤";
      points = 25;
      speed = 3.2 + Math.random() * 2.0;
      size = 30;
    } else if (rand < 0.48) {
      type = "ticket";
      symbol = "🎟️";
      points = 50;
      speed = 3.8 + Math.random() * 2.6;
      size = 32;
    } else if (rand < 0.53) {
      type = "reel";
      symbol = "🎞️";
      points = 100;
      speed = 4.2 + Math.random() * 2.5;
      size = 34;
    } else if (rand < 0.58 && livesRef.current < 3) {
      type = "heart";
      symbol = "💖";
      points = 0;
      speed = 2.8 + Math.random() * 1.5;
      size = 32;
    }

    itemsRef.current.push({
      id: nextItemIdRef.current++,
      x: 35 + Math.random() * (canvasWidth - 70),
      y: -25,
      speed,
      rotation: (Math.random() - 0.5) * 0.4,
      rotSpeed: (Math.random() - 0.5) * 0.06,
      type,
      symbol,
      points,
      size,
    });
  }, []);

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

    const width = (canvas.width = 480);
    const height = (canvas.height = 600);
    basketXRef.current = width / 2;

    const basketWidth = 84;
    const basketHeight = 52;
    const basketY = height - 65;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Handle screen shake
      let offsetX = 0;
      let offsetY = 0;
      if (shakeRef.current > 0) {
        shakeRef.current = Math.max(0, shakeRef.current - dt * 25);
        offsetX = (Math.random() - 0.5) * shakeRef.current * 1.5;
        offsetY = (Math.random() - 0.5) * shakeRef.current * 1.5;
      }

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // Handle Fever countdown
      if (feverTimerRef.current > 0) {
        feverTimerRef.current -= dt;
        if (feverTimerRef.current <= 0) {
          feverTimerRef.current = 0;
          setFeverActive(false);
        }
      }
      const isFever = feverTimerRef.current > 0;

      // 1. Dynamic Background: Synthwave Cyber Neon Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isFever) {
        const hue = (now * 0.08) % 360;
        bgGrad.addColorStop(0, `hsl(${hue}, 60%, 12%)`);
        bgGrad.addColorStop(1, `hsl(${(hue + 60) % 360}, 65%, 8%)`);
      } else {
        bgGrad.addColorStop(0, "#090a10");
        bgGrad.addColorStop(0.5, "#10121d");
        bgGrad.addColorStop(1, "#181424");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-10, -10, width + 20, height + 20);

      // 2. Animated Retro Grid Floor
      const gridHorizonY = height - 120;
      ctx.strokeStyle = isFever ? "rgba(244, 63, 94, 0.4)" : "rgba(120, 70, 220, 0.22)";
      ctx.lineWidth = 1;

      // Vertical perspective lines
      const gridVanishingX = width / 2;
      for (let i = -8; i <= 8; i++) {
        const startX = gridVanishingX + i * 36;
        ctx.beginPath();
        ctx.moveTo(gridVanishingX + i * 8, gridHorizonY);
        ctx.lineTo(startX + (startX - gridVanishingX) * 1.8, height);
        ctx.stroke();
      }

      // Horizontal moving grid lines
      const gridScroll = (now * 0.08) % 24;
      for (let y = gridHorizonY; y <= height; y += 20) {
        const lineY = y + gridScroll;
        if (lineY <= height) {
          const depthAlpha = Math.min(0.4, ((lineY - gridHorizonY) / 120) * 0.4);
          ctx.strokeStyle = isFever ? `rgba(251, 191, 36, ${depthAlpha})` : `rgba(225, 29, 72, ${depthAlpha})`;
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(width, lineY);
          ctx.stroke();
        }
      }

      // 3. Twinkling Stars & Cinema Bokeh
      for (let i = 0; i < 28; i++) {
        const sx = ((i * 79 + now * 0.015) % width);
        const sy = ((i * 53) % (gridHorizonY - 40));
        const pulse = 0.3 + 0.7 * Math.sin(now * 0.003 + i);
        ctx.fillStyle = i % 3 === 0 ? `rgba(251, 191, 36, ${pulse * 0.8})` : `rgba(255, 255, 255, ${pulse * 0.7})`;
        ctx.fillRect(sx, sy, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2);
      }

      // Game Logic (when active)
      if (gameStartedRef.current && !gameOverRef.current) {
        // Keyboard controls with acceleration
        let targetSpeed = 0;
        if (keysPressedRef.current.left) targetSpeed -= 520;
        if (keysPressedRef.current.right) targetSpeed += 520;
        basketSpeedRef.current += (targetSpeed - basketSpeedRef.current) * 14 * dt;
        basketXRef.current += basketSpeedRef.current * dt;
        basketXRef.current = Math.max(basketWidth / 2, Math.min(width - basketWidth / 2, basketXRef.current));

        // Squash & stretch recovery
        basketSquashRef.current.x += (1 - basketSquashRef.current.x) * 12 * dt;
        basketSquashRef.current.y += (1 - basketSquashRef.current.y) * 12 * dt;

        // Spawn items (faster during Fever mode)
        const spawnDelay = isFever ? 450 : Math.max(500, 780 - scoreRef.current * 0.4);
        if (now - lastSpawnRef.current > spawnDelay) {
          spawnItem(width);
          lastSpawnRef.current = now;
        }

        // Update items
        const currentItems = itemsRef.current;
        for (let i = currentItems.length - 1; i >= 0; i--) {
          const item = currentItems[i];
          const speedMultiplier = isFever ? 1.25 : 1.0;
          item.y += item.speed * speedMultiplier * 60 * dt;
          item.rotation += item.rotSpeed;

          // Catch collision test
          const bx = basketXRef.current;
          const hitX = item.x >= bx - basketWidth / 2 - 12 && item.x <= bx + basketWidth / 2 + 12;
          const hitY = item.y >= basketY - 18 && item.y <= basketY + 28;

          if (hitX && hitY) {
            // Collision trigger
            basketSquashRef.current = { x: 1.22, y: 0.82 };

            if (item.type === "tomato") {
              // Hit by rotten tomato!
              shakeRef.current = 14;
              addParticles(item.x, item.y, "#ef4444", 18);
              addFloatingText(item.x, item.y - 10, "SPLAT! -1 ❤️", "#ef4444");
              audio.playTomato();

              const nextLives = livesRef.current - 1;
              livesRef.current = nextLives;
              setLives(nextLives);
              comboRef.current = 0;
              setCombo(0);

              if (nextLives <= 0) {
                gameOverRef.current = true;
                setGameOver(true);
                audio.playGameOver();
              }
            } else if (item.type === "heart") {
              // Life refill!
              shakeRef.current = 4;
              addParticles(item.x, item.y, "#f43f5e", 15, true);
              addFloatingText(item.x, item.y - 15, "+1 LIFE! 💖", "#f43f5e");
              audio.playHeart();
              const nextLives = Math.min(3, livesRef.current + 1);
              livesRef.current = nextLives;
              setLives(nextLives);
            } else {
              // Good item caught!
              const currentCombo = comboRef.current + 1;
              comboRef.current = currentCombo;
              setCombo(currentCombo);

              // Multiplier calculation (up to 4x)
              let mult = 1;
              if (currentCombo >= 15) mult = 4;
              else if (currentCombo >= 10) mult = 3;
              else if (currentCombo >= 5) mult = 2;
              if (isFever) mult *= 2;

              const earned = item.points * mult;
              const nextScore = scoreRef.current + earned;
              scoreRef.current = nextScore;
              setScore(nextScore);

              // Sound effects
              if (item.type === "popcorn") audio.playPop();
              else if (item.type === "drink") audio.playDrink();
              else if (item.type === "ticket") audio.playTicket();
              else if (item.type === "reel") audio.playTicket();

              // Trigger Fever Mode on 10 combo
              if (currentCombo === 10 && !isFever) {
                feverTimerRef.current = 7.0;
                setFeverActive(true);
                shakeRef.current = 8;
                addFloatingText(width / 2, height / 2 - 40, "🔥 FEVER MODE 2X! 🔥", "#fbbf24");
              }

              // Visual pops
              let particleColor = "#fef08a";
              if (item.type === "ticket") particleColor = "#fbbf24";
              else if (item.type === "drink") particleColor = "#38bdf8";
              else if (item.type === "reel") particleColor = "#c084fc";

              addParticles(item.x, item.y, particleColor, item.type === "reel" ? 22 : 12, item.type === "ticket");
              const comboSuffix = mult > 1 ? ` (x${mult})` : "";
              addFloatingText(item.x, item.y - 12, `+${earned}${comboSuffix}`, particleColor);

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

          // Offscreen boundary
          if (item.y > height + 25) {
            // Drop combo if clean item missed
            if (item.type !== "tomato") {
              comboRef.current = 0;
              setCombo(0);
            }
            currentItems.splice(i, 1);
          }
        }

        // Update particles
        const currentParticles = particlesRef.current;
        for (let i = currentParticles.length - 1; i >= 0; i--) {
          const p = currentParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12; // Gravity
          p.life++;
          if (p.life > p.maxLife) {
            currentParticles.splice(i, 1);
          }
        }

        // Update floating text
        const currentTexts = floatTextsRef.current;
        for (let i = currentTexts.length - 1; i >= 0; i--) {
          const ft = currentTexts[i];
          ft.y -= 1.4;
          ft.life++;
          if (ft.life > ft.maxLife) {
            currentTexts.splice(i, 1);
          }
        }
      }

      // 4. Render Falling Items with Rotation & Glow
      for (const item of itemsRef.current) {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);

        // Glow behind rare items
        if (item.type === "ticket" || item.type === "reel" || item.type === "heart") {
          const glowColor = item.type === "ticket" ? "rgba(251, 191, 36, 0.45)" : item.type === "reel" ? "rgba(192, 132, 252, 0.5)" : "rgba(244, 63, 94, 0.5)";
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 16;
        }

        ctx.font = `${item.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.symbol, 0, 0);
        ctx.restore();
      }

      // 5. Render Particles
      for (const p of particlesRef.current) {
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        if (p.shape === "star") {
          // Draw mini star
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 6. Render Floating Score Texts
      for (const ft of floatTextsRef.current) {
        const progress = ft.life / ft.maxLife;
        const alpha = Math.max(0, 1 - progress);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // 7. Render Popcorn Basket (Tub) with Squash & Stretch + Tilt
      const bx = basketXRef.current;
      const tilt = Math.max(-0.2, Math.min(0.2, basketSpeedRef.current * 0.0004));

      ctx.save();
      ctx.translate(bx, basketY);
      ctx.rotate(tilt);
      ctx.scale(basketSquashRef.current.x, basketSquashRef.current.y);

      // Neon tub glow aura
      ctx.shadowColor = isFever ? "#fbbf24" : "#e11d48";
      ctx.shadowBlur = isFever ? 24 : 14;

      // Tub Body
      const bwHalf = basketWidth / 2;
      const tubGrad = ctx.createLinearGradient(-bwHalf, 0, bwHalf, basketHeight);
      tubGrad.addColorStop(0, "#e11d48");
      tubGrad.addColorStop(0.5, "#be123c");
      tubGrad.addColorStop(1, "#881337");

      ctx.fillStyle = tubGrad;
      ctx.beginPath();
      ctx.moveTo(-bwHalf, 0);
      ctx.lineTo(bwHalf, 0);
      ctx.lineTo(bwHalf - 10, basketHeight);
      ctx.lineTo(-bwHalf + 10, basketHeight);
      ctx.closePath();
      ctx.fill();

      // White cinema stripes
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-9, basketHeight - 2);
      ctx.lineTo(-18, basketHeight - 2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(16, 0);
      ctx.lineTo(14, basketHeight - 2);
      ctx.lineTo(5, basketHeight - 2);
      ctx.closePath();
      ctx.fill();

      // Glowing Golden Rim
      const rimGrad = ctx.createLinearGradient(-bwHalf - 4, 0, bwHalf + 4, 0);
      rimGrad.addColorStop(0, "#fbbf24");
      rimGrad.addColorStop(0.5, "#fef08a");
      rimGrad.addColorStop(1, "#fbbf24");
      ctx.fillStyle = rimGrad;
      ctx.fillRect(-bwHalf - 4, -4, basketWidth + 8, 7);

      // Overflow Popcorn Cluster
      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🍿", 0, -8);

      ctx.restore();

      // 8. Ground Neon Line
      ctx.shadowColor = isFever ? "#fbbf24" : "#e11d48";
      ctx.shadowBlur = 12;
      ctx.fillStyle = isFever ? "#fbbf24" : "#e11d48";
      ctx.fillRect(0, height - 12, width, 3);
      ctx.shadowBlur = 0;

      ctx.restore(); // Restore shake translation

      // Next frame request
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isGameOpen, spawnItem, highScore]);

  // Controls handling (Keyboard)
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

  // Smooth pointer drag control
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const clientX = e.clientX - rect.left;
    basketXRef.current = Math.max(42, Math.min(canvas.width - 42, clientX * scale));
  };

  const startGame = () => {
    itemsRef.current = [];
    particlesRef.current = [];
    floatTextsRef.current = [];
    shakeRef.current = 0;
    feverTimerRef.current = 0;
    setFeverActive(false);
    setScore(0);
    setCombo(0);
    setLives(3);
    setGameOver(false);
    setGameStarted(true);
    audio.playTicket();
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.setEnabled(next);
  };

  return (
    <>
      {/* 1. Cold-Starting Glowing Floating Card */}
      {serverState === "cold_starting" && !isDismissed && !isGameOpen && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-sm animate-fade-in">
          <div className="relative overflow-hidden bg-neutral-950/95 backdrop-blur-xl border border-rose-500/50 rounded-2xl p-4 shadow-2xl shadow-rose-950/60 flex flex-col gap-3 group">
            {/* Glowing ambient light */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/25 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/40 transition-all" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-rose-300">
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

            <p className="text-xs text-neutral-300 leading-relaxed relative z-10">
              Free cloud instance is waking up (~30-50s). Catch popcorn and rack up high scores while you wait! 🍿
            </p>

            <div className="flex items-center gap-2 pt-1 relative z-10">
              <button
                onClick={() => {
                  setIsGameOpen(true);
                  if (!gameStarted) startGame();
                }}
                className="flex-1 bg-gradient-to-r from-primary via-rose-600 to-amber-500 hover:from-primary-hover hover:to-amber-400 text-white text-xs font-black py-2.5 px-3 rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-base animate-bounce">🍿</span>
                <span>PLAY POPCORN CATCHER</span>
                <span className="text-xs">🎮</span>
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-medium py-2 px-3 rounded-xl border border-neutral-800 transition-colors"
              >
                Hide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Arcade Game Modal */}
      {isGameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[480px] bg-[#0c0d14] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh]">
            {/* Header with Live Status & Controls */}
            <div className="px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/80 backdrop-blur flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl animate-pulse">🍿</span>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 tracking-wide">
                    POPCORN CATCHER
                    <span className="text-[9px] bg-primary/20 text-rose-300 border border-primary/40 px-1.5 py-0.5 rounded-full font-mono font-bold">
                      PRO ARCADE
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

              <div className="flex items-center gap-1.5">
                {/* Audio Toggle */}
                <button
                  onClick={toggleSound}
                  title={soundEnabled ? "Mute Arcade SFX" : "Unmute Arcade SFX"}
                  className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                >
                  <span>{soundEnabled ? "🔊" : "🔇"}</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsGameOpen(false)}
                  className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-sm"
                  aria-label="Close game"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Score, Multiplier & Lives HUD */}
            <div className="px-4 py-2.5 bg-neutral-900/50 border-b border-neutral-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold">
                  Score: <span className="text-amber-400 font-mono text-base font-black">{score}</span>
                </span>
                {combo > 1 && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black animate-pulse">
                    {combo}x STREAK! 🔥
                  </span>
                )}
                {feverActive && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-black animate-bounce">
                    FEVER 2X! ⚡
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-neutral-400 text-[11px]">
                  Best: <span className="text-white font-mono font-bold">{highScore}</span>
                </span>
                <div className="flex items-center gap-0.5 text-sm ml-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      className={`transition-all duration-300 ${i < lives ? "scale-100 opacity-100" : "scale-75 opacity-20 grayscale"}`}
                    >
                      ❤️
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full aspect-[48/60] bg-[#090a10] flex items-center justify-center overflow-hidden touch-none select-none">
              <canvas
                ref={canvasRef}
                onPointerMove={handlePointerMove}
                className="w-full h-full cursor-ew-resize"
              />

              {/* Start Overlay */}
              {!gameStarted && !gameOver && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-3 animate-fade-in">
                  <div className="text-6xl animate-bounce">🍿</div>
                  <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-rose-500 tracking-wider">
                    POPCORN CATCHER
                  </h4>
                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 max-w-xs space-y-1.5 leading-relaxed">
                    <p className="flex items-center justify-center gap-1.5">
                      <span>🍿 Popcorn (+10)</span>
                      <span>🥤 Soda (+25)</span>
                      <span>🎟️ Ticket (+50)</span>
                    </p>
                    <p className="text-amber-300 font-semibold flex items-center justify-center gap-1">
                      <span>🎞️ Film Reel (+100)</span>
                      <span>•</span>
                      <span>💖 Life Refill</span>
                    </p>
                    <p className="text-rose-400 font-bold">
                      ⚠️ Dodge Rotten Tomatoes 🍅!
                    </p>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    Controls: Drag screen or use Left/Right arrow keys
                  </p>
                  <button
                    onClick={startGame}
                    className="mt-1 bg-gradient-to-r from-primary to-rose-600 hover:from-primary-hover hover:to-rose-500 text-white font-black px-8 py-3 rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 text-sm tracking-wide"
                  >
                    START PLAYING 🎮
                  </button>
                </div>
              )}

              {/* Game Over Overlay */}
              {gameOver && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-3 animate-fade-in">
                  <div className="text-5xl animate-bounce">🍅💥</div>
                  <h4 className="text-3xl font-black text-rose-500 tracking-wider">
                    GAME OVER
                  </h4>
                  <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 w-64 space-y-2">
                    <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                      Final Score
                    </div>
                    <div className="font-black text-amber-400 text-3xl font-mono">
                      {score}
                    </div>
                    {score >= highScore && score > 0 && (
                      <div className="text-[11px] text-emerald-400 font-bold bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-500/40 animate-pulse">
                        🏆 NEW HIGH SCORE!
                      </div>
                    )}
                  </div>
                  <button
                    onClick={startGame}
                    className="mt-2 bg-gradient-to-r from-primary to-rose-600 hover:from-primary-hover hover:to-rose-500 text-white font-black px-8 py-3 rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 text-sm"
                  >
                    PLAY AGAIN 🔄
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Touch Helper Buttons (Left & Right Tap) */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-neutral-950 border-t border-neutral-900 sm:hidden">
              <button
                onTouchStart={() => (keysPressedRef.current.left = true)}
                onTouchEnd={() => (keysPressedRef.current.left = false)}
                onMouseDown={() => (keysPressedRef.current.left = true)}
                onMouseUp={() => (keysPressedRef.current.left = false)}
                className="py-2.5 rounded-xl bg-neutral-900 active:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-800 flex items-center justify-center gap-1 active:scale-95"
              >
                ◀ Left
              </button>
              <button
                onTouchStart={() => (keysPressedRef.current.right = true)}
                onTouchEnd={() => (keysPressedRef.current.right = false)}
                onMouseDown={() => (keysPressedRef.current.right = true)}
                onMouseUp={() => (keysPressedRef.current.right = false)}
                className="py-2.5 rounded-xl bg-neutral-900 active:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-800 flex items-center justify-center gap-1 active:scale-95"
              >
                Right ▶
              </button>
            </div>

            {/* Bottom Status / Stream Callout */}
            <div className="p-3 bg-neutral-900 border-t border-neutral-800/80 flex items-center justify-between gap-3">
              {serverState === "online" ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <span>🚀 Server is ready to stream!</span>
                  </div>
                  <Link
                    href="/movies"
                    onClick={() => setIsGameOpen(false)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-md transition-all hover:scale-105"
                  >
                    Watch Movies &rarr;
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Free-tier spins up automatically</span>
                  </div>
                  <span className="font-mono text-amber-400 font-bold">{elapsedSeconds}s</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
