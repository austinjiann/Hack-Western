import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import PricingRoute from "./components/PricingRoute";
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
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/pricing"
                element={
                  <PricingRoute>
                    <Pricing />
                  </PricingRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <Canvas />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </Theme>
    </ErrorBoundary>
  );
}