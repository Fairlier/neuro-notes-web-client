import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const MainLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen w-full bg-white text-zinc-900 overflow-hidden font-sans">

            {/* ЛЕВАЯ ПАНЕЛЬ */}
            <AppSidebar
                isOpen={isSidebarOpen}
                toggle={() => setSidebarOpen(!isSidebarOpen)}
            />

            {/* ОСНОВНОЙ КОНТЕНТ */}
            {/* Здесь будет рендериться GlobalChatPage, NoteWorkspace и т.д. */}
            <main className="flex-1 flex flex-col relative min-w-0 bg-white transition-all duration-300 ease-in-out">
                <Outlet />
            </main>
        </div>
    );
};