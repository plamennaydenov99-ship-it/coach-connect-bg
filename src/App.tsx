import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/context/LanguageContext";

import Index from "./pages/Index";
import SplitEntry from "./pages/SplitEntry";
import AthleteHome from "./pages/AthleteHome";
import Search from "./pages/Search";
import CoachProfile from "./pages/CoachProfile";
import ClubProfile from "./pages/ClubProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForCoaches from "./pages/ForCoaches";
import Events from "./pages/Events";
import Marketplace from "./pages/Marketplace";
import Camps from "./pages/Camps";
import CampDetail from "./pages/CampDetail";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";

import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import ProfileEditor from "./pages/dashboard/ProfileEditor";
import Analytics from "./pages/dashboard/Analytics";
import Messages from "./pages/dashboard/Messages";
import Billing from "./pages/dashboard/Billing";
import DashSettings from "./pages/dashboard/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/athlete" element={<AthleteHome />} />
            <Route path="/entry" element={<SplitEntry />} />
            <Route path="/home" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/coach/:slug" element={<CoachProfile />} />
            <Route path="/club/:slug" element={<ClubProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/for-coaches" element={<ForCoaches />} />
            <Route path="/events" element={<Events />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/camps" element={<Camps />} />
            <Route path="/camps/:id" element={<CampDetail />} />
            <Route path="/community" element={<Community />} />

            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="profile" element={<ProfileEditor />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="messages" element={<Messages />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<DashSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
