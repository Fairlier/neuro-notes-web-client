import api from '@/shared/api/axios';
import type { SystemConfigResponse } from '../types/systemTypes';

export const systemApi = {
    getConfig: async () => {
        const { data } = await api.get<SystemConfigResponse>('/system/config');
        return data;
    }
};