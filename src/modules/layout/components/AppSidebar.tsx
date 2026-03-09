import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { useTheme } from "@/modules/theme";
import { useTabs } from "../hooks/useTabs";
import { useQuery } from "@tanstack/react-query";
import { notesApi } from "@/modules/notes";
import { cn } from "@/shared/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { NoteListItemDto, SortDirection } from "@/modules/notes/types/notesTypes";
import {
    PanelLeftClose, PanelLeftOpen, Search, LogOut, FileText,
    FileAudio, Loader2, Settings, User, ChevronRight,
    MessageCircle, ArrowDown, ArrowUp, Sun, Moon, Palette
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface AppSidebarProps {
    isOpen: boolean;
    toggle: () => void;
}

export const AppSidebar = ({ isOpen, toggle }: AppSidebarProps) => {
    const { logout, user } = useAuth();
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

    return (
        <aside
            className={cn(
                "flex flex-col border-r border-border bg-muted/30 transition-all duration-300 ease-in-out relative flex-shrink-0 z-30",
                isOpen ? "w-[280px] max-w-[280px]" : "w-[70px] max-w-[70px]"
            )}
        >
            {/* 1. ШАПКА */}
            <div className="flex items-center h-16 flex-shrink-0 w-full relative">
                <div className={cn(
                    "flex items-center gap-2 font-bold text-foreground select-none overflow-hidden transition-all duration-300 absolute left-4",
                    isOpen ? "opacity-100" : "opacity-0 invisible"
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
                        "text-muted-foreground hover:text-foreground shrink-0 transition-all duration-300 absolute",
                        // Абсолютное позиционирование для плавного скольжения кнопки
                        isOpen ? "right-4 h-8 w-8 rounded-full" : "right-[15px] h-10 w-10 rounded-lg"
                    )}
                >
                    {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                </Button>
            </div>

            {/* 2. ДЕЙСТВИЯ */}
            <div className="px-3 pb-3 flex flex-col items-center gap-2 flex-shrink-0 w-full">
                <Link to="/chat" className="flex w-full justify-center">
                    <Button
                        variant={location.pathname === "/chat" ? "secondary" : "ghost"}
                        className={cn(
                            "h-10 transition-all duration-300 overflow-hidden border border-transparent rounded-lg flex justify-start px-3",
                            location.pathname === "/chat"
                                ? "bg-background text-foreground shadow-sm border-border"
                                : "hover:bg-background/50 text-muted-foreground hover:text-foreground",
                            // Используем ТОЛЬКО ширину. Отступ px-3 (12px) идеально центрирует иконку в блоке w-10 (40px)
                            isOpen ? "w-full gap-3" : "w-10 gap-0"
                        )}
                        title={!isOpen ? "Общий чат" : undefined}
                    >
                        <MessageCircle className="h-4 w-4 shrink-0" />
                        <span className={cn("truncate transition-all duration-300 font-medium", isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
                            Общий чат
                        </span>
                    </Button>
                </Link>

                <Button
                    variant={isNotesActive ? "secondary" : "ghost"}
                    onClick={handleNotesClick}
                    className={cn(
                        "h-10 transition-all duration-300 overflow-hidden border border-transparent rounded-lg flex justify-start px-3",
                        isNotesActive
                            ? "bg-background text-foreground shadow-sm border-border"
                            : "hover:bg-background/50 text-muted-foreground hover:text-foreground",
                        isOpen ? "w-full gap-3" : "w-10 gap-0"
                    )}
                    title={!isOpen ? "Workspace" : undefined}
                >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className={cn("truncate transition-all duration-300 font-medium", isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
                        Workspace
                    </span>
                </Button>
            </div>

            <Separator className="bg-border w-auto mx-4" />

            {/* 3. СПИСОК ЗАМЕТОК И ПОИСК */}
            <ScrollArea className="flex-1 py-3 px-3 w-full min-w-0">
                <div className={cn(
                    "w-full min-w-0 transition-all duration-300 mb-3",
                    isOpen ? "flex flex-row items-center gap-2 px-1" : "hidden"
                )}>
                    <div className="relative min-w-0 w-full flex-1">
                        <Search className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground left-3" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Поиск..."
                            className="h-8 w-full min-w-0 text-xs bg-background border-border rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 shadow-sm pl-9 pr-2"
                            title="Поиск"
                        />
                    </div>
                    <Button
                        variant="ghost" size="icon"
                        onClick={() => setSortDirection(prev => prev === 'Descending' ? 'Ascending' : 'Descending')}
                        className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all"
                        title={sortDirection === 'Descending' ? "Сначала новые" : "Сначала старые"}
                    >
                        {sortDirection === 'Descending' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                    </Button>
                </div>

                {isOpen ? (
                    <>
                        {isLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/></div>
                        ) : notes.length === 0 ? (
                            <div className="text-center text-muted-foreground text-xs py-4 border border-dashed border-border rounded-lg m-1">Нет заметок</div>
                        ) : (
                            <div className="space-y-1 animate-in fade-in duration-300 w-full min-w-0">
                                {notes.map((note: NoteListItemDto) => {
                                    const dateToUse = note.updatedAt ? new Date(note.updatedAt) : new Date(note.createdAt);
                                    const isAudio = note.sourceType === 'AudioFile';
                                    const isActive = location.pathname === `/notes/${note.id}`;

                                    return (
                                        <Button
                                            key={note.id} variant="ghost"
                                            onClick={(e) => handleNoteClick(e, note.id, note.title)}
                                            className={cn(
                                                "w-full min-w-0 justify-start h-auto py-2.5 px-3 text-left font-normal overflow-hidden rounded-lg transition-colors",
                                                isActive ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:bg-background/50 hover:text-foreground border border-transparent"
                                            )}
                                        >
                                            <div className="flex flex-col gap-1.5 w-full min-w-0">
                                                <div className="flex items-start justify-between gap-2 w-full min-w-0">
                                                    <span className="truncate text-sm font-medium flex-1">{note.title || "Без названия"}</span>
                                                    {note.isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0 mt-0.5" />}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-muted-foreground leading-none w-full min-w-0">
                                                    <span className="shrink-0">{format(dateToUse, "d MMM yyyy", { locale: ru })}</span>
                                                    <div className="w-0.5 h-0.5 rounded-full bg-border shrink-0" />
                                                    <span className="flex items-center gap-0.5 shrink-0 min-w-0">
                                                        {isAudio ? <FileAudio className="h-3 w-3 shrink-0" /> : <FileText className="h-3 w-3 shrink-0" />}
                                                        <span className="truncate">{isAudio ? 'Audio' : 'Text'}</span>
                                                    </span>

                                                    {note.category && (
                                                        <>
                                                            <div className="w-0.5 h-0.5 rounded-full bg-border shrink-0" />
                                                            <span className="truncate max-w-[80px] shrink-0">{note.category}</span>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="flex items-center mt-0.5">
                                                    <span className={cn(
                                                        "text-[9px] px-1.5 py-0.5 rounded-sm font-medium border shrink-0",
                                                        note.status === 'Pending' ? "bg-muted text-muted-foreground border-border" :
                                                            note.status === 'Failed' ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                                note.status === 'Raw' ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" :
                                                                    note.status === 'Structured' ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" :
                                                                        "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                                    )}>
                                                        {note.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </Button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : <div className="h-full w-full" />}
            </ScrollArea>

            {/* 4. ПОДВАЛ С ПРОФИЛЕМ И НАСТРОЙКАМИ */}
            <div className="p-3 border-t border-border bg-background/50 flex flex-col items-center gap-2 flex-shrink-0 w-full transition-all duration-300">
                <div className={cn("flex w-full items-center transition-all duration-300", isOpen ? "flex-row gap-1 mb-1" : "flex-col gap-2")}>
                    <Button
                        variant="ghost"
                        className={cn(
                            "transition-all duration-300 hover:bg-background text-muted-foreground rounded-lg flex justify-start px-[10px]",
                            isOpen ? "h-9 w-full flex-1 gap-3" : "h-10 w-10 gap-0"
                        )}
                        title={!isOpen ? "Настройки" : undefined}
                    >
                        <Settings className="h-4 w-4 shrink-0" />
                        <span className={cn("truncate transition-all duration-300 text-xs", isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>Настройки</span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "rounded-lg shrink-0 text-muted-foreground hover:bg-background transition-all duration-300 flex justify-center",
                                    isOpen ? "h-9 w-9" : "h-10 w-10"
                                )}
                                title={!isOpen ? "Смена темы" : undefined}
                            >
                                {theme === 'light' ? <Sun className="h-4 w-4" /> : theme === 'dark' ? <Moon className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isOpen ? "end" : "start"} side={isOpen ? "top" : "right"} sideOffset={8}>
                            <DropdownMenuItem onClick={() => setTheme('light')}>Светлая</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme('dark')}>Темная</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "hover:bg-background transition-all duration-300 group min-w-0 rounded-lg flex justify-start",
                                isOpen ? "w-full h-12 gap-3 px-2" : "w-10 h-10 gap-0 px-1"
                            )}
                        >
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground font-semibold text-xs shadow-sm">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            {isOpen && (
                                <>
                                    <div className="flex flex-col items-start text-left overflow-hidden min-w-0 flex-1 animate-in fade-in duration-200">
                                        <span className="text-sm font-medium text-foreground truncate w-full">{user?.email}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                                </>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 ml-2" side="right" sideOffset={5}>
                        <DropdownMenuItem className="cursor-pointer rounded-md">
                            <User className="mr-2 h-4 w-4" />
                            <span>Профиль</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-md" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Выйти</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
};