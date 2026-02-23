import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import EnhancedReportLost from './pages/EnhancedReportLost';
import EnhancedReportFound from './pages/EnhancedReportFound';
import ItemDetail from './pages/ItemDetail';
import MyItems from './pages/MyItems';
import NotFound from './pages/NotFound';
import NotificationsPage from './pages/NotificationsPage';
import AdminLayout from './pages/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminClaimsPage from './pages/AdminClaimsPage';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/report-lost" element={<EnhancedReportLost />} />
          <Route path="/report-found" element={<EnhancedReportFound />} />
          <Route path="/report-lost-basic" element={<ReportLost />} />
          <Route path="/report-found-basic" element={<ReportFound />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/my-items" element={<MyItems />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="claims" element={<AdminClaimsPage />} />
            <Route path="items" element={<div>Items Management - Coming Soon</div>} />
            <Route path="users" element={<div>User Management - Coming Soon</div>} />
            <Route path="ai-system" element={<div>AI System Management - Coming Soon</div>} />
            <Route path="notifications" element={<div>Notification Management - Coming Soon</div>} />
            <Route path="settings" element={<div>Settings - Coming Soon</div>} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;