import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "@/api/notes";
import { NoteStatus } from "@/types/notes";
import { useTabs } from "@/features/tabs/TabsContext";
import { NoteCreator } from "@/features/notes/NoteCreator";
import {
    Loader2,
    Sparkles,
    FileJson,
    AlignLeft,
    PanelRightClose,
    PanelRightOpen,
    Edit3,
    File,
    Info,
    Plus,
    X,
    MoreVertical,
    Trash2,
    Pencil,
    Mic
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = 'raw' | 'structured' | 'summary';

// --- Вспомогательные компоненты (Вынесены наружу!) ---

const StatusBadge = ({ status }: { status: NoteStatus }) => {
    const styles = {
        'PendingResource': 'text-zinc-500 bg-zinc-100',
        'Processing': 'text-blue-600 bg-blue-50',
        'Failed': 'text-red-600 bg-red-50',
        'Raw': 'text-orange-600 bg-orange-50',
        'Structured': 'text-purple-600 bg-purple-50',
        'Completed': 'text-green-600 bg-green-50',
    }[status] || 'text-zinc-500 bg-zinc-100';

    return (
        <span className={cn("text-[10px] px-2 py-0.5 rounded-sm font-medium border border-transparent select-none", styles)}>
            {status}
        </span>
    );
};

// Вынесли ActionButton из компонента
const ActionButton = ({ viewMode, sourceType }: { viewMode: ViewMode, sourceType?: string }) => {
    if (viewMode === 'raw' && sourceType === 'AudioFile') {
        return (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 mr-1 bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 shadow-sm">
                <Mic className="h-3.5 w-3.5 text-blue-500" />
                Transcribe
            </Button>
        );
    }
    if (viewMode === 'structured') {
        return (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 mr-1 bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 shadow-sm">
                <FileJson className="h-3.5 w-3.5 text-purple-500" />
                Structure
            </Button>
        );
    }
    if (viewMode === 'summary') {
        return (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 mr-1 bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Summarize
            </Button>
        );
    }
    return null;
};

export default function NoteWorkspace() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { tabs, activeTabUid, setActiveTabUid, createNewTab, closeTab, ensureActiveTab } = useTabs();

    const [viewMode, setViewMode] = useState<ViewMode>('structured');
    const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);

    const isCreating = id === 'new';

    const { data: note, isLoading, isError } = useQuery({
        queryKey: ['note', id],
        queryFn: () => notesApi.getById(id!),
        enabled: !!id && !isCreating,
    });

    const deleteMutation = useMutation({
        mutationFn: notesApi.delete,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['notes'] });
            if (activeTabUid) {
                closeTab(null, activeTabUid);
            }
        },
        onError: (err) => {
            console.error("Ошибка при удалении:", err);
        }
    });

    const handleDelete = () => {
        if (confirm("Вы уверены, что хотите удалить эту заметку?")) {
            deleteMutation.mutate(id!);
        }
    };

    useEffect(() => {
        if (isCreating) {
            ensureActiveTab('new', 'Новая заметка', '/notes/new');
        } else if (note && id) {
            ensureActiveTab(id, note.title || "Без названия", `/notes/${id}`);
        }
    }, [note, id, isCreating, ensureActiveTab]);

    const handleCreateNew = () => {
        createNewTab();
    };

    const handleTabClick = (uid: string, url: string) => {
        setActiveTabUid(uid);
        navigate(url);
    };

    const renderContent = () => {
        if (isCreating) return <NoteCreator />;
        if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-zinc-400"/></div>;
        if (isError || !note) return <div className="flex h-full items-center justify-center text-zinc-400">Заметка не найдена</div>;

        const text = (() => {
            switch (viewMode) {
                case 'summary': return note.summaryText || "Саммари еще не создано. Нажмите Summarize.";
                case 'structured': return note.structuredText || "Структура еще не создана. Нажмите Structure.";
                case 'raw': default: return note.rawText || "Исходный текст отсутствует.";
            }
        })();

        return (
            <div className="max-w-4xl mx-auto p-8 lg:p-12">
                <h1 className="text-3xl font-bold text-zinc-900 mb-8 leading-tight tracking-tight outline-none">
                    {note.title}
                </h1>
                <div className={cn(
                    "min-h-[50vh] outline-none",
                    viewMode === 'raw' && "font-mono text-sm text-zinc-600 bg-zinc-50/50 p-6 rounded-lg border border-zinc-100 whitespace-pre-wrap leading-relaxed",
                    viewMode === 'structured' && "prose prose-zinc max-w-none text-zinc-800 leading-7 whitespace-pre-wrap",
                    viewMode === 'summary' && "prose prose-zinc max-w-none text-zinc-800 text-lg leading-relaxed whitespace-pre-wrap pl-4 border-l-4 border-indigo-100"
                )}>
                    {text}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-white">

            {/* 1. TAB BAR */}
            <div className="h-10 bg-zinc-100/80 flex items-end justify-between px-2 border-b border-zinc-200 select-none flex-shrink-0 gap-2">
                <div className="flex items-end flex-1 overflow-x-auto no-scrollbar mask-gradient-right">
                    {tabs.map((tab) => {
                        const isActive = tab.uid === activeTabUid;
                        return (
                            <div
                                key={tab.uid}
                                onClick={() => handleTabClick(tab.uid, tab.url)}
                                className={cn(
                                    "group relative flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] cursor-pointer text-xs font-medium border-t border-x rounded-t-md transition-all mr-[-1px]",
                                    isActive
                                        ? "bg-white border-zinc-200 text-zinc-800 z-10 shadow-sm"
                                        : "bg-zinc-100 border-transparent text-zinc-500 hover:bg-zinc-200/50"
                                )}
                            >
                                <File className={cn("h-3 w-3 shrink-0", isActive ? "text-blue-500" : "text-zinc-400")} />
                                <span className="truncate flex-1">{tab.title}</span>

                                <div
                                    role="button"
                                    onClick={(e) => closeTab(e, tab.uid)}
                                    className={cn(
                                        "opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-zinc-200 transition-opacity",
                                        isActive && "opacity-100"
                                    )}
                                >
                                    <X className="h-3 w-3 text-zinc-400 hover:text-zinc-700" />
                                </div>
                            </div>
                        );
                    })}

                    <div
                        onClick={handleCreateNew}
                        className="flex items-center justify-center h-8 w-8 ml-1 mb-0.5 rounded-md hover:bg-zinc-200 cursor-pointer text-zinc-500 transition-colors"
                        title="Новая вкладка"
                    >
                        <Plus className="h-4 w-4" />
                    </div>
                </div>

                <div className="pb-1.5 pl-2 border-l border-zinc-200/50">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-700" onClick={() => setRightSidebarOpen(!isRightSidebarOpen)}>
                        {isRightSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* MAIN SPLIT AREA */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 bg-white">

                    {/* Toolbar */}
                    {!isCreating && note && (
                        <div className="h-10 border-b border-zinc-100 bg-white flex items-center justify-between px-4 flex-shrink-0 select-none">

                            {/* ЛЕВАЯ ЧАСТЬ */}
                            <div className="flex items-center gap-3">
                                <StatusBadge status={note.status} />

                                <Separator orientation="vertical" className="h-3 bg-zinc-200" />
                                <span className="text-[10px] text-zinc-400 uppercase tracking-wide">
                                    {note.sourceType === 'AudioFile' ? 'Audio' : 'Text'}
                                </span>

                                <span className="text-[10px] text-zinc-400 select-none">
                                    {note.updatedAt
                                        ? format(new Date(note.updatedAt), "d MMM, HH:mm", { locale: ru })
                                        : format(new Date(note.createdAt), "d MMM, HH:mm", { locale: ru })
                                    }
                                </span>
                            </div>

                            {/* ПРАВАЯ ЧАСТЬ */}
                            <div className="flex items-center gap-2">

                                {/* Передаем пропсы в вынесенный компонент */}
                                <ActionButton viewMode={viewMode} sourceType={note.sourceType} />

                                <div className="flex items-center bg-zinc-100/80 rounded-md p-0.5 border border-zinc-200/50">
                                    <button onClick={() => setViewMode('raw')} className={cn("flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded-[4px] transition-all", viewMode === 'raw' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900")}>
                                        <AlignLeft className="h-3 w-3" /> Raw
                                    </button>
                                    <button onClick={() => setViewMode('structured')} className={cn("flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded-[4px] transition-all", viewMode === 'structured' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900")}>
                                        <FileJson className="h-3 w-3" /> Structured
                                    </button>
                                    <button onClick={() => setViewMode('summary')} className={cn("flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded-[4px] transition-all", viewMode === 'summary' ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-900")}>
                                        <Sparkles className="h-3 w-3" /> Summary
                                    </button>
                                </div>

                                <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-200" />

                                <Button variant="ghost" size="sm" className="h-7 px-2 text-zinc-500 gap-1.5 text-xs font-normal">
                                    <Edit3 className="h-3.5 w-3.5" /> Edit
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-700">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => console.log("Rename")}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            <span>Переименовать</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                            onClick={handleDelete}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Удалить</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}
                    <ScrollArea className="flex-1">{renderContent()}</ScrollArea>
                </div>

                {!isCreating && note && (
                    <aside className={cn("bg-zinc-50/80 border-l border-zinc-200 transition-all duration-300 ease-in-out overflow-hidden flex flex-col backdrop-blur-sm flex-shrink-0", isRightSidebarOpen ? "w-[300px] opacity-100" : "w-0 opacity-0")}>
                        <div className="h-9 border-b border-zinc-200/50 flex items-center px-4 flex-shrink-0">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Info className="h-3 w-3" /> Info
                            </span>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="text-xs font-medium text-zinc-900">Свойства</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs"><span className="text-zinc-400">Создано</span><span className="text-zinc-600">{format(new Date(note.createdAt), "dd.MM.yyyy HH:mm")}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-zinc-400">ID</span><span className="text-zinc-400 font-mono text-[10px] truncate max-w-[120px]" title={note.id}>{note.id}</span></div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </aside>
                )}
            </div>
        </div>
    );
}