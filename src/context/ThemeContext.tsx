import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useData } from "@/hooks/useData";

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

/** Returns the class string to apply to <html> for a given theme */
export const themeClass = (t: Theme): string => (t === "light" ? "" : t);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { user } = useData();
    const location = useLocation();

    // Tie theme preference to the user's ID
    const storageKey = user?.id ? `bhaws_theme_${user.id}` : "bhaws_theme";

    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const saved = localStorage.getItem(storageKey) as Theme | null;
            if (saved && THEMES.find(t => t.id === saved)) return saved;
        } catch { /* ignore */ }
        return "light";
    });

    // When the user switches (changes storage key), load their specific theme
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey) as Theme | null;
            if (saved && THEMES.find(t => t.id === saved)) {
                setThemeState(saved);
            } else {
                setThemeState("light"); // default if no saved theme
            }
        } catch {
            setThemeState("light");
        }
    }, [storageKey]);

    useEffect(() => {
        const root = document.documentElement;
        
        // Remove all theme classes first
        THEMES.forEach(t => root.classList.remove(t.id));

        const isPublicPage = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup";

        // Apply new theme class if theme isn't light AND we are not on a public page
        if (!isPublicPage && theme !== "light") {
            root.classList.add(theme);
        }

        // Always save preference for this specific user
        localStorage.setItem(storageKey, theme);
    }, [theme, location.pathname, storageKey]);

    const setTheme = (t: Theme) => setThemeState(t);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
