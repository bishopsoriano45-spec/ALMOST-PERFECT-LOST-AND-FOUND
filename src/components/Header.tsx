import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Plus,
  Search,
  Shield,
  Menu,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationService } from '@/lib/notificationService';
import { adminService } from '@/lib/adminService';
import FeedbackModal from '@/components/FeedbackModal';
import { MessageSquare } from 'lucide-react';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
}

export default function Header({ onMobileMenuToggle, showMobileMenu }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingClaims, setPendingClaims] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const userId = 'user@example.com'; // Demo user ID

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = notificationService.subscribe(userId, (notifications) => {
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    });

    // Get pending claims count
    const claims = adminService.getClaims();
    const pending = claims.filter(c => c.status === 'pending').length;
    setPendingClaims(pending);

    return unsubscribe;
  }, [userId]);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Mobile Menu */}
          <div className="flex items-center gap-3">
            {onMobileMenuToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileMenuToggle}
                className="md:hidden"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}

            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Search className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI Lost & Found</h1>
            </Link>
          </div>

          {/* Right side - Navigation and Actions */}
          <div className="flex items-center gap-3">
            {/* Admin Panel Access */}
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link to="/admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
                {pendingClaims > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs">
                    {pendingClaims}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Mobile Admin Access */}
            <Button variant="outline" size="sm" asChild className="sm:hidden">
              <Link to="/admin">
                <Shield className="h-4 w-4" />
                {pendingClaims > 0 && (
                  <Badge className="ml-1 bg-red-500 text-white text-xs">
                    {pendingClaims}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Feedback Button */}
            <Button variant="outline" size="sm" onClick={() => setShowFeedback(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Feedback</span>
            </Button>

            {/* Claimed Items Button */}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/claimed">
                Success Stories
              </Link>
            </Button>

            {/* Report Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button size="sm" asChild>
                <Link to="/report-lost">
                  <Plus className="h-4 w-4 mr-2" />
                  Report Lost
                </Link>
              </Button>

              <Button variant="outline" size="sm" asChild>
                <Link to="/report-found">
                  <Plus className="h-4 w-4 mr-2" />
                  Report Found
                </Link>
              </Button>
            </div>

            {/* Mobile Report Menu */}
            <div className="md:hidden">
              <Button size="sm" asChild>
                <Link to="/report-lost">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </header>
  );
}