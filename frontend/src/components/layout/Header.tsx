import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/authStore';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-primary-foreground font-bold text-sm">VL</span>
          </div>
          <span className="text-xl font-bold tracking-tight">VoteLens AI</span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
