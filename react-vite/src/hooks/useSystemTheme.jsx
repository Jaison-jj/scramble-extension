import { useEffect } from "react";
import { useState } from "react";


export const useSystemTheme = () => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setTheme(prefersDarkMode ? "dark" : "light");

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const themeChangeHandler = (e) => {
      setTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", themeChangeHandler);

    return () => {
      mediaQuery.removeEventListener("change", themeChangeHandler);
    };
  }, []);

  return theme;
};