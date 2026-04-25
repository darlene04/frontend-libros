import { Routes, Route, Navigate } from "react-router-dom";
import Library     from "@/pages/Library";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Marketplace from "@/pages/Marketplace";
import Home from "@/pages/Home";
import Profile     from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Messages    from "@/pages/Messages";
import AddBook     from "@/pages/AddBook";
import BookDetail  from "@/pages/BookDetail";
import Exchanges         from "@/pages/Exchanges";
import PendingDeliveries from "@/pages/PendingDeliveries";
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

  { path: "/mensajes", element: <PlaceholderPage title="Mensajes" /> },
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

          <Route path="/mi-biblioteca"  element={<Library />} />
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/explorar"      element={<Home />} />
          <Route path="/marketplace"   element={<Marketplace />} />
          <Route path="/mis-libros"    element={<PlaceholderPage title="Mis libros" />} />
          <Route path="/publicar"      element={<AddBook />} />
          <Route path="/intercambios"        element={<Exchanges />} />
          <Route path="/entregas-pendientes" element={<PendingDeliveries />} />
          <Route path="/mensajes"      element={<Messages />} />
          <Route path="/perfil"          element={<Profile />} />
          <Route path="/perfil/editar" element={<EditProfile />} />
          <Route path="/perfil/:id"    element={<Profile />} />
          <Route path="/configuracion" element={<PlaceholderPage title="Configuración" />} />
          <Route path="/libro/:id"     element={<BookDetail />} />
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
