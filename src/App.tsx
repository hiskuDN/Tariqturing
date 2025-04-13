import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Simulator from "./pages/Simulator";
import Tutorial from "./pages/Tutorial";
import Chatbot from "./components/chatbot/Chatbot";

// Initialize React Query client for data fetching and caching
const queryClient = new QueryClient();

/**
 * The main application component.
 * Sets up global providers (React Query, Tooltip, Toasters) and routing.
 * Defines the application's routes using HashRouter.
 */
const App = () => (
  // Provides the React Query client to the entire application
  <QueryClientProvider client={queryClient}>
    {/* Enables tooltips throughout the application */}
    <TooltipProvider>
      {/* Renders standard toasts */}
      <Toaster />
      {/* Renders Sonner toasts (likely a different style or position) */}
      <Sonner />
      {/* Uses HashRouter for client-side routing compatible with static hosting */}
      <HashRouter>
        {/* Defines the available routes and their corresponding components */}
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/tutorial" element={<Tutorial />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          {/* Catch-all route for handling undefined paths */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* Renders the Chatbot component globally across all routes */}
        <Chatbot />
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
