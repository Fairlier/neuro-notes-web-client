import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { useTabs } from "@/modules/layout";
import { usersApi } from "@/modules/users";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Loader2, User, Upload, Trash2, CheckCircle2, LogOut, Settings, Camera, ShieldAlert, Languages } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const { clearAllTabs } = useTabs();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [localNickname, setLocalNickname] = useState<string | null>(null);
    const [localLanguage, setLocalLanguage] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState("");

    const { data: profile, isLoading } = useQuery({
        queryKey: ['userProfile'],
        queryFn: usersApi.getProfile,
    });

    const nickname = localNickname ?? profile?.nickname ?? "";
    const language = localLanguage ?? profile?.interfaceLanguage ?? "ru";

    const BUTTON_CLASS = "w-full sm:w-[220px] h-10 flex items-center justify-center gap-2 transition-all shrink-0";

    const updateProfileMutation = useMutation({
        mutationFn: usersApi.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            setLocalNickname(null);
            setLocalLanguage(null);
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

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-background selection:bg-primary/10 py-12 px-4 overflow-y-auto">
            <div className="max-w-xl mx-auto space-y-6">

                {/* ГЛАВНЫЙ ЗАГОЛОВОК */}
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <User className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {t('profile.title')}
                    </h1>
                </div>

                {/* БЛОК 1: Фото профиля */}
                <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                        <Camera className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
                            {t('profile.avatar')}
                        </h2>
                    </div>

                    <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-8">
                        {/* Аватар без наложений */}
                        <div className="h-32 w-32 rounded-3xl bg-muted border-2 border-border flex items-center justify-center overflow-hidden shadow-inner transition-all hover:border-primary/30">
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-16 w-16 text-muted-foreground/30" />
                            )}
                        </div>

                        {/* Кнопки в вертикальном стеке одинакового размера */}
                        <div className="flex flex-col gap-3 w-full sm:w-auto">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadAvatarMutation.mutate(file);
                                }}
                            />
                            <Button
                                variant="outline"
                                className={`${BUTTON_CLASS} border-dashed`}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadAvatarMutation.isPending}
                            >
                                {uploadAvatarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                Изменить фото
                            </Button>
                            {profile?.avatarUrl && (
                                <Button
                                    variant="ghost"
                                    className={`${BUTTON_CLASS} text-destructive hover:bg-destructive/10 hover:text-destructive`}
                                    onClick={() => deleteAvatarMutation.mutate()}
                                    disabled={deleteAvatarMutation.isPending}
                                >
                                    <Trash2 className="h-4 w-4" /> Удалить фото
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                {/* БЛОК 2: Настройки пользователя */}
                <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
                            Настройки пользователя
                        </h2>
                    </div>

                    <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
                        <div className="grid gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold flex items-center gap-2 ml-1">
                                    <User className="h-3.5 w-3.5 text-primary" />
                                    {t('profile.nickname')}
                                </label>
                                <Input
                                    className="h-11 bg-muted/20 border-border/50 focus-visible:ring-primary"
                                    value={nickname}
                                    onChange={(e) => setLocalNickname(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold flex items-center gap-2 ml-1">
                                    <Languages className="h-3.5 w-3.5 text-primary" />
                                    {t('profile.interfaceLanguage')}
                                </label>
                                <Select value={language} onValueChange={setLocalLanguage}>
                                    <SelectTrigger className="h-11 bg-muted/20 border-border/50">
                                        <SelectValue placeholder={t('profile.selectInterfaceLanguage')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ru">Русский</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between gap-4 border-t border-border/40">
                            <div className="flex-1">
                                {successMsg && (
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-left-4">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-sm font-medium">{successMsg}</span>
                                    </div>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className={`${BUTTON_CLASS} shadow-md shadow-primary/10`}
                                disabled={updateProfileMutation.isPending}
                            >
                                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                {t('profile.saveChanges')}
                            </Button>
                        </div>
                    </form>
                </section>

                {/* БЛОК 3: Завершение сеанса */}
                <section className="bg-destructive/[0.03] border border-destructive/10 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-destructive/10 rounded-2xl text-destructive">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-lg font-bold text-foreground leading-tight">Завершение сеанса</h3>
                                <p className="text-xs text-muted-foreground mt-1 text-balance">Выход из аккаунта на этом устройстве</p>
                            </div>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => { clearAllTabs(); logout(); }}
                            className={`${BUTTON_CLASS} shadow-lg shadow-destructive/20`}
                        >
                            <LogOut className="h-4 w-4" />
                            Выйти из аккаунта
                        </Button>
                    </div>
                </section>

            </div>
        </div>
    );
}