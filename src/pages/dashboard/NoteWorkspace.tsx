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
    File,
    Info,
    Plus,
    X,
    MoreVertical,
    Trash2,
    Pencil,
    Mic,
    BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import Markdown from 'react-markdown';
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = 'raw' | 'structured' | 'summary';

// --- Вспомогательные компоненты ---

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

// 1. ИСПРАВЛЕНИЕ: Вынесли ButtonBase наружу и типизировали его
interface ButtonBaseProps {
    icon: React.ElementType;
    text: string;
    onClick: () => void;
    colorClass: string;
    isPending: boolean;
}

const ButtonBase = ({ icon: Icon, text, onClick, colorClass, isPending }: ButtonBaseProps) => (
    <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={isPending}
        className="h-8 text-xs gap-1.5 mr-1 bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 shadow-sm"
    >
        {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
        ) : (
            <Icon className={cn("h-3.5 w-3.5", colorClass)} />
        )}
        {text}
    </Button>
);

interface ActionButtonProps {
    viewMode: ViewMode;
    sourceType?: string;
    onTranscribe: () => void;
    onStructure: () => void;
    onSummarize: () => void;
    isPending: boolean;
}

const ActionButton = ({
                          viewMode,
                          sourceType,
                          onTranscribe,
                          onStructure,
                          onSummarize,
                          isPending
                      }: ActionButtonProps) => {
    // 2. ИСПРАВЛЕНИЕ: Используем вынесенный компонент
    if (viewMode === 'raw' && sourceType === 'AudioFile') {
        return <ButtonBase icon={Mic} text="Transcribe" onClick={onTranscribe} colorClass="text-blue-500" isPending={isPending} />;
    }
    if (viewMode === 'structured') {
        return <ButtonBase icon={FileJson} text="Structure" onClick={onStructure} colorClass="text-purple-500" isPending={isPending} />;
    }
    if (viewMode === 'summary') {
        return <ButtonBase icon={Sparkles} text="Summarize" onClick={onSummarize} colorClass="text-indigo-500" isPending={isPending} />;
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

    const [isEditing, setIsEditing] = useState(false);
    const [localContent, setLocalContent] = useState("");
    const [titleInput, setTitleInput] = useState("");

    const isCreating = id === 'new';

    const { data: note, isLoading, isError } = useQuery({
        queryKey: ['note', id],
        queryFn: () => notesApi.getById(id!),
        enabled: !!id && !isCreating,
    });

    const transcribeMutation = useMutation({
        mutationFn: notesApi.transcribe,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['note', id] })
    });

    const structureMutation = useMutation({
        mutationFn: notesApi.structure,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['note', id] })
    });

    const summarizeMutation = useMutation({
        mutationFn: notesApi.summarize,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['note', id] })
    });

    const saveChangesMutation = useMutation({
        mutationFn: (data: { id: string, title: string, content: string, field: ViewMode }) => {
            const contentField = data.field === 'raw' ? 'rawText' :
                data.field === 'structured' ? 'structuredText' :
                    'summaryText';

            // 3. ИСПРАВЛЕНИЕ: Убрали (notesApi as any), так как метод теперь есть в типах
            return notesApi.update(data.id, {
                title: data.title,
                [contentField]: data.content
            });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['note', id] });
            await queryClient.invalidateQueries({ queryKey: ['notes'] });
        }
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

    useEffect(() => {
        if (note) {
            const content = (() => {
                switch (viewMode) {
                    case 'summary': return note.summaryText || "";
                    case 'structured': return note.structuredText || "";
                    case 'raw': default: return note.rawText || "";
                }
            })();

            if (localContent !== content && !isEditing) {
                setLocalContent(content);
            }

            if (titleInput !== note.title && !isEditing) {
                setTitleInput(note.title || "");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [note, viewMode, isEditing]);

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

    const handleDelete = () => {
        if (confirm("Вы уверены, что хотите удалить эту заметку?")) {
            deleteMutation.mutate(id!);
        }
    };

    const toggleEditMode = () => {
        if (isEditing) {
            if (note && id) {
                saveChangesMutation.mutate({
                    id,
                    title: titleInput,
                    content: localContent,
                    field: viewMode
                });
            }
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    };

    const renderContent = () => {
        if (isCreating) return <NoteCreator />;
        if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-zinc-400"/></div>;
        if (isError || !note) return <div className="flex h-full items-center justify-center text-zinc-400">Заметка не найдена</div>;

        return (
            <div className="max-w-4xl mx-auto p-8 lg:p-12 h-full flex flex-col">

                {isEditing ? (
                    <input
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        className="text-3xl font-bold text-zinc-900 mb-8 leading-tight tracking-tight outline-none bg-transparent border-none w-full p-0 focus:ring-0 placeholder:text-zinc-300"
                        placeholder="Без названия"
                    />
                ) : (
                    <h1 className="text-3xl font-bold text-zinc-900 mb-8 leading-tight tracking-tight outline-none cursor-default">
                        {titleInput || "Без названия"}
                    </h1>
                )}

                <div className={cn(
                    "flex-1 outline-none relative",
                    !isEditing && "prose prose-zinc max-w-none text-zinc-800 leading-7"
                )}>
                    {isEditing ? (
                        <Textarea
                            value={localContent}
                            onChange={(e) => setLocalContent(e.target.value)}
                            className="w-full h-full min-h-[60vh] resize-none bg-transparent border-0 focus-visible:ring-0 p-0 text-base leading-relaxed font-mono text-zinc-800"
                            placeholder="Начните писать..."
                        />
                    ) : (
                        localContent ? (
                            <Markdown>
                                {localContent}
                            </Markdown>
                        ) : (
                            <span className="text-zinc-400 italic">Нет содержимого</span>
                        )
                    )}
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

                                {/* КНОПКА ДЕЙСТВИЯ (Transcribe / Structure / Summarize) */}
                                <ActionButton
                                    viewMode={viewMode}
                                    sourceType={note.sourceType}
                                    onTranscribe={() => transcribeMutation.mutate(note.id)}
                                    onStructure={() => structureMutation.mutate(note.id)}
                                    onSummarize={() => summarizeMutation.mutate(note.id)}
                                    isPending={transcribeMutation.isPending || structureMutation.isPending || summarizeMutation.isPending}
                                />

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

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 gap-1.5 text-xs font-normal transition-colors",
                                        isEditing
                                            ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                            : "text-zinc-500 hover:text-zinc-700"
                                    )}
                                    onClick={toggleEditMode}
                                    title={isEditing ? "Сохранить и читать" : "Редактировать"}
                                >
                                    {isEditing ? (
                                        <>
                                            <BookOpen className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Preview</span>
                                        </>
                                    ) : (
                                        <>
                                            <Pencil className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Edit</span>
                                        </>
                                    )}
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-700">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
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
                                        <div className="flex justify-between text-xs"><span className="text-zinc-400">Обновлено</span><span className="text-zinc-600">{note.updatedAt ? format(new Date(note.updatedAt), "dd.MM.yyyy HH:mm") : "-"}</span></div>
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