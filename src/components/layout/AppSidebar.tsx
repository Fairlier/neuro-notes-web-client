// src/components/layout/AppSidebar.tsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { notesApi } from "@/api/notes";
import { useTabs } from "@/features/tabs/TabsContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { NoteListItemDto, SortDirection } from "@/types/notes";
import {
    PanelLeftClose,
    PanelLeftOpen,
    Search,
    LogOut,
    FileText,
    FileAudio,
    Loader2,
    Settings,
    User,
    ChevronRight,
    MessageSquare,
    ArrowDown,
    ArrowUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    const navigate = useNavigate();

    // Получаем состояние вкладок для возврата к последней активной
    const { openNoteInCurrentTab, tabs, activeTabUid } = useTabs();

    // Состояния для поиска и сортировки
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortDirection, setSortDirection] = useState<SortDirection>("Descending");

    // Задержка (debounce) для поискового запроса
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
            sortBy: 'UpdatedAt', // Сортируем по дате обновления
            sortDirection: sortDirection,
            searchTerm: debouncedSearch || undefined,
            searchMode: 'Title' // Поиск только по названию
        }),
    });

    const notes = data?.notes || [];

    // Клик по заметке в сайдбаре — открывает в текущей вкладке
    const handleNoteClick = (e: React.MouseEvent, noteId: string, noteTitle: string) => {
        e.preventDefault();
        openNoteInCurrentTab(noteId, noteTitle || "Без названия");
    };

    // Навигация к рабочей области заметок
    const handleNotesClick = (e: React.MouseEvent) => {
        e.preventDefault();

        // Если мы уже в разделе заметок, ничего не делаем
        if (location.pathname.startsWith('/notes')) {
            return;
        }

        // Если мы в другом разделе, ищем активную вкладку и возвращаемся к ней
        const activeTab = tabs.find(t => t.uid === activeTabUid);
        const targetUrl = activeTab ? activeTab.url : '/notes/new';

        navigate(targetUrl);
    };

    // Проверяем, находимся ли мы сейчас в рабочей области заметок
    const isNotesActive = location.pathname.startsWith('/notes');

    return (
        <aside
            className={cn(
                "flex flex-col border-r border-zinc-200 bg-zinc-50/50 transition-all duration-300 ease-in-out relative flex-shrink-0 z-30",
                // Жесткое ограничение максимальной ширины, чтобы контент не растягивал панель
                isOpen ? "w-[280px] max-w-[280px]" : "w-[70px] max-w-[70px]"
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

                <Button variant="ghost" size="icon" onClick={toggle} className="text-zinc-400 hover:text-zinc-700 h-8 w-8 shrink-0">
                    {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                </Button>
            </div>

            {/* 2. ДЕЙСТВИЯ */}
            <div className="p-3 flex flex-col gap-2 flex-shrink-0 w-full">
                <Link to="/chat" className="block w-full">
                    <Button
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

                {/* Главная кнопка рабочего пространства заметок */}
                <Button
                    variant={isNotesActive ? "secondary" : "ghost"}
                    onClick={handleNotesClick}
                    className={cn(
                        "h-10 transition-all duration-300 overflow-hidden border border-transparent",
                        isNotesActive ? "bg-zinc-200 text-zinc-900" : "hover:bg-zinc-200/50 text-zinc-600",
                        isOpen ? "w-full justify-start gap-2 px-4" : "w-10 justify-center px-0 mx-auto"
                    )}
                    title={!isOpen ? "Заметки" : undefined}
                >
                    <FileText className="h-5 w-5 shrink-0" />
                    <span className={cn(
                        "truncate transition-all duration-300",
                        isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
                    )}>
                        Заметки
                    </span>
                </Button>
            </div>

            <Separator className="bg-zinc-200 w-auto mx-3 mt-1" />

            {/* 3. СПИСОК ЗАМЕТОК И ПОИСК */}
            <ScrollArea className="flex-1 py-3 px-3 w-full min-w-0">

                {/* Поиск и сортировка */}
                <div className={cn(
                    "flex w-full min-w-0 transition-all duration-300 mb-3",
                    isOpen ? "flex-row items-center gap-1.5 px-1" : "flex-col items-center gap-2 px-0"
                )}>
                    {/* Обертка поля: min-w-0 решает проблему растягивания */}
                    <div className={cn("relative min-w-0 w-full", isOpen ? "flex-1" : "")}>
                        <Search className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 transition-opacity",
                            isOpen ? "left-2.5 opacity-100" : "left-1/2 -translate-x-1/2 opacity-0 hidden"
                        )} />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={isOpen ? "Поиск..." : "🔍"}
                            className={cn(
                                "h-8 w-full min-w-0 text-xs bg-white border-zinc-200 focus-visible:ring-1 focus-visible:ring-blue-500/20 shadow-sm transition-all overflow-hidden whitespace-nowrap text-ellipsis",
                                isOpen ? "pl-8 pr-2" : "px-0 text-center"
                            )}
                            title="Поиск"
                        />
                    </div>
                    {/* Кнопка с shrink-0, чтобы её никогда не выталкивало */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSortDirection(prev => prev === 'Descending' ? 'Ascending' : 'Descending')}
                        className="h-8 w-8 shrink-0 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50 transition-all"
                        title={sortDirection === 'Descending' ? "Сначала новые" : "Сначала старые"}
                    >
                        {sortDirection === 'Descending' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Сам список отображается только когда панель открыта */}
                {isOpen ? (
                    <>
                        {isLoading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-400"/>
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="text-center text-zinc-400 text-xs py-4">Нет заметок</div>
                        ) : (
                            <div className="space-y-1 animate-in fade-in duration-300 w-full min-w-0">
                                {notes.map((note: NoteListItemDto) => {
                                    const dateToUse = note.updatedAt ? new Date(note.updatedAt) : new Date(note.createdAt);
                                    const isAudio = note.sourceType === 'AudioFile';

                                    return (
                                        <Button
                                            key={note.id}
                                            variant="ghost"
                                            onClick={(e) => handleNoteClick(e, note.id, note.title)}
                                            className={cn(
                                                "w-full min-w-0 justify-start h-auto py-2.5 px-2.5 text-left font-normal overflow-hidden",
                                                location.pathname === `/notes/${note.id}`
                                                    ? "bg-zinc-200/60 text-zinc-900"
                                                    : "text-zinc-600 hover:bg-zinc-200/40"
                                            )}
                                        >
                                            <div className="flex flex-col gap-1.5 w-full min-w-0">

                                                {/* Заголовок и индикатор обработки */}
                                                <div className="flex items-start justify-between gap-2 w-full min-w-0">
                                                    <span className="truncate text-sm font-medium flex-1">
                                                        {note.title || "Без названия"}
                                                    </span>
                                                    {note.isProcessing && (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 shrink-0 mt-0.5" />
                                                    )}
                                                </div>

                                                {/* Мета-информация (Дата, Тип, Категория) */}
                                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-zinc-500 leading-none w-full min-w-0">
                                                    <span className="shrink-0">{format(dateToUse, "d MMM yyyy", { locale: ru })}</span>

                                                    <div className="w-0.5 h-0.5 rounded-full bg-zinc-300 shrink-0" />
                                                    <span className="flex items-center gap-0.5 shrink-0 min-w-0">
                                                        {isAudio ? <FileAudio className="h-3 w-3 shrink-0" /> : <FileText className="h-3 w-3 shrink-0" />}
                                                        <span className="truncate">{isAudio ? 'Audio' : 'Text'}</span>
                                                    </span>

                                                    {note.category && (
                                                        <>
                                                            <div className="w-0.5 h-0.5 rounded-full bg-zinc-300 shrink-0" />
                                                            <span className="truncate max-w-[80px] shrink-0">{note.category}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Статус */}
                                                <div className="flex items-center mt-0.5">
                                                    <span className={cn(
                                                        "text-[9px] px-1.5 py-0.5 rounded-sm font-medium border shrink-0",
                                                        note.status === 'Pending' ? "bg-zinc-100 text-zinc-500 border-zinc-200" :
                                                            note.status === 'Failed' ? "bg-red-50 text-red-600 border-red-200" :
                                                                note.status === 'Raw' ? "bg-orange-50 text-orange-600 border-orange-200" :
                                                                    note.status === 'Structured' ? "bg-purple-50 text-purple-600 border-purple-200" :
                                                                        "bg-green-50 text-green-600 border-green-200"
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
                ) : (
                    <div className="h-full w-full" />
                )}
            </ScrollArea>

            {/* 4. ПОДВАЛ */}
            <div className="p-3 border-t border-zinc-200 bg-zinc-50/50 flex flex-col gap-1 flex-shrink-0 w-full">
                <Link to="/settings" className="block w-full">
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
                                "w-full hover:bg-zinc-200/50 transition-all duration-300 group min-w-0",
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
                    <DropdownMenuContent align="start" className="w-56 ml-2" side="right" sideOffset={5}>
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