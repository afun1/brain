import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPrompt } from "@/components/InstallPrompt";
import HomePage from "@/pages/HomePage";
import PlayerPage from "@/pages/PlayerPage";
import CustomPage from "@/pages/CustomPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/program/:id" component={PlayerPage} />
      <Route path="/custom" component={CustomPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <InstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
