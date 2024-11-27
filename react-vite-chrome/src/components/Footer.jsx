import { useState } from "react";
import { cn } from "../utils/cn";
import ToggleButton from "./utils/ToggleButton";
import PropTypes from "prop-types";

const Footer = (props) => {
  const { codeType, setCodeType } = props;

  const onToggle = async () => {
    const newCodeType = codeType === "qrCode" ? "typeCode" : "qrCode";

    await chrome?.runtime?.sendMessage({
      action: "switchCodeType",
      codeType: newCodeType === "qrCode" ? "QID" : "DID",
    });

    setCodeType(newCodeType);
  };

  return (
    <div className="flex justify-around py-6 text-lg">
      <p
        className={cn("font-semibold text-gray-500", {
          "text-black dark:text-white": codeType === "qrCode",
        })}
      >
        QR code
      </p>
      <ToggleButton isOn={codeType === "typeCode"} setIsOn={onToggle} />
      <p
        className={cn("font-semibold text-gray-500", {
          "text-black dark:text-white": codeType === "typeCode",
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
