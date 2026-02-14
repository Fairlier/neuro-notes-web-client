import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar"; // Создадим ниже
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MainLayout = () => {
    // Состояние свернутости панели
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen w-full bg-white text-zinc-900 overflow-hidden font-sans">

            {/* ЛЕВАЯ ПАНЕЛЬ (Вынесена в отдельный компонент) */}
            <AppSidebar
                isOpen={isSidebarOpen}
                toggle={() => setSidebarOpen(!isSidebarOpen)}
            />

            {/* ОСНОВНОЙ КОНТЕНТ */}
            <main className="flex-1 flex flex-col relative min-w-0 bg-white">

                {/* Кнопка открытия меню (видна только если панель скрыта) */}
                {!isSidebarOpen && (
                    <div className="absolute top-3 left-3 z-50">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(true)}
                            className="text-zinc-500 hover:bg-zinc-100"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                )}

                {/* Здесь отрисовываются: HomePage, SearchPage или NoteDetailsPage */}
                <Outlet />
            </main>
        </div>
    );
};