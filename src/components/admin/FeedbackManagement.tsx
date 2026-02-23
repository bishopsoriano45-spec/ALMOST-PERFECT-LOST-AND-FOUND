import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { feedbackService } from '@/services/feedbackService';
import { toast } from 'sonner';
import { MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface FeedbackItem {
    id: number;
    user_email: string;
    user_name: string;
    message: string;
    type: 'complaint' | 'suggestion' | 'bug' | 'other';
    status: 'new' | 'read' | 'resolved';
    created_at: string;
}

export default function FeedbackManagement() {
    const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFeedback();
    }, []);

    const loadFeedback = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken') || '';
            const data = await feedbackService.getAllFeedback(token);
            setFeedbackList(data);
        } catch (error) {
            console.error('Error loading feedback:', error);
            toast.error('Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            const token = localStorage.getItem('adminToken') || '';
            await feedbackService.updateStatus(id, newStatus, token);

            setFeedbackList(prev => prev.map(item =>
                item.id === id ? { ...item, status: newStatus as any } : item
            ));
            toast.success('Status updated');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return <Badge variant="destructive">New</Badge>;
            case 'read': return <Badge variant="secondary">Read</Badge>;
            case 'resolved': return <Badge className="bg-green-500">Resolved</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'bug': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'suggestion': return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'complaint': return <AlertCircle className="h-4 w-4 text-orange-500" />;
            default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading feedback...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Student Feedback
                </CardTitle>
            </CardHeader>
            <CardContent>
                {feedbackList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No feedback received yet.
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="w-[40%]">Message</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedbackList.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {new Date(item.created_at).toLocaleDateString()}
                                            <div className="text-xs text-gray-500">
                                                {new Date(item.created_at).toLocaleTimeString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.user_name || 'Anonymous'}</div>
                                            <div className="text-xs text-gray-500">{item.user_email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 capitalize">
                                                {getTypeIcon(item.type)}
                                                {item.type}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm line-clamp-3" title={item.message}>
                                                {item.message}
                                            </p>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={item.status}
                                                onValueChange={(val) => handleStatusChange(item.id, val)}
                                            >
                                                <SelectTrigger className="w-[110px] h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="new">New</SelectItem>
                                                    <SelectItem value="read">Read</SelectItem>
                                                    <SelectItem value="resolved">Resolved</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
