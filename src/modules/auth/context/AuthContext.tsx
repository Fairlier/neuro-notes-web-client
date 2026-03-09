import { createContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '../api/authApi';
import type { LoginRequest, RegisterRequest, User } from '../types/authTypes';

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Auth check failed", error);
                logout();
            } finally {
                setIsLoading(false);
            }
        };

        void checkAuth();
    }, []);

    const login = async (data: LoginRequest) => {
        const responseData = await authApi.login(data);
        localStorage.setItem('accessToken', responseData.accessToken);

        setUser({
            id: responseData.id,
            email: data.email
        });
        setIsAuthenticated(true);
    };

    const register = async (data: RegisterRequest) => {
        await authApi.register(data);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        setUser(null);
        setIsAuthenticated(false);
        authApi.logout().catch((err) => console.error(err));
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}