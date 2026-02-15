import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { notesApi } from "@/api/notes";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
    Search,
    LogOut,
    FileText,
    Loader2,
    Settings,
    User,
    ChevronRight,
    MessageSquare // Иконка чата
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppSidebarProps {
    isOpen: boolean;
    toggle: () => void;
}

export const AppSidebar = ({ isOpen, toggle }: AppSidebarProps) => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const { data, isLoading } = useQuery({
        queryKey: ['notes'],
        queryFn: notesApi.getAll,
    });

    const notes = data?.notes || [];

    return (
        <aside
            className={cn(
                "flex flex-col border-r border-zinc-200 bg-zinc-50/50 transition-all duration-300 ease-in-out relative flex-shrink-0 z-30",
                isOpen ? "w-[280px]" : "w-[70px]"
            )}
        >
            {/* 1. ШАПКА */}
            <div className={cn("flex items-center h-14 px-3 flex-shrink-0 transition-all duration-300", isOpen ? "justify-between" : "justify-center")}>
                <div className={cn(
                    "flex items-center gap-2 font-bold text-zinc-800 select-none overflow-hidden transition-all duration-300",
                    isOpen ? "w-auto opacity-100" : "w-0 opacity-0 hidden"
                )}>
                    <div className="h-6 w-6 bg-blue-600 rounded-md flex items-center justify-center shrink-0">
                        <FileText className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="whitespace-nowrap tracking-tight">NeuroNotes</span>
                </div>

                <Button variant="ghost" size="icon" onClick={toggle} className="text-zinc-400 hover:text-zinc-700 h-8 w-8">
                    {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                </Button>
            </div>

            {/* 2. ДЕЙСТВИЯ */}
            <div className="p-3 flex flex-col gap-2 flex-shrink-0">

                {/* --- ССЫЛКА НА ОБЩИЙ ЧАТ --- */}
                <Link to="/chat" className="block">
                    <Button
                        // Подсветка, если мы на странице чата
                        variant={location.pathname === "/chat" ? "secondary" : "ghost"}
                        className={cn(
                            "h-10 transition-all duration-300 overflow-hidden border border-transparent",
                            location.pathname === "/chat"
                                ? "bg-zinc-200 text-zinc-900"
                                : "hover:bg-indigo-50 hover:text-indigo-600 text-zinc-600",
                            isOpen ? "w-full justify-start gap-2 px-4" : "w-10 justify-center px-0 mx-auto"
                        )}
                        title={!isOpen ? "Общий чат" : undefined}
                    >
                        <MessageSquare className="h-5 w-5 shrink-0" />
                        <span className={cn(
                            "truncate transition-all duration-300",
                            isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
                        )}>
                            Общий чат
                        </span>
                    </Button>
                </Link>

                <Link to="/" className="block">
                    <Button
                        variant={location.pathname === "/" ? "secondary" : "ghost"}
                        className={cn(
                            "h-10 transition-all duration-300 overflow-hidden border border-transparent",
                            location.pathname === "/" ? "bg-zinc-200 text-zinc-900" : "hover:bg-zinc-200/50 text-zinc-600",
                            isOpen ? "w-full justify-start gap-2 px-4" : "w-10 justify-center px-0 mx-auto"
                        )}
                        title={!isOpen ? "Новая заметка" : undefined}
                    >
                        <Plus className="h-5 w-5 shrink-0" />
                        <span className={cn(
                            "truncate transition-all duration-300",
                            isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
                        )}>
                            Новая заметка
                        </span>
                    </Button>
                </Link>

                <Link to="/search" className="block">
                    <Button
                        variant="outline"
                        className={cn(
                            "h-10 transition-all duration-300 overflow-hidden bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-500",
                            isOpen ? "w-full justify-start gap-2 px-4" : "w-10 justify-center px-0 mx-auto border-transparent bg-transparent"
                        )}
                        title={!isOpen ? "Поиск" : undefined}
                    >
                        <Search className="h-5 w-5 shrink-0" />
                        <span className={cn(
                            "truncate transition-all duration-300 font-normal",
                            isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
                        )}>
                            Поиск
                        </span>
                    </Button>
                </Link>
            </div>

            <Separator className="bg-zinc-200 w-auto mx-3 mt-2" />

            {/* 3. СПИСОК ЗАМЕТОК (Без изменений) */}
            <ScrollArea className="flex-1 py-4 px-3">
                {isOpen && (
                    <div className="px-2 mb-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider animate-in fade-in duration-300">
                        История
                    </div>
                )}
                {isOpen ? (
                    <>
                        {isLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-zinc-400"/></div>
                        ) : notes.length === 0 ? (
                            <div className="text-center text-zinc-400 text-xs py-4">Нет заметок</div>
                        ) : (
                            <div className="space-y-0.5 animate-in fade-in duration-300">
                                {notes.map((note) => (
                                    <Link key={note.id} to={`/notes/${note.id}`}>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start h-auto py-2 px-2 text-left font-normal overflow-hidden",
                                                location.pathname === `/notes/${note.id}`
                                                    ? "bg-zinc-200/60 text-zinc-900"
                                                    : "text-zinc-600 hover:bg-zinc-200/40"
                                            )}
                                        >
                                            <div className="flex flex-col gap-0.5 w-full min-w-0">
                                                <span className="truncate text-sm font-medium">{note.title || "Без названия"}</span>
                                                <span className="text-[10px] text-zinc-400 truncate">
                                                    {format(new Date(note.createdAt), "d MMM", { locale: ru })}
                                                </span>
                                            </div>
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-full w-full" />
                )}
            </ScrollArea>

            {/* 4. ПОДВАЛ (Без изменений) */}
            <div className="p-3 border-t border-zinc-200 bg-zinc-50/50 flex flex-col gap-1 flex-shrink-0">
                <Link to="/settings" className="block">
                    <Button
                        variant="ghost"
                        className={cn(
                            "h-10 transition-all duration-300 hover:bg-zinc-200/50 text-zinc-600",
                            isOpen ? "w-full justify-start gap-3 px-2" : "w-10 justify-center px-0 mx-auto"
                        )}
                        title={!isOpen ? "Настройки" : undefined}
                    >
                        <Settings className="h-5 w-5 shrink-0" />
                        <span className={cn(
                            "truncate transition-all duration-300",
                            isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
                        )}>
                            Настройки
                        </span>
                    </Button>
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full hover:bg-zinc-200/50 transition-all duration-300 group",
                                isOpen ? "justify-start px-2 h-12 gap-3" : "justify-center px-0 h-10 w-10 rounded-full mx-auto"
                            )}
                        >
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shrink-0 text-white font-semibold text-xs shadow-sm ring-2 ring-white">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            {isOpen && (
                                <>
                                    <div className="flex flex-col items-start text-left overflow-hidden min-w-0 flex-1 animate-in fade-in duration-200">
                                        <span className="text-sm font-medium text-zinc-900 truncate w-full">
                                            {user?.email}
                                        </span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0" />
                                </>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 ml-2" side={isOpen ? "right" : "right"} sideOffset={5}>
                        <DropdownMenuItem className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Профиль</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            onClick={logout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Выйти</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
};