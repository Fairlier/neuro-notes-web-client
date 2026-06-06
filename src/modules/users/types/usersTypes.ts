export interface UserProfileResponse {
    nickname: string;
    interfaceLanguage: string;
    theme: string;
    avatarUrl?: string | null;
}

export interface UpdateUserProfileCommand {
    nickname?: string;
    interfaceLanguage?: string;
    theme?: string;
}

export interface UploadAvatarDto {
    avatarUrl: string;
}

export interface AIOperationSettingsDto {
    targetLanguage?: string | null;
    customPrompt?: string | null;
    useCustomPrompt: boolean;
    isAutomatic?: boolean;
}

export interface UserAIProfileResponse {
    aiOperationLanguage: string;
    transcriptionProvider: string;
    structureProvider: string;
    summaryProvider: string;
    globalChatProvider: string;
    noteChatProvider: string;
    transcription?: AIOperationSettingsDto;
    structuring?: AIOperationSettingsDto;
    summarization?: AIOperationSettingsDto;
    globalChat?: AIOperationSettingsDto;
    noteChat?: AIOperationSettingsDto;

    classification?: AIOperationSettingsDto;

    providerSettings: Record<string, Record<string, string>>;
}

export type UpdateUserAIProfileCommand = Partial<UserAIProfileResponse>;