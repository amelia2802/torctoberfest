import { Link, useLocation } from "react-router-dom";
import { BookOpen, Library, Vote, Home, Menu, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProfileDialog } from "./ProfileDialog";

export const Navigation = () => {
  const location = useLocation();
  const {theme, setTheme} = useTheme();

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/books", label: "Books", icon: BookOpen },
    { to: "/guides", label: "Study Guides", icon: Library },
    { to: "/vote", label: "Monthly Vote", icon: Vote },
  ];

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-light text-foreground">
            torcReads<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1 mr-2 pr-2 border-r border-border">
              {links.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-light transition-colors",
                    location.pathname === to
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>

            {/* Mobile nav */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation menu"
                    className="h-10 w-10"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-[85vw] sm:w-[360px] p-4">
                  <SheetHeader className="text-left">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 flex flex-col gap-2">
                    {links.map(({ to, label, icon: Icon }) => (
                      <SheetClose asChild key={to}>
                        <Link
                          to={to}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-light transition-colors",
                            location.pathname === to
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{label}</span>
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  <div className="mt-6 border-t border-border pt-4">
                    <ProfileDialog />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop profile */}
            <div className="hidden md:block">
              <ProfileDialog />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};