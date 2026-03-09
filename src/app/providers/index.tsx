import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/modules/theme';
import { AuthProvider } from '@/modules/auth';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

export const AppProviders = ({ children }: { children: ReactNode }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {/* Router должен быть выше остальных, чтобы хуки навигации работали внутри провайдеров */}
            <BrowserRouter>
                {/* Подключаем нашу новую систему тем */}
                <ThemeProvider defaultTheme="light" storageKey="neuronotes-theme">
                    {/* Авторизация */}
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </ThemeProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
};