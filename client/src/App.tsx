import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Home from "@/pages/home";
import Assessment from "@/pages/assessment";
import Results from "@/pages/results";
import Providers from "@/pages/providers";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background-gray">
      <Header />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/assessment" component={Assessment} />
        <Route path="/results/:sessionId" component={Results} />
        <Route path="/providers" component={Providers} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
