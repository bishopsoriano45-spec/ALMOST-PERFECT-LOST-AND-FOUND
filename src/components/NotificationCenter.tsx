import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Check,
  X,
  Eye,
  Trash2,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  MapPin,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Notification } from '@/types';
import * as notificationService from '@/services/notificationService';
import { Link } from 'react-router-dom';

interface NotificationCenterProps {
  userId: string;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await notificationService.getNotifications(userId, filter === 'unread');
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();

    // Poll for new notifications every 10 seconds
    const interval = setInterval(loadNotifications, 10000);

    return () => clearInterval(interval);
  }, [userId, filter]);

  const filteredNotifications = notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    await loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(userId);
    await loadNotifications();
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId);
    await loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match_found':
        return <Target className="h-5 w-5 text-green-500" />;
      case 'item_claimed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'verification_required':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-200';
      case 'medium': return 'bg-yellow-100 border-yellow-200';
      case 'low': return 'bg-gray-100 border-gray-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6" />
              <CardTitle>Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Buttons */}
              <div className="flex rounded-lg border p-1">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </Button>
              </div>

              {/* Action Buttons */}
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </h3>
                <p className="text-gray-600">
                  {filter === 'unread'
                    ? "You're all caught up!"
                    : "We'll notify you when there are updates about your items."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`transition-all ${notification.read ? 'opacity-75' : ''
                      } ${getPriorityColor(notification.priority)}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>

                              {/* Match Preview Card */}
                              {notification.type === 'match_found' && notification.metadata?.matchedItem && (
                                <Card className="mt-3 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                                  <CardContent className="p-3">
                                    <div className="flex gap-3">
                                      {notification.metadata.matchedItem.imageUrl && (
                                        <img
                                          src={notification.metadata.matchedItem.imageUrl}
                                          alt={notification.metadata.matchedItem.title}
                                          className="w-20 h-20 object-cover rounded-md"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-medium text-sm mb-1">
                                          {notification.metadata.matchedItem.title}
                                        </h5>
                                        <div className="space-y-1 text-xs text-gray-600">
                                          <div className="flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            <span className="font-medium">
                                              {Math.round(notification.metadata.matchScore * 100)}% Match
                                            </span>
                                            <Badge variant={notification.metadata.confidence === 'high' ? 'default' : 'secondary'} className="ml-1 text-xs">
                                              {notification.metadata.confidence}
                                            </Badge>
                                          </div>
                                          {notification.metadata.matchedItem.location && (
                                            <div className="flex items-center gap-1">
                                              <MapPin className="h-3 w-3" />
                                              {notification.metadata.matchedItem.location}
                                            </div>
                                          )}
                                          {notification.metadata.matchedItem.dateReported && (
                                            <div className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              {new Date(notification.metadata.matchedItem.dateReported).toLocaleDateString()}
                                            </div>
                                          )}
                                          {notification.metadata.explanation && notification.metadata.explanation.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-blue-200">
                                              <div className="font-medium mb-1">Why it matches:</div>
                                              <ul className="list-disc list-inside space-y-0.5">
                                                {notification.metadata.explanation.map((reason: string, idx: number) => (
                                                  <li key={idx}>{reason}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <div className="text-xs text-gray-500">
                                {formatTimeAgo(notification.timestamp)}
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 mt-3">
                            {!notification.read && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Mark Read
                              </Button>
                            )}

                            {notification.type === 'match_found' && notification.relatedItemId && (
                              <Link to={`/item/${notification.relatedItemId}`}>
                                <Button variant="default" size="sm">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Match
                                </Button>
                              </Link>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="ml-auto"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}