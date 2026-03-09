import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export const MainLayout = () => {
    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
            <AppSidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
};