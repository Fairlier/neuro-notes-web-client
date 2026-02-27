import axios, { type InternalAxiosRequestConfig } from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,           // refresh-токен летит в HttpOnly cookie
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── mutex для refresh ──────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token!);
        }
    });
    failedQueue = [];
};
// ────────────────────────────────────────────────────────────────────

// ── request: подставляем accessToken ────────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── response: обработка 401 + очередь ───────────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        const isUnauthorized = error.response?.status === 401;
        const isRetry = originalRequest._retry;
        const isRefreshUrl = originalRequest.url?.includes('/auth/refresh');

        if (isUnauthorized && !isRetry && !isRefreshUrl) {
            // ─── другой запрос уже обновляет токен — встаём в очередь ───
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((newToken) => {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                });
            }

            // ─── мы первые — запускаем refresh ─────────────────────────
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // cookie с refreshToken уйдёт автоматически (withCredentials)
                const { data } = await api.post('/auth/refresh');
                const newAccessToken: string = data.accessToken;

                localStorage.setItem('accessToken', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // разрешаем все ожидающие запросы с новым токеном
                processQueue(null, newAccessToken);

                return api(originalRequest);
            } catch (refreshError) {
                // отклоняем все ожидающие запросы
                processQueue(refreshError, null);

                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;