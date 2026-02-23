import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, TrendingUp, Users, Activity } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface PointsStats {
    totalPoints: number;
    topContributors: Array<{
        user_id: string;
        email: string;
        points: number;
        found_count: number;
    }>;
    distribution: Array<{
        bracket: string;
        count: number;
    }>;
    recentActivity: Array<{
        date: string;
        email: string;
        reason: string;
        points: number;
    }>;
}

export default function PointsMonitoring() {
    const [stats, setStats] = useState<PointsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPointsStats();
    }, []);

    const loadPointsStats = async () => {
        setLoading(true);
        setError(null); // Clear previous errors
        try {
            console.log("📊 Frontend: Fetching points stats...");
            const token = localStorage.getItem('adminToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // Use relative path to leverage Vite proxy
            const response = await axios.get('/api/admin/points/stats', config);

            console.log("📊 Points stats response:", response.data);

            // Robust check for success flag or direct data
            // New backend sends { success: true, data: { ... } }
            if (response.data && response.data.success === false) {
                throw new Error(response.data.error || 'API reported failure');
            }

            const statsData = response.data.data || response.data;

            // Defensive check for data structure
            if (!statsData || typeof statsData !== 'object') {
                throw new Error('Invalid data format received from server');
            }

            setStats(statsData);
        } catch (error: any) {
            console.error('❌ Error loading points stats:', error);
            // Extract detailed error message
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                'Failed to load points data';

            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleResetUserPoints = async (userId: string, userEmail: string) => {
        if (confirm(`Are you sure you want to reset points for ${userEmail}? This action cannot be undone.`)) {
            try {
                const token = localStorage.getItem('adminToken');
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                await axios.post(`/api/admin/users/${userId}/reset-points`, {}, config);
                toast.success(`Points for ${userEmail} reset successfully.`);
                loadPointsStats(); // Reload stats after reset
            } catch (error) {
                console.error('Error resetting user points:', error);
                toast.error(`Failed to reset points for ${userEmail}.`);
            }
        }
    };

    const handleResetAllPoints = async () => {
        if (confirm('Are you strictly sure you want to reset ALL user points? This will set everyone\'s points to 0 and cannot be undone.')) {
            try {
                const token = localStorage.getItem('adminToken');
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                await axios.post('/api/admin/users/reset-all-points', {}, config);
                toast.success('All points reset successfully.');
                loadPointsStats();
            } catch (error) {
                console.error('Error resetting all points:', error);
                toast.error('Failed to reset all points.');
            }
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading points data...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                <p>Error: {error}</p>
                <Button variant="outline" className="mt-4" onClick={loadPointsStats}>
                    Try Again
                </Button>
            </div>
        );
    }

    if (!stats) {
        return <div className="text-center py-8">No data available</div>;
    }

    const getBracketLabel = (bracket: string) => {
        // You can format this if needed, or leave as is
        return bracket;
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Points Awarded</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.totalPoints}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <Award className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Contributors</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {stats.topContributors.filter(u => u.points > 0).length}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Points / Contributor</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {stats.topContributors.length > 0 ? Math.round(stats.totalPoints / Math.max(stats.topContributors.filter(u => u.points > 0).length, 1)) : 0}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Contributors */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-500" />
                            Top Contributors
                        </CardTitle>
                        <div className="flex items-center justify-between">
                            <CardDescription>Users with the most points earned</CardDescription>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={handleResetAllPoints}
                            >
                                Reset All Points
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0"> {/* Remove padding to let table scroll edge-to-edge if desired, or keep it. Let's keep it clean. */}
                        <div className="max-h-[400px] overflow-y-auto relative">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Items Found</TableHead>
                                        <TableHead className="text-right">Points</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.topContributors.map((user, index) => (
                                        <TableRow key={user.user_id}>
                                            <TableCell className="font-medium text-gray-500">#{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{user.email.split('@')[0]}</span>
                                                        <span className="text-xs text-gray-500">{user.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.found_count}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                    {user.points} pts
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleResetUserPoints(user.user_id, user.email)}
                                                >
                                                    Reset
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-500" />
                            Recent Point Activity
                        </CardTitle>
                        <CardDescription>Latest points awarded to users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((activity, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-50 rounded-full">
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{activity.reason}</p>
                                                <p className="text-xs text-gray-500">
                                                    {activity.email} • {new Date(activity.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-green-600">+{activity.points}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">No recent activity</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
