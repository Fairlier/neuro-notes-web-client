import { useTranslation } from 'react-i18next';
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import type { GetNotesParams } from "../types/notesTypes";

interface NoteFiltersProps {
    filters: GetNotesParams;
    onChange: <K extends keyof GetNotesParams>(key: K, value: GetNotesParams[K]) => void;
    onClear: () => void;
    isSemanticSearch: boolean;
}

export const NoteFilters = ({ filters, onChange, onClear, isSemanticSearch }: NoteFiltersProps) => {
    const { t } = useTranslation();

    const hasActiveFilters = !!(
        filters.status ||
        filters.sourceType ||
        filters.category ||
        (filters.sortBy && filters.sortBy !== "UpdatedAt") ||
        (filters.sortDirection && filters.sortDirection !== "Descending")
    );

    return (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border animate-in fade-in duration-200 flex flex-col gap-5">

            {/* Шапка с зарезервированным местом под кнопку (h-7) */}
            <div className="flex items-center justify-between h-7 -mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t('noteCreator.filters.title')}
                </span>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className={cn(
                        "h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-md transition-all duration-200",
                        !hasActiveFilters && "opacity-0 pointer-events-none"
                    )}
                >
                    <X className="h-3 w-3 mr-1" /> {t('noteCreator.filters.reset')}
                </Button>
            </div>

            {/* Блок Фильтров */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {t('noteCreator.filters.status.label')}
                    </label>
                    <Select
                        value={filters.status || "all"}
                        onValueChange={(v) => onChange("status", v === "all" ? undefined : v as GetNotesParams['status'])}
                    >
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder={t('noteCreator.filters.status.all')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('noteCreator.filters.status.all')}</SelectItem>
                            <SelectItem value="Pending">{t('note.status.Pending')}</SelectItem>
                            <SelectItem value="Raw">{t('note.status.Raw')}</SelectItem>
                            <SelectItem value="Structured">{t('note.status.Structured')}</SelectItem>
                            <SelectItem value="Summarized">{t('note.status.Summarized')}</SelectItem>
                            <SelectItem value="Failed">{t('note.status.Failed')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {t('noteCreator.filters.type.label')}
                    </label>
                    <Select
                        value={filters.sourceType || "all"}
                        onValueChange={(v) => onChange("sourceType", v === "all" ? undefined : v as GetNotesParams['sourceType'])}
                    >
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder={t('noteCreator.filters.type.all')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('noteCreator.filters.type.all')}</SelectItem>
                            <SelectItem value="DirectText">{t('noteCreator.filters.type.text')}</SelectItem>
                            <SelectItem value="AudioFile">{t('noteCreator.filters.type.audio')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {t('noteCreator.filters.category.label')}
                    </label>
                    <Select
                        value={filters.category || "all"}
                        onValueChange={(v) => onChange("category", v === "all" ? undefined : v as GetNotesParams['category'])}
                    >
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder={t('noteCreator.filters.category.all')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('noteCreator.filters.category.all')}</SelectItem>
                            <SelectItem value="Work">{t('note.category.Work')}</SelectItem>
                            <SelectItem value="Personal">{t('note.category.Personal')}</SelectItem>
                            <SelectItem value="Idea">{t('note.category.Idea')}</SelectItem>
                            <SelectItem value="Study">{t('note.category.Study')}</SelectItem>
                            <SelectItem value="Other">{t('note.category.Other')}</SelectItem>
                            <SelectItem value="Finance">{t('note.category.Finance')}</SelectItem>
                            <SelectItem value="Reference">{t('note.category.Reference')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="h-px bg-border w-full" />

            {/* Блок Сортировки */}
            <div className={cn(
                "flex flex-col gap-3 transition-opacity",
                isSemanticSearch && "opacity-50"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            {t('noteCreator.filters.sort.label')}
                        </span>
                    </div>
                    {isSemanticSearch && (
                        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                            {t('noteCreator.filters.sort.aiSort')}
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        disabled={isSemanticSearch}
                        value={filters.sortBy || "UpdatedAt"}
                        onValueChange={(v) => onChange("sortBy", v as GetNotesParams['sortBy'])}
                    >
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="UpdatedAt">{t('noteCreator.filters.sort.byUpdatedAt')}</SelectItem>
                            <SelectItem value="CreatedAt">{t('noteCreator.filters.sort.byCreatedAt')}</SelectItem>
                            <SelectItem value="Title">{t('noteCreator.filters.sort.byTitle')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        disabled={isSemanticSearch}
                        value={filters.sortDirection || "Descending"}
                        onValueChange={(v) => onChange("sortDirection", v as GetNotesParams['sortDirection'])}
                    >
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Descending">{t('noteCreator.filters.sort.descending')}</SelectItem>
                            <SelectItem value="Ascending">{t('noteCreator.filters.sort.ascending')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};