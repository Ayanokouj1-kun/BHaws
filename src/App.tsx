import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useData } from "@/hooks/useData";
import Dashboard from "./pages/Dashboard";
import RoomsPage from "./pages/RoomsPage";
import RoomDetails from "./pages/RoomDetails";
import BoardersPage from "./pages/BoardersPage";
import BoarderDetails from "./pages/BoarderDetails";
import PaymentsPage from "./pages/PaymentsPage";
import ReportsPage from "./pages/ReportsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import SettingsPage from "./pages/SettingsPage";
import AccountsPage from "./pages/AccountsPage";
import MaintenancePage from "./pages/MaintenancePage";
import ExpensesPage from "./pages/ExpensesPage";
import LoginPage from "./pages/LoginPage";
import AccountPage from "./pages/AccountPage";
import NotFound from "./pages/NotFound";

import { DataProvider } from "@/context/DataContext";
import { ThemeProvider } from "@/context/ThemeContext";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user } = useData();
  if (!user) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataProvider>
      <BrowserRouter>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Login as landing page */}
              <Route path="/" element={<LoginPage />} />
              {/* Keep /login as an alias for backwards compatibility */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
              />
              <Route
                path="/rooms"
                element={<ProtectedRoute allowedRoles={["SuperAdmin", "Admin", "Staff"]}><RoomsPage /></ProtectedRoute>}
              />
              <Route
                path="/rooms/:id"
                element={<ProtectedRoute allowedRoles={["SuperAdmin", "Admin", "Staff"]}><RoomDetails /></ProtectedRoute>}
              />
              <Route
                path="/boarders"
                element={<ProtectedRoute allowedRoles={["SuperAdmin", "Admin", "Staff"]}><BoardersPage /></ProtectedRoute>}
              />
              <Route
                path="/boarders/:id"
                element={<ProtectedRoute><BoarderDetails /></ProtectedRoute>}
              />
              <Route
                path="/payments"
                element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>}
              />
              <Route
                path="/maintenance"
                element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>}
              />
              <Route
                path="/expenses"
                element={<ProtectedRoute allowedRoles={["SuperAdmin", "Admin", "Staff"]}><ExpensesPage /></ProtectedRoute>}
              />
              <Route
                path="/reports"
                element={<ProtectedRoute allowedRoles={["SuperAdmin", "Admin", "Staff"]}><ReportsPage /></ProtectedRoute>}
              />
              <Route
                path="/audit-logs"
                element={<ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}><AuditLogsPage /></ProtectedRoute>}
              />
              <Route
                path="/settings"
                element={<ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}><SettingsPage /></ProtectedRoute>}
              />
              <Route
                path="/accounts"
                element={<ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}><AccountsPage /></ProtectedRoute>}
              />
              <Route
                path="/account"
                element={<ProtectedRoute><AccountPage /></ProtectedRoute>}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
    </DataProvider>
  </QueryClientProvider>
);

export default App;
