import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AuthLayout from "@/layouts/AuthLayout";
import ProtectedRoute from "@/layouts/ProtectedRoute";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground text-sm">{title} — próximamente</p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />

      {/* Auth — shared chrome via AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected — add routes here as children */}
      <Route element={<ProtectedRoute />}>
        <Route path="/explorar" element={<PlaceholderPage title="Explorar" />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
