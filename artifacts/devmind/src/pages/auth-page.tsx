import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Workflow, BookOpen, AlertTriangle, Loader2 } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email, password }
        : { email, password, firstName, lastName };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      onAuthSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-muted/30 border-r border-border p-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/devmind-logo.png"
              alt="DevMind AI"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="text-xl font-bold tracking-tight">DevMind AI</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered developer intelligence platform
          </p>
        </div>

        <div className="space-y-6">
          {[
            { icon: Shield, title: "Security Scanner", desc: "Detect vulnerabilities with AI-powered code analysis", color: "text-red-400" },
            { icon: Workflow, title: "Workflow Builder", desc: "Generate automation pipelines from natural language", color: "text-blue-400" },
            { icon: BookOpen, title: "Codebase Knowledge", desc: "Ask questions about any codebase instantly", color: "text-purple-400" },
            { icon: AlertTriangle, title: "Root Cause Analyzer", desc: "Diagnose errors with AI-powered log analysis", color: "text-orange-400" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg bg-card border border-card-border flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          © 2026 DevMind AI. Built with ❤️ by Rudraksh Tripathi
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <img
              src="/devmind-logo.png"
              alt="DevMind AI"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-semibold text-lg">DevMind AI</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isLogin
              ? "Sign in to access your dashboard"
              : "Get started with DevMind AI today"}
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
