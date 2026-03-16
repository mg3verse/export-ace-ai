import { lazy, Suspense, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import LandingPage from "@/pages/LandingPage";
import AboutPage from "@/pages/AboutPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "./pages/NotFound.tsx";

const DemoPage = lazy(() => import("@/pages/DemoPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AgentsPage = lazy(() => import("@/pages/AgentsPage"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authed === null) return <PageLoader />;
  if (!authed) return <LoginPage onAuth={() => setAuthed(true)} />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/demo" element={<Suspense fallback={<PageLoader />}><DemoPage /></Suspense>} />
              <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><DashboardPage /></Suspense></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AdminPage /></Suspense></ProtectedRoute>} />
              <Route path="/agents" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AgentsPage /></Suspense></ProtectedRoute>} />
              <Route path="/about" element={<AboutPage />} />
            </Route>
            <Route path="/login" element={<LoginPage onAuth={() => window.location.href = '/dashboard'} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
