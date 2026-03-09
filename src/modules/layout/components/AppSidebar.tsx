import { Link, useLocation } from "react-router-dom";
import { MessageSquare, LayoutDashboard, Settings, LogOut, FileText, Plus, X, Moon, Sun, Palette } from "lucide-react";
import { useAuth } from "@/modules/auth";
import { useTabs } from "../hooks/useTabs";
import { useTheme } from "@/modules/theme";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/shared/ui/dropdown-menu";

export const AppSidebar = () => {
    const location = useLocation();
    const { logout, user } = useAuth();
    const { tabs, activeTabId, closeTab, setActiveTab, createNewTab } = useTabs();
    const { theme, setTheme } = useTheme();

    return (
        <div className="w-64 bg-muted border-r border-border flex flex-col h-full transition-colors duration-200">
            {/* Логотип */}
            <div className="p-4 flex items-center gap-2 mb-2">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                    N
                </div>
                <span className="font-semibold text-lg tracking-tight text-foreground">NeuroNotes</span>
            </div>

            {/* Главное меню */}
            <div className="px-3 space-y-1 mb-6">
                <Link to="/" className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === '/' ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                )}>
                    <LayoutDashboard className="h-4 w-4" /> Workspace
                </Link>
                <Link to="/chat" className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === '/chat' ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                )}>
                    <MessageSquare className="h-4 w-4" /> Global Chat
                </Link>
            </div>

            {/* Вкладки (Открытые заметки) */}
            <div className="flex-1 overflow-y-auto px-3">
                <div className="flex items-center justify-between px-3 py-2 mb-1 group">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Открытые заметки</span>
                    <button onClick={createNewTab} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-y-1">
                    {tabs.map(tab => (
                        <div key={tab.id} className={cn(
                            "flex items-center justify-between px-3 py-1.5 rounded-md text-sm group cursor-pointer transition-colors border border-transparent",
                            activeTabId === tab.id ? "bg-background text-foreground shadow-sm border-border" : "text-muted-foreground hover:bg-background/50"
                        )} onClick={() => setActiveTab(tab.id)}>
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{tab.title}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-destructive transition-all"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                    {tabs.length === 0 && (
                        <div className="px-3 py-4 text-xs text-muted-foreground text-center border border-dashed border-border rounded-lg m-2">
                            Нет открытых заметок
                        </div>
                    )}
                </div>
            </div>

            {/* Профиль и Настройки */}
            <div className="p-4 mt-auto border-t border-border bg-background/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">{user?.email}</span>
                        <span className="text-xs text-muted-foreground">Pro Plan</span>
                    </div>

                    {/* Кнопка смены темы */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0">
                                {theme === 'light' ? <Sun className="h-4 w-4" /> : theme === 'dark' ? <Moon className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTheme('light')}>Светлая</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme('dark')}>Темная</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme('ocean')}>Ocean</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="flex-1 justify-start h-9 text-xs" size="sm">
                        <Settings className="mr-2 h-3.5 w-3.5" /> Настройки
                    </Button>
                    <Button variant="ghost" size="sm" onClick={logout} className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};