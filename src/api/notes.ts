import api from './axios';
import type {
    NoteListResponse,
    CreateDirectTextRequest,
    CreateNoteResponse,
    NoteDetailsDto
} from '@/types/notes';

export interface UpdateNoteRequest {
    title?: string;
    rawText?: string;
    structuredText?: string;
    summaryText?: string;
}

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

    update: async (id: string, payload: UpdateNoteRequest) => {
        const { data } = await api.patch<void>(`/notes/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/notes/${id}`);
    },

    transcribe: async (id: string) => {
        await api.post(`/notes/${id}/transcribe`);
    },

    structure: async (id: string) => {
        await api.post(`/notes/${id}/structure`);
    },

    summarize: async (id: string) => {
        await api.post(`/notes/${id}/summarize`);
    }
};