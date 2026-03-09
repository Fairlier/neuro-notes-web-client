import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export const MainLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
            <AppSidebar
                isOpen={isSidebarOpen}
                toggle={() => setSidebarOpen(!isSidebarOpen)}
            />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300">
                <Outlet />
            </main>
        </div>
    );
};