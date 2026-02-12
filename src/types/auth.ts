export interface User {
    id: string;
    email: string;
}

export interface AuthResponse { // LoginUserResponse
    id: string;
    accessToken: string;
    refreshToken?: string;
}

export interface LoginRequest { // LoginUserCommand
    email: string;
    password: string;
}

export interface RegisterRequest { // RegisterUserCommand
    email: string;
    password: string;
}

export interface RegisterResponse { // RegisterUserResponse
    id: string;
}