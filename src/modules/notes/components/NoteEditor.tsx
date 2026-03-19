import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/lib/utils";
import type { NoteDetailsDto } from "@/modules/notes";

interface NoteEditorProps {
    note: NoteDetailsDto | undefined;
    isLoading: boolean;
    isError: boolean;
    isEditing: boolean;
    displayContent: string;
    localContent: string;
    setLocalContent: (val: string) => void;
    titleInput: string;
    setTitleInput: (val: string) => void;
}

export const NoteEditor = ({ note, isLoading, isError, isEditing, displayContent, localContent, setLocalContent, titleInput, setTitleInput }: NoteEditorProps) => {
    const { t } = useTranslation();

    if (isLoading) return null;
    if (isError || !note) return null;

    return (
        <div className="max-w-4xl mx-auto p-8 lg:p-12 h-full flex flex-col">
            {isEditing ? (
                <input
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="text-3xl font-bold text-foreground mb-8 leading-tight tracking-tight outline-none bg-transparent border-none w-full p-0 focus:ring-0 placeholder:text-muted-foreground"
                    placeholder={t('sidebar.untitled')}
                />
            ) : (
                <h1 className="text-3xl font-bold text-foreground mb-8 leading-tight tracking-tight cursor-default">
                    {note?.title || t('sidebar.untitled')}
                </h1>
            )}

            <div className={cn("flex-1 outline-none relative text-foreground", !isEditing && "prose prose-sm md:prose-base dark:prose-invert max-w-none leading-7")}>
                {isEditing ? (
                    <Textarea
                        value={localContent}
                        onChange={(e) => setLocalContent(e.target.value)}
                        className="w-full h-full min-h-[60vh] resize-none bg-transparent border-0 focus-visible:ring-0 p-0 text-base leading-relaxed font-mono text-foreground"
                        placeholder=""
                    />
                ) : displayContent ? (
                    <Markdown>{displayContent}</Markdown>
                ) : null }
            </div>
        </div>
    );
};