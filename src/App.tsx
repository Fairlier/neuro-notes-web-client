import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
// Импортируем провайдер вкладок
import { TabsProvider } from "@/features/tabs/TabsContext";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import NoteWorkspace from "@/pages/dashboard/NoteWorkspace";
import HomePage from "@/pages/dashboard/HomePage.tsx";

function App() {
    return (
        <AuthProvider>
            {/* Оборачиваем роуты в TabsProvider, чтобы контекст был доступен внутри NoteWorkspace и Sidebar */}
            <TabsProvider>
                <Routes>
                    {/* --- Публичные маршруты --- */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* --- Приватные маршруты --- */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<MainLayout />}>

                            <Route path="/" element={<HomePage />} />

                            {/* Маршрут для создания новой заметки (открывает NoteWorkspace в режиме создания) */}
                            <Route path="/notes/new" element={<NoteWorkspace />} />

                            {/* Просмотр конкретной заметки по ID */}
                            <Route path="/notes/:id" element={<NoteWorkspace />} />

                            {/* Страница поиска */}
                            <Route path="/search" element={<div className="p-8 text-zinc-500">Страница поиска (в разработке)</div>} />

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