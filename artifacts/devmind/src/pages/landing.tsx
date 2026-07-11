import { useState, useEffect, useRef } from "react";
import {
  motion, useInView, useReducedMotion, AnimatePresence,
  useMotionValue, useSpring, useTransform, type MotionValue,
} from "framer-motion";
import {
  Shield, Workflow, BookOpen, AlertTriangle, ChevronDown,
  ChevronLeft, ChevronRight, CheckCircle2, Zap, Lock, Globe,
  ArrowRight, Github, Twitter, Star, TrendingUp, Clock, Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Animation helpers ───────────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Navbar ──────────────────────────────────────────────────────
function Navbar({ onLogin }: { onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent",
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/devmind-logo.png" alt="DevMind AI" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-semibold text-base">DevMind AI</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {[["Features", "features"], ["How it works", "how-it-works"], ["FAQ", "faq"]].map(
            ([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                {label}
              </button>
            ),
          )}
        </nav>

        <Button onClick={onLogin} size="sm" className="gap-2 font-medium">
          Log in with Google
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}

// ── Hero ────────────────────────────────────────────────────────
const CYCLING_WORDS = ["faster.", "smarter.", "safer.", "bolder."];

function HeroVisual({
  mouseX,
  mouseY,
}: {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % 3), 400);
    return () => clearInterval(id);
  }, []);

  // Parallax layers — different depths
  const p0x = useTransform(mouseX, (x) => x * 0.03);
  const p0y = useTransform(mouseY, (y) => y * 0.022);
  const p1x = useTransform(mouseX, (x) => x * 0.013);
  const p1y = useTransform(mouseY, (y) => y * 0.01);
  const p2x = useTransform(mouseX, (x) => x * -0.022);
  const p2y = useTransform(mouseY, (y) => y * -0.016);
  const orbX = useTransform(mouseX, (x) => x * 0.055);
  const orbY = useTransform(mouseY, (y) => y * 0.055);

  const glowFor = (idx: number) =>
    active === idx
      ? "border-primary/60 shadow-[0_0_32px_6px_hsl(var(--primary)/0.22)]"
      : "border-white/[0.08]";

  const floatFor = (phase: number) => ({
    y: [0, -9, 0],
    transition: { y: { repeat: Infinity, duration: 2.8, ease: "easeInOut", delay: phase } },
  });

  return (
    <>
      <style>{`
        @keyframes hero-live { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.8)} }
        @keyframes hero-shimmer { 0%{transform:translateX(-150%) skewX(-15deg)} 100%{transform:translateX(250%) skewX(-15deg)} }
        @keyframes hero-scan { 0%{top:0%;opacity:0} 4%{opacity:0.9} 96%{opacity:0.6} 100%{top:100%;opacity:0} }
        @keyframes hero-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
        .hero-live-dot  { animation: hero-live 1.8s ease-in-out infinite; }
        .hero-shimmer   { animation: hero-shimmer 2.6s ease-in-out infinite 1.2s; }
        .hero-scan-line { animation: hero-scan 5s linear infinite; }
        .hero-ring      { animation: hero-ring 2s ease-out infinite; }
      `}</style>
      <div className="relative w-full max-w-lg mx-auto select-none pointer-events-none" style={{ height: 400 }}>

        {/* Ambient glow behind cards — follows mouse */}
        <motion.div style={{ x: orbX, y: orbY }} className="absolute inset-0 flex items-center justify-center">
          <div className="w-72 h-72 rounded-full bg-primary/18 blur-[70px]" />
        </motion.div>
        <div className="absolute top-0 right-4 w-36 h-36 rounded-full bg-purple-500/12 blur-[50px]" />

        {/* Card 0 – Workflow (top-right) */}
        <motion.div
          style={{ x: p0x, y: p0y }}
          initial={{ opacity: 0, x: 40, rotate: 3 }}
          animate={{ opacity: 1, rotate: 3, ...floatFor(0.9) }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "absolute top-6 right-0 w-58 rounded-xl p-4 shadow-2xl border backdrop-blur-xl transition-[border-color,box-shadow] duration-400",
            "bg-card/80",
            glowFor(0),
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-6 h-6 rounded-md flex items-center justify-center transition-colors duration-300", active === 0 ? "bg-purple-500/40" : "bg-purple-500/20")}>
                <Workflow className={cn("h-3 w-3 transition-colors duration-300", active === 0 ? "text-purple-300" : "text-purple-400")} />
              </div>
              <span className="text-xs font-semibold tracking-tight">Workflow Generated</span>
            </div>
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="hero-live-dot w-1.5 h-1.5 rounded-full bg-green-400 block" />
              <span className="text-[9px] text-green-400 font-bold uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {["Trigger: GitHub Push", "Build & Test", "Security Scan", "Deploy to Prod"].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className={cn("h-3 w-3 flex-shrink-0 transition-colors duration-300", active === 0 ? "text-green-300" : "text-green-400/70")} />
                <span className="text-xs text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
          {/* bottom metadata */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/60 font-mono">github-actions.yml</span>
            <span className="text-[10px] text-green-400/80">↑ pushed 2m ago</span>
          </div>
        </motion.div>

        {/* Card 1 – Security Analysis (center) */}
        <motion.div
          style={{ x: p1x, y: p1y }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, ...floatFor(0) }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "absolute z-10 rounded-2xl p-5 shadow-2xl border backdrop-blur-xl overflow-hidden transition-[border-color,box-shadow] duration-400",
            "left-3 right-3 top-[72px] bg-card/85",
            glowFor(1),
          )}
        >
          {/* Animated scan line when active */}
          {active === 1 && (
            <div className="hero-scan-line absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent pointer-events-none z-20" />
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 relative", active === 1 ? "bg-primary/35" : "bg-primary/15")}>
                <Shield className="h-4 w-4 text-primary" />
                {active === 1 && (
                  <div className="hero-ring absolute inset-0 rounded-lg border border-primary/50" />
                )}
              </div>
              <div>
                <span className="text-sm font-bold block leading-none mb-0.5">Security Analysis</span>
                <span className="text-[10px] text-muted-foreground font-mono">src/middlewares/auth.ts</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/12 text-green-400 border border-green-500/20 font-semibold tracking-wide">
              ✓ Complete
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {[
              { color: "bg-red-400", label: "0 Critical vulnerabilities", dot: "text-red-400" },
              { color: "bg-orange-400", label: "1 High — SQL injection risk", dot: "text-orange-400" },
              { color: "bg-yellow-400", label: "2 Medium — Input validation", dot: "text-yellow-400" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0 shadow-sm", color)} />
                {label}
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.07] pt-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Severity Score</span>
              <span className="font-bold text-orange-400 tabular-nums">4.1 / 10</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: "41%" }}
                transition={{ delay: 0.9, duration: 1, ease: "easeOut" }}
              >
                <div className="hero-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Card 2 – Codebase Q&A (bottom-left) */}
        <motion.div
          style={{ x: p2x, y: p2y }}
          initial={{ opacity: 0, x: -30, rotate: -2 }}
          animate={{ opacity: 1, rotate: -2, ...floatFor(1.7) }}
          transition={{ delay: 0.75, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "absolute bottom-2 left-0 w-56 rounded-xl p-3.5 shadow-2xl border backdrop-blur-xl transition-[border-color,box-shadow] duration-400",
            "bg-card/80",
            glowFor(2),
          )}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div className={cn("w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-300", active === 2 ? "bg-blue-500/40" : "bg-blue-500/18")}>
              <BookOpen className={cn("h-3 w-3 transition-colors duration-300", active === 2 ? "text-blue-300" : "text-blue-400")} />
            </div>
            <span className="text-xs font-semibold">Codebase Q&amp;A</span>
          </div>
          <div className="bg-muted/40 rounded-lg p-2 mb-2.5 border border-white/[0.05]">
            <p className="text-[11px] text-muted-foreground italic leading-relaxed">"Where is auth middleware defined?"</p>
          </div>
          <div className="flex items-start gap-1.5">
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-primary/20">
              <Zap className="h-2.5 w-2.5 text-primary" />
            </div>
            <p className="text-[11px] text-primary leading-relaxed">
              <span className="font-mono text-[10px] bg-primary/10 px-1 py-0.5 rounded border border-primary/15">src/middlewares/auth.ts</span>
              {" "}— session validation &amp; OIDC.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function Hero({ onLogin }: { onLogin: () => void }) {
  const heroRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Mouse tracking for spotlight + parallax
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { damping: 28, stiffness: 110, mass: 0.9 });
  const mouseY = useSpring(rawY, { damping: 28, stiffness: 110, mass: 0.9 });

  // Magnetic button springs
  const btnRawX = useMotionValue(0);
  const btnRawY = useMotionValue(0);
  const btnX = useSpring(btnRawX, { damping: 16, stiffness: 240 });
  const btnY = useSpring(btnRawY, { damping: 16, stiffness: 240 });

  useEffect(() => {
    if (reduced) return;
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      rawX.set(e.clientX - r.left - r.width / 2);
      rawY.set(e.clientY - r.top - r.height / 2);
      // Magnetic button pull
      const btn = btnRef.current;
      if (btn) {
        const br = btn.getBoundingClientRect();
        const dx = e.clientX - (br.left + br.width / 2);
        const dy = e.clientY - (br.top + br.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          const strength = (1 - dist / 110) * 0.35;
          btnRawX.set(dx * strength);
          btnRawY.set(dy * strength);
        } else {
          btnRawX.set(0);
          btnRawY.set(0);
        }
      }
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [reduced]);

  // 3-D tilt on the visual
  const tiltX = useTransform(mouseY, (y) => y * -0.014);
  const tiltY = useTransform(mouseX, (x) => x * 0.009);

  // Spotlight
  const spotX = useTransform(mouseX, (x) => `calc(50% + ${x * 0.52}px)`);
  const spotY = useTransform(mouseY, (y) => `calc(42% + ${y * 0.52}px)`);

  // Cycling word
  const [wordIdx, setWordIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setWordIdx((i) => (i + 1) % CYCLING_WORDS.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-center pt-24 pb-20 px-6 overflow-hidden"
    >
      {/* Fine dot-grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.11]"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Animated aurora orbs */}
      <motion.div
        animate={{ x: [0, 55, -25, 0], y: [0, -35, 28, 0], scale: [1, 1.18, 0.94, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute pointer-events-none w-[580px] h-[580px] rounded-full bg-primary/12 blur-[110px]"
        style={{ top: "0%", left: "8%" }}
      />
      <motion.div
        animate={{ x: [0, -45, 35, 0], y: [0, 45, -25, 0], scale: [1, 0.88, 1.12, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute pointer-events-none w-[420px] h-[420px] rounded-full bg-purple-500/10 blur-[90px]"
        style={{ top: "-5%", right: "2%" }}
      />
      <motion.div
        animate={{ x: [0, 38, -55, 0], y: [0, -28, 45, 0], scale: [1, 1.22, 0.88, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 9 }}
        className="absolute pointer-events-none w-[280px] h-[280px] rounded-full bg-cyan-500/7 blur-[65px]"
        style={{ bottom: "8%", right: "22%" }}
      />

      {/* Mouse-following spotlight */}
      {!reduced && (
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 860,
            height: 860,
            left: spotX,
            top: spotY,
            translateX: "-50%",
            translateY: "-50%",
            background: "radial-gradient(circle, hsl(var(--primary)/0.09) 0%, hsl(var(--primary)/0.03) 38%, transparent 62%)",
          }}
        />
      )}

      {/* Edge vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_72%_52%_at_50%_50%,transparent_52%,hsl(var(--background)/0.88)_100%)]" />

      <div className="relative max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
        {/* ── Left col ── */}
        <div>
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-7 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            AI-powered developer intelligence
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-6"
          >
            Ship safer code,{" "}
            <span className="inline-block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={CYCLING_WORDS[wordIdx]}
                  initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent"
                >
                  {CYCLING_WORDS[wordIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md"
          >
            Your unified developer intelligence platform — instant security scanning, AI workflow
            automation, codebase Q&amp;A, and root cause analysis, all in one place.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.5 }}
            className="flex items-center gap-4 flex-wrap mb-8"
          >
            {/* Magnetic button wrapper */}
            <motion.div ref={btnRef} style={{ x: btnX, y: btnY }}>
              <Button
                onClick={onLogin}
                size="lg"
                className="gap-2 px-7 font-semibold text-base h-12 relative overflow-hidden group shadow-lg shadow-primary/25"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
                {/* Sweep shimmer on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                />
              </Button>
            </motion.div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-2.5 w-2.5 text-green-400" />
              </span>
              <span className="text-sm text-muted-foreground">No credit card required</span>
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="flex items-center gap-6"
          >
            {[
              { icon: Lock, label: "SOC-2 Ready" },
              { icon: Globe, label: "10+ Languages" },
              { icon: Zap, label: "<1s Response" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs text-muted-foreground group cursor-default hover:text-foreground transition-colors duration-200"
              >
                <Icon className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors duration-200" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right col — 3-D tilting visual ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          style={reduced ? {} : { rotateX: tiltX, rotateY: tiltY, transformPerspective: 1100 }}
        >
          <HeroVisual mouseX={mouseX} mouseY={mouseY} />
        </motion.div>
      </div>
    </section>
  );
}

// ── Social proof — infinite marquee ──────────────────────────────
const row1Langs = [
  { name: "React",      dot: "bg-blue-400" },
  { name: "Python",     dot: "bg-yellow-400" },
  { name: "TypeScript", dot: "bg-blue-500" },
  { name: "Go",         dot: "bg-cyan-400" },
  { name: "Rust",       dot: "bg-orange-500" },
  { name: "Java",       dot: "bg-red-500" },
  { name: "Node.js",    dot: "bg-green-500" },
  { name: "C#",         dot: "bg-purple-500" },
];
const row2Langs = [
  { name: "Ruby",       dot: "bg-red-400" },
  { name: "C++",        dot: "bg-indigo-400" },
  { name: "PHP",        dot: "bg-violet-400" },
  { name: "Kotlin",     dot: "bg-purple-400" },
  { name: "Swift",      dot: "bg-orange-400" },
  { name: "Scala",      dot: "bg-red-600" },
  { name: "Elixir",     dot: "bg-purple-600" },
  { name: "Dart",       dot: "bg-cyan-500" },
];

function LangBadge({ name, dot }: { name: string; dot: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card",
        "text-sm text-muted-foreground font-medium mx-2 flex-shrink-0 whitespace-nowrap",
        "hover:border-primary/50 hover:text-foreground hover:scale-105",
        "transition-all duration-200 cursor-default select-none",
      )}
    >
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", dot)} />
      {name}
    </span>
  );
}

const MASK_FADE = "linear-gradient(to right, transparent 0px, black 80px, black calc(100% - 80px), transparent 100%)";

function SocialProof() {
  return (
    <section className="border-y border-border bg-muted/30 py-12 overflow-hidden [--play:running] hover:[--play:paused]">
      <style>{`
        @keyframes dm-marquee-left {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes dm-marquee-right {
          0%   { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .dm-track {
          display: flex;
          align-items: center;
          width: max-content;
          will-change: transform;
          animation-duration: 30s;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-delay: 0s;
          animation-play-state: var(--play, running);
        }
        .dm-scroll-left  { animation-name: dm-marquee-left;  }
        .dm-scroll-right { animation-name: dm-marquee-right; }
      `}</style>

      <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8 px-6">
        Supports every major language &amp; stack
      </p>

      <div className="space-y-3">
        {/* Row 1 – scrolls right → left */}
        <div
          className="overflow-hidden"
          style={{ maskImage: MASK_FADE, WebkitMaskImage: MASK_FADE }}
        >
          <div className="dm-track dm-scroll-left">
            {[...row1Langs, ...row1Langs].map((l, i) => (
              <LangBadge key={i} {...l} />
            ))}
          </div>
        </div>

        {/* Row 2 – scrolls left → right */}
        <div
          className="overflow-hidden"
          style={{ maskImage: MASK_FADE, WebkitMaskImage: MASK_FADE }}
        >
          <div className="dm-track dm-scroll-right">
            {[...row2Langs, ...row2Langs].map((l, i) => (
              <LangBadge key={i} {...l} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features carousel ────────────────────────────────────────────
const features = [
  {
    icon: Shield,
    color: "bg-red-500/15 text-red-400",
    iconColor: "text-red-400",
    gradientFrom: "from-red-500/10",
    tag: "Security",
    title: "AI Security Scanner",
    description:
      "Instantly detect SQL injection, XSS, insecure dependencies, and dozens of other vulnerability classes across any language — with a severity score and targeted fix suggestions.",
    bullets: [
      "SQL injection, XSS & CSRF detection",
      "Dependency vulnerability auditing",
      "Severity scoring with one-click fix guidance",
      "Supports Python, JS, Go, Rust, Java & more",
    ],
  },
  {
    icon: Workflow,
    color: "bg-purple-500/15 text-purple-400",
    iconColor: "text-purple-400",
    gradientFrom: "from-purple-500/10",
    tag: "Automation",
    title: "AI Workflow Builder",
    description:
      "Describe your CI/CD pipeline in plain English and get a complete workflow diagram and production-ready config back in seconds.",
    bullets: [
      "Natural-language pipeline definition",
      "GitHub Actions, GitLab CI & CircleCI output",
      "Visual flow diagram with dependency graph",
      "Instant copy-paste YAML generation",
    ],
  },
  {
    icon: BookOpen,
    color: "bg-blue-500/15 text-blue-400",
    iconColor: "text-blue-400",
    gradientFrom: "from-blue-500/10",
    tag: "Knowledge",
    title: "Codebase Knowledge AI",
    description:
      "Index your entire repository and ask natural-language questions. Get precise answers with file references — like a senior engineer who knows every corner of your codebase.",
    bullets: [
      "Full-repo semantic indexing",
      "Answers with exact file + line references",
      "Architecture and dependency mapping",
      "Works with any language or framework",
    ],
  },
  {
    icon: AlertTriangle,
    color: "bg-orange-500/15 text-orange-400",
    iconColor: "text-orange-400",
    gradientFrom: "from-orange-500/10",
    tag: "Debugging",
    title: "Root Cause Analyzer",
    description:
      "Paste any error log or stack trace. DevMind pinpoints the root cause, affected component, confidence level, and step-by-step remediation.",
    bullets: [
      "Stack trace & log parsing for any language",
      "Root cause with confidence score",
      "Affected component map",
      "Step-by-step fix instructions",
    ],
  },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0 }),
};

function Features() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const autoRef = useRef<ReturnType<typeof setInterval>>();
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  const startAuto = () => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setDir(1);
      setActive((c) => (c + 1) % features.length);
    }, 4500);
  };

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const go = (d: number) => {
    setDir(d);
    setActive((c) => (c + features.length + d) % features.length);
    startAuto();
  };

  const goTo = (i: number) => {
    if (i === active) return;
    setDir(i > active ? 1 : -1);
    setActive(i);
    startAuto();
  };

  const f = features[active];

  return (
    <section id="features" ref={sectionRef} className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeUp className="text-center mb-14">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Features</span>
          <h2 className="text-4xl font-bold mt-3 mb-4">Four modules, one platform</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Everything a modern engineering team needs to ship with confidence.
          </p>
        </FadeUp>

        {/* Carousel */}
        <FadeUp delay={0.1}>
          <div
            className="relative"
            onMouseEnter={() => clearInterval(autoRef.current)}
            onMouseLeave={startAuto}
          >
            {/* Card stage */}
            <div className="overflow-hidden rounded-3xl">
              <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                <motion.div
                  key={active}
                  custom={dir}
                  variants={reduced ? {} : slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
                  drag={reduced ? false : "x"}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.08}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) go(1);
                    else if (info.offset.x > 60) go(-1);
                  }}
                  className={cn(
                    "relative bg-card border border-card-border rounded-3xl overflow-hidden",
                    "cursor-grab active:cursor-grabbing select-none",
                  )}
                >
                  {/* Gradient accent */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none",
                      f.gradientFrom,
                    )}
                  />

                  <div className="relative flex flex-col lg:flex-row gap-0">
                    {/* Left panel */}
                    <div className="flex-1 p-8 lg:p-12">
                      {/* Tag + counter */}
                      <div className="flex items-center gap-3 mb-6">
                        <span
                          className={cn(
                            "text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-md",
                            f.color,
                          )}
                        >
                          {f.tag}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {active + 1} of {features.length}
                        </span>
                      </div>

                      {/* Icon */}
                      <motion.div
                        key={`icon-${active}`}
                        initial={reduced ? {} : { scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center mb-6",
                          f.color,
                        )}
                      >
                        <f.icon className="h-7 w-7" />
                      </motion.div>

                      <h3 className="text-2xl lg:text-3xl font-bold mb-3">{f.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-base mb-8 max-w-md">
                        {f.description}
                      </p>

                      {/* Bullets */}
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {f.bullets.map((b, i) => (
                          <motion.div
                            key={b}
                            initial={reduced ? {} : { opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.07, duration: 0.3 }}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle2 className={cn("h-4 w-4 flex-shrink-0 mt-0.5", f.iconColor)} />
                            <span className="text-muted-foreground">{b}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Right panel – visual accent */}
                    <div className="hidden lg:flex flex-col items-center justify-center w-72 p-10 border-l border-card-border/60 bg-muted/20 gap-6">
                      <motion.div
                        key={`big-icon-${active}`}
                        initial={reduced ? {} : { scale: 0.5, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          "w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl",
                          f.color,
                        )}
                      >
                        <f.icon className="h-12 w-12" />
                      </motion.div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Module</p>
                        <p className="text-sm font-semibold">{f.title}</p>
                      </div>
                      {/* Progress pips */}
                      <div className="flex flex-col gap-1.5 w-full">
                        {features.map((feat, i) => (
                          <button
                            key={feat.title}
                            onClick={() => goTo(i)}
                            className={cn(
                              "h-1 rounded-full transition-all duration-500 w-full",
                              i === active ? "bg-primary" : "bg-muted-foreground/20 hover:bg-muted-foreground/40",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Arrow buttons */}
            <button
              onClick={() => go(-1)}
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5",
                "w-10 h-10 rounded-full bg-card border border-card-border shadow-md",
                "flex items-center justify-center text-muted-foreground",
                "hover:text-foreground hover:border-primary/40 hover:shadow-lg",
                "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
              aria-label="Previous feature"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => go(1)}
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 translate-x-5",
                "w-10 h-10 rounded-full bg-card border border-card-border shadow-md",
                "flex items-center justify-center text-muted-foreground",
                "hover:text-foreground hover:border-primary/40 hover:shadow-lg",
                "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
              aria-label="Next feature"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Tab row */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {features.map((feat, i) => (
              <button
                key={feat.title}
                onClick={() => goTo(i)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-250",
                  i === active
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-muted-foreground border-card-border hover:border-primary/40 hover:text-foreground",
                )}
              >
                <feat.icon className="h-3.5 w-3.5" />
                {feat.title}
              </button>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ── How it works ─────────────────────────────────────────────────
const steps = [
  {
    n: "01",
    title: "Sign in securely",
    body: "Log in with Google in one click. Your workspace is private and isolated — no one else sees your code or results.",
    icon: Lock,
  },
  {
    n: "02",
    title: "Pick a module",
    body: "Choose Security Scanner, Workflow Builder, Codebase AI, or Root Cause Analyzer depending on what you need.",
    icon: Code2,
  },
  {
    n: "03",
    title: "Submit your input",
    body: "Paste code, describe a workflow in plain English, upload files, or drop in an error log. DevMind handles the rest.",
    icon: ArrowRight,
  },
  {
    n: "04",
    title: "Get instant AI analysis",
    body: "Receive structured, actionable results in under a second — ready to act on or share with your team.",
    icon: Zap,
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-16">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">How it works</span>
          <h2 className="text-4xl font-bold mt-3 mb-4">Up and running in minutes</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No complex setup. No API keys to configure. Just sign in and start getting AI-powered insights.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* connector line */}
          <div className="hidden lg:block absolute top-10 left-[calc(12.5%+1.25rem)] right-[calc(12.5%+1.25rem)] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {steps.map((s, i) => (
            <FadeUp key={s.n} delay={i * 0.1}>
              <div className="relative bg-card border border-card-border rounded-2xl p-6 text-center group hover:border-primary/40 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-primary font-bold text-sm">{s.n}</span>
                </div>
                <h3 className="font-semibold text-base mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────
const stats = [
  { value: "<1s", label: "Average response time", icon: Clock },
  { value: "10+", label: "Languages supported", icon: Globe },
  { value: "4", label: "Specialized AI modules", icon: TrendingUp },
  { value: "100%", label: "Private, per-user data", icon: Lock },
];

function Stats() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.08}>
              <div className="text-center p-8 bg-card border border-card-border rounded-2xl hover:border-primary/30 transition-all duration-300 group">
                <s.icon className="h-5 w-5 text-primary mx-auto mb-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="text-5xl font-black bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
                  {s.value}
                </div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────
const testimonials = [
  {
    quote:
      "DevMind AI caught a SQL injection vulnerability in our auth flow that had been there for months. The severity breakdown made it trivial to prioritize the fix.",
    name: "Sarah Chen",
    role: "Lead Engineer, Acme Corp",
    initials: "SC",
    color: "bg-blue-500/20 text-blue-400",
  },
  {
    quote:
      "I described our deployment pipeline in one sentence and got a complete GitHub Actions workflow back in seconds. This is what AI tooling should feel like.",
    name: "Marcus Alvarez",
    role: "DevOps Lead, Stackify",
    initials: "MA",
    color: "bg-purple-500/20 text-purple-400",
  },
  {
    quote:
      "Our on-call rotation used to dread incident investigations. Now we paste the log, get the root cause instantly, and have a fix deployed before the post-mortem even starts.",
    name: "Priya Nair",
    role: "SRE Manager, CloudFront",
    initials: "PN",
    color: "bg-green-500/20 text-green-400",
  },
];

function Testimonials() {
  return (
    <section className="py-28 px-6 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-16">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Testimonials</span>
          <h2 className="text-4xl font-bold mt-3 mb-4">Loved by developers</h2>
          <p className="text-sm text-muted-foreground">(Placeholder — add your own quotes later)</p>
        </FadeUp>

        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.1}>
              <div className="bg-card border border-card-border rounded-2xl p-6 flex flex-col gap-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                      t.color,
                    )}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────
const faqs = [
  {
    q: "What is DevMind AI?",
    a: "DevMind AI is a unified developer intelligence SaaS platform with four AI-powered modules: a Security Scanner, Workflow Builder, Codebase Knowledge AI, and Root Cause Analyzer. It helps engineering teams ship safer, faster.",
  },
  {
    q: "Is it free to use?",
    a: "DevMind AI is currently in early access. Sign in with Google to get started — no credit card required. Pricing will be announced before general availability.",
  },
  {
    q: "How does login work?",
    a: "We use Google OAuth via Replit's secure OIDC infrastructure. You click 'Log in with Google', authorize once, and you're in. We never store your password.",
  },
  {
    q: "Is my code safe? Do you store it?",
    a: "Your code and analysis results are stored securely and scoped strictly to your account. No other user can see your data. We do not use your code to train models.",
  },
  {
    q: "Which programming languages does the Security Scanner support?",
    a: "The scanner supports over 10 languages including Python, JavaScript, TypeScript, Go, Rust, Java, Ruby, C++, PHP, and more. Just specify the language when submitting.",
  },
  {
    q: "Can I use DevMind AI on mobile?",
    a: "The web app is fully responsive and works on mobile browsers. A dedicated mobile app is on the roadmap.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <FadeUp className="text-center mb-14">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">FAQ</span>
          <h2 className="text-4xl font-bold mt-3">Common questions</h2>
        </FadeUp>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <FadeUp key={i} delay={i * 0.04}>
              <div className="bg-card border border-card-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
                <button
                  className="w-full flex items-center justify-between p-5 text-left group"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="font-medium text-sm pr-4">{f.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                      open === i && "rotate-180",
                    )}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </motion.div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────
function FinalCTA({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="py-28 px-6">
      <FadeUp>
        <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-purple-500/10 p-14 text-center">
          {/* glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

          <div className="relative">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Get started today</span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-4 mb-5 leading-tight">
              Your AI co-pilot for{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                safer shipping
              </span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Join developers who use DevMind AI to catch vulnerabilities, automate workflows, and ship with confidence.
            </p>
            <Button onClick={onLogin} size="lg" className="gap-2 px-8 font-semibold text-base h-12">
              Start for free — Log in with Google
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/devmind-logo.png" alt="DevMind AI" className="w-7 h-7 rounded-lg object-cover" />
              <span className="font-semibold text-sm">DevMind AI</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Unified AI developer intelligence. Security, workflows, codebase knowledge, and incident analysis in one platform.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div>
              <div className="font-medium text-xs uppercase tracking-widest text-muted-foreground mb-3">Product</div>
              <div className="space-y-2">
                {["Features", "How it Works", "FAQ"].map((l) => (
                  <div key={l} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {l}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium text-xs uppercase tracking-widest text-muted-foreground mb-3">Legal</div>
              <div className="space-y-2">
                {["Privacy Policy", "Terms of Service"].map((l) => (
                  <div key={l} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com"
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">© 2026 DevMind AI. All rights reserved.</p>
          <p className="text-muted-foreground text-[12px] text-center">Built with ❤️ for developers by Rudraksh Tripathi</p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onLogin={onLogin} />
      <Hero onLogin={onLogin} />
      <SocialProof />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <FAQ />
      <FinalCTA onLogin={onLogin} />
      <Footer />
    </div>
  );
}
