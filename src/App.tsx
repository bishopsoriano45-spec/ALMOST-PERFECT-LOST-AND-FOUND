import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import ItemDetail from './pages/ItemDetail';
import MyItems from './pages/MyItems';
import SearchItems from './pages/SearchItems';
import Admin from './pages/Admin';
import AdminLayout from './pages/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminClaimsPage from './pages/AdminClaimsPage';
import ClaimedItems from './pages/ClaimedItems';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

import { AuthProvider } from '@/context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/report-lost" element={<ReportLost />} />
            <Route path="/report-found" element={<ReportFound />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/search" element={<SearchItems />} />
            <Route path="/my-items" element={<MyItems />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboardPage /></AdminLayout>} />
            <Route path="/admin/claims" element={<AdminLayout><AdminClaimsPage /></AdminLayout>} />
            <Route path="/claimed" element={<ClaimedItems />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;