import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { notesApi } from "@/modules/notes";

export const AudioPlayer = ({ noteId }: { noteId: string }) => {
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let url = "";

        const fetchAudio = async () => {
            try {
                const response = await notesApi.getSourceFile(noteId, false);
                if (isMounted && response.blob) {
                    url = URL.createObjectURL(response.blob);
                    setAudioUrl(url);
                }
            } catch (err) {
                console.error('Failed to load audio file:', err);
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchAudio();
        return () => {
            isMounted = false;
            if (url) URL.revokeObjectURL(url);
        };
    }, [noteId]);

    if (isLoading) return <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Загрузка аудио...</div>;
    if (error || !audioUrl) return <div className="text-xs text-destructive py-2">Не удалось загрузить аудиофайл</div>;

    return <audio controls className="w-full h-8 mt-1" src={audioUrl} />;
};