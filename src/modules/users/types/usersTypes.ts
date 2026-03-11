export interface UserProfileResponse {
    nickname: string;
    interfaceLanguage: string;
    avatarUrl?: string | null;
}

export interface UpdateUserProfileCommand {
    nickname?: string;
    interfaceLanguage?: string;
}

export interface UploadAvatarDto {
    avatarUrl: string;
}