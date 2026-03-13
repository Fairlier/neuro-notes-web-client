import { useState, useEffect, useRef } from "react";
import { useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "../api/notesApi";
import { useAudioRecorder } from "@/modules/notes";
import { NoteCard } from "./NoteCard";
import { NoteFilters } from "./NoteFilters";
import { useTabs } from "@/modules/layout";
import type { GetNotesParams, NoteListItemDto } from "../types/notesTypes";

import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/shared/ui/collapsible";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/shared/ui/dropdown-menu";
import { Search, Mic, Paperclip, ArrowUp, Loader2, Play, Pause, Square, Trash2, Upload, SlidersHorizontal, ChevronDown, Sparkles, Type, FileQuestion, FileAudio } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const DEFAULT_FILTERS: GetNotesParams = {
    searchMode: 'Title',
    sortBy: 'CreatedAt',
    sortDirection: 'Descending',
    page: 1,
    pageSize: 20,
};

export const NoteCreator = () => {
    const queryClient = useQueryClient();
    const { openNoteInCurrentTab } = useTabs();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isRecordingMode, setIsRecordingMode] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const {
        isRecording, isPaused, audioBlob, setAudioBlob, formattedTime, canvasRef,
        startRecording, pauseRecording, resumeRecording, stopRecording, cancelAudio
    } = useAudioRecorder();

    const [filters, setFilters] = useState<GetNotesParams>(DEFAULT_FILTERS);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isFiltersOpen, setFiltersOpen] = useState(false);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea && !isRecordingMode) {
            textarea.style.height = "auto";
            const nextHeight = Math.max(200, Math.min(textarea.scrollHeight, 600));
            textarea.style.height = `${nextHeight}px`;
        }
    }, [content, isRecordingMode]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const {
        data,
        isLoading,
        isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        // Убираем filters.page из ключа, чтобы при скролле не создавался новый кэш, а добавлялись страницы
        queryKey: ['notes', 'search', { ...filters, page: undefined }, debouncedSearch],
        queryFn: ({ pageParam = 1 }) =>
            notesApi.getAll({ ...filters, page: pageParam, searchTerm: debouncedSearch || undefined }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.notes.length === filters.pageSize ? allPages.length + 1 : undefined;
        },
        refetchInterval: (query) => {
            const currentQuery = query as { state?: { data?: { pages?: { notes: NoteListItemDto[] }[] } } };
            const pages = currentQuery.state?.data?.pages || [];
            const hasProcessingNotes = pages.some(page =>
                page.notes.some(note => note.isProcessing || note.status === 'Pending')
            );
            return hasProcessingNotes ? 3000 : false;
        },
    });

    const allNotes = data?.pages.flatMap(page => page.notes) || [];

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = loadMoreRef.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const createTextMutation = useMutation({
        mutationFn: notesApi.createDirectText,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            openNoteInCurrentTab(data.id, variables.title);
            setTitle("");
            setContent("");
        }
    });

    const createAudioMutation = useMutation({
        mutationFn: ({ title, file }: { title: string; file: File }) => notesApi.createFromAudio(title, file),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            openNoteInCurrentTab(data.id, variables.title);
            setTitle("");
            cancelAudio();
            setIsRecordingMode(false);
        }
    });

    const handleFilterChange = <K extends keyof GetNotesParams>(
        key: K,
        value: GetNotesParams[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleCreateText = () => {
        if (!content.trim()) return;
        const finalTitle = title.trim()
            ? title.trim()
            : content.split('\n')[0].substring(0, 50) || "Новая заметка";
        createTextMutation.mutate({ title: finalTitle, content });
    };

    const handleCreateAudio = () => {
        if (!audioBlob) return;
        const finalTitle = title.trim()
            ? title.trim()
            : `Аудиозаметка от ${new Date().toLocaleString('ru-RU')}`;
        const audioFile = audioBlob instanceof File
            ? audioBlob
            : new File([audioBlob], "recording.webm", {
                type: 'audio/webm',
                lastModified: Date.now()
            });
        createAudioMutation.mutate({ title: finalTitle, file: audioFile });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !isRecordingMode) {
            e.preventDefault();
            handleCreateText();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioBlob(file);
            setIsRecordingMode(true);
            if (!title.trim()) {
                setTitle(file.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const isPendingAny = createTextMutation.isPending || createAudioMutation.isPending;

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden text-foreground">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="audio/*"
                onChange={handleFileSelect}
            />

            <ScrollArea className="flex-1" style={{ scrollbarGutter: 'stable' }}>
                <div className="border-b border-border bg-background">
                    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
                        <h1 className="text-3xl font-light text-center mb-6">Что вы хотите создать?</h1>

                        <div className="relative bg-muted/30 rounded-lg border border-border shadow-sm focus-within:ring-2 focus-within:ring-primary/20 mb-4 transition-all">
                            <Input
                                value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder="Название заметки (необязательно)"
                                className="w-full bg-transparent border-none focus-visible:ring-0 text-lg px-4 py-3"
                            />
                        </div>

                        <div className="relative bg-muted/30 rounded-lg border border-border shadow-sm transition-all overflow-hidden">
                            {isRecordingMode ? (
                                <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
                                    {audioBlob ? (
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            {audioBlob instanceof File && (
                                                <div className="text-sm font-medium text-foreground flex items-center gap-2 mb-2 bg-muted px-3 py-1.5 rounded-md border border-border">
                                                    <FileAudio className="h-4 w-4 text-primary" />
                                                    {audioBlob.name}
                                                </div>
                                            )}
                                            <audio controls src={URL.createObjectURL(audioBlob)} className="w-full max-w-md h-10" />
                                            <Button variant="ghost" size="sm" onClick={cancelAudio} className="text-destructive hover:bg-destructive/10 mt-2">
                                                <Trash2 className="h-4 w-4 mr-2" /> Удалить {audioBlob instanceof File ? 'файл' : 'запись'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            <div className={cn(
                                                "w-full max-w-[280px] h-12 flex justify-center items-end bg-background rounded-md p-1 border border-border transition-opacity",
                                                !isRecording && "opacity-50"
                                            )}>
                                                <canvas ref={canvasRef} width={280} height={40} className="w-full h-full" />
                                            </div>
                                            <div className={cn(
                                                "text-3xl font-mono transition-colors tracking-tight",
                                                isRecording && !isPaused ? "text-destructive" : "text-foreground"
                                            )}>{formattedTime}</div>
                                            <div className="flex gap-3">
                                                {!isRecording ? (
                                                    <Button onClick={startRecording} className="bg-destructive hover:bg-destructive/90 text-white rounded-full h-14 w-14">
                                                        <Mic className="h-6 w-6" />
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button onClick={isPaused ? resumeRecording : pauseRecording} variant="outline" className="rounded-full h-14 w-14 border-border">
                                                            {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                                                        </Button>
                                                        <Button onClick={stopRecording} className="bg-foreground text-background hover:bg-foreground/90 rounded-full h-14 w-14 shadow-md">
                                                            <Square className="h-5 w-5 fill-current" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Напишите заметку или идею..."
                                    className="w-full min-h-[200px] resize-none bg-transparent border-none focus-visible:ring-0 text-lg p-6 overflow-y-auto scrollbar-thin"
                                />
                            )}

                            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-b-lg border-t border-border">
                                <div className="flex gap-1 items-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full"><Paperclip className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Загрузить аудиофайл</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button
                                        variant={isRecordingMode ? "secondary" : "ghost"}
                                        size="icon"
                                        className={cn("rounded-full", isRecordingMode && "text-primary")}
                                        onClick={() => {
                                            if (isRecordingMode) {
                                                setTitle("");
                                            }
                                            setIsRecordingMode(!isRecordingMode);
                                        }}
                                        title={isRecordingMode ? "Переключиться на текст" : "Переключиться на голос"}
                                    >
                                        {isRecordingMode ? <Type className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <Button
                                    onClick={isRecordingMode ? handleCreateAudio : handleCreateText}
                                    disabled={isPendingAny || (isRecordingMode ? !audioBlob : !content.trim())}
                                    size="icon"
                                    className={cn("rounded-md transition-all", (isRecordingMode ? audioBlob : content.trim()) ? "bg-primary hover:bg-primary/90 shadow-md" : "bg-muted text-muted-foreground")}
                                >
                                    {isPendingAny ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 pb-32">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><Search className="h-5 w-5" /></div>
                        <div>
                            <h2 className="text-lg font-bold">Поиск заметок</h2>
                            <p className="text-xs text-muted-foreground">Найдите нужную информацию по базе знаний</p>
                        </div>
                    </div>

                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={filters.searchMode === 'Semantic' ? "AI Поиск по смыслу..." : "Поиск по названию..."}
                            className="w-full h-12 pl-12 pr-32 bg-background border-border rounded-lg"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleFilterChange('searchMode', filters.searchMode === 'Semantic' ? 'Title' : 'Semantic')} className="h-8">
                                {filters.searchMode === 'Semantic' ? <><Sparkles className="mr-1 h-3.5 w-3.5" /> AI</> : <><Type className="mr-1 h-3.5 w-3.5" /> Текст</>}
                            </Button>
                        </div>
                    </div>

                    <Collapsible open={isFiltersOpen} onOpenChange={setFiltersOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm"><SlidersHorizontal className="mr-2 h-3.5 w-3.5" /> Фильтры <ChevronDown className={cn("ml-2 h-3.5 w-3.5", isFiltersOpen && "rotate-180")} /></Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <NoteFilters
                                filters={filters}
                                onChange={handleFilterChange}
                                isSemanticSearch={filters.searchMode === 'Semantic' && !!debouncedSearch}
                                onClear={() => setFilters(DEFAULT_FILTERS)}
                            />
                        </CollapsibleContent>
                    </Collapsible>

                    <div className="mt-8 min-h-[500px]">
                        {isLoading ? (
                            <div className="flex justify-center py-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : allNotes.length === 0 ? (
                            <div className="text-center py-40 text-muted-foreground">
                                <FileQuestion className="h-10 w-10 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">Заметки не найдены</p>
                                <p className="text-sm opacity-70">Попробуйте изменить параметры фильтрации</p>
                            </div>
                        ) : (
                            <>
                                <div className={cn(
                                    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-200 content-start",
                                    isFetching && !isFetchingNextPage && "opacity-50 pointer-events-none"
                                )}>
                                    {allNotes.map(note => (
                                        <NoteCard key={note.id} note={note} onClick={() => openNoteInCurrentTab(note.id, note.title)} />
                                    ))}
                                </div>

                                <div ref={loadMoreRef} className="w-full flex justify-center py-8">
                                    {isFetchingNextPage && (
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};