import { createContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export interface TabData {
    id: string;
    title: string;
}

interface TabsContextType {
    tabs: TabData[];
    activeTabId: string | null;
    openNoteInCurrentTab: (id: string, title: string) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    createNewTab: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function TabsProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [tabs, setTabs] = useState<TabData[]>([]);

    const activeTabId = useMemo(() => {
        const match = location.pathname.match(/^\/notes\/([^/]+)/);
        return match ? match[1] : null;
    }, [location.pathname]);

    const openNoteInCurrentTab = useCallback((id: string, title: string) => {
        setTabs(prev => {
            const exists = prev.find(t => t.id === id);
            if (exists) return prev;

            const currentActiveId = location.pathname.match(/^\/notes\/([^/]+)/)?.[1];

            if (!currentActiveId) {
                return [...prev, { id, title }];
            }
            return prev.map(t => t.id === currentActiveId ? { id, title } : t);
        });
        navigate(`/notes/${id}`);
    }, [navigate, location.pathname]);

    const closeTab = useCallback((id: string) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id);
            const currentActiveId = location.pathname.match(/^\/notes\/([^/]+)/)?.[1];

            if (currentActiveId === id) {
                if (newTabs.length > 0) {
                    navigate(`/notes/${newTabs[newTabs.length - 1].id}`);
                } else {
                    navigate('/');
                }
            }
            return newTabs;
        });
    }, [navigate, location.pathname]);

    const setActiveTab = useCallback((id: string) => {
        navigate(`/notes/${id}`);
    }, [navigate]);

    const createNewTab = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const value = useMemo(() => ({
        tabs,
        activeTabId,
        openNoteInCurrentTab,
        closeTab,
        setActiveTab,
        createNewTab
    }), [tabs, activeTabId, openNoteInCurrentTab, closeTab, setActiveTab, createNewTab]);

    return (
        <TabsContext.Provider value={value}>
            {children}
        </TabsContext.Provider>
    );
}