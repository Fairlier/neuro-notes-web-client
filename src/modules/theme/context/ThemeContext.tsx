import { createContext, useState, useEffect, type ReactNode } from "react";

export type Theme = "light" | "dark" | string;

export interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

export function ThemeProvider({
                                  children,
                                  defaultTheme = "light",
                                  storageKey = "neuronotes-theme"
                              }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(
        () => localStorage.getItem(storageKey) || defaultTheme
    );

    useEffect(() => {
        const root = window.document.documentElement;

        root.setAttribute("data-theme", theme);
        localStorage.setItem(storageKey, theme);
    }, [theme, storageKey]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        // TODO: Здесь можно добавить API-запрос для сохранения темы в профиле БД
        // themeApi.updateProfileTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}