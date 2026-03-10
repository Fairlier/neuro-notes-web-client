import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { Info, MessageSquareText, FileAudio, Trash2, Mic, FileJson, Sparkles } from "lucide-react";
import { NoteChatPanel } from "@/modules/chat";
import { AudioPlayer, notesApi, type NoteDetailsDto } from "@/modules/notes";
import { cn } from "@/shared/lib/utils";

export type SidebarView = 'info' | 'chat' | 'audio';

interface NoteSidebarProps {
    note: NoteDetailsDto;
    sidebarView: SidebarView;
    setSidebarView: (view: SidebarView) => void;
    isRightSidebarOpen: boolean;
    sidebarWidth: number;
    isResizing: boolean;
    handleDelete: () => void;
}

export const NoteSidebar = ({ note, sidebarView, setSidebarView, isRightSidebarOpen, sidebarWidth, isResizing, handleDelete }: NoteSidebarProps) => {
    const queryClient = useQueryClient();

    const transcribeMutation = useMutation({
        mutationFn: notesApi.transcribe,
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['note', note.id] }); }
    });

    const structureMutation = useMutation({
        mutationFn: notesApi.structure,
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['note', note.id] }); }
    });

    const summarizeMutation = useMutation({
        mutationFn: notesApi.summarize,
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['note', note.id] }); }
    });

    if (!isRightSidebarOpen) return null;

    return (
        <aside
            className={cn(
                "bg-muted/30 transition-all overflow-hidden flex flex-col flex-shrink-0 border-l border-border",
                isResizing ? "duration-0" : "duration-300"
            )}
            style={{ width: sidebarWidth }}
        >
            <div className="h-10 border-b border-border flex items-center justify-between px-3 flex-shrink-0 bg-background">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-md", sidebarView === 'info' ? "text-foreground bg-muted" : "text-muted-foreground")} onClick={() => setSidebarView('info')}><Info className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-md", sidebarView === 'chat' ? "text-primary bg-primary/10" : "text-muted-foreground")} onClick={() => setSidebarView('chat')}><MessageSquareText className="h-4 w-4" /></Button>
                    {note.sourceType === 'AudioFile' && (
                        <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-md", sidebarView === 'audio' ? "text-primary bg-primary/10" : "text-muted-foreground")} onClick={() => setSidebarView('audio')}><FileAudio className="h-4 w-4" /></Button>
                    )}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{sidebarView === 'chat' ? 'AI Chat' : sidebarView === 'audio' ? 'Audio' : 'Info'}</span>
            </div>

            {sidebarView === 'chat' && <NoteChatPanel noteId={note.id} />}
            {sidebarView === 'audio' && (
                <ScrollArea className="flex-1 p-4">
                    {note.sourceType === 'AudioFile' && note.hasSourceFile ? (
                        <div className="space-y-3"><div className="text-xs font-medium">Воспроизведение</div><AudioPlayer noteId={note.id} /></div>
                    ) : <div className="text-center text-muted-foreground text-xs py-8">Аудиофайл недоступен.</div>}
                </ScrollArea>
            )}
            {sidebarView === 'info' && (
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                        <div className="text-xs font-medium">Свойства</div>
                        <div className="space-y-2 text-xs">
                            {/* Статус в инфо */}
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Статус</span>
                                <span className="font-medium text-[10px]">{note.status}</span>
                            </div>
                            {/* Тип заметки */}
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Тип</span>
                                <span className="font-medium">{note.sourceType === 'AudioFile' ? 'Аудио' : 'Текст'}</span>
                            </div>
                            {/* Категория */}
                            {note.category && (
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Категория</span>
                                    <span className="font-medium">{note.category}</span>
                                </div>
                            )}
                            <Separator className="my-2 opacity-50" />
                            {/* Даты */}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Создано</span>
                                <span>{format(new Date(note.createdAt), "dd.MM.yyyy HH:mm")}</span>
                            </div>
                            {note.updatedAt && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Обновлено</span>
                                    <span>{format(new Date(note.updatedAt), "dd.MM.yyyy HH:mm")}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator className="my-5 bg-border" />

                    <div className="space-y-3">
                        <div className="text-xs font-medium">Действия</div>
                        <div className="flex flex-col gap-2">
                            {note.sourceType === 'AudioFile' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => transcribeMutation.mutate(note.id)}
                                    disabled={transcribeMutation.isPending}
                                    className="w-full justify-start h-8 text-xs font-normal rounded-md"
                                >
                                    <Mic className="mr-2 h-3.5 w-3.5" /> Транскрибировать
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => structureMutation.mutate(note.id)}
                                disabled={structureMutation.isPending}
                                className="w-full justify-start h-8 text-xs font-normal rounded-md"
                            >
                                <FileJson className="mr-2 h-3.5 w-3.5" /> Структурировать
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => summarizeMutation.mutate(note.id)}
                                disabled={summarizeMutation.isPending}
                                className="w-full justify-start h-8 text-xs font-normal rounded-md"
                            >
                                <Sparkles className="mr-2 h-3.5 w-3.5" /> Сделать резюме
                            </Button>
                        </div>
                    </div>

                    <Separator className="my-5 bg-border" />

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 h-8 text-xs font-normal rounded-md"
                        onClick={handleDelete}
                    >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Удалить заметку
                    </Button>
                </ScrollArea>
            )}
        </aside>
    );
};