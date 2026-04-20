import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute";

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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<PlaceholderPage title="Registro" />} />

      {/* Protected */}
      <Route
        path="/explorar"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Explorar" />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
