import api from './axios';

// ── Types ──

export interface ChatMessageDto {
    id: string;
    role: 'User' | 'Assistant';
    content: string;
    createdAt: string;
}

export interface ChatHistoryResponse {
    sessionId: string;
    relatedNoteId: string | null;
    title: string;
    messages: ChatMessageDto[];
}

export interface SendChatMessageResponse {
    response: string;
    sessionId: string;
}

// ── API ──

export const chatApi = {
    // ═══ Global Chat ═══

    getGlobalHistory: async () => {
        const { data } = await api.get<ChatHistoryResponse>('/chat/global/history');
        return data;
    },

    sendGlobalMessage: async (message: string) => {
        const { data } = await api.post<SendChatMessageResponse>(
            '/chat/global/send',
            { message }
        );
        return data;
    },

    clearGlobalHistory: async () => {
        await api.delete('/chat/global/history');
    },

    // ═══ Note Chat ═══

    getNoteHistory: async (noteId: string) => {
        const { data } = await api.get<ChatHistoryResponse>(
            `/chat/notes/${noteId}/history`
        );
        return data;
    },

    sendNoteMessage: async (noteId: string, message: string) => {
        const { data } = await api.post<SendChatMessageResponse>(
            `/chat/notes/${noteId}/send`,
            { message }       // SendNoteChatMessageDto { Message }
        );
        return data;
    },

    clearNoteHistory: async (noteId: string) => {
        await api.delete(`/chat/notes/${noteId}/history`);
    },
};