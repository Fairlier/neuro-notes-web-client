import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/sonner"

// Клиент для кэширования запросов
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1, // Повторять запрос 1 раз при ошибке
            refetchOnWindowFocus: false, // Не обновлять при переключении вкладок
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
                <Toaster /> {/* Сюда будут прилетать уведомления */}
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>,
)