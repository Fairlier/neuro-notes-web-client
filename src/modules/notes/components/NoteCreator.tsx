import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "../api/notesApi";
import { useAudioRecorder } from "@/modules/notes";
import { NoteCard } from "./NoteCard";
import { NoteFilters } from "./NoteFilters";
import { useTabs } from "@/modules/layout";
import type { GetNotesParams } from "../types/notesTypes";

import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/shared/ui/collapsible";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/shared/ui/dropdown-menu";
import { Search, Mic, Paperclip, ArrowUp, Loader2, Play, Pause, Square, Trash2, Upload, SlidersHorizontal, ChevronDown, Sparkles, Type, FileQuestion } from "lucide-react";
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

    const {
        isRecording, isPaused, audioBlob, setAudioBlob, formattedTime, canvasRef,
        startRecording, pauseRecording, resumeRecording, stopRecording, cancelAudio
    } = useAudioRecorder();

    const [filters, setFilters] = useState<GetNotesParams>(DEFAULT_FILTERS);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isFiltersOpen, setFiltersOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data, isLoading } = useQuery({
        queryKey: ['notes', 'search', filters, debouncedSearch],
        queryFn: () => notesApi.getAll({ ...filters, searchTerm: debouncedSearch || undefined }),
    });

    const createTextMutation = useMutation({
        mutationFn: notesApi.createDirectText,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            openNoteInCurrentTab(data.id, title || "Новая заметка");
            setTitle(""); setContent("");
        }
    });

    const createAudioMutation = useMutation({
        mutationFn: ({ title, file }: { title: string; file: File }) => notesApi.createFromAudio(title, file),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            openNoteInCurrentTab(data.id, title || "Аудиозаметка");
            setTitle(""); cancelAudio(); setIsRecordingMode(false);
        }
    });

    const handleFilterChange = <K extends keyof GetNotesParams>(
        key: K,
        value: GetNotesParams[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const isPendingAny = createTextMutation.isPending || createAudioMutation.isPending;

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden text-foreground">
            <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setAudioBlob(file); setIsRecordingMode(true); }
            }} />

            <ScrollArea className="flex-1">
                {/* --- СЕКЦИЯ СОЗДАНИЯ --- */}
                <div className="border-b border-border bg-background">
                    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
                        <h1 className="text-3xl font-light text-center mb-6">Что вы хотите создать?</h1>

                        <div className="relative bg-muted/30 rounded-lg border border-border shadow-sm focus-within:ring-2 focus-within:ring-primary/20 mb-4 transition-all">
                            <Input
                                value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder="Название заметки (необязательно)"
                                className="w-full bg-transparent border-none focus-visible:ring-0 text-lg px-4 py-3"
                            />
                        </div>

                        <div className="relative bg-muted/30 rounded-lg border border-border shadow-sm transition-all">
                            {isRecordingMode ? (
                                <div className="flex flex-col items-center justify-center min-h-[140px] p-6">
                                    {audioBlob ? (
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            <audio controls src={URL.createObjectURL(audioBlob)} className="w-full max-w-md h-10" />
                                            <Button variant="ghost" size="sm" onClick={cancelAudio} className="text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4 mr-2" /> Удалить
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            {/* Визуализатор звука из хука */}
                                            <div className="w-full max-w-[280px] h-12 bg-background rounded-md p-1 border border-border">
                                                <canvas ref={canvasRef} width={280} height={40} className="w-full h-full" />
                                            </div>
                                            <div className="text-3xl font-mono">{formattedTime}</div>
                                            <div className="flex gap-3">
                                                {!isRecording ? (
                                                    <Button onClick={startRecording} className="bg-destructive hover:bg-destructive/90 text-white rounded-full h-14 w-14">
                                                        <Mic className="h-6 w-6" />
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button onClick={isPaused ? resumeRecording : pauseRecording} variant="outline" className="rounded-full h-14 w-14">
                                                            {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                                                        </Button>
                                                        <Button onClick={stopRecording} className="bg-foreground text-background hover:bg-foreground/90 rounded-full h-14 w-14">
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
                                    value={content} onChange={(e) => setContent(e.target.value)}
                                    placeholder="Напишите заметку или идею..."
                                    className="w-full min-h-[120px] resize-none bg-transparent border-none focus-visible:ring-0 text-lg p-4"
                                />
                            )}

                            {/* Панель инструментов */}
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
                                    <Button variant={isRecordingMode ? "secondary" : "ghost"} size="icon" className="rounded-full" onClick={() => setIsRecordingMode(!isRecordingMode)}>
                                        <Mic className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button
                                    onClick={() => isRecordingMode ? createAudioMutation.mutate({ title, file: new File([audioBlob!], "audio.webm") }) : createTextMutation.mutate({ title, content })}
                                    disabled={isPendingAny || (isRecordingMode ? !audioBlob : !content.trim())}
                                    size="icon"
                                    className={cn("rounded-md", (isRecordingMode ? audioBlob : content.trim()) ? "bg-primary" : "bg-muted text-muted-foreground")}
                                >
                                    {isPendingAny ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- СЕКЦИЯ ПОИСКА --- */}
                <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
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

                    {/* Вынесенный компонент фильтров! */}
                    <Collapsible open={isFiltersOpen} onOpenChange={setFiltersOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm"><SlidersHorizontal className="mr-2 h-3.5 w-3.5" /> Фильтры <ChevronDown className={cn("ml-2 h-3.5 w-3.5", isFiltersOpen && "rotate-180")} /></Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <NoteFilters filters={filters} onChange={handleFilterChange} isSemanticSearch={filters.searchMode === 'Semantic' && !!debouncedSearch} />
                        </CollapsibleContent>
                    </Collapsible>

                    {/* --- РЕЗУЛЬТАТЫ --- */}
                    <div className="mt-8">
                        {isLoading ? (
                            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : data?.notes.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Заметки не найдены</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {data?.notes.map(note => (
                                    <NoteCard key={note.id} note={note} onClick={() => openNoteInCurrentTab(note.id, note.title)} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};