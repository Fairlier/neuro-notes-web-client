import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '@/api/axios';
import type { AuthResponse, LoginRequest, RegisterRequest, RegisterResponse, User } from '@/types/auth';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        const response = await api.post<AuthResponse>('/auth/login', data);

        localStorage.setItem('accessToken', response.data.accessToken);

        setUser({
            id: response.data.id,
            email: data.email
        });

        setIsAuthenticated(true);
    };

    const register = async (data: RegisterRequest) => {
        await api.post<RegisterResponse>('/auth/register', data);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        setUser(null);
        setIsAuthenticated(false);
        api.post('/auth/logout').catch((err) => console.error(err));
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};