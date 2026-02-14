import api from './axios';
import type {
    NoteListResponse,
    CreateDirectTextRequest,
    CreateNoteResponse,
    NoteDetailsDto // <-- Добавили импорт
} from '@/types/notes';

export const notesApi = {
    getAll: async () => {
        const { data } = await api.get<NoteListResponse>('/notes');
        return data;
    },

    getById: async (id: string) => {
        const { data } = await api.get<NoteDetailsDto>(`/notes/${id}`);
        return data;
    },

    createDirectText: async (payload: CreateDirectTextRequest) => {
        const { data } = await api.post<CreateNoteResponse>('/notes/directText', payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/notes/${id}`);
    }
};