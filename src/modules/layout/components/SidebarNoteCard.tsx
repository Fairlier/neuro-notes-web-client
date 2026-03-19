import { useTranslation } from 'react-i18next';
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { enUS } from "date-fns/locale/en-US";
import { FileText, FileAudio, Calendar } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import type { NoteListItemDto, NoteStatus } from "@/modules/notes/types/notesTypes";

interface SidebarNoteCardProps {
    note: NoteListItemDto;
    isActive: boolean;
    onClick: (e: React.MouseEvent, noteId: string, noteTitle: string) => void;
}

const statusBorderColors: Record<NoteStatus, string> = {
    'Pending': 'bg-muted-foreground/40',
    'Failed': 'bg-red-500',
    'Raw': 'bg-amber-500',
    'Structured': 'bg-sky-500',
    'Summarized': 'bg-emerald-500',
};

export const SidebarNoteCard = ({ note, isActive, onClick }: SidebarNoteCardProps) => {
    const { t, i18n } = useTranslation();

    const dateToUse = note.updatedAt ? new Date(note.updatedAt) : new Date(note.createdAt);
    const isAudio = note.sourceType === 'AudioFile';

    // Функция форматирования даты с учётом локали
    const formatDate = (date: Date) => {
        const locale = i18n.language === 'ru' ? ru : enUS;
        const dateFormat = i18n.language === 'ru' ? "d MMM yyyy" : "MMM d, yyyy";
        return format(date, dateFormat, { locale });
    };

    // Получение локализованной категории
    const getCategoryLabel = (category: string) =>
        t(`note.category.${category}`, { defaultValue: category });

    return (
        <Button
            variant="ghost"
            onClick={(e) => onClick(e, note.id, note.title)}
            className={cn(
                "w-full relative overflow-hidden h-auto py-3 px-3.5 flex flex-col items-start gap-2 text-left font-normal rounded-lg transition-all border group",
                isActive
                    ? "bg-background text-foreground shadow-sm border-border"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground border-transparent"
            )}
        >
            {/* 1. Левая полоска статуса */}
            <div
                className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300",
                    statusBorderColors[note.status]
                )}
            />

            {/* 2. Верхняя часть: Иконка + Заголовок */}
            <div className="flex items-center gap-2.5 w-full min-w-0">
                {/* Иконка в контейнере w-7 */}
                <div className={cn(
                    "h-7 w-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
                    isActive ? "bg-muted text-foreground" : "bg-muted/50 text-muted-foreground group-hover:bg-muted"
                )}>
                    {isAudio ? (
                        <FileAudio className="h-3.5 w-3.5" />
                    ) : (
                        <FileText className="h-3.5 w-3.5" />
                    )}
                </div>

                <span className={cn(
                    "truncate text-sm font-medium flex-1 leading-tight transition-colors",
                    isActive ? "text-foreground" : "group-hover:text-primary"
                )}>
                    {note.title || t('sidebar.untitled')}
                </span>
            </div>

            {/* 3. Метаданные (Дата и категория) */}
            <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground w-full">
                {/* Обертка w-7 для идеальной центровки под верхней иконкой */}
                <div className="w-7 flex justify-center shrink-0">
                    <Calendar className="h-3 w-3" />
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span>{formatDate(dateToUse)}</span>

                    {note.category && (
                        <span className="truncate bg-muted/60 px-1.5 py-0.5 rounded-sm text-[9px] tracking-wider font-semibold">
                            {getCategoryLabel(note.category)}
                        </span>
                    )}
                </div>
            </div>

            {/* 4. Нижняя полоска (Анимация обработки) */}
            {note.isProcessing && (
                <>
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-muted/20 overflow-hidden">
                        <div
                            className="h-full w-1/3 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
                            style={{
                                animation: 'sidebar-shuttle 2s infinite ease-in-out'
                            }}
                        />
                    </div>
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes sidebar-shuttle {
                            0% { transform: translateX(-110%); }
                            100% { transform: translateX(310%); }
                        }
                    `}} />
                </>
            )}
        </Button>
    );
};