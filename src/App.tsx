import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
// Импортируем провайдер вкладок
import { TabsProvider } from "@/features/tabs/TabsContext";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import HomePage from "@/pages/dashboard/HomePage";
import NoteWorkspace from "@/pages/dashboard/NoteWorkspace";

function App() {
    return (
        <AuthProvider>
            {/* Оборачиваем роуты в TabsProvider, чтобы контекст был доступен внутри NoteWorkspace */}
            <TabsProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/notes/:id" element={<NoteWorkspace />} />
                            <Route path="/search" element={<div className="p-8">Страница поиска (в разработке)</div>} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </TabsProvider>
        </AuthProvider>
    );
}

export default App;