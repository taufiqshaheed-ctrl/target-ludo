import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import AdminRoute from "@/components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminTransactions from "./pages/AdminTransactions";
import AdminKYC from "./pages/AdminKYC";
import AdminDeposits from "./pages/AdminDeposits";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminBattles from "./pages/AdminBattles";
import Home from "./pages/Home";
import LudoHome from "./pages/LudoHome";
import BattlePage from "./pages/BattlePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import Account from "./pages/Account";
import Profile from "./pages/Profile";
import WalletPage from "./pages/WalletPage";
import HistoryPage from "./pages/HistoryPage";
import Support from "./pages/Support";
import Legal from "./pages/Legal";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import Refer from "./pages/Refer";
import AddMoney from "./pages/AddMoney";
import KYCPage from "./pages/KYCPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/community-guidelines" element={<CommunityGuidelines />} />
            <Route path="/support" element={<Support />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><Layout><AdminUsers /></Layout></AdminRoute>} />
            <Route path="/admin/users/:id" element={<AdminRoute><Layout><AdminUserDetail /></Layout></AdminRoute>} />
            <Route path="/admin/transactions" element={<AdminRoute><Layout><AdminTransactions /></Layout></AdminRoute>} />
            <Route path="/admin/kyc" element={<AdminRoute><Layout><AdminKYC /></Layout></AdminRoute>} />
            <Route path="/admin/deposits" element={<AdminRoute><Layout><AdminDeposits /></Layout></AdminRoute>} />
            <Route path="/admin/withdrawals" element={<AdminRoute><Layout><AdminWithdrawals /></Layout></AdminRoute>} />
            <Route path="/admin/battles" element={<AdminRoute><Layout><AdminBattles /></Layout></AdminRoute>} />

            {/* Protected routes */}
            <Route path="/home" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
            <Route path="/ludo-home" element={<ProtectedRoute><Layout><LudoHome /></Layout></ProtectedRoute>} />
            <Route path="/battle" element={<ProtectedRoute><Layout><BattlePage /></Layout></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Layout><Account /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Layout><WalletPage /></Layout></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><Layout><HistoryPage /></Layout></ProtectedRoute>} />
            <Route path="/refer" element={<ProtectedRoute><Layout><Refer /></Layout></ProtectedRoute>} />
            <Route path="/add-money" element={<ProtectedRoute><Layout><AddMoney /></Layout></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><Layout><KYCPage /></Layout></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
