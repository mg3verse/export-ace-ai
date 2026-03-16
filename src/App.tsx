import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LandingPage from "@/pages/LandingPage";
import AboutPage from "@/pages/AboutPage";
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
              <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
              <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminPage /></Suspense>} />
              <Route path="/agents" element={<Suspense fallback={<PageLoader />}><AgentsPage /></Suspense>} />
              <Route path="/about" element={<AboutPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
