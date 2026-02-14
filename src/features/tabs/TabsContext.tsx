// Разделяем импорты на обычные и типовые (type)
import { createContext, useContext, useState } from 'react';
import type { ReactNode, MouseEvent } from 'react'; // Исправляет ошибку TS1484
import { useNavigate, useLocation } from 'react-router-dom';

export interface Tab {
    id: string;
    title: string;
    url: string;
}

interface TabsContextType {
    tabs: Tab[];
    addTab: (tab: Tab) => void;
    closeTab: (e: MouseEvent, id: string) => void;
    activeTabId: string | null;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const TabsProvider = ({ children }: { children: ReactNode }) => {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    const activeTabId = location.pathname.split('/notes/')[1] || null;

    const addTab = (newTab: Tab) => {
        setTabs((prev) => {
            if (prev.some(t => t.id === newTab.id)) return prev;
            return [...prev, newTab];
        });
    };

    const closeTab = (e: MouseEvent, id: string) => {
        e.stopPropagation();
        e.preventDefault();

        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);

        if (id === activeTabId) {
            if (newTabs.length > 0) {
                navigate(newTabs[newTabs.length - 1].url);
            } else {
                navigate('/');
            }
        }
    };

    return (
        <TabsContext.Provider value={{ tabs, addTab, closeTab, activeTabId }}>
            {children}
        </TabsContext.Provider>
    );
};

export const useTabs = () => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("useTabs must be used within a TabsProvider");
    return context;
};