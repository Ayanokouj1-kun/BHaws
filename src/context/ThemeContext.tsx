import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";

export type Theme = "light" | "dark" | "ocean" | "forest" | "sunset" | "midnight";

export interface ThemeMeta {
    id: Theme;
    label: string;
    description: string;
    /** Preview swatch colors [bg, accent, text] */
    swatches: [string, string, string];
}

export const THEMES: ThemeMeta[] = [
    {
        id: "light",
        label: "Light",
        description: "Clean & bright",
        swatches: ["#f0f4fb", "#4f6fc1", "#1a2340"],
    },
    {
        id: "dark",
        label: "Dark",
        description: "Easy on the eyes",
        swatches: ["#0e1422", "#6c83e0", "#dce4f5"],
    },
    {
        id: "ocean",
        label: "Ocean",
        description: "Deep teal tones",
        swatches: ["#0b1d2e", "#22b5c8", "#c8eaf0"],
    },
    {
        id: "forest",
        label: "Forest",
        description: "Calming greens",
        swatches: ["#0f1f16", "#3dbd82", "#c2edd8"],
    },
    {
        id: "sunset",
        label: "Sunset",
        description: "Warm amber glow",
        swatches: ["#1f1108", "#e08c30", "#f5e0c0"],
    },
    {
        id: "midnight",
        label: "Midnight",
        description: "Deep violet night",
        swatches: ["#0d0c1f", "#a07ef5", "#e0d9ff"],
    },
];

interface ThemeContextValue {
    theme: Theme;
    setTheme: (t: Theme) => void;
    themes: ThemeMeta[];
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "light",
    setTheme: () => { },
    themes: THEMES,
});

const STORAGE_KEY = "bhaws_theme";

/** Returns the class string to apply to <html> for a given theme */
export const themeClass = (t: Theme): string => (t === "light" ? "" : t);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
            if (saved && THEMES.find(t => t.id === saved)) return saved;
        } catch { /* ignore */ }
        return "light";
    });

    useEffect(() => {
        const root = document.documentElement;

        // Remove all theme classes first
        THEMES.forEach(t => root.classList.remove(t.id));

        // Use window.location for robust path detection at the root level
        const path = window.location.pathname;
        const isPublicPage = path === "/" || path === "/login" || path === "/signup";

        // Apply new theme class only if not on a public page and theme isn't light
        if (!isPublicPage && theme !== "light") {
            root.classList.add(theme);
        }

        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]); // We can rely on popstate or other events if needed, but for theme toggle this is usually enough. 
    // Actually, to handle navigation between login and app, we might want to check on interval or wrap in a small component.
    // But react-router-dom Link clicks don't trigger global re-renders of parents unless we use the hook.
    // Let's use a small interval or a navigation listener if we want it to be perfectly reactive without the hook.

    // Safety: we define a listener for navigation changes to ensure theme updates when URL changes
    useEffect(() => {
        const handleLocationChange = () => {
            const root = document.documentElement;
            const path = window.location.pathname;
            const isPublicPage = path === "/" || path === "/login" || path === "/signup";

            THEMES.forEach(t => root.classList.remove(t.id));
            if (!isPublicPage && theme !== "light") {
                root.classList.add(theme);
            }
        };

        window.addEventListener('popstate', handleLocationChange);
        // Also listen for clicks on the document to catch client-side routing
        window.addEventListener('click', handleLocationChange);

        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            window.removeEventListener('click', handleLocationChange);
        };
    }, [theme]);

    const setTheme = (t: Theme) => setThemeState(t);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
