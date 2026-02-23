const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface FeedbackData {
    name?: string;
    email?: string;
    message: string;
    type: 'complaint' | 'suggestion' | 'bug' | 'other';
}

export const feedbackService = {
    submitFeedback: async (data: FeedbackData) => {
        const response = await fetch(`${API_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userName: data.name,
                userEmail: data.email,
                message: data.message,
                type: data.type
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit feedback');
        }

        return response.json();
    },

    getAllFeedback: async (token: string) => {
        const response = await fetch(`${API_URL}/feedback`, {
            headers: {
                'Authorization': `Bearer ${token}` // Ensure admin token is passed
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch feedback');
        }

        return response.json();
    },

    updateStatus: async (id: number | string, status: string, token: string) => {
        const response = await fetch(`${API_URL}/feedback/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            throw new Error('Failed to update status');
        }

        return response.json();
    }
};
