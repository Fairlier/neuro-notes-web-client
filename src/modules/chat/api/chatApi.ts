import api from '@/shared/api/axios';
import type { ChatHistoryResponse, SendChatMessageResponse } from '@/modules/chat';

export const chatApi = {
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

    getNoteHistory: async (noteId: string) => {
        const { data } = await api.get<ChatHistoryResponse>(
            `/chat/notes/${noteId}/history`
        );
        return data;
    },

    sendNoteMessage: async (noteId: string, message: string) => {
        const { data } = await api.post<SendChatMessageResponse>(
            `/chat/notes/${noteId}/send`,
            { message }
        );
        return data;
    },

    clearNoteHistory: async (noteId: string) => {
        await api.delete(`/chat/notes/${noteId}/history`);
    },
};