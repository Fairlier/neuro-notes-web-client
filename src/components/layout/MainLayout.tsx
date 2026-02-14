import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import {
    LogOut,
    LayoutDashboard,
    Settings,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export const MainLayout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-zinc-50 overflow-hidden">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r flex flex-col shadow-sm z-10">
                <div className="p-6 border-b flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900">
                        NeuroNotes
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/">
                        <Button
                            variant={isActive("/") ? "secondary" : "ghost"}
                            className={cn("w-full justify-start", isActive("/") && "bg-zinc-100 font-medium")}
                        >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Мои заметки
                        </Button>
                    </Link>

                    <Button variant="ghost" disabled className="w-full justify-start text-zinc-400">
                        <Settings className="mr-2 h-4 w-4" />
                        Настройки (Скоро)
                    </Button>
                </nav>

                <div className="p-4 border-t bg-zinc-50/50">
                    <div className="mb-4 px-2">
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Аккаунт</p>
                        <p className="text-sm font-semibold truncate text-zinc-800" title={user?.email}>
                            {user?.email}
                        </p>
                    </div>
                    <Button variant="outline" className="w-full border-zinc-200 hover:bg-zinc-100 hover:text-red-600" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Выйти
                    </Button>
                </div>
            </aside>

            {/* CONTENT */}
            <main className="flex-1 overflow-auto p-8 relative">
                <Outlet />
            </main>
        </div>
    );
};