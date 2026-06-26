"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/tracks", label: "Tracks" },
  { href: "/resources", label: "Resources" },
  { href: "/demos", label: "Demos" },
];

function initials(email: string, firstName?: string | null, lastName?: string | null) {
  const fromName = [firstName, lastName]
    .filter(Boolean)
    .map((s) => s![0]!.toUpperCase())
    .join("");
  return fromName || email[0]?.toUpperCase() || "?";
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  // Keep embed routes chrome-less for external <iframe> use.
  if (pathname?.endsWith("/embed")) return null;

  return (
    <header className="border-border/80 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 lg:px-6">
        <Link href="/" className="font-serif text-lg font-bold tracking-tight">
          XLab<span className="text-primary"> · </span>Tracks
        </Link>
        <nav className="text-muted-foreground hidden items-center gap-1 text-sm sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-foreground hover:bg-muted rounded-md px-3 py-1.5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ring-offset-background focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  aria-label="Account menu"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={user.profilePictureUrl ?? undefined} alt="" />
                    <AvatarFallback className="text-xs">
                      {initials(user.email, user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate font-normal">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/classrooms">My classrooms</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 size-4" aria-hidden /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
