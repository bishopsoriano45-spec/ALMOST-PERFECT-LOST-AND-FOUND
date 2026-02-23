import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Item } from '@/types';

interface ClaimItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Item;
    type?: 'claim' | 'contact';
}

export default function ClaimItemModal({ isOpen, onClose, item, type = 'contact' }: ClaimItemModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: type === 'claim'
            ? `Hi, I believe this item (${item.title}) belongs to me. I can provide more details to verify ownership.`
            : `Hi, I have a question about your item (${item.title}).`
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const endpoint = type === 'claim'
                ? `${import.meta.env.VITE_API_URL || '/api'}/admin/claims`
                : `${import.meta.env.VITE_API_URL || '/api'}/items/contact`;

            const payload = type === 'claim' ? {
                foundItemId: item.id,
                // For generic claims on found items, we might not have a lostItemId link unless passed.
                // We'll leave lostItemId null for now as it's a direct claim.
                // We need a claimerId. If the user is logged in, we should use it. 
                // For now, let's try to pass the email and let the backend resolve or use 'guest'.
                // If the backend strictly requires claimer_id, we might need a workaround.
                // Valid workaround: Check if user exists by email in backend, or use a known guest ID.
                // Sending email in verificationNotes for Admin visibility if ID is just 'guest'.
                claimerId: 'guest', // Backend will resolve this using email
                claimerEmail: formData.email,
                claimerName: formData.name,
                verificationNotes: formData.message,
                matchScore: 0
            } : {
                itemId: item.id,
                senderName: formData.name,
                senderEmail: formData.email,
                message: formData.message,
                type: type
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.details
                    ? `${data.error}: ${data.details}`
                    : data.error || 'Failed to send message';
                throw new Error(errorMessage);
            }

            toast.success('Message sent successfully!');
            onClose();
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{type === 'claim' ? 'Submit Claim to Office' : 'Contact Owner/Finder'}</DialogTitle>
                    <DialogDescription>
                        {type === 'claim'
                            ? 'Submit a claim request to the Lost & Found Admin Office. Please provide details to prove ownership.'
                            : 'Send a message to the person who reported this item.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="message" className="text-right">
                            Message
                        </Label>
                        <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="col-span-3"
                            rows={4}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
