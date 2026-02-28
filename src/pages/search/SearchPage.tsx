// src/pages/search/SearchPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { notesApi } from "@/api/notes";
import type { GetNotesParams, NoteStatus, NoteSourceType, NoteCategory, SearchMode, NoteSortBy, SortDirection, NoteListItemDto } from "@/types/notes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Search,
    Loader2,
    FileText,
    FileAudio,
    Calendar,
    Filter,
    ChevronDown,
    X,
    SlidersHorizontal,
    Sparkles,
    Type,
    AlertCircle,
    FileQuestion
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// --- Компонент карточки заметки ---
interface NoteCardProps {
    note: NoteListItemDto;
    onClick: () => void;
}

const NoteCard = ({ note, onClick }: NoteCardProps) => {
    const statusStyles: Record<NoteStatus, string> = {
        'Pending': 'bg-zinc-100 text-zinc-600 border-zinc-200',
        'Failed': 'bg-red-50 text-red-600 border-red-200',
        'Raw': 'bg-orange-50 text-orange-600 border-orange-200',
        'Structured': 'bg-purple-50 text-purple-600 border-purple-200',
        'Summarized': 'bg-green-50 text-green-600 border-green-200',
    };

    return (
        <div
            onClick={onClick}
            className="group bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        note.sourceType === 'AudioFile' ? "bg-blue-50 text-blue-600" : "bg-zinc-100 text-zinc-600"
                    )}>
                        {note.sourceType === 'AudioFile' ? <FileAudio className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <h3 className="font-medium text-zinc-900 truncate group-hover:text-blue-600 transition-colors">
                        {note.title || "Без названия"}
                    </h3>
                </div>
                <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md border font-medium shrink-0",
                    statusStyles[note.status]
                )}>
                    {note.status}
                </span>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-zinc-400">
                <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(note.createdAt), "d MMM yyyy", { locale: ru })}</span>
                </div>
                {note.category && (
                    <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md text-[10px]">
                        {note.category}
                    </span>
                )}
                {note.isProcessing && (
                    <div className="flex items-center gap-1 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Обработка...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Главный компонент ---
export default function SearchPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Состояние поиска
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const [isFiltersOpen, setFiltersOpen] = useState(false);

    // Пагинация
    const [currentPage, setCurrentPage] = useState(
        parseInt(searchParams.get('page') || '1', 10)
    );

    // Фильтры - по умолчанию Title
    const [searchMode, setSearchMode] = useState<SearchMode>(
        (searchParams.get('mode') as SearchMode) || 'Title'
    );
    const [status, setStatus] = useState<NoteStatus | 'all'>(
        (searchParams.get('status') as NoteStatus) || 'all'
    );
    const [sourceType, setSourceType] = useState<NoteSourceType | 'all'>(
        (searchParams.get('sourceType') as NoteSourceType) || 'all'
    );
    const [category, setCategory] = useState<NoteCategory | 'all'>(
        (searchParams.get('category') as NoteCategory) || 'all'
    );
    const [sortBy, setSortBy] = useState<NoteSortBy>(
        (searchParams.get('sortBy') as NoteSortBy) || 'CreatedAt'
    );
    const [sortDirection, setSortDirection] = useState<SortDirection>(
        (searchParams.get('sortDir') as SortDirection) || 'Descending'
    );

    // Debounce поиска
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Синхронизация с URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (searchMode !== 'Title') params.set('mode', searchMode);
        if (status !== 'all') params.set('status', status);
        if (sourceType !== 'all') params.set('sourceType', sourceType);
        if (category !== 'all') params.set('category', category);
        if (sortBy !== 'CreatedAt') params.set('sortBy', sortBy);
        if (sortDirection !== 'Descending') params.set('sortDir', sortDirection);
        if (currentPage > 1) params.set('page', currentPage.toString());

        setSearchParams(params, { replace: true });
    }, [debouncedSearch, searchMode, status, sourceType, category, sortBy, sortDirection, currentPage, setSearchParams]);

    // Формируем параметры запроса
    const queryParams: GetNotesParams = {
        searchTerm: debouncedSearch || undefined,
        searchMode: searchMode,
        status: status !== 'all' ? status : undefined,
        sourceType: sourceType !== 'all' ? sourceType : undefined,
        category: category !== 'all' ? category : undefined,
        sortBy,
        sortDirection,
        page: currentPage,
        pageSize: 50,
    };

    // Запрос заметок
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['notes', 'search', queryParams],
        queryFn: () => notesApi.getAll(queryParams),
    });

    // Обработчик клика по карточке
    const handleNoteClick = (noteId: string) => {
        navigate(`/notes/${noteId}`);
    };

    // Обработчики изменения фильтров с сбросом страницы
    const handleSearchModeChange = () => {
        setSearchMode(searchMode === 'Semantic' ? 'Title' : 'Semantic');
        setCurrentPage(1);
    };

    const handleStatusChange = (v: NoteStatus | 'all') => {
        setStatus(v);
        setCurrentPage(1);
    };

    const handleSourceTypeChange = (v: NoteSourceType | 'all') => {
        setSourceType(v);
        setCurrentPage(1);
    };

    const handleCategoryChange = (v: NoteCategory | 'all') => {
        setCategory(v);
        setCurrentPage(1);
    };

    const handleSortByChange = (v: NoteSortBy) => {
        setSortBy(v);
        setCurrentPage(1);
    };

    const handleSortDirectionChange = (v: SortDirection) => {
        setSortDirection(v);
        setCurrentPage(1);
    };

    const handleSearchTermChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    // Сброс фильтров
    const resetFilters = () => {
        setSearchTerm("");
        setSearchMode('Title');
        setStatus('all');
        setSourceType('all');
        setCategory('all');
        setSortBy('CreatedAt');
        setSortDirection('Descending');
        setCurrentPage(1);
    };

    const hasActiveFilters = status !== 'all' || sourceType !== 'all' || category !== 'all';

    // Обработчики пагинации
    const handlePreviousPage = () => {
        if (data?.hasPreviousPage) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (data?.hasNextPage) {
            setCurrentPage(prev => prev + 1);
        }
    };

    // Обработка ошибки
    if (isError) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center space-y-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-900">Ошибка загрузки</h2>
                <p className="text-sm text-zinc-500 max-w-md">
                    Не удалось выполнить поиск. Проверьте подключение к серверу.
                </p>
                <div className="p-4 bg-zinc-100 rounded text-xs font-mono text-left max-w-lg overflow-auto">
                    {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
                </div>
                <Button onClick={() => window.location.reload()}>Обновить страницу</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">

            {/* === HEADER === */}
            <div className="border-b border-zinc-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">

                    {/* Заголовок */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Search className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-zinc-900">Поиск заметок</h1>
                            <p className="text-xs text-zinc-500">Найдите нужную информацию по всей базе знаний</p>
                        </div>
                    </div>

                    {/* Поисковая строка */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => handleSearchTermChange(e.target.value)}
                            placeholder={
                                searchMode === 'Semantic'
                                    ? "Введите поисковый запрос (семантический поиск по смыслу)..."
                                    : "Введите название заметки..."
                            }
                            className="w-full h-12 pl-12 pr-32 text-base bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-blue-500"
                        />

                        {/* Переключатель режима поиска */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSearchModeChange}
                                className={cn(
                                    "h-8 px-3 text-xs gap-1.5 rounded-lg transition-colors",
                                    searchMode === 'Semantic'
                                        ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                )}
                            >
                                {searchMode === 'Semantic' ? (
                                    <><Sparkles className="h-3.5 w-3.5" /> AI</>
                                ) : (
                                    <><Type className="h-3.5 w-3.5" /> Текст</>
                                )}
                            </Button>

                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSearchTermChange("")}
                                    className="h-8 w-8 text-zinc-400 hover:text-zinc-600"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Фильтры */}
                    <Collapsible open={isFiltersOpen} onOpenChange={setFiltersOpen}>
                        <div className="flex items-center justify-between mt-4">
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 px-3 text-xs gap-2",
                                        hasActiveFilters ? "text-blue-600" : "text-zinc-500"
                                    )}
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    Фильтры
                                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isFiltersOpen && "rotate-180")} />
                                </Button>
                            </CollapsibleTrigger>

                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="h-8 px-3 text-xs text-zinc-400 hover:text-zinc-600"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Сбросить
                                </Button>
                            )}
                        </div>

                        <CollapsibleContent className="mt-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">

                                {/* Статус */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Статус</label>
                                    <Select value={status} onValueChange={handleStatusChange}>
                                        <SelectTrigger className="h-9 text-xs bg-white">
                                            <SelectValue placeholder="Все" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={4}>
                                            <SelectItem value="all">Все статусы</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Raw">Raw</SelectItem>
                                            <SelectItem value="Structured">Structured</SelectItem>
                                            <SelectItem value="Summarized">Summarized</SelectItem>
                                            <SelectItem value="Failed">Failed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Тип источника */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Тип</label>
                                    <Select value={sourceType} onValueChange={handleSourceTypeChange}>
                                        <SelectTrigger className="h-9 text-xs bg-white">
                                            <SelectValue placeholder="Все" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={4}>
                                            <SelectItem value="all">Все типы</SelectItem>
                                            <SelectItem value="DirectText">Текст</SelectItem>
                                            <SelectItem value="AudioFile">Аудио</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Категория */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Категория</label>
                                    <Select value={category} onValueChange={handleCategoryChange}>
                                        <SelectTrigger className="h-9 text-xs bg-white">
                                            <SelectValue placeholder="Все" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={4}>
                                            <SelectItem value="all">Все категории</SelectItem>
                                            <SelectItem value="Finance">Финансы</SelectItem>
                                            <SelectItem value="Ideas">Идеи</SelectItem>
                                            <SelectItem value="Personal">Личное</SelectItem>
                                            <SelectItem value="Reference">Справка</SelectItem>
                                            <SelectItem value="Study">Учёба</SelectItem>
                                            <SelectItem value="Work">Работа</SelectItem>
                                            <SelectItem value="Other">Другое</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Сортировка */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Сортировка</label>
                                    <Select
                                        value={sortBy}
                                        onValueChange={handleSortByChange}
                                        disabled={searchMode === 'Semantic' && !!debouncedSearch}
                                    >
                                        <SelectTrigger className="h-9 text-xs bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={4}>
                                            <SelectItem value="CreatedAt">По дате создания</SelectItem>
                                            <SelectItem value="UpdatedAt">По дате обновления</SelectItem>
                                            <SelectItem value="Title">По названию</SelectItem>
                                            <SelectItem value="Status">По статусу</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {searchMode === 'Semantic' && debouncedSearch && (
                                        <p className="text-[10px] text-zinc-400">
                                            Сортировка по релевантности
                                        </p>
                                    )}
                                </div>

                                {/* Направление сортировки */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Порядок</label>
                                    <Select
                                        value={sortDirection}
                                        onValueChange={handleSortDirectionChange}
                                        disabled={searchMode === 'Semantic' && !!debouncedSearch}
                                    >
                                        <SelectTrigger className="h-9 text-xs bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={4}>
                                            <SelectItem value="Descending">Сначала новые</SelectItem>
                                            <SelectItem value="Ascending">Сначала старые</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </div>

            {/* === RESULTS === */}
            <ScrollArea className="flex-1">
                <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">

                    {/* Статистика результатов */}
                    {data && (
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                                <Filter className="h-4 w-4" />
                                <span>
                                    Найдено <strong className="text-zinc-900">{data.totalCount}</strong> заметок
                                </span>
                                {debouncedSearch && (
                                    <span className="text-zinc-400">
                                        по запросу «<span className="text-zinc-700">{debouncedSearch}</span>»
                                        {searchMode === 'Semantic' && (
                                            <span className="ml-1 text-purple-600">(AI поиск)</span>
                                        )}
                                    </span>
                                )}
                            </div>

                            {data.totalPages > 1 && (
                                <span className="text-xs text-zinc-400">
                                    Страница {data.page} из {data.totalPages}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Состояние загрузки */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-sm text-zinc-500">
                                {searchMode === 'Semantic' && debouncedSearch
                                    ? 'Выполняем семантический поиск...'
                                    : 'Ищем заметки...'}
                            </p>
                        </div>
                    ) : data?.notes.length === 0 ? (
                        // Пустое состояние
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center">
                                <FileQuestion className="h-8 w-8 text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-zinc-900 mb-1">Заметки не найдены</h3>
                                <p className="text-sm text-zinc-500 max-w-md">
                                    {debouncedSearch
                                        ? `По запросу «${debouncedSearch}» ничего не найдено. Попробуйте изменить запрос или фильтры.`
                                        : "Создайте свою первую заметку, чтобы она появилась здесь."
                                    }
                                </p>
                            </div>
                            {hasActiveFilters && (
                                <Button variant="outline" size="sm" onClick={resetFilters}>
                                    Сбросить фильтры
                                </Button>
                            )}
                        </div>
                    ) : (
                        // Сетка карточек
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data?.notes.map((note) => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    onClick={() => handleNoteClick(note.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Пагинация */}
                    {data && data.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!data.hasPreviousPage}
                                onClick={handlePreviousPage}
                            >
                                Назад
                            </Button>
                            <span className="flex items-center px-4 text-sm text-zinc-500">
                                {data.page} / {data.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!data.hasNextPage}
                                onClick={handleNextPage}
                            >
                                Вперёд
                            </Button>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}