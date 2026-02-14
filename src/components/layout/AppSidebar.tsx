// src/components/layout/AppSidebar.tsx
import { Link, useLocation } from "react-router-dom"; // Убрали useNavigate
import { useAuth } from "@/features/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { notesApi } from "@/api/notes";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
    PanelLeftClose,
    Plus,
    Search,
    LogOut,
    FileText,
    Loader2
    // Убрали MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AppSidebarProps {
    isOpen: boolean;
    toggle: () => void;
}

export const AppSidebar = ({ isOpen, toggle }: AppSidebarProps) => {
    const { logout, user } = useAuth();
    const location = useLocation();

    // navigate нам тут не нужен, так как мы используем <Link>

    const { data, isLoading } = useQuery({
        queryKey: ['notes'],
        queryFn: notesApi.getAll,
    });

    const notes = data?.notes || [];

    return (
        <aside
            className={cn(
                "flex flex-col border-r border-zinc-200 bg-zinc-50/50 transition-all duration-300 ease-in-out relative flex-shrink-0",
                isOpen ? "w-[280px]" : "w-0 opacity-0 overflow-hidden border-none"
            )}
        >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-3 border-b border-zinc-200/50">
                <div className="flex items-center gap-2 font-bold text-zinc-800 select-none">
                    <div className="h-6 w-6 bg-blue-600 rounded-md flex items-center justify-center">
                        <FileText className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span>NeuroNotes</span>
                </div>
                <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8 text-zinc-400 hover:text-zinc-700">
                    <PanelLeftClose className="h-4 w-4" />
                </Button>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-1">
                <Link to="/">
                    <Button
                        variant={location.pathname === "/" ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2 h-10 font-normal text-zinc-600"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Новая заметка</span>
                    </Button>
                </Link>

                <Link to="/search">
                    <Button
                        variant={location.pathname === "/search" ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2 h-10 font-normal text-zinc-600"
                    >
                        <Search className="h-4 w-4" />
                        <span>Поиск</span>
                    </Button>
                </Link>
            </div>

            <Separator className="bg-zinc-200" />

            {/* List */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    История
                </div>

                <ScrollArea className="flex-1 px-2">
                    {isLoading ? (
                        <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-zinc-400"/></div>
                    ) : notes.length === 0 ? (
                        <div className="text-center text-zinc-400 text-xs py-4">Нет заметок</div>
                    ) : (
                        <div className="space-y-0.5">
                            {notes.map((note) => (
                                <Link key={note.id} to={`/notes/${note.id}`}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start h-auto py-2 px-2 text-left font-normal",
                                            location.pathname === `/notes/${note.id}`
                                                ? "bg-zinc-200/60 text-zinc-900"
                                                : "text-zinc-600 hover:bg-zinc-200/40"
                                        )}
                                    >
                                        <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                                            <span className="truncate text-sm">{note.title || "Без названия"}</span>
                                            <span className="text-[10px] text-zinc-400">
                                                {format(new Date(note.createdAt), "d MMM", { locale: ru })}
                                            </span>
                                        </div>
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Profile */}
            <div className="p-3 border-t border-zinc-200 bg-zinc-50">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-200/50 transition-colors group cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-700 truncate">{user?.email}</p>
                        <div
                            onClick={logout}
                            className="text-xs text-zinc-400 hover:text-red-500 flex items-center gap-1 mt-0.5"
                        >
                            <LogOut className="h-3 w-3" /> Выйти
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}