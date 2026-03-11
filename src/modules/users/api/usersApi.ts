import api from '@/shared/api/axios';
import type { UserProfileResponse, UpdateUserProfileCommand, UploadAvatarDto } from '../types/usersTypes';

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
    }
};