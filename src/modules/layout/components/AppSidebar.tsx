import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { useTheme } from "@/modules/theme";
import { useTabs } from "../hooks/useTabs";
import { useQuery } from "@tanstack/react-query";
import { notesApi } from "@/modules/notes";
import { usersApi } from "@/modules/users";
import { cn } from "@/shared/lib/utils";
import type { NoteListItemDto, SortDirection } from "@/modules/notes/types/notesTypes";
import {
    PanelLeftClose, PanelLeftOpen, Search, FileText,
    Loader2, Settings, ChevronRight,
    MessageCircle, ArrowDown, ArrowUp, Sun, Moon
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { SidebarNoteCard } from "./SidebarNoteCard";

interface AppSidebarProps {
    isOpen: boolean;
    toggle: () => void;
}

export const AppSidebar = ({ isOpen, toggle }: AppSidebarProps) => {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const { openNoteInCurrentTab, tabs, activeTabId } = useTabs();

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortDirection, setSortDirection] = useState<SortDirection>("Descending");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data, isLoading } = useQuery({
        queryKey: ['notes', 'sidebar', debouncedSearch, sortDirection],
        queryFn: () => notesApi.getAll({
            pageSize: 50,
            sortBy: 'UpdatedAt',
            sortDirection: sortDirection,
            searchTerm: debouncedSearch || undefined,
            searchMode: 'Title'
        }),
        refetchInterval: (query) => {
            const notesList = query.state.data?.notes || [];
            const hasProcessingNotes = notesList.some(
                note => note.isProcessing || note.status === 'Pending'
            );
            return hasProcessingNotes ? 3000 : false;
        },
    });

    const { data: profile } = useQuery({
        queryKey: ['userProfile'],
        queryFn: usersApi.getProfile,
        enabled: !!user,
    });

    const notes = data?.notes || [];

    const handleNoteClick = (e: React.MouseEvent, noteId: string, noteTitle: string) => {
        e.preventDefault();
        openNoteInCurrentTab(noteId, noteTitle || "Без названия");
    };

    const handleNotesClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (location.pathname === '/' || location.pathname.startsWith('/notes')) return;

        const activeTab = tabs.find(t => t.id === activeTabId);
        navigate(activeTab ? `/notes/${activeTab.id}` : '/');
    };

    const isNotesActive = location.pathname === '/' || location.pathname.startsWith('/notes');
    const displayName = profile?.nickname || user?.email || 'User';

    return (
        <aside
            className={cn(
                "flex flex-col border-r border-border bg-muted/30 transition-[width] duration-300 ease-in-out relative flex-shrink-0 z-30 overflow-hidden",
                isOpen ? "w-[280px]" : "w-[70px]"
            )}
        >
            {/* 1. ШАПКА */}
            <div className="flex items-center h-16 flex-shrink-0 w-full relative overflow-hidden">
                <div className={cn(
                    "absolute left-[15px] flex items-center gap-2 font-bold text-foreground select-none transition-all duration-300",
                    isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
                )}>
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-primary-foreground font-bold">N</span>
                    </div>
                    <span className="whitespace-nowrap tracking-tight text-lg">NeuroNotes</span>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggle}
                    className={cn(
                        "absolute transition-all duration-300 h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground shrink-0",
                        isOpen ? "right-[15px]" : "left-[15px]"
                    )}
                >
                    {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                </Button>
            </div>

            {/* 2. ДЕЙСТВИЯ */}
            <div className="px-[15px] pb-3 flex flex-col items-center gap-2 flex-shrink-0 w-full">
                <Link to="/chat" className={cn("flex transition-all duration-300", isOpen ? "w-full" : "w-10")}>
                    <Button
                        variant={location.pathname === "/chat" ? "secondary" : "ghost"}
                        className={cn(
                            "h-10 w-full transition-all duration-300 overflow-hidden border border-transparent rounded-lg flex",
                            location.pathname === "/chat"
                                ? "bg-background text-foreground shadow-sm border-border"
                                : "hover:bg-background/50 text-muted-foreground hover:text-foreground",
                            isOpen ? "justify-start px-3 gap-3" : "justify-center p-0 gap-0"
                        )}
                        title={!isOpen ? "Общий чат" : undefined}
                    >
                        <MessageCircle className="h-5 w-5 shrink-0" />
                        <span className={cn(
                            "whitespace-nowrap transition-all duration-300 font-medium",
                            isOpen ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0 hidden"
                        )}>
                            Общий чат
                        </span>
                    </Button>
                </Link>

                <Button
                    variant={isNotesActive ? "secondary" : "ghost"}
                    onClick={handleNotesClick}
                    className={cn(
                        "h-10 transition-all duration-300 overflow-hidden border border-transparent rounded-lg flex",
                        isNotesActive
                            ? "bg-background text-foreground shadow-sm border-border"
                            : "hover:bg-background/50 text-muted-foreground hover:text-foreground",
                        isOpen ? "w-full justify-start px-3 gap-3" : "w-10 justify-center p-0 gap-0 mx-auto"
                    )}
                    title={!isOpen ? "Workspace" : undefined}
                >
                    <FileText className="h-5 w-5 shrink-0" />
                    <span className={cn(
                        "whitespace-nowrap transition-all duration-300 font-medium",
                        isOpen ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0 hidden"
                    )}>
                        Workspace
                    </span>
                </Button>
            </div>

            <Separator className={cn("bg-border transition-all duration-300", isOpen ? "w-auto mx-[15px]" : "w-10 mx-auto")} />

            {/* 3. СПИСОК ЗАМЕТОК И ПОИСК */}
            <ScrollArea className="flex-1 bg-transparent">
                {isOpen ? (
                    <div className="w-[280px] max-w-[280px] py-3 pl-[15px] pr-[15px] flex flex-col overflow-hidden">
                        {/* Поиск */}
                        <div className="flex items-center gap-2 mb-3 w-full max-w-full">
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground left-3" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Поиск..."
                                    className="h-9 w-full min-w-0 text-xs bg-background border-border rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 shadow-sm pl-9 pr-2 transition-none"
                                    title="Поиск"
                                />
                            </div>
                            <Button
                                variant="ghost" size="icon"
                                onClick={() => setSortDirection(prev => prev === 'Descending' ? 'Ascending' : 'Descending')}
                                className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50 transition-none"
                                title={sortDirection === 'Descending' ? "Сначала новые" : "Сначала старые"}
                            >
                                {sortDirection === 'Descending' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                            </Button>
                        </div>

                        {/* Карточки */}
                        {isLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/></div>
                        ) : notes.length === 0 ? (
                            <div className="text-center text-muted-foreground text-xs py-4 border border-dashed border-border rounded-lg m-1 w-full">Нет заметок</div>
                        ) : (
                            <div className="space-y-1 animate-in fade-in duration-300 flex flex-col w-full max-w-full">
                                {notes.map((note: NoteListItemDto) => (
                                    <SidebarNoteCard
                                        key={note.id}
                                        note={note}
                                        isActive={location.pathname === `/notes/${note.id}`}
                                        onClick={handleNoteClick}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : null}
            </ScrollArea>

            {/* 4. ПОДВАЛ С ПРОФИЛЕМ И НАСТРОЙКАМИ */}
            <div className="p-[15px] border-t border-border bg-background/50 flex flex-col items-center gap-2 flex-shrink-0 w-full transition-all duration-300">

                {/* Группа Настройки + Тема */}
                <div className={cn("flex w-full transition-all duration-300", isOpen ? "flex-row gap-2" : "flex-col-reverse gap-2")}>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/settings')}
                        className={cn(
                            "transition-all duration-300 rounded-lg shrink-0 text-muted-foreground hover:bg-background hover:text-foreground flex items-center",
                            isOpen ? "h-10 flex-1 px-3 justify-start gap-2" : "h-10 w-10 justify-center p-0 mx-auto"
                        )}
                        title={!isOpen ? "Настройки" : undefined}
                    >
                        <Settings className="h-5 w-5 shrink-0" />
                        {isOpen && <span className="text-xs font-medium truncate">Настройки</span>}
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className="transition-all duration-300 rounded-lg shrink-0 text-muted-foreground hover:bg-background hover:text-foreground flex items-center justify-center h-10 w-10 p-0 mx-auto"
                        title="Смена темы"
                    >
                        {theme === 'dark' ? <Moon className="h-5 w-5 shrink-0" /> : <Sun className="h-5 w-5 shrink-0" />}
                    </Button>
                </div>

                {/* Кнопка перехода в профиль */}
                <Button
                    variant="ghost"
                    onClick={() => navigate('/profile')}
                    className={cn(
                        "hover:bg-background transition-all duration-300 group min-w-0 rounded-lg flex items-center",
                        isOpen ? "justify-start w-full h-12 gap-3 px-2" : "justify-center p-0 w-10 h-10 gap-0 mx-auto"
                    )}
                >
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground font-semibold text-xs shadow-sm overflow-hidden">
                        {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                            displayName.charAt(0).toUpperCase()
                        )}
                    </div>
                    {isOpen && (
                        <>
                            <div className="flex flex-col items-start text-left overflow-hidden min-w-0 flex-1 animate-in fade-in duration-200">
                                <span className="text-sm font-medium text-foreground truncate w-full">{displayName}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                        </>
                    )}
                </Button>
            </div>
        </aside>
    );
};