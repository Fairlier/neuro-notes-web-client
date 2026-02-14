export const NoteStatus = {
    PendingResource: 'PendingResource',
    Processing: 'Processing',
    Failed: 'Failed',
    Raw: 'Raw',
    Structured: 'Structured',
    Completed: 'Completed'
} as const;

export type NoteStatus = typeof NoteStatus[keyof typeof NoteStatus];

export const NoteSourceType = {
    DirectText: 'DirectText',
    TextFile: 'TextFile',
    AudioFile: 'AudioFile'
} as const;

export type NoteSourceType = typeof NoteSourceType[keyof typeof NoteSourceType];

export interface NoteListItemDto {
    id: string;
    title: string;
    status: NoteStatus;
    sourceType: NoteSourceType;
    createdAt: string;
    updatedAt?: string;
}

export interface NoteDetailsDto {
    id: string;
    title: string;
    sourceType: NoteSourceType;
    status: NoteStatus;

    rawText?: string;
    structuredText?: string;
    summaryText?: string;

    createdAt: string;
    updatedAt?: string;
}

export interface NoteListResponse {
    notes: NoteListItemDto[];
}

export interface CreateDirectTextRequest {
    title: string;
    content: string;
}

export interface CreateNoteResponse {
    id: string;
}