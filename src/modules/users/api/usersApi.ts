import api from '@/shared/api/axios';
import type {
    UserProfileResponse,
    UpdateUserProfileCommand,
    UploadAvatarDto,
    UserAIProfileResponse,
    UpdateUserAIProfileCommand
} from '../types/usersTypes';

export const usersApi = {
    getProfile: async () => {
        const { data } = await api.get<UserProfileResponse>('/users/profile');
        return data;
    },

    updateProfile: async (payload: UpdateUserProfileCommand) => {
        await api.patch('/users/profile', payload);
    },

    uploadAvatar: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post<UploadAvatarDto>('/users/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    deleteAvatar: async () => {
        await api.delete('/users/avatar');
    },

    getAiProfile: async () => {
        const { data } = await api.get<UserAIProfileResponse>('/users/ai-profile');
        return data;
    },

    updateAiProfile: async (payload: UpdateUserAIProfileCommand) => {
        await api.patch('/users/ai-profile', payload);
    },

    resetAiProfile: async () => {
        await api.post('/users/ai-profile/reset');
    }
};