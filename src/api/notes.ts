import api from './axios';
import type {
    NoteListResponse,
    GetNotesParams,
    CreateDirectTextRequest,
    CreateNoteResponse,
    NoteDetailsDto,
    UpdateNoteRequest,
} from '@/types/notes';

export const notesApi = {
    // ── GET /notes?status=...&searchTerm=...&page=...  ──
    getAll: async (params?: GetNotesParams) => {
        const { data } = await api.get<NoteListResponse>('/notes', { params });
        return data;
    },

    // ── GET /notes/:id ──
    getById: async (id: string) => {
        const { data } = await api.get<NoteDetailsDto>(`/notes/${id}`);
        return data;
    },

    // ── POST /notes/directText ──
    createDirectText: async (payload: CreateDirectTextRequest) => {
        const { data } = await api.post<CreateNoteResponse>('/notes/directText', payload);
        return data;
    },

    // ── POST /notes/audioFile  (multipart/form-data) ──
    createFromAudio: async (title: string, file: File) => {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);

        const { data } = await api.post<CreateNoteResponse>('/notes/audioFile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    // ── PATCH /notes/:id  → 204 ──
    update: async (id: string, payload: UpdateNoteRequest) => {
        await api.patch(`/notes/${id}`, payload);
    },

    // ── DELETE /notes/:id  → 204 ──
    delete: async (id: string) => {
        await api.delete(`/notes/${id}`);
    },

    // ── POST /notes/:id/transcribe  → 204 ──
    transcribe: async (id: string) => {
        await api.post(`/notes/${id}/transcribe`);
    },

    // ── POST /notes/:id/structure  → 204 ──
    structure: async (id: string) => {
        await api.post(`/notes/${id}/structure`);
    },

    // ── POST /notes/:id/summarize  → 204 ──
    summarize: async (id: string) => {
        await api.post(`/notes/${id}/summarize`);
    },

    // ── GET /notes/:id/file?download=true  → blob ──
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