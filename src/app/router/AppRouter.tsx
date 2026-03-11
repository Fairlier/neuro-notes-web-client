import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, MainLayout, TabsProvider } from "@/modules/layout";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import NoteWorkspace from "@/pages/dashboard/NoteWorkspace";
import GlobalChatPage from "@/pages/chat/GlobalChatPage";
import ProfilePage from "@/pages/profile/ProfilePage.tsx";

export const AppRouter = () => {
    return (
        <Routes>
            {/* --- Публичные маршруты --- */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* --- Приватные маршруты --- */}
            <Route element={<ProtectedRoute />}>
                {/* TabsProvider оборачивает MainLayout, чтобы вкладки работали по всему интерфейсу */}
                <Route element={
                    <TabsProvider>
                        <MainLayout />
                    </TabsProvider>
                }>
                    {/* Главная страница (Создание заметки и поиск) */}
                    <Route index element={<NoteWorkspace />} />

                    {/* Открытая заметка */}
                    <Route path="/notes/:id" element={<NoteWorkspace />} />

                    {/* Глобальный чат */}
                    <Route path="/chat" element={<GlobalChatPage />} />

                    {/* Маршрут профиля */}
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Fallback для неизвестных маршрутов */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Route>
        </Routes>
    );
};