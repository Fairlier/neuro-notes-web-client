import { useTranslation } from 'react-i18next';
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { enUS } from "date-fns/locale/en-US";
import { FileText, FileAudio, Calendar } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { NoteListItemDto, NoteStatus } from "@/modules/notes";

interface NoteCardProps {
    note: NoteListItemDto;
    onClick: () => void;
}

export const NoteCard = ({ note, onClick }: NoteCardProps) => {
    const { t, i18n } = useTranslation();

    // Функция форматирования даты с учётом локали
    const formatDate = (dateString: string) => {
        const locale = i18n.language === 'ru' ? ru : enUS;
        const dateFormat = i18n.language === 'ru' ? "d MMM yyyy" : "MMM d, yyyy";
        return format(new Date(dateString), dateFormat, { locale });
    };

    // Получение локализованной категории
    const getCategoryLabel = (category: string) =>
        t(`note.category.${category}`, { defaultValue: category });

    const statusBorderColors: Record<NoteStatus, string> = {
        'Pending': 'bg-muted-foreground/40',
        'Failed': 'bg-red-500',
        'Raw': 'bg-amber-500',
        'Structured': 'bg-sky-500',
        'Summarized': 'bg-emerald-500',
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden bg-card text-card-foreground border border-border rounded-lg p-4",
                "hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
            )}
        >
            {/* 1. ЛЕВАЯ ПОЛОСКА (Статус) */}
            <div
                className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300",
                    statusBorderColors[note.status]
                )}
            />

            {/* Контент карточки: ВЕРХНЯЯ СТРОКА */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Верхняя иконка в контейнере w-8 */}
                    <div className="h-8 w-8 rounded-md flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                        {note.sourceType === 'AudioFile' ? (
                            <FileAudio className="h-4 w-4" />
                        ) : (
                            <FileText className="h-4 w-4" />
                        )}
                    </div>

                    <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                        {note.title || t('sidebar.untitled')}
                    </h3>
                </div>
            </div>

            {/* Контент карточки: НИЖНЯЯ СТРОКА */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-1">
                <div className="flex items-center gap-2">
                    <div className="w-8 flex justify-center shrink-0">
                        <Calendar className="h-3 w-3" />
                    </div>
                    <span>{formatDate(note.createdAt)}</span>
                </div>
                {note.category && (
                    <span className="bg-muted px-2 py-0.5 rounded-sm text-[10px]">
                        {getCategoryLabel(note.category)}
                    </span>
                )}
            </div>

            {/* 2. НИЖНЯЯ ПОЛОСКА (Анимация обработки) */}
            {note.isProcessing && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-muted/20 overflow-hidden">
                    <div
                        className="h-full w-1/3 rounded-full animate-shuttle bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
                        style={{ animation: 'shuttle 2s infinite ease-in-out' }}
                    />
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shuttle {
                    0% { transform: translateX(-110%); }
                    100% { transform: translateX(310%); }
                }
            `}} />
        </div>
    );
};