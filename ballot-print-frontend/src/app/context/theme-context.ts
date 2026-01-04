"use client"
import { createContext, useContext } from 'react';

export interface ThemeContext {
    selectedTheme: string;
    toggsetSelectedTheme: () => void;
}

export const ThemeContext = createContext<ThemeContext>({
    selectedTheme: "light",
    toggsetSelectedTheme: () => { },
});

export const useThemeContext = () => {
    return useContext(ThemeContext);
};

