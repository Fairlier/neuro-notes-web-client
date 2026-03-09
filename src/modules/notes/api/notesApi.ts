import api from '@/shared/api/axios';
import type {
    NoteListResponse,
    GetNotesParams,
    CreateDirectTextRequest,
    CreateNoteResponse,
    NoteDetailsDto,
    UpdateNoteRequest,
} from '../types/notesTypes';

export const notesApi = {
    getAll: async (params?: GetNotesParams) => {
        const { data } = await api.get<NoteListResponse>('/notes', { params });
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

    createFromAudio: async (title: string, file: File) => {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);

        const { data } = await api.post<CreateNoteResponse>('/notes/audioFile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    update: async (id: string, payload: UpdateNoteRequest) => {
        await api.patch(`/notes/${id}`, payload);
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
    },

    getSourceFile: async (id: string, download = false) => {
        const { data, headers } = await api.get(`/notes/${id}/file`, {
            params: { download },
            responseType: 'blob',
        });
        return {
            blob: data as Blob,
            contentType: headers['content-type'] ?? 'application/octet-stream',
        };
    },
};