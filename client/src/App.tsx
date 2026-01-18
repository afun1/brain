import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPrompt } from "@/components/InstallPrompt";
import ConsolePage from "@/pages/ConsolePage";
import FeaturesPage from "@/pages/FeaturesPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ConsolePage} />
      <Route path="/features" component={FeaturesPage} />
      <Route component={ConsolePage} />
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
