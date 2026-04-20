import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import AuthLayout from "@/layouts/AuthLayout";
import AppLayout from "@/layouts/AppLayout";
import ProtectedRoute from "@/layouts/ProtectedRoute";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground text-sm">{title} — próximamente</p>
    </div>
  );
}

const protectedAppRoutes = [
  { path: "/explorar", element: <Home /> },
  { path: "/mis-libros", element: <PlaceholderPage title="Mis libros" /> },
  { path: "/intercambios", element: <PlaceholderPage title="Intercambios" /> },
  { path: "/mensajes", element: <PlaceholderPage title="Mensajes" /> },
  { path: "/perfil", element: <PlaceholderPage title="Perfil" /> },
  { path: "/configuracion", element: <PlaceholderPage title="Configuración" /> },
];

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* ProtectedRoute -> AppLayout -> page */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {protectedAppRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
