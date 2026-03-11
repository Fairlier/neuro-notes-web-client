export interface FileConfigDto {
    supportedExtensions: string[];
    supportedContentTypes: string[];
    maxUploadSizeBytes: number;
    maxUploadSizeFormatted: string;
}

export interface ProvidersConfigDto {
    transcription: string[];
    chat: string[];
    structure: string[];
    summary: string[];
}

export interface SystemConfigResponse {
    audio: FileConfigDto;
    image: FileConfigDto;
    providers: ProvidersConfigDto;
}