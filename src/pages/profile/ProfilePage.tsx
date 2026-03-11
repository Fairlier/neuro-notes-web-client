import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth"; // Добавили авторизацию
import { usersApi } from "@/modules/users";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Loader2, User, Upload, Trash2, CheckCircle2, LogOut } from "lucide-react"; // Импортировали LogOut

export default function ProfilePage() {
    const { logout } = useAuth(); // Достали метод логаута
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [nickname, setNickname] = useState("");
    const [language, setLanguage] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const { data: profile, isLoading } = useQuery({
        queryKey: ['userProfile'],
        queryFn: usersApi.getProfile,
    });

    useEffect(() => {
        if (profile) {
            setNickname(profile.nickname || "");
            setLanguage(profile.interfaceLanguage || "ru");
        }
    }, [profile]);

    const updateProfileMutation = useMutation({
        mutationFn: usersApi.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            setSuccessMsg("Профиль успешно обновлен");
            setTimeout(() => setSuccessMsg(""), 3000);
        }
    });

    const uploadAvatarMutation = useMutation({
        mutationFn: usersApi.uploadAvatar,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    });

    const deleteAvatarMutation = useMutation({
        mutationFn: usersApi.deleteAvatar,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    });

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({ nickname, interfaceLanguage: language });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadAvatarMutation.mutate(file);
        }
    };

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-8 w-full">
            <h1 className="text-3xl font-bold mb-8 text-foreground">Настройки профиля</h1>

            <div className="space-y-8 bg-card p-6 rounded-lg border border-border shadow-sm">

                {/* Секция Аватара */}
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                        {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-10 w-10 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:text-white hover:bg-white/20" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-medium text-foreground">Аватар профиля</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">JPEG, PNG или WebP. Максимальный размер 10MB.</p>
                        <div className="flex gap-2">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelect} />
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadAvatarMutation.isPending}>
                                {uploadAvatarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                Загрузить
                            </Button>
                            {profile?.avatarUrl && (
                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteAvatarMutation.mutate()} disabled={deleteAvatarMutation.isPending}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Удалить
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border w-full" />

                {/* Секция данных */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Никнейм</label>
                        <Input
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Ваш никнейм"
                            className="max-w-md"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Язык интерфейса</label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="max-w-md">
                                <SelectValue placeholder="Выберите язык" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ru">Русский</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                        <Button type="submit" disabled={updateProfileMutation.isPending}>
                            {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Сохранить изменения
                        </Button>
                        {successMsg && (
                            <span className="text-sm text-emerald-500 flex items-center gap-1 animate-in fade-in">
                                <CheckCircle2 className="h-4 w-4" /> {successMsg}
                            </span>
                        )}
                    </div>
                </form>

                <div className="h-px bg-border w-full" />

                {/* Секция выхода из аккаунта */}
                <div className="space-y-3">
                    <h3 className="font-medium text-destructive">Управление аккаунтом</h3>
                    <Button variant="destructive" onClick={logout} className="w-fit">
                        <LogOut className="mr-2 h-4 w-4" />
                        Выйти из аккаунта
                    </Button>
                </div>

            </div>
        </div>
    );
}