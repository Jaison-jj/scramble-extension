import { cn } from "../utils/cn";
import ToggleButton from "./utils/ToggleButton";
import PropTypes from "prop-types";

const Footer = (props) => {
  const { codeType, setCodeType } = props;

  const onClickRemoveCreds = async () => {
    await chrome.runtime.sendMessage({
      action: "dropUserCreds",
    });
    await window.close();
  };

  const onToggle = async () => {
    const newCodeType = codeType === "qrCode" ? "typeCode" : "qrCode";

    await chrome?.runtime?.sendMessage({
      action: "switchCodeType",
      codeType: newCodeType === "qrCode" ? "QID" : "DID",
    });

    setCodeType(newCodeType);
  };

  return (
    <div className="py-6 text-lg">
      <button
        onClick={onClickRemoveCreds}
        className={cn("dark:text-white  mx-auto text-center w-full", {
          hidden: codeType,
        })}
      >
        Logout
      </button>
      <div
        className={cn("flex justify-around", {
          "hidden": !codeType,
        })}
      >
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
    </div>
  );
};

Footer.propTypes = {
  codeType: PropTypes.string,
  setCodeType: PropTypes.func,
};

export default Footer;
