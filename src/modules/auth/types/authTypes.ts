export interface User {
    id: string;
    email: string;
}

export interface AuthResponse {
    id: string;
    accessToken: string;
    refreshToken?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface RegisterResponse {
    id: string;
}