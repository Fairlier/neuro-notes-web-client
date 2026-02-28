// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { TabsProvider } from "@/features/tabs/TabsContext";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import NoteWorkspace from "@/pages/dashboard/NoteWorkspace";
import GlobalChatPage from "@/pages/chat/GlobalChatPage";
import SearchPage from "@/pages/search/SearchPage";

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* --- Публичные маршруты --- */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* --- Приватные маршруты --- */}
                <Route element={<ProtectedRoute />}>
                    {/* TabsProvider ВНУТРИ MainLayout чтобы иметь доступ к navigate */}
                    <Route element={
                        <TabsProvider>
                            <MainLayout />
                        </TabsProvider>
                    }>
                        {/* Главная страница - редирект на /notes/new */}
                        <Route path="/" element={<Navigate to="/notes/new" replace />} />

                        {/* Заметки */}
                        <Route path="/notes/new" element={<NoteWorkspace />} />
                        <Route path="/notes/:id" element={<NoteWorkspace />} />

                        {/* Поиск */}
                        <Route path="/search" element={<SearchPage />} />

                        {/* Чат */}
                        <Route path="/chat" element={<GlobalChatPage />} />
                    </Route>
                </Route>

                {/* --- Ловушка для неизвестных маршрутов --- */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;