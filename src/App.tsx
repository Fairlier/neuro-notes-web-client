import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import { Button } from "@/components/ui/button";

// Временный компонент Dashboard для проверки входа
const Dashboard = () => {
    const { logout, user } = useAuth();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-100">
            <div className="bg-white p-10 rounded-xl shadow-md text-center">
                <h1 className="text-3xl font-bold mb-4">Мои заметки</h1>
                <p className="mb-6 text-zinc-600">
                    Вы авторизованы как: <span className="font-semibold">{user?.email || "Пользователь"}</span>
                </p>
                <Button variant="destructive" onClick={logout}>Выйти</Button>
            </div>
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Публичные маршруты */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Приватные маршруты (доступны только с токеном) */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Dashboard />} />
                </Route>

                {/* Любой неизвестный путь перенаправляем на главную */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;