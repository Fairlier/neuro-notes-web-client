import { ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import type { GetNotesParams } from "../types/notesTypes";

interface NoteFiltersProps {
    filters: GetNotesParams;
    onChange: <K extends keyof GetNotesParams>(key: K, value: GetNotesParams[K]) => void;
    isSemanticSearch: boolean;
}

export const NoteFilters = ({ filters, onChange, isSemanticSearch }: NoteFiltersProps) => {
    return (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border animate-in fade-in duration-200 flex flex-col gap-5">

            {/* Блок Фильтров (Статусы и Категории) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Статус</label>
                    <Select
                        value={filters.status || "all"}
                        onValueChange={(v) => onChange("status", v === "all" ? undefined : v as GetNotesParams['status'])}
                    >
                        <SelectTrigger className="h-9 text-xs bg-background">
                            <SelectValue placeholder="Все" />
                        </SelectTrigger>
                        {/* ДОБАВЛЕН bg-background и shadow-md */}
                        <SelectContent className="bg-background shadow-md">
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
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Тип</label>
                    <Select
                        value={filters.sourceType || "all"}
                        onValueChange={(v) => onChange("sourceType", v === "all" ? undefined : v as GetNotesParams['sourceType'])}
                    >
                        <SelectTrigger className="h-9 text-xs bg-background">
                            <SelectValue placeholder="Все" />
                        </SelectTrigger>
                        {/* ДОБАВЛЕН bg-background и shadow-md */}
                        <SelectContent className="bg-background shadow-md">
                            <SelectItem value="all">Все типы</SelectItem>
                            <SelectItem value="DirectText">Текст</SelectItem>
                            <SelectItem value="AudioFile">Аудио</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Категория</label>
                    <Select
                        value={filters.category || "all"}
                        onValueChange={(v) => onChange("category", v === "all" ? undefined : v as GetNotesParams['category'])}
                    >
                        <SelectTrigger className="h-9 text-xs bg-background">
                            <SelectValue placeholder="Все" />
                        </SelectTrigger>
                        {/* ДОБАВЛЕН bg-background и shadow-md */}
                        <SelectContent className="bg-background shadow-md">
                            <SelectItem value="all">Все категории</SelectItem>
                            <SelectItem value="Work">Работа</SelectItem>
                            <SelectItem value="Personal">Личное</SelectItem>
                            <SelectItem value="Ideas">Идеи</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Внутренний разделитель */}
            <div className="h-px bg-border w-full" />

            {/* Блок Сортировки */}
            <div className={cn(
                "flex flex-col gap-3 transition-opacity",
                isSemanticSearch && "opacity-50"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium">Сортировка</span>
                    </div>
                    {isSemanticSearch && (
                        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                            AI Сортировка
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        disabled={isSemanticSearch}
                        value={filters.sortBy || "CreatedAt"}
                        onValueChange={(v) => onChange("sortBy", v as GetNotesParams['sortBy'])}
                    >
                        <SelectTrigger className="h-9 text-xs bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        {/* ДОБАВЛЕН bg-background и shadow-md */}
                        <SelectContent className="bg-background shadow-md">
                            <SelectItem value="CreatedAt">Дате создания</SelectItem>
                            <SelectItem value="UpdatedAt">Дате обновления</SelectItem>
                            <SelectItem value="Title">Названию</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        disabled={isSemanticSearch}
                        value={filters.sortDirection || "Descending"}
                        onValueChange={(v) => onChange("sortDirection", v as GetNotesParams['sortDirection'])}
                    >
                        <SelectTrigger className="h-9 text-xs bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        {/* ДОБАВЛЕН bg-background и shadow-md */}
                        <SelectContent className="bg-background shadow-md">
                            <SelectItem value="Descending">По убыванию</SelectItem>
                            <SelectItem value="Ascending">По возрастанию</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

        </div>
    );
};