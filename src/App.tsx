import { Routes, Route } from "react-router-dom";

function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">LibrosOff</h1>
        <p className="text-muted-foreground text-lg">Proyecto listo para desarrollar.</p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
