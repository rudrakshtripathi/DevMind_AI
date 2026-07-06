import { Link, useLocation } from "wouter";
import {
  Shield,
  Workflow,
  BookOpen,
  AlertTriangle,
  LayoutDashboard,
  Moon,
  Sun,
  LogOut,
  User,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/security", label: "Security Scanner", icon: Shield },
  { path: "/workflows", label: "Workflow Builder", icon: Workflow },
  { path: "/codebase", label: "Codebase AI", icon: BookOpen },
  { path: "/analyzer", label: "Root Cause Analyzer", icon: AlertTriangle },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-8 w-8"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border">
        <img
          src="/devmind-logo.png"
          alt="DevMind AI"
          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
        />
        <span className="font-semibold text-sm tracking-tight">DevMind AI</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location === path;
          return (
            <Link
              key={path}
              href={path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border space-y-2">
        {user && (
          <div className="flex items-center gap-2.5">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.firstName ?? "User"}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">
                {user.firstName
                  ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                  : user.email ?? "User"}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
              onClick={logout}
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">v1.0.0</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
