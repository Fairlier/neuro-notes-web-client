// src/features/notes/NoteCreator.tsx
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "@/api/notes";
import { useTabs } from "@/features/tabs/TabsContext";
import type { GetNotesParams, NoteStatus, NoteSourceType, NoteCategory, SearchMode, NoteSortBy, SortDirection, NoteListItemDto } from "@/types/notes";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
    ArrowUp,
    Loader2,
    Paperclip,
    Search,
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
    FileQuestion,
    ArrowUpDown,
    CalendarDays,
    Mic,
    Square,
    Pause,
    Play,
    Trash2
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

// --- Значения по умолчанию ---
const DEFAULT_FILTERS = {
    searchTerm: "",
    searchMode: 'Title' as SearchMode,
    status: 'all' as NoteStatus | 'all',
    sourceType: 'all' as NoteSourceType | 'all',
    category: 'all' as NoteCategory | 'all',
    sortBy: 'CreatedAt' as NoteSortBy,
    sortDirection: 'Descending' as SortDirection,
    createdFrom: "",
    createdTo: "",
    updatedFrom: "",
    updatedTo: "",
};

// --- Главный компонент ---
export function NoteCreator() {
    const queryClient = useQueryClient();
    const { openNoteInCurrentTab } = useTabs();

    // === Состояние создания заметки (Текст) ===
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    // === Состояние создания заметки (Аудио) ===
    const [isRecordingMode, setIsRecordingMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    // Ссылки для записи аудио
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Ссылки для визуализатора звука
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    // === Состояние поиска и фильтров ===
    const [searchTerm, setSearchTerm] = useState(DEFAULT_FILTERS.searchTerm);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isFiltersOpen, setFiltersOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchMode, setSearchMode] = useState<SearchMode>(DEFAULT_FILTERS.searchMode);
    const [status, setStatus] = useState<NoteStatus | 'all'>(DEFAULT_FILTERS.status);
    const [sourceType, setSourceType] = useState<NoteSourceType | 'all'>(DEFAULT_FILTERS.sourceType);
    const [category, setCategory] = useState<NoteCategory | 'all'>(DEFAULT_FILTERS.category);
    const [sortBy, setSortBy] = useState<NoteSortBy>(DEFAULT_FILTERS.sortBy);
    const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_FILTERS.sortDirection);
    const [createdFrom, setCreatedFrom] = useState(DEFAULT_FILTERS.createdFrom);
    const [createdTo, setCreatedTo] = useState(DEFAULT_FILTERS.createdTo);
    const [updatedFrom, setUpdatedFrom] = useState(DEFAULT_FILTERS.updatedFrom);
    const [updatedTo, setUpdatedTo] = useState(DEFAULT_FILTERS.updatedTo);

    // === Мутации ===
    const createTextMutation = useMutation({
        mutationFn: notesApi.createDirectText,
    });

    const createAudioMutation = useMutation({
        mutationFn: ({ title, file }: { title: string; file: File }) =>
            notesApi.createFromAudio(title, file),
    });

    // --- Логика создания текстовой заметки ---
    const handleCreateText = () => {
        if (!content.trim()) return;

        const finalTitle = title.trim()
            ? title.trim()
            : content.split('\n')[0].substring(0, 50) || "Новая заметка";

        createTextMutation.mutate(
            { title: finalTitle, content },
            {
                onSuccess: async (data) => {
                    await queryClient.invalidateQueries({ queryKey: ['notes'] });
                    openNoteInCurrentTab(data.id, finalTitle);
                    setTitle("");
                    setContent("");
                }
            }
        );
    };

    // --- Логика создания аудио заметки ---
    const handleCreateAudio = () => {
        if (!audioBlob) return;

        // Генерация красивого дефолтного названия, если пользователь не ввел свое
        const finalTitle = title.trim() || `Аудиозаметка от ${format(new Date(), "dd.MM.yyyy, HH:mm", { locale: ru })}`;

        // Создаем File с расширением .webm и MIME-типом audio/webm
        const audioFile = new File([audioBlob], "recording.webm", {
            type: 'audio/webm',
            lastModified: Date.now()
        });

        createAudioMutation.mutate(
            { title: finalTitle, file: audioFile },
            {
                onSuccess: async (data) => {
                    await queryClient.invalidateQueries({ queryKey: ['notes'] });
                    openNoteInCurrentTab(data.id, finalTitle);
                    setTitle("");
                    cancelAudio();
                }
            }
        );
    };

    // === ЛОГИКА ЗАПИСИ АУДИО И ВИЗУАЛИЗАЦИИ ===

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyser = analyserRef.current;

        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barCount = 40;
        const step = Math.floor(bufferLength / barCount);
        const barWidth = (canvas.width / barCount) - 2;

        // Рисуем столбцы
        for (let i = 0; i < barCount; i++) {
            let sum = 0;
            for(let j = 0; j < step; j++) {
                sum += dataArray[i * step + j];
            }
            const average = sum / step;

            // Нормализация высоты
            const barHeight = (average / 255) * canvas.height;
            const x = i * (barWidth + 2);
            const y = canvas.height - barHeight;

            // Цвет: синий во время записи, серый на паузе
            ctx.fillStyle = mediaRecorderRef.current?.state === 'paused' ? '#a1a1aa' : '#3b82f6';

            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(x, y, barWidth, barHeight, 2);
            } else {
                ctx.fillRect(x, y, barWidth, barHeight);
            }
            ctx.fill();
        }

        animationRef.current = requestAnimationFrame(drawVisualizer);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 1. Инициализация MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop()); // Выключаем микрофон
            };

            // 2. Инициализация Web Audio API для визуализатора
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;

            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioCtxRef.current = audioCtx;
            analyserRef.current = analyser;

            // 3. Запуск записи и анимации
            mediaRecorder.start();
            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            drawVisualizer();

        } catch (err) {
            console.error("Ошибка доступа к микрофону:", err);
            alert("Не удалось получить доступ к микрофону. Проверьте разрешения в браузере.");
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) clearInterval(timerRef.current);
            audioCtxRef.current?.suspend(); // Приостанавливаем контекст, чтобы "заморозить" график
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current?.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            audioCtxRef.current?.resume();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (timerRef.current) clearInterval(timerRef.current);

            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioCtxRef.current?.state !== 'closed') {
                audioCtxRef.current?.close().catch(() => {});
            }
        }
    };

    const cancelAudio = () => {
        setAudioBlob(null);
        setRecordingTime(0);

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
        setIsPaused(false);
        setIsRecordingMode(false);

        if (timerRef.current) clearInterval(timerRef.current);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (audioCtxRef.current?.state !== 'closed') {
            audioCtxRef.current?.close().catch(() => {});
        }
    };

    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioCtxRef.current?.state !== 'closed') {
                audioCtxRef.current?.close().catch(() => {});
            }
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && e.currentTarget.tagName === 'TEXTAREA') {
            e.preventDefault();
            handleCreateText();
        }
    };

    // === Debounce поиска ===
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // === Проверка активных фильтров ===
    const hasActiveFilters =
        status !== DEFAULT_FILTERS.status ||
        sourceType !== DEFAULT_FILTERS.sourceType ||
        category !== DEFAULT_FILTERS.category ||
        createdFrom !== DEFAULT_FILTERS.createdFrom ||
        createdTo !== DEFAULT_FILTERS.createdTo ||
        updatedFrom !== DEFAULT_FILTERS.updatedFrom ||
        updatedTo !== DEFAULT_FILTERS.updatedTo ||
        sortBy !== DEFAULT_FILTERS.sortBy ||
        sortDirection !== DEFAULT_FILTERS.sortDirection;

    const activeFiltersCount = [
        status !== DEFAULT_FILTERS.status,
        sourceType !== DEFAULT_FILTERS.sourceType,
        category !== DEFAULT_FILTERS.category,
        createdFrom || createdTo,
        updatedFrom || updatedTo,
    ].filter(Boolean).length;

    const queryParams: GetNotesParams = {
        searchTerm: debouncedSearch || undefined,
        searchMode: searchMode,
        status: status !== 'all' ? status : undefined,
        sourceType: sourceType !== 'all' ? sourceType : undefined,
        category: category !== 'all' ? category : undefined,
        createdFrom: createdFrom ? new Date(createdFrom).toISOString() : undefined,
        createdTo: createdTo ? new Date(createdTo).toISOString() : undefined,
        updatedFrom: updatedFrom ? new Date(updatedFrom).toISOString() : undefined,
        updatedTo: updatedTo ? new Date(updatedTo).toISOString() : undefined,
        sortBy,
        sortDirection,
        page: currentPage,
        pageSize: 20,
    };

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['notes', 'search', queryParams],
        queryFn: () => notesApi.getAll(queryParams),
    });

    const handleNoteClick = (noteId: string, noteTitle: string) => {
        openNoteInCurrentTab(noteId, noteTitle || "Без названия");
    };

    const handleSearchModeChange = () => {
        setSearchMode(prev => prev === 'Semantic' ? 'Title' : 'Semantic');
        setCurrentPage(1);
    };

    const handleFilterChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (value: T) => {
        setter(value);
        setCurrentPage(1);
    };

    const handleSearchTermChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setSearchTerm(DEFAULT_FILTERS.searchTerm);
        setSearchMode(DEFAULT_FILTERS.searchMode);
        setStatus(DEFAULT_FILTERS.status);
        setSourceType(DEFAULT_FILTERS.sourceType);
        setCategory(DEFAULT_FILTERS.category);
        setSortBy(DEFAULT_FILTERS.sortBy);
        setSortDirection(DEFAULT_FILTERS.sortDirection);
        setCreatedFrom(DEFAULT_FILTERS.createdFrom);
        setCreatedTo(DEFAULT_FILTERS.createdTo);
        setUpdatedFrom(DEFAULT_FILTERS.updatedFrom);
        setUpdatedTo(DEFAULT_FILTERS.updatedTo);
        setCurrentPage(1);
    };

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

    const isSemanticSearch = searchMode === 'Semantic' && !!debouncedSearch;

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

    const isPendingAny = createTextMutation.isPending || createAudioMutation.isPending;

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            <ScrollArea className="flex-1">
                {/* === СЕКЦИЯ СОЗДАНИЯ ЗАМЕТКИ === */}
                <div className="border-b border-zinc-100 bg-white">
                    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
                        <h1 className="text-3xl font-light text-zinc-800 text-center mb-6">
                            What would you like to create?
                        </h1>

                        {/* Название */}
                        <div className="relative bg-zinc-100 rounded-2xl border border-zinc-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all mb-4">
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={isRecordingMode ? "Название аудиозаметки (необязательно)" : "Название заметки (необязательно)"}
                                className="w-full bg-transparent border-none focus-visible:ring-0 text-lg px-4 py-3 placeholder:text-zinc-400"
                            />
                        </div>

                        {/* Контент или аудио-рекордер */}
                        <div className="relative bg-zinc-100 rounded-2xl border border-zinc-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">

                            {isRecordingMode ? (
                                <div className="flex flex-col items-center justify-center min-h-[140px] p-6 text-zinc-800">
                                    {audioBlob ? (
                                        // Показ готового аудио перед отправкой
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            <audio
                                                controls
                                                src={URL.createObjectURL(audioBlob)}
                                                className="w-full max-w-md h-10"
                                            />
                                            <Button variant="ghost" size="sm" onClick={cancelAudio} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4 mr-2" /> Удалить запись
                                            </Button>
                                        </div>
                                    ) : (
                                        // Процесс записи
                                        <div className="flex flex-col items-center gap-4 w-full">

                                            {/* Визуализатор Canvas */}
                                            <div className={cn(
                                                "w-full max-w-[280px] h-12 flex justify-center items-end bg-white/50 rounded-lg p-1 border border-zinc-200/50 transition-opacity",
                                                !isRecording && "opacity-50"
                                            )}>
                                                <canvas
                                                    ref={canvasRef}
                                                    width={280}
                                                    height={40}
                                                    className="w-full h-full"
                                                />
                                            </div>

                                            <div className={cn(
                                                "text-3xl font-mono transition-colors tracking-tight",
                                                isRecording && !isPaused ? "text-red-500" : "text-zinc-600"
                                            )}>
                                                {formatTime(recordingTime)}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {!isRecording ? (
                                                    <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600 text-white rounded-full h-14 w-14 shadow-md">
                                                        <Mic className="h-6 w-6" />
                                                    </Button>
                                                ) : (
                                                    <>
                                                        {isPaused ? (
                                                            <Button onClick={resumeRecording} variant="outline" className="rounded-full h-14 w-14 border-zinc-300">
                                                                <Play className="h-6 w-6 text-zinc-700" />
                                                            </Button>
                                                        ) : (
                                                            <Button onClick={pauseRecording} variant="outline" className="rounded-full h-14 w-14 border-zinc-300">
                                                                <Pause className="h-6 w-6 text-zinc-700" />
                                                            </Button>
                                                        )}
                                                        <Button onClick={stopRecording} className="bg-zinc-800 hover:bg-zinc-900 text-white rounded-full h-14 w-14 shadow-md">
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
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Напишите заметку или идею..."
                                    className="w-full min-h-[120px] resize-none bg-transparent border-none focus-visible:ring-0 text-lg p-4 placeholder:text-zinc-400"
                                    autoFocus
                                />
                            )}

                            {/* Toolbar (Скрепка, Микрофон, Отправить) */}
                            <div className="flex justify-between items-center p-3 bg-zinc-100/50 rounded-b-2xl border-t border-zinc-200">
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-600 rounded-full h-8 w-8">
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={isRecordingMode ? "secondary" : "ghost"}
                                        size="icon"
                                        onClick={() => {
                                            if (isRecordingMode) {
                                                cancelAudio();
                                            } else {
                                                setIsRecordingMode(true);
                                            }
                                        }}
                                        className={cn(
                                            "rounded-full h-8 w-8 transition-colors",
                                            isRecordingMode ? "text-blue-600 bg-blue-100 hover:bg-blue-200" : "text-zinc-400 hover:text-zinc-600"
                                        )}
                                        title="Голосовая заметка"
                                    >
                                        <Mic className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button
                                    onClick={isRecordingMode ? handleCreateAudio : handleCreateText}
                                    disabled={
                                        isRecordingMode
                                            ? (!audioBlob || isPendingAny)
                                            : (!content.trim() || isPendingAny)
                                    }
                                    size="icon"
                                    className={cn(
                                        "rounded-xl transition-all",
                                        (isRecordingMode ? audioBlob : content.trim())
                                            ? 'bg-blue-600 hover:bg-blue-700 shadow-md'
                                            : 'bg-zinc-300'
                                    )}
                                >
                                    {isPendingAny ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ArrowUp className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === СЕКЦИЯ ПОИСКА === */}
                <div className="border-b border-zinc-100 bg-white">
                    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <Search className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900">Поиск заметок</h2>
                                <p className="text-xs text-zinc-500">Найдите нужную информацию по всей базе знаний</p>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => handleSearchTermChange(e.target.value)}
                                placeholder={
                                    searchMode === 'Semantic'
                                        ? "Семантический поиск по смыслу содержимого..."
                                        : "Поиск по названию заметки..."
                                }
                                className="w-full h-12 pl-12 pr-32 text-base bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-blue-500"
                            />

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
                                        {activeFiltersCount > 0 && (
                                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                                                {activeFiltersCount}
                                            </span>
                                        )}
                                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isFiltersOpen && "rotate-180")} />
                                    </Button>
                                </CollapsibleTrigger>

                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetFilters}
                                        className="h-8 px-3 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <X className="h-3 w-3 mr-1" />
                                        Сбросить всё
                                    </Button>
                                )}
                            </div>

                            <CollapsibleContent className="mt-4 space-y-4">
                                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Filter className="h-4 w-4 text-zinc-400" />
                                        <span className="text-xs font-medium text-zinc-700">Фильтры</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Статус</label>
                                            <Select value={status} onValueChange={handleFilterChange(setStatus)}>
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

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Тип</label>
                                            <Select value={sourceType} onValueChange={handleFilterChange(setSourceType)}>
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

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Категория</label>
                                            <Select value={category} onValueChange={handleFilterChange(setCategory)}>
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
                                    </div>
                                </div>

                                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CalendarDays className="h-4 w-4 text-zinc-400" />
                                        <span className="text-xs font-medium text-zinc-700">Период</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Дата создания</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] text-zinc-400">От</span>
                                                    <Input
                                                        type="date"
                                                        value={createdFrom}
                                                        onChange={(e) => handleFilterChange(setCreatedFrom)(e.target.value)}
                                                        className="h-9 text-xs bg-white"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] text-zinc-400">До</span>
                                                    <Input
                                                        type="date"
                                                        value={createdTo}
                                                        onChange={(e) => handleFilterChange(setCreatedTo)(e.target.value)}
                                                        className="h-9 text-xs bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Дата обновления</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] text-zinc-400">От</span>
                                                    <Input
                                                        type="date"
                                                        value={updatedFrom}
                                                        onChange={(e) => handleFilterChange(setUpdatedFrom)(e.target.value)}
                                                        className="h-9 text-xs bg-white"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] text-zinc-400">До</span>
                                                    <Input
                                                        type="date"
                                                        value={updatedTo}
                                                        onChange={(e) => handleFilterChange(setUpdatedTo)(e.target.value)}
                                                        className="h-9 text-xs bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={cn(
                                    "p-4 bg-zinc-50 rounded-xl border border-zinc-100 transition-opacity",
                                    isSemanticSearch && "opacity-50"
                                )}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <ArrowUpDown className="h-4 w-4 text-zinc-400" />
                                            <span className="text-xs font-medium text-zinc-700">Сортировка</span>
                                        </div>
                                        {isSemanticSearch && (
                                            <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                                Сортировка по релевантности
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Сортировать по</label>
                                            <Select
                                                value={sortBy}
                                                onValueChange={handleFilterChange(setSortBy)}
                                                disabled={isSemanticSearch}
                                            >
                                                <SelectTrigger className="h-9 text-xs bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent position="popper" sideOffset={4}>
                                                    <SelectItem value="CreatedAt">Дате создания</SelectItem>
                                                    <SelectItem value="UpdatedAt">Дате обновления</SelectItem>
                                                    <SelectItem value="Title">Названию</SelectItem>
                                                    <SelectItem value="Status">Статусу</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Направление</label>
                                            <Select
                                                value={sortDirection}
                                                onValueChange={handleFilterChange(setSortDirection)}
                                                disabled={isSemanticSearch}
                                            >
                                                <SelectTrigger className="h-9 text-xs bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent position="popper" sideOffset={4}>
                                                    <SelectItem value="Descending">
                                                        {sortBy === 'Title' ? 'Я → А' : sortBy === 'Status' ? 'Z → A' : 'Сначала новые'}
                                                    </SelectItem>
                                                    <SelectItem value="Ascending">
                                                        {sortBy === 'Title' ? 'А → Я' : sortBy === 'Status' ? 'A → Z' : 'Сначала старые'}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>

                {/* === РЕЗУЛЬТАТЫ ПОИСКА === */}
                <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
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
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center">
                                <FileQuestion className="h-8 w-8 text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-zinc-900 mb-1">Заметки не найдены</h3>
                                <p className="text-sm text-zinc-500 max-w-md">
                                    {debouncedSearch || hasActiveFilters
                                        ? "Попробуйте изменить параметры поиска или сбросить фильтры."
                                        : "Создайте свою первую заметку выше."}
                                </p>
                            </div>
                            {hasActiveFilters && (
                                <Button variant="outline" size="sm" onClick={resetFilters}>
                                    <X className="h-3 w-3 mr-1" />
                                    Сбросить фильтры
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data?.notes.map((note) => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    onClick={() => handleNoteClick(note.id, note.title)}
                                />
                            ))}
                        </div>
                    )}

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