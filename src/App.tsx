// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { TabsProvider } from "@/features/tabs/TabsContext";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import NoteWorkspace from "@/pages/dashboard/NoteWorkspace";
import HomePage from "@/pages/dashboard/HomePage.tsx";
import GlobalChatPage from "@/pages/chat/GlobalChatPage.tsx";
import SearchPage from "@/pages/search/SearchPage.tsx"; // 👈 Добавляем импорт

function App() {
    return (
        <AuthProvider>
            <TabsProvider>
                <Routes>
                    {/* --- Публичные маршруты --- */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* --- Приватные маршруты --- */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/notes/new" element={<NoteWorkspace />} />
                            <Route path="/notes/:id" element={<NoteWorkspace />} />

                            {/* 👇 ОБНОВЛЁННЫЙ МАРШРУТ ПОИСКА */}
                            <Route path="/search" element={<SearchPage />} />

                            <Route path="chat" element={<GlobalChatPage />} />
                        </Route>
                    </Route>

                    {/* --- Ловушка для неизвестных маршрутов --- */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </TabsProvider>
        </AuthProvider>
    );
}

export default App;