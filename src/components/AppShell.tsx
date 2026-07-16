"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Home,
  Languages,
  FolderKanban,
  History,
  BookMarked,
  Database,
  GitCompare,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  ready?: boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home, ready: true },
  { href: "/translate", label: "Translator", icon: Languages, ready: true },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/history", label: "History", icon: History },
  { href: "/glossaries", label: "Glossaries", icon: BookMarked },
  { href: "/memory", label: "Translation Memory", icon: Database },
  { href: "/review", label: "Review & Compare", icon: GitCompare },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV = NAV.filter((n) => n.ready).concat(
  NAV.find((n) => n.href === "/projects")!,
  NAV.find((n) => n.href === "/history")!,
);

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen">
      {/* Desktop / tablet navigation rail */}
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="font-display text-lg leading-none">L</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-display text-lg leading-tight text-foreground">Lingua</div>
              <div className="marker truncate">AI Translation</div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-2 scrollbar-slim">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const content = (
              <>
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && !item.ready && (
                  <span className="ml-auto rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                    Soon
                  </span>
                )}
              </>
            );
            const classes = cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-primary"
                : "text-muted hover:bg-surface-2 hover:text-foreground",
              !item.ready && "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-muted",
            );
            return item.ready ? (
              <Link
                key={item.href}
                href={item.href}
                className={classes}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
              >
                {content}
              </Link>
            ) : (
              <div key={item.href} className={classes} title={`${item.label} — coming soon`} aria-disabled>
                {content}
              </div>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-2.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-[18px] w-[18px]" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden />
              <span>Collapse</span>
            </>
          )}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="font-display text-base leading-none">L</span>
            </div>
            <span className="font-display text-lg">Lingua</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-surface/95 px-2 py-1.5 backdrop-blur md:hidden">
        {MOBILE_NAV.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
