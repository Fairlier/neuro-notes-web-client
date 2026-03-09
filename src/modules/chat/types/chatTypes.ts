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