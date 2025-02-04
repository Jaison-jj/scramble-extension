import React from "react";
import LogoBlack from "../assets/icons/headerLogoBlack.svg";
import LogoWhite from "../assets/icons/headerLogoWhite.svg";
import { useSystemTheme } from "../hooks/useSystemTheme";
import DemoCorpImage from "../assets/images/demoCorpLogo.png";
import OptionButton from "./OptionButton";
import CodeRenderer from "./CodeRenderer";

const AutoPopup = (props) => {
  const { codeType, setCodeType } = props;

  const theme = useSystemTheme();

  return (
    <div className="container dark:bg-black h-[500px] min-w-[1000px] flex justify-between gap-5">
      <div className="left p-8 min-w-[520px] flex flex-col justify-between">
        <img alt="org" src={DemoCorpImage} className="w-[148px] h-[32px]" />
        <div className="buttons flex flex-col gap-3">
          <OptionButton
            title="Scan Code"
            selectedOption={codeType}
            type="qrCode"
            setSelectedOption={setCodeType}
          />
          <OptionButton
            title="Type Code"
            selectedOption={codeType}
            type="typeCode"
            setSelectedOption={setCodeType}
          />
        </div>
        <img
          src={theme === "dark" ? LogoWhite : LogoBlack}
          alt="logo"
          className="max-w-[128px] max-h-[32px] w-full h-full object-cover"
        />
      </div>
      <div className="right w-[428px] mt-4 mr-4 mb-4 flex items-center">
        <CodeRenderer {...props} />
      </div>
    </div>
  );
};

export default AutoPopup;
