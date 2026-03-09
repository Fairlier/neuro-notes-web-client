import { format } from "date-fns";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { Info, MessageSquareText, FileAudio, Trash2 } from "lucide-react";
import { NoteChatPanel } from "@/modules/chat";
import { AudioPlayer, type NoteDetailsDto } from "@/modules/notes";
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
                            <div className="flex justify-between"><span className="text-muted-foreground">Создано</span><span>{format(new Date(note.createdAt), "dd.MM.yyyy HH:mm")}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="text-muted-foreground font-mono text-[10px] truncate max-w-[120px]">{note.id}</span></div>
                        </div>
                    </div>
                    <Separator className="my-5 bg-border" />
                    <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 h-8 text-xs font-normal rounded-md" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Удалить заметку
                    </Button>
                </ScrollArea>
            )}
        </aside>
    );
};