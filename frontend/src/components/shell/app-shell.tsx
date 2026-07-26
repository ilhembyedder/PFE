"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, FileText, LogOut, Menu, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, useTenant } from "@/lib/query/hooks";
import { initials, roleLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { useIdleLogout } from "./use-idle-logout";

export type ShellVariant = "tenant" | "platform";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const TENANT_NAV: NavItem[] = [
  { href: "/cases", label: "Dossiers", icon: <FileText aria-hidden /> },
  { href: "/leasing", label: "Clients & contrats", icon: <Users aria-hidden /> },
  { href: "/settings", label: "Paramètres", icon: <Settings aria-hidden /> },
];

const PLATFORM_NAV: NavItem[] = [
  { href: "/tenants", label: "Sociétés", icon: <Building2 aria-hidden /> },
];

/** Active state is a filled shape, never a coloured left stripe. */
function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "type-body flex h-9 items-center gap-2.5 rounded-md px-3 transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
        "focus-visible:focus-ring outline-none",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground hover:bg-card",
        collapsed && "justify-center px-0",
      )}
      style={{ transitionDuration: "var(--duration-fast)" }}
    >
      {item.icon}
      <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function Identity({ variant, collapsed }: { variant: ShellVariant; collapsed?: boolean }) {
  // The platform shell has no tenant, so it must not fetch branding.
  const tenant = useTenant();
  const isPlatform = variant === "platform";

  const name = isPlatform ? "LeasRecover" : tenant.data?.name;
  const logoUrl = isPlatform ? null : tenant.data?.logoUrl;

  if (!isPlatform && tenant.isPending) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-4">
        <Skeleton className="size-7 shrink-0 rounded-sm" />
        {!collapsed ? <Skeleton className="h-4 w-28" /> : null}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5 px-3 py-4", collapsed && "justify-center px-0")}>
      {logoUrl ? (
        // Remote tenant logos of unknown dimensions; next/image would need a
        // configured host allowlist per tenant, which is not possible here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="border-border size-7 shrink-0 rounded-sm border object-contain"
        />
      ) : (
        <span
          aria-hidden
          className="bg-primary text-primary-foreground type-caption grid size-7 shrink-0 place-items-center rounded-sm font-semibold"
        >
          {initials(name ?? "LeasRecover")}
        </span>
      )}
      {!collapsed ? (
        <span className="type-title truncate">{name ?? "LeasRecover"}</span>
      ) : null}
    </div>
  );
}

function AccountBlock({ collapsed }: { collapsed?: boolean }) {
  const session = useSession();
  const router = useRouter();

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const user = session.data;

  return (
    <div className="border-sidebar-border border-t p-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={cn(
                "focus-visible:focus-ring hover:bg-card flex w-full items-center gap-2.5 rounded-md p-2 text-left outline-none transition-colors",
                collapsed && "justify-center",
              )}
              aria-label="Compte et préférences"
            >
              <span
                aria-hidden
                className="bg-panel text-foreground type-caption border-border grid size-7 shrink-0 place-items-center rounded-full border font-semibold"
              >
                {initials(user?.name)}
              </span>
              {!collapsed ? (
                <span className="min-w-0 flex-1">
                  <span className="type-body-sm text-foreground block truncate">
                    {user?.name ?? "—"}
                  </span>
                  <span className="type-caption text-muted-foreground block truncate">
                    {roleLabel(user?.role)}
                  </span>
                </span>
              ) : null}
            </button>
          }
        />
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuItem onClick={() => void signOut()}>
            <LogOut aria-hidden />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SidebarBody({
  variant,
  collapsed,
  onNavigate,
}: {
  variant: ShellVariant;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const nav = variant === "platform" ? PLATFORM_NAV : TENANT_NAV;

  return (
    <>
      <div className="border-sidebar-border border-b">
        <Identity variant={variant} collapsed={collapsed} />
      </div>

      <nav aria-label="Navigation principale" className="flex-1 space-y-0.5 p-2">
        {nav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
            active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
          />
        ))}
      </nav>

      <AccountBlock collapsed={collapsed} />
    </>
  );
}

export function AppShell({
  variant = "tenant",
  breadcrumb,
  children,
}: {
  variant?: ShellVariant;
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { warning, stayConnected, logout } = useIdleLogout(true);

  return (
    <div className="bg-background min-h-svh">
      {/* Skip link: first focusable element on every screen. */}
      <a
        href="#contenu"
        className="focus:bg-primary focus:text-primary-foreground type-label sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>

      {/* Breakpoint-driven: 56px icon rail at tablet, 240px at desktop. */}
      <aside
        className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-30 hidden w-14 flex-col border-r md:flex lg:w-60"
        aria-label="Barre latérale"
      >
        <div className="flex h-full flex-col lg:hidden">
          <SidebarBody variant={variant} collapsed />
        </div>
        <div className="hidden h-full flex-col lg:flex">
          <SidebarBody variant={variant} />
        </div>
      </aside>

      <div className="flex min-h-svh flex-col md:pl-14 lg:pl-60">
        <header className="bg-background/95 border-border sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-sm md:px-6 lg:px-8">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden"
                  aria-label="Ouvrir la navigation"
                >
                  <Menu aria-hidden />
                </Button>
              }
            />
            <SheetContent side="left" className="bg-sidebar w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-full flex-col">
                <SidebarBody variant={variant} onNavigate={() => setDrawerOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">{breadcrumb}</div>
          <ThemeToggle />
        </header>

        {/* NFR12 made visible: the platform console cannot reach case data. */}
        {variant === "platform" ? (
          <p className="bg-panel border-border type-caption text-muted-foreground border-b px-4 py-1.5 md:px-6 lg:px-8">
            Console plateforme — accès aux dossiers clients désactivé.
          </p>
        ) : null}

        {warning ? (
          <div
            role="alert"
            className="bg-warning-surface border-warning-border type-body-sm flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2 md:px-6 lg:px-8"
          >
            <span>Votre session expire dans 1 minute.</span>
            <span className="flex gap-2">
              <Button size="sm" variant="outline" onClick={stayConnected}>
                Rester connecté
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void logout()}>
                Se déconnecter
              </Button>
            </span>
          </div>
        ) : null}

        <main id="contenu" className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
