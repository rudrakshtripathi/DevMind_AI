import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Shield, Workflow, BookOpen, AlertTriangle, ChevronDown,
  CheckCircle2, Zap, Lock, Globe, ArrowRight, Github,
  Twitter, Star, TrendingUp, Clock, Users, Code2,
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
function HeroVisual() {
  return (
    <div className="relative w-full max-w-lg mx-auto select-none pointer-events-none">
      {/* Glow orbs */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
      </div>
      <div className="absolute top-0 right-8 w-40 h-40 rounded-full bg-purple-500/15 blur-2xl" />

      {/* Back card - Workflow */}
      <motion.div
        initial={{ opacity: 0, x: 40, rotate: 3 }}
        animate={{ opacity: 1, x: 0, rotate: 3 }}
        transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-8 right-0 w-56 bg-card border border-card-border rounded-xl p-4 shadow-xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center">
            <Workflow className="h-3 w-3 text-purple-400" />
          </div>
          <span className="text-xs font-medium">Workflow Generated</span>
        </div>
        <div className="space-y-1.5">
          {["Trigger: GitHub Push", "Build & Test", "Security Scan", "Deploy to Prod"].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-400 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main card - Security */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 bg-card border border-card-border rounded-2xl p-5 shadow-2xl mx-6 mt-20"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold">Security Analysis</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-medium">
            Complete
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
            0 Critical vulnerabilities
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            1 High — SQL injection risk
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
            2 Medium — Input validation
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Severity Score</span>
            <span className="font-semibold text-orange-400">4.1 / 10</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: "41%" }}
              transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Bottom-left card - Codebase */}
      <motion.div
        initial={{ opacity: 0, x: -30, rotate: -2 }}
        animate={{ opacity: 1, x: 0, rotate: -2 }}
        transition={{ delay: 0.75, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-0 left-0 w-52 bg-card border border-card-border rounded-xl p-3.5 shadow-xl"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center">
            <BookOpen className="h-3 w-3 text-blue-400" />
          </div>
          <span className="text-xs font-medium">Codebase Q&A</span>
        </div>
        <p className="text-xs text-muted-foreground italic">"Where is auth middleware defined?"</p>
        <p className="text-xs text-primary mt-1.5">Found in src/middlewares/auth.ts — handles session validation and OIDC token refresh.</p>
      </motion.div>
    </div>
  );
}

function Hero({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-20 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6"
          >
            <Zap className="h-3 w-3" />
            AI-powered developer intelligence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Ship safer code,{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              faster.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg"
          >
            DevMind AI is your unified developer intelligence platform — instant security scanning,
            AI workflow automation, codebase Q&A, and root cause analysis, all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center gap-4 flex-wrap"
          >
            <Button onClick={onLogin} size="lg" className="gap-2 px-6 font-semibold text-base h-12">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">No credit card required</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-5 mt-8"
          >
            {[
              { icon: Lock, label: "SOC-2 Ready" },
              { icon: Globe, label: "10+ Languages" },
              { icon: Zap, label: "<1s Response" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

// ── Social proof ─────────────────────────────────────────────────
function SocialProof() {
  const badges = [
    "React", "Python", "TypeScript", "Go", "Rust", "Java", "Ruby", "C++",
  ];
  return (
    <section className="border-y border-border bg-muted/30 py-10 px-6 overflow-hidden">
      <FadeUp className="max-w-6xl mx-auto">
        <p className="text-center text-sm text-muted-foreground mb-6 font-medium tracking-wide uppercase">
          Supports every major language & stack
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {badges.map((b) => (
            <span
              key={b}
              className="px-4 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground font-medium hover:border-primary/50 hover:text-foreground transition-colors"
            >
              {b}
            </span>
          ))}
          <span className="px-4 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground font-medium">
            + more
          </span>
        </div>
      </FadeUp>
    </section>
  );
}

// ── Features ─────────────────────────────────────────────────────
const features = [
  {
    icon: Shield,
    color: "bg-red-500/15 text-red-400",
    title: "AI Security Scanner",
    description:
      "Instantly detect SQL injection, XSS, insecure dependencies, and dozens of other vulnerability classes across any language — with a severity score and fix suggestions.",
  },
  {
    icon: Workflow,
    color: "bg-purple-500/15 text-purple-400",
    title: "AI Workflow Builder",
    description:
      "Describe your CI/CD pipeline in plain English. DevMind generates a complete workflow diagram and config you can copy straight into your infrastructure.",
  },
  {
    icon: BookOpen,
    color: "bg-blue-500/15 text-blue-400",
    title: "Codebase Knowledge AI",
    description:
      "Index your entire repository and ask natural language questions. Get precise answers with file references — like a senior engineer who knows every corner of your codebase.",
  },
  {
    icon: AlertTriangle,
    color: "bg-orange-500/15 text-orange-400",
    title: "Root Cause Analyzer",
    description:
      "Paste any error log or stack trace. DevMind pinpoints the root cause, the affected component, confidence level, and step-by-step remediation instructions.",
  },
];

function Features() {
  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-16">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Features</span>
          <h2 className="text-4xl font-bold mt-3 mb-4">Four modules, one platform</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Everything a modern engineering team needs to ship with confidence, powered by the latest AI models.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.08}>
              <div className="group relative bg-card border border-card-border rounded-2xl p-7 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300",
                    f.color,
                  )}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            </FadeUp>
          ))}
        </div>
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
