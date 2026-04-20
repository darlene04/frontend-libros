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
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

//Nav config

const NAV_MAIN = [
  { label: "Explorar",      icon: Search,         href: "/explorar"      },
  { label: "Mis libros",    icon: BookMarked,      href: "/mis-libros"    },
  { label: "Intercambios",  icon: ArrowLeftRight,  href: "/intercambios"  },
  { label: "Mensajes",      icon: MessageCircle,   href: "/mensajes"      },
];

const NAV_BOTTOM = [
  { label: "Perfil",         icon: User,     href: "/perfil"         },
  { label: "Configuración",  icon: Settings, href: "/configuracion"  },
];

// Layout
export default function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      <div
        aria-hidden
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <aside
      className={cn(
        // Base
        "fixed lg:sticky top-0 h-screen w-64 flex flex-col z-40",
        "bg-white border-r border-border",
        // Mobile slide
        "transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border flex-shrink-0">
        <NavLink to="/" className="flex items-center gap-2.5 font-bold text-base">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-sm shadow-violet-200">
            <BookOpen className="w-[14px] h-[14px] text-white" />
          </div>
          <span>Booker</span>
        </NavLink>

        {/* Close — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest px-3 mb-2">
          Menú
        </p>
        {NAV_MAIN.map((item) => (
          <SidebarLink key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
        ))}

        <div className="my-3 border-t border-border/60" />

        <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest px-3 mb-2">
          Cuenta
        </p>
        {NAV_BOTTOM.map((item) => (
          <SidebarLink key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
        ))}
      </nav>

      {/* User card */}
      {user && (
        <div className="border-t border-border flex-shrink-0 p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors group">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full bg-violet-100 flex-shrink-0 ring-1 ring-border"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.location}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

//Header

const UNREAD_NOTIFICATIONS = 2;

function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 lg:px-6 bg-white/80 backdrop-blur-md border-b border-border flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Abrir menú"
        >
          <Menu className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        </button>

        <button className="hidden sm:flex items-center gap-2 bg-muted hover:bg-muted/80 text-muted-foreground text-sm px-3 py-1.5 rounded-lg transition-colors border border-border/60 w-52">
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 text-left text-xs">Buscar libros…</span>
          <kbd className="text-[10px] bg-background border border-border rounded px-1 leading-none py-0.5 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-[18px] h-[18px]" />
          {UNREAD_NOTIFICATIONS > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-600 rounded-full ring-2 ring-white" />
          )}
        </button>

        <div className="w-px h-5 bg-border mx-1" />
        {user && (
          <button className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-muted transition-colors group">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-full bg-violet-100 ring-1 ring-border"
            />
            <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
              {user.name.split(" ")[0]}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}

//Sidebar link

interface SidebarLinkProps {
  label: string;
  icon: React.ElementType;
  href: string;
  onClick?: () => void;
}

function SidebarLink({ label, icon: Icon, href, onClick }: SidebarLinkProps) {
  return (
    <NavLink
      to={href}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-violet-50 text-violet-700"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "w-4 h-4 flex-shrink-0 transition-colors",
              isActive ? "text-violet-600" : "text-current"
            )}
          />
          {label}
        </>
      )}
    </NavLink>
  );
}
