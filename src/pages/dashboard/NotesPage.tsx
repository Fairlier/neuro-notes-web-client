import { useQuery } from "@tanstack/react-query";
import { notesApi } from "@/api/notes.ts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Plus, Mic, FileText, File, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Link } from "react-router-dom";

import { NoteStatus, NoteSourceType } from "@/types/notes.ts";

const getStatusConfig = (status: NoteStatus) => {
    switch (status) {
        case NoteStatus.PendingResource:
            return { color: "bg-zinc-100 text-zinc-600 border-zinc-200", label: "Ожидание", icon: null };
        case NoteStatus.Processing:
            return { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Обработка...", icon: <Loader2 className="h-3 w-3 animate-spin mr-1"/> };
        case NoteStatus.Failed:
            return { color: "bg-red-50 text-red-700 border-red-200", label: "Ошибка", icon: <AlertCircle className="h-3 w-3 mr-1"/> };
        case NoteStatus.Raw:
            return { color: "bg-orange-50 text-orange-700 border-orange-200", label: "Черновик", icon: null };
        case NoteStatus.Structured:
            return { color: "bg-purple-50 text-purple-700 border-purple-200", label: "Структурировано", icon: null };
        case NoteStatus.Completed:
            return { color: "bg-green-50 text-green-700 border-green-200", label: "Готово", icon: <CheckCircle2 className="h-3 w-3 mr-1"/> };
        default:
            return { color: "bg-zinc-100", label: status, icon: null };
    }
};

const SourceIcon = ({ type }: { type: NoteSourceType }) => {
    switch (type) {
        case NoteSourceType.AudioFile: return <Mic className="h-4 w-4 text-blue-500" />;
        case NoteSourceType.TextFile: return <File className="h-4 w-4 text-zinc-500" />;
        case NoteSourceType.DirectText: return <FileText className="h-4 w-4 text-orange-500" />;
        default: return <File className="h-4 w-4" />;
    }
};

export default function NotesPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['notes'],
        queryFn: notesApi.getAll,
    });

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200">
                Не удалось загрузить заметки. Возможно, сервер недоступен.
            </div>
        );
    }

    const notes = data?.notes || [];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Заметки</h2>
                    <p className="text-zinc-500 mt-1">Здесь хранятся ваши записи и их AI-анализ.</p>
                </div>
                <Button className="shadow-lg shadow-blue-500/20">
                    <Plus className="mr-2 h-4 w-4" /> Создать новую
                </Button>
            </div>

            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                    <div className="h-12 w-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-900">Список пуст</h3>
                    <p className="text-zinc-500 mb-6 text-sm">У вас пока нет ни одной заметки.</p>
                    <Button variant="outline">Создать первую заметку</Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {notes.map((note) => {
                        const statusConfig = getStatusConfig(note.status);
                        return (
                            <Link to={`/notes/${note.id}`} key={note.id} className="block group h-full">
                                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-zinc-200 group-hover:border-blue-300/50">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <CardTitle className="line-clamp-2 text-lg leading-tight group-hover:text-blue-700 transition-colors">
                                                {note.title || "Без названия"}
                                            </CardTitle>
                                            <div className="shrink-0 mt-1">
                                                <SourceIcon type={note.sourceType} />
                                            </div>
                                        </div>

                                        <div className="pt-2 flex items-center gap-2">
                                            <div className={`flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${statusConfig.color}`}>
                                                {statusConfig.icon}
                                                {statusConfig.label}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-xs">
                                            Создано: {format(new Date(note.createdAt), "d MMMM yyyy, HH:mm", { locale: ru })}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}