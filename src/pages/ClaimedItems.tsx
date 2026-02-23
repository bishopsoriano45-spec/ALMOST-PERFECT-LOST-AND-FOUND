
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Tag } from "lucide-react";
import { format } from "date-fns";
import axios from 'axios';
import { Item } from '@/types/item';
import { toast } from 'sonner';

const ClaimedItems = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClaimedItems = async () => {
            try {
                // Fetch items with status='claimed'
                // We use the existing query param 'status'
                const response = await axios.get('/api/items?status=claimed');
                setItems(response.data);
            } catch (error) {
                console.error('Failed to fetch claimed items:', error);
                toast.error('Could not load claimed items.');
            } finally {
                setLoading(false);
            }
        };

        fetchClaimedItems();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Claimed Items
                    </h1>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
                        Items that have found their way back to their owners.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="object-cover w-full h-48"
                                        />
                                    ) : (
                                        <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                                            Returned
                                        </Badge>
                                        <span className="text-sm text-gray-500">
                                            {item.dateReported && format(new Date(item.dateReported), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {item.description}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Tag className="w-4 h-4" />
                                            <span>{item.category}</span>
                                        </div>
                                        {item.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                <span className="truncate max-w-[100px]">{typeof item.location === 'string' ? item.location : item.location.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-500 py-12">
                            <p className="text-lg">No claimed items to display yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClaimedItems;
