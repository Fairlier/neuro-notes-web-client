import { createContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../api/authApi';
import type { LoginRequest, RegisterRequest, User } from '@/modules/auth';

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

interface JwtPayload {
    sub: string;
    email: string;
    name: string;
    jti: string;
    exp: number;
    iss: string;
    aud: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const restoreAuth = () => {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const decoded = jwtDecode<JwtPayload>(token);

                setUser({
                    id: decoded.sub,
                    email: decoded.email
                });
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Failed to decode token:', error);
                localStorage.removeItem('accessToken');
            } finally {
                setIsLoading(false);
            }
        };

        restoreAuth();
    }, []);

    const login = async (data: LoginRequest) => {
        const response = await authApi.login(data);

        localStorage.setItem('accessToken', response.accessToken);

        setUser({
            id: response.id,
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

        authApi.logout().catch((error) => {
            console.error('Logout API error:', error);
        });
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}