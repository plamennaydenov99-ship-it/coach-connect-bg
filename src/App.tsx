import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CanonicalTag } from "@/components/CanonicalTag";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoSwitcher } from "@/components/DemoSwitcher";

import Index from "./pages/Index";
import Search from "./pages/Search";
import Discover from "./pages/Discover";
import CoachProfile from "./pages/CoachProfile";
import ClubProfile from "./pages/ClubProfile";
import ForCoaches from "./pages/ForCoaches";
import Events from "./pages/Events";
import Marketplace from "./pages/Marketplace";
import Camps from "./pages/Camps";
import CampDetail from "./pages/CampDetail";
import Community from "./pages/Community";
import Match from "./pages/Match";
import Start from "./pages/Start";
import NotFound from "./pages/NotFound";
import LegacyCoachRedirect from "./pages/LegacyCoachRedirect";
import LegacyClubRedirect from "./pages/LegacyClubRedirect";
import ClubFacilities from "./pages/club/ClubFacilities";
import { StaffLayout } from "./components/coach/StaffLayout";

import { CoachLayout } from "./components/coach/CoachLayout";
import CoachCalendar from "./pages/coach/CoachCalendar";
import CoachClients from "./pages/coach/CoachClients";
import CoachDashboard from "./pages/coach/CoachDashboard";
import CoachMessages from "./pages/coach/CoachMessages";
import CoachSettings from "./pages/coach/CoachSettings";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { AccountLayout } from "./components/account/AccountLayout";
import Account from "./pages/Account";
import { RequireAuth } from "./components/dashboard/RequireAuth";
import DashboardHome from "./pages/dashboard/DashboardHome";
import ProfileEditor from "./pages/dashboard/ProfileEditor";
import Analytics from "./pages/dashboard/Analytics";
import Messages from "./pages/dashboard/Messages";
import Billing from "./pages/dashboard/Billing";
import DashSettings from "./pages/dashboard/Settings";
import Availability from "./pages/dashboard/Availability";
import BookingRequests from "./pages/dashboard/BookingRequests";
import Clients from "./pages/dashboard/Clients";
import ClientDetail from "./pages/dashboard/ClientDetail";
import MyProgram from "./pages/account/MyProgram";
import MyBookings from "./pages/dashboard/MyBookings";
import PersonalInfo from "./pages/dashboard/PersonalInfo";
import BookmarksPage from "./pages/dashboard/Bookmarks";
import AdminReview from "./pages/admin/AdminReview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTrending from "./pages/admin/AdminTrending";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CanonicalTag />
            <DemoSwitcher />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/athlete" element={<Index />} />
              <Route path="/search" element={<Search />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/coaches/:id" element={<CoachProfile />} />
              <Route path="/coach" element={<RequireAuth area="coach"><CoachLayout /></RequireAuth>}>
                <Route index element={<Navigate to="/coach/dashboard" replace />} />
                <Route path="dashboard" element={<CoachDashboard />} />
                <Route path="clients" element={<CoachClients />} />
                <Route path="clients/:id" element={<CoachClients />} />
                <Route path="calendar" element={<CoachCalendar />} />
                <Route path="messages" element={<CoachMessages />} />
                <Route path="profile" element={<div className="portal-skin"><ProfileEditor /></div>} />
                <Route path="settings" element={<CoachSettings />} />
              </Route>
              {/* Legacy profile links. Register future /coach/* portal paths above this. */}
              <Route path="/coach/:id" element={<LegacyCoachRedirect />} />
              <Route path="/clubs/:id" element={<ClubProfile />} />
              <Route path="/club" element={<RequireAuth area="club"><StaffLayout role="club" /></RequireAuth>}>
                <Route index element={<Navigate to="/club/dashboard" replace />} />
                <Route path="dashboard" element={<CoachDashboard />} />
                <Route path="members" element={<CoachClients />} />
                <Route path="members/:id" element={<CoachClients />} />
                <Route path="clients" element={<Navigate to="/club/members" replace />} />
                <Route path="calendar" element={<CoachCalendar />} />
                <Route path="facilities" element={<ClubFacilities />} />
                <Route path="messages" element={<CoachMessages />} />
                <Route path="profile" element={<div className="portal-skin"><ProfileEditor /></div>} />
                <Route path="settings" element={<CoachSettings />} />
              </Route>
              {/* Legacy club profile links. Register future /club/* portal paths above this. */}
              <Route path="/club/:id" element={<LegacyClubRedirect />} />
              <Route path="/login" element={<Navigate to="/start" replace />} />
              <Route path="/register" element={<Navigate to="/start" replace />} />
              <Route path="/for-coaches" element={<ForCoaches />} />
              <Route path="/events" element={<Events />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/camps" element={<Camps />} />
              <Route path="/camps/:id" element={<CampDetail />} />
              <Route path="/community" element={<Community />} />
              <Route path="/match" element={<Match />} />
              <Route path="/start" element={<Start />} />

              <Route path="/dashboard" element={<RequireAuth area="staff"><DashboardLayout /></RequireAuth>}>
                <Route index element={<DashboardHome />} />
                <Route path="profile" element={<ProfileEditor />} />
                <Route path="availability" element={<Availability />} />
                <Route path="requests" element={<BookingRequests />} />
                <Route path="clients" element={<Clients />} />
                <Route path="clients/:id" element={<ClientDetail />} />
                <Route path="bookings" element={<MyBookings />} />
                <Route path="personal-info" element={<PersonalInfo />} />
                <Route path="bookmarks" element={<BookmarksPage />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="messages" element={<Messages />} />
                <Route path="billing" element={<Billing />} />
                <Route path="settings" element={<DashSettings />} />
              </Route>

              <Route path="/account" element={<RequireAuth area="athlete"><AccountLayout /></RequireAuth>}>
                <Route index element={<Account />} />
                <Route path="bookings" element={<MyBookings />} />
                <Route path="program" element={<MyProgram />} />
                <Route path="personal-info" element={<PersonalInfo />} />
                <Route path="bookmarks" element={<BookmarksPage />} />
                <Route path="messages" element={<Messages />} />
              </Route>

              <Route path="/admin/review" element={<AdminReview />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/trending" element={<AdminTrending />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
