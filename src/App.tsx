import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// One page, so no router library: anything but "/" is the 404 page.
const isHome = ["/", "/index.html"].includes(window.location.pathname);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    {isHome ? <Index /> : <NotFound />}
  </TooltipProvider>
);

export default App;
