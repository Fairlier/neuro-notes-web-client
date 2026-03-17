import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/modules/users/api/usersApi";
import { systemApi } from "@/modules/system/api/systemApi";
import type { UserAIProfileResponse, AIOperationSettingsDto } from "@/modules/users/types/usersTypes";
import type { SystemConfigResponse } from "@/modules/system/types/systemTypes";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import {
    Loader2,
    CheckCircle2,
    Cpu,
    KeyRound,
    Plus,
    Trash2,
    Settings2,
    Languages,
    Sparkles,
    RefreshCcw,
    Settings
} from "lucide-react";

const BUTTON_CLASS = "w-full sm:w-[220px] h-10 flex items-center justify-center gap-2 transition-all shrink-0";

interface SettingsFormProps {
    initialData: UserAIProfileResponse;
    systemConfig: SystemConfigResponse;
}

function SettingsForm({ initialData, systemConfig }: SettingsFormProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<UserAIProfileResponse>(initialData);
    const [successMsg, setSuccessMsg] = useState("");
    const [resetMsg, setResetMsg] = useState("");

    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [newSettingKey, setNewSettingKey] = useState("");
    const [newSettingValue, setNewSettingValue] = useState("");

    const allProviders = useMemo(() => Array.from(new Set([
        ...(systemConfig.providers.transcription || []),
        ...(systemConfig.providers.structure || []),
        ...(systemConfig.providers.summary || []),
        ...(systemConfig.providers.chat || [])
    ])), [systemConfig]);

    const updateProfileMutation = useMutation({
        mutationFn: usersApi.updateAiProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userAiProfile'] });
            setSuccessMsg("Настройки успешно сохранены");
            setResetMsg("");
            setTimeout(() => setSuccessMsg(""), 3000);
        }
    });

    const resetProfileMutation = useMutation({
        mutationFn: usersApi.resetAiProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userAiProfile'] });
            setResetMsg("Настройки успешно сброшены");
            setSuccessMsg("");
            setTimeout(() => setResetMsg(""), 3000);
        }
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    const updateOperationSetting = (operation: keyof UserAIProfileResponse, field: keyof AIOperationSettingsDto, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [operation]: {
                ...(prev[operation as keyof UserAIProfileResponse] as AIOperationSettingsDto || { useCustomPrompt: false }),
                [field]: value
            }
        }));
    };

    const renderOperationItem = (title: string, opKey: keyof UserAIProfileResponse, providers: string[]) => {
        const opData = formData[opKey] as AIOperationSettingsDto || {};
        return (
            <div className="p-5 rounded-2xl border border-border bg-muted/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-1">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2 ml-1">
                            <Cpu className="h-3.5 w-3.5 text-primary" />
                            Провайдер
                        </label>
                        <Select
                            value={(formData[opKey === 'transcription' ? 'transcriptionProvider' : opKey === 'structuring' ? 'structureProvider' : opKey === 'summarization' ? 'summaryProvider' : opKey === 'globalChat' ? 'globalChatProvider' : 'noteChatProvider' as keyof UserAIProfileResponse] as string) || ""}
                            onValueChange={(v) => setFormData({...formData, [opKey === 'transcription' ? 'transcriptionProvider' : opKey === 'structuring' ? 'structureProvider' : opKey === 'summarization' ? 'summaryProvider' : opKey === 'globalChat' ? 'globalChatProvider' : 'noteChatProvider' as keyof UserAIProfileResponse]: v})}
                        >
                            <SelectTrigger className="bg-muted/20 border-border/50 h-11">
                                <SelectValue placeholder="По умолчанию" />
                            </SelectTrigger>
                            <SelectContent>
                                {providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2 ml-1">
                            <Languages className="h-3.5 w-3.5 text-primary" />
                            Язык (ISO)
                        </label>
                        <Input
                            value={opData.targetLanguage || ""}
                            onChange={(e) => updateOperationSetting(opKey, 'targetLanguage', e.target.value.toLowerCase())}
                            maxLength={2}
                            className="bg-muted/20 border-border/50 h-11 font-mono lowercase"
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            checked={opData.useCustomPrompt || false}
                            onChange={(e) => updateOperationSetting(opKey, 'useCustomPrompt', e.target.checked)}
                            className="h-4 w-4 rounded border-border text-primary"
                        />
                        <span className="text-sm font-medium text-muted-foreground">Кастомный промт</span>
                    </label>

                    {opData.useCustomPrompt && (
                        <Textarea
                            value={opData.customPrompt || ""}
                            onChange={(e) => updateOperationSetting(opKey, 'customPrompt', e.target.value)}
                            className="min-h-[100px] bg-muted/20 border-border/50 resize-none"
                        />
                    )}
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={handleSave} className="space-y-6 w-full pb-10">

            {/* 1. ОБЩИЕ */}
            <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Общие параметры</h2>
                </div>
                <div className="p-6">
                    <div className="space-y-2 max-w-[200px]">
                        <label className="text-sm font-semibold flex items-center gap-2 ml-1">
                            <Languages className="h-3.5 w-3.5 text-primary" />
                            Глобальный язык
                        </label>
                        <Input
                            value={formData.aiOperationLanguage}
                            onChange={(e) => setFormData({...formData, aiOperationLanguage: e.target.value.toLowerCase()})}
                            maxLength={2}
                            className="bg-muted/20 border-border/50 h-11 font-mono lowercase"
                        />
                    </div>
                </div>
            </section>

            {/* 2. ОПЕРАЦИИ */}
            <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Настройка операций</h2>
                </div>
                <div className="p-6 space-y-5">
                    {renderOperationItem("Транскрибация", "transcription", systemConfig.providers.transcription)}
                    {renderOperationItem("Структурирование", "structuring", systemConfig.providers.structure)}
                    {renderOperationItem("Саммаризация", "summarization", systemConfig.providers.summary)}
                    {renderOperationItem("Общий чат", "globalChat", systemConfig.providers.chat)}
                    {renderOperationItem("Чат по заметке", "noteChat", systemConfig.providers.chat)}
                </div>
            </section>

            {/* 3. КЛЮЧИ */}
            <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Ключи провайдеров</h2>
                </div>
                <div className="p-6 space-y-6">
                    {/* Форма добавления */}
                    <div className="flex flex-col sm:flex-row gap-3 items-end bg-muted/10 p-5 rounded-2xl">
                        <div className="w-full sm:flex-1 space-y-2">
                            <label className="text-sm font-semibold ml-1">Провайдер</label>
                            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                                <SelectTrigger className="bg-background h-11"><SelectValue placeholder="Выберите провайдера" /></SelectTrigger>
                                <SelectContent>{allProviders.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="w-full sm:flex-1 space-y-2">
                            <label className="text-sm font-semibold ml-1">Ключ</label>
                            <Input value={newSettingKey} onChange={e => setNewSettingKey(e.target.value)} className="bg-background h-11"/>
                        </div>
                        <div className="w-full sm:flex-[2] space-y-2">
                            <label className="text-sm font-semibold ml-1">Значение</label>
                            <div className="flex gap-2">
                                <Input value={newSettingValue} onChange={e => setNewSettingValue(e.target.value)} className="bg-background h-11"/>
                                <Button type="button" size="icon" className="h-11 w-11 shrink-0" onClick={() => {
                                    if (!selectedProvider || !newSettingKey) return;
                                    setFormData(prev => ({
                                        ...prev,
                                        providerSettings: {
                                            ...(prev.providerSettings || {}),
                                            [selectedProvider]: { ...(prev.providerSettings?.[selectedProvider] || {}), [newSettingKey]: newSettingValue }
                                        }
                                    }));
                                    setNewSettingKey(""); setNewSettingValue("");
                                }} disabled={!selectedProvider || !newSettingKey}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>

                    {/* Список ключей */}
                    <div className="space-y-4">
                        {Object.entries(formData.providerSettings || {}).map(([providerName, settingsObj]) => (
                            <div key={providerName} className="space-y-2">
                                <span className="text-sm font-bold text-primary/80 tracking-tight px-1">{providerName}</span>
                                <div className="divide-y divide-border/50 border border-border/50 rounded-xl overflow-hidden">
                                    {Object.entries(settingsObj).map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between bg-background px-4 py-3 group">
                                            <div className="flex gap-2 items-center min-w-0">
                                                <span className="text-muted-foreground font-medium text-sm">{k}:</span>
                                                <span className="text-foreground truncate font-mono text-sm">{v}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    const newSettings = { ...formData.providerSettings };
                                                    const providerDict = { ...newSettings[providerName] };
                                                    delete providerDict[k];
                                                    newSettings[providerName] = providerDict;
                                                    setFormData({...formData, providerSettings: newSettings});
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. ДЕЙСТВИЯ */}
            <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <Button
                            type="button"
                            variant="ghost"
                            className={`${BUTTON_CLASS} text-destructive hover:bg-destructive/10 hover:text-destructive justify-start px-4`}
                            onClick={() => { if(window.confirm("Сбросить настройки?")) resetProfileMutation.mutate(); }}
                            disabled={resetProfileMutation.isPending}
                        >
                            {resetProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                            Сбросить настройки
                        </Button>

                        <Button
                            type="submit"
                            className={`${BUTTON_CLASS} shadow-md shadow-primary/10`}
                            disabled={updateProfileMutation.isPending}
                        >
                            {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Сохранить настройки
                        </Button>
                    </div>
                </div>
            </section>

            {/* 5. УВЕДОМЛЕНИЯ (отдельная карточка под действиями) */}
            {(successMsg || resetMsg) && (
                <section className={`
                    border rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4
                    ${successMsg ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/5 border-destructive/20'}
                `}>
                    <div className="p-6">
                        <div className="flex items-center justify-center gap-3">
                            {successMsg ? (
                                <>
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                                        {successMsg}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <RefreshCcw className="h-5 w-5 text-destructive" />
                                    <span className="text-base font-semibold text-destructive">
                                        {resetMsg}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            )}

        </form>
    );
}

export default function SettingsPage() {
    const { data: aiProfile, isLoading: isProfileLoading } = useQuery<UserAIProfileResponse>({
        queryKey: ['userAiProfile'],
        queryFn: usersApi.getAiProfile,
    });

    const { data: systemConfig, isLoading: isConfigLoading } = useQuery<SystemConfigResponse>({
        queryKey: ['systemConfig'],
        queryFn: systemApi.getConfig,
    });

    if (isProfileLoading || isConfigLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!aiProfile || !systemConfig) return null;

    return (
        <div className="min-h-screen w-full bg-background selection:bg-primary/10 py-12 px-4 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <Settings className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Настройки ИИ</h1>
                </div>
                <SettingsForm initialData={aiProfile} systemConfig={systemConfig} key={aiProfile.aiOperationLanguage} />
            </div>
        </div>
    );
}