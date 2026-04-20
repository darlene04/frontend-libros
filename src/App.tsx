import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
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

      {/* Protected — AppLayout + ProtectedRoute como doble wrapper */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/explorar"      element={<PlaceholderPage title="Explorar" />} />
          <Route path="/mis-libros"    element={<PlaceholderPage title="Mis libros" />} />
          <Route path="/intercambios"  element={<PlaceholderPage title="Intercambios" />} />
          <Route path="/mensajes"      element={<PlaceholderPage title="Mensajes" />} />
          <Route path="/perfil"        element={<PlaceholderPage title="Perfil" />} />
          <Route path="/configuracion" element={<PlaceholderPage title="Configuración" />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
