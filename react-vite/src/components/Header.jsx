import LogoBlack from "../assets/icons/headerLogoBlack.svg";
import LogoWhite from "../assets/icons/headerLogoWhite.svg";
import { useSystemTheme } from "../hooks/useSystemTheme";

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

