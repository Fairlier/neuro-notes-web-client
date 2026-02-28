// ── Enums (строки, как возвращает бэкенд через .ToString()) ──

export type NoteStatus = 'Pending' | 'Raw' | 'Structured' | 'Summarized' | 'Failed';
export type NoteSourceType = 'DirectText' | 'AudioFile';
export type NoteCategory = 'Finance' | 'Ideas' | 'Personal' | 'Reference' | 'Study' | 'Work' | 'Other';
export type SearchMode = 'Semantic' | 'Title';
export type NoteSortBy = 'CreatedAt' | 'UpdatedAt' | 'Title' | 'Status' | 'SourceType' | 'Category';
export type SortDirection = 'Ascending' | 'Descending';

// ── List ──

export interface NoteListItemDto {
    id: string;
    title: string;
    status: NoteStatus;
    sourceType: NoteSourceType;
    isProcessing: boolean;
    category: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface NoteListResponse {
    notes: NoteListItemDto[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

// ── Query params для GET /notes ──

export interface GetNotesParams {
    searchTerm?: string;
    searchMode?: SearchMode;
    status?: NoteStatus;
    sourceType?: NoteSourceType;
    category?: NoteCategory;
    createdFrom?: string;
    createdTo?: string;
    updatedFrom?: string;
    updatedTo?: string;
    sortBy?: NoteSortBy;
    sortDirection?: SortDirection;
    page?: number;
    pageSize?: number;
}

// ── Details ──

export interface NoteDetailsDto {
    id: string;
    title: string;
    sourceType: NoteSourceType;
    category: string | null;
    rawText: string | null;
    structuredText: string | null;
    summaryText: string | null;
    status: NoteStatus;
    isProcessing: boolean;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string | null;
    hasSourceFile: boolean;
}

// ── Create ──

export interface CreateDirectTextRequest {
    title: string;
    content: string;
}

export interface CreateNoteResponse {
    id: string;
}

// ── Update ──

export interface UpdateNoteRequest {
    title?: string;
    rawText?: string;
    structuredText?: string;
    summaryText?: string;
    category?: string;
}