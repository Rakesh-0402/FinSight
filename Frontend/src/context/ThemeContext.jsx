import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({children}) {
  const [theme, setThemeState] = useState(() => {
      return (
        localStorage.getItem("theme") || "system"
      );
    });

  const [resolvedTheme, setResolvedTheme] = useState("light");

  useEffect(() => {
    const root = document.documentElement;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const actualTheme =
        theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : theme;

      setResolvedTheme(actualTheme);

      root.classList.toggle("dark",actualTheme === "dark");
    };
    applyTheme();

    media.addEventListener("change",applyTheme);

    return () => {
      media.removeEventListener("change",applyTheme);
    };
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme",newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(
    ThemeContext
  );
}