import { useState, useEffect } from "react";
import LogoBlack from "../assets/icons/headerLogoBlack.svg";
import LogoWhite from "../assets/icons/headerLogoWhite.svg";

const useSystemTheme = () => {
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

const Header = () => {
  const theme = useSystemTheme();
  return (
    <div className="h-[72px] flex items-center justify-center">
      <img
        src={theme === "dark" ? LogoWhite : LogoBlack}
        alt="logo"
        className="min-w-[128px] min-h-[32px]"
      />
    </div>
  );
};

export default Header;

