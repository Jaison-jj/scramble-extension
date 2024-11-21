import LogoBlack from "../assets/icons/headerLogoBlack.svg";

const Header = () => {
  return (
    <div className="bg-white h-[72px] flex items-center justify-center">
      <img src={LogoBlack} alt="logo" className="w-[128px] h-[32px]"/>
    </div>
  );
};

export default Header;
