import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { notesApi } from "@/api/notes";
import { Loader2, Calendar, FileText, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { NoteStatus } from "@/types/notes";

export default function NoteDetailsPage() {
    const { id } = useParams<{ id: string }>();

    const { data: note, isLoading, isError } = useQuery({
        queryKey: ['note', id],
        queryFn: () => notesApi.getById(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-zinc-400"/></div>;
    }

    if (isError || !note) {
        return <div className="flex h-full items-center justify-center text-zinc-400">Заметка не найдена</div>;
    }

    // Логика выбора контента: если есть структурированный (Markdown), показываем его, иначе сырой
    const mainContent = note.structuredText || note.rawText;
    // Флаг, чтобы понимать, показываем мы уже обработанный текст или черновик
    const isStructured = !!note.structuredText;

    return (
        <div className="flex-1 h-full flex flex-col overflow-hidden bg-white">
            {/* Header заметки */}
            <div className="h-14 border-b border-zinc-100 flex items-center justify-between px-8 flex-shrink-0 bg-white">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(note.createdAt), "d MMMM yyyy, HH:mm", { locale: ru })}</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Бейдж статуса */}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        note.status === NoteStatus.Completed ? 'bg-green-50 text-green-700 border-green-200' :
                            note.status === NoteStatus.Processing ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}>
                        {note.status}
                    </span>
                </div>
            </div>

            {/* Контент с прокруткой */}
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full custom-scrollbar">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 leading-tight">
                        {note.title || "Без названия"}
                    </h1>
                </div>

                {/* 1. Блок Summary (Краткое содержание), если есть */}
                {note.summaryText && (
                    <div className="mb-8 p-6 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                        <div className="flex items-center gap-2 mb-2 text-indigo-900 font-semibold text-sm">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                            <span>Краткое содержание (AI)</span>
                        </div>
                        <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {note.summaryText}
                        </div>
                    </div>
                )}

                {/* 2. Основной контент */}
                <div className="prose prose-zinc max-w-none text-zinc-700 text-lg leading-relaxed">
                    {mainContent ? (
                        <div className="whitespace-pre-wrap">
                            {isStructured ? (
                                // Здесь в будущем можно подключить Markdown компонент
                                mainContent
                            ) : (
                                // Если текст сырой (например, просто транскрипция)
                                <span className="text-zinc-600">{mainContent}</span>
                            )}
                        </div>
                    ) : (
                        // Заглушка, если текста вообще нет (ни сырого, ни готового)
                        <div className="py-20 flex flex-col items-center text-center gap-3">
                            <div className="h-12 w-12 bg-zinc-50 rounded-full flex items-center justify-center">
                                <FileText className="h-6 w-6 text-zinc-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-zinc-900 font-medium">Нет содержимого</p>
                                <p className="text-zinc-500 text-sm">Текст заметки еще не обработан или отсутствует.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}