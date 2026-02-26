"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "./language-switcher";
import { Trophy, Calendar, BarChart3, Shield, Menu, Users, User, LogOut } from "lucide-react";
import { useState } from "react";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: `/${locale}/calendar`, label: t("calendar"), icon: Calendar },
    { href: `/${locale}/riders`, label: t("riders"), icon: Users },
    { href: `/${locale}/leaderboard`, label: t("leaderboard"), icon: BarChart3 },
  ];

  if (session?.user?.role === "admin") {
    navItems.push({ href: `/${locale}/admin`, label: t("admin"), icon: Shield });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 font-bold text-xl"
          >
            <Trophy className="h-6 w-6 text-red-600" />
            <span className="hidden sm:inline">MotoGP Predictions</span>
            <span className="sm:hidden">MotoGP</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user.image || undefined} />
                    <AvatarFallback>
                      {(session.user.nickname || session.user.name || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {session.user.nickname || session.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile`} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    {t("profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: `/${locale}` })}
                  className="cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href={`/${locale}/auth/login`}>
                <Button variant="ghost" size="sm">
                  {t("login")}
                </Button>
              </Link>
              <Link href={`/${locale}/auth/register`}>
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  {t("register")}
                </Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t px-4 py-3 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
