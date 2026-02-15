import api from './axios';

export interface ChatMessageDto {
    id: string;
    role: 'User' | 'Assistant';
    content: string;
    createdAt: string;
}

export interface ChatHistoryResponse {
    sessionId: string;
    relatedNoteId?: string;
    title: string;
    messages: ChatMessageDto[];
}

export interface SendMessageRequest {
    noteId?: string | null;
    message: string;
}

export const chatApi = {
    getHistory: async (noteId?: string | null) => {
        const params = noteId ? { noteId } : {};
        const { data } = await api.get<ChatHistoryResponse>('/chat/history', { params });
        return data;
    },

    // Отправить сообщение
    sendMessage: async (payload: SendMessageRequest) => {
        const { data } = await api.post('/chat/send', payload);
        return data;
    },

    // Очистить историю
    clearHistory: async (noteId?: string | null) => {
        const params = noteId ? { noteId } : {};
        await api.delete('/chat/history', { params });
    }
};