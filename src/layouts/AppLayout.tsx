import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  BookMarked,
  ArrowLeftRight,
  MessageCircle,
  User,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_MAIN = [
  { label: "Explorar",     icon: Search,        href: "/explorar"     },
  { label: "Mis libros",   icon: BookMarked,     href: "/mis-libros"   },
  { label: "Intercambios", icon: ArrowLeftRight, href: "/intercambios" },
  { label: "Mensajes",     icon: MessageCircle,  href: "/mensajes"     },
];

const NAV_BOTTOM = [
  { label: "Perfil",        icon: User,     href: "/perfil"        },
  { label: "Configuración", icon: Settings, href: "/configuracion" },
];

const UNREAD = 2;

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AppLayout() {
  const sidebarOpen      = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen   = useUIStore((s) => s.setSidebarOpen);

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      {/* Mobile overlay */}
      <div
        aria-hidden
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      <Sidebar />

      {/* Right column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar() {
  const sidebarOpen            = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen         = useUIStore((s) => s.setSidebarOpen);
  const sidebarCollapsed       = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebarCollapsed = useUIStore((s) => s.toggleSidebarCollapsed);
  const user                   = useAuthStore((s) => s.user);
  const logout                 = useAuthStore((s) => s.logout);
  const navigate               = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <aside
      className={cn(
        "fixed lg:sticky top-0 h-screen flex flex-col z-40",
        "bg-white border-r border-border",
        "transition-[width,transform] duration-300 ease-in-out",
        // Desktop width — collapsed or expanded
        sidebarCollapsed ? "lg:w-[68px]" : "lg:w-64",
        // Mobile: always full width, slides in/out
        "w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* ── Logo row ── */}
      <div
        className={cn(
          "flex items-center h-14 border-b border-border flex-shrink-0 gap-2",
          sidebarCollapsed ? "px-[18px]" : "px-4"
        )}
      >
        {/* Icon always visible */}
        <NavLink to="/" className="flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-md shadow-violet-200">
            <BookOpen className="w-[14px] h-[14px] text-white" />
          </div>
        </NavLink>

        {/* Wordmark — hidden when collapsed */}
        <span
          className={cn(
            "font-bold text-base flex-1 overflow-hidden whitespace-nowrap transition-all duration-300",
            sidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
        >
          Booker
        </span>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebarCollapsed}
          title={sidebarCollapsed ? "Expandir" : "Colapsar"}
          className={cn(
            "hidden lg:flex flex-shrink-0 items-center justify-center w-6 h-6 rounded-lg",
            "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          )}
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft  className="w-3.5 h-3.5" />
          }
        </button>

        {/* Mobile close */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden flex-shrink-0 p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-0.5",
          sidebarCollapsed ? "px-2" : "px-3"
        )}
      >
        {!sidebarCollapsed && (
          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest px-3 mb-2">
            Menú
          </p>
        )}
        {NAV_MAIN.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
            collapsed={sidebarCollapsed}
            onClick={() => setSidebarOpen(false)}
          />
        ))}

        <div className={cn("border-t border-border/60", sidebarCollapsed ? "my-2 mx-1" : "my-3")} />

        {!sidebarCollapsed && (
          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest px-3 mb-2">
            Cuenta
          </p>
        )}
        {NAV_BOTTOM.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
            collapsed={sidebarCollapsed}
            onClick={() => setSidebarOpen(false)}
          />
        ))}
      </nav>

      {/* ── User card ── */}
      {user && (
        <div className="border-t border-border flex-shrink-0 p-2">
          {sidebarCollapsed ? (
            /* Avatar-only when collapsed */
            <div className="flex justify-center py-1">
              <img
                src={user.avatar}
                alt={user.name}
                title={user.name}
                className="w-8 h-8 rounded-full ring-1 ring-border bg-violet-100 cursor-default"
              />
            </div>
          ) : (
            /* Full card when expanded */
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors group">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full ring-1 ring-border bg-violet-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.location}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {/* Logout visible when collapsed */}
          {sidebarCollapsed && (
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="flex items-center justify-center w-full py-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors mt-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const user          = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-20 h-14 flex-shrink-0 flex items-center justify-between px-4 lg:px-6 bg-white/90 backdrop-blur-md border-b border-border">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Abrir menú"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>

        {/* Search pill */}
        <button className="hidden sm:flex items-center gap-2 bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded-xl transition-colors border border-border/60 w-52">
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 text-left text-xs">Buscar libros…</span>
          <kbd className="text-[10px] bg-background border border-border rounded px-1 py-0.5 font-mono leading-none">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-[18px] h-[18px]" />
          {UNREAD > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-600 rounded-full ring-2 ring-white" />
          )}
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* User */}
        {user && (
          <button className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-muted transition-colors">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-full ring-1 ring-border bg-violet-100"
            />
            <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
              {user.name.split(" ")[0]}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}

// ─── Sidebar link ─────────────────────────────────────────────────────────────

interface SidebarLinkProps {
  label: string;
  icon: React.ElementType;
  href: string;
  collapsed: boolean;
  onClick?: () => void;
}

function SidebarLink({ label, icon: Icon, href, collapsed, onClick }: SidebarLinkProps) {
  return (
    <NavLink
      to={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-xl text-sm font-medium transition-all duration-150",
          collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
          isActive
            ? "bg-violet-50 text-violet-700 font-semibold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "flex-shrink-0 transition-colors",
              collapsed ? "w-5 h-5" : "w-4 h-4",
              isActive ? "text-violet-600" : "text-current"
            )}
          />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}
