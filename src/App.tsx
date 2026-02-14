import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import HomePage from "@/pages/dashboard/HomePage";
import NoteDetailsPage from "@/pages/dashboard/NoteDetailsPage";

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                        {/* Главная: Создание новой заметки (как в Arena) */}
                        <Route path="/" element={<HomePage />} />

                        {/* Просмотр конкретной заметки */}
                        <Route path="/notes/:id" element={<NoteDetailsPage />} />

                        {/* Поиск */}
                        <Route path="/search" element={<div className="p-8">Страница поиска (в разработке)</div>} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;