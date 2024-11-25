import { useState } from "react";
import { cn } from "../utils/cn";
import ToggleButton from "./utils/ToggleButton";
import PropTypes from "prop-types";

const Footer = (props) => {
  const { codeType, setCodeType } = props;
  const [isOn, setIsOn] = useState(codeType === "typeCode");

  const onToggle = () => {
    setIsOn(!isOn);
    if (codeType === "qrCode") return setCodeType("typeCode");
    setCodeType("qrCode");
  };

  return (
    <div className="flex justify-around py-6 text-lg">
      <p
        className={cn("font-semibold text-gray-500", {
          "text-black dark:text-white": !isOn,
        })}
      >
        QR code
      </p>
      <ToggleButton isOn={isOn} setIsOn={onToggle} />
      <p
        className={cn("font-semibold text-gray-500", {
          "text-black dark:text-white": isOn,
        })}
      >
        Type code
      </p>
    </div>
  );
};

Footer.propTypes = {
  codeType: PropTypes.string,
  setCodeType: PropTypes.func,
};

export default Footer;
