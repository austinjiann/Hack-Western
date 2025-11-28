import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import Canvas from "./pages/Canvas";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Pricing from "./pages/Pricing";

export default function App() {
  return (
    <ErrorBoundary>
      <Theme>
        <AuthProvider>
          <Toaster position="bottom-center" richColors />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/pricing" element={<Pricing />} />
          <Route path="/app" element={<Canvas />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </Theme>
    </ErrorBoundary>
  );
}
