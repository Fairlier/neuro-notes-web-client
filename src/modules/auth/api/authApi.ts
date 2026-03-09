import api from '@/shared/api/axios';
import type { AuthResponse, LoginRequest, RegisterRequest, RegisterResponse } from '../types/authTypes.ts';

export const authApi = {
    login: async (data: LoginRequest) => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    register: async (data: RegisterRequest) => {
        const response = await api.post<RegisterResponse>('/auth/register', data);
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    }
};