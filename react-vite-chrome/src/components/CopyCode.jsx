import CopyIcon from "../assets/icons/copy.svg";
import { cn } from "../utils/cn";
import PropTypes from "prop-types";

const CopyCodeButton = (props) => {
  const { className, codeValue = "" } = props;

  const onClickCopy = () => {
    navigator.clipboard
      .writeText(codeValue)
      .then(() => {
        console.log("Code copied to clipboard:", codeValue);
      })
      .catch((err) => {
        console.error("Error copying Code:", err);
      });
  };

  return (
    <button
      className={cn("flex gap-1", className)}
      onClick={onClickCopy}
      title="Copy code to clipboard"
    >
      <img src={CopyIcon} alt="copy" className="mt-[3px] dark:invert-[1]" />
      <span className="text-base font-normal dark:text-[#B3B3B3]">Copy</span>
    </button>
  );
};

CopyCodeButton.propTypes = {
  className: PropTypes.string,
};

export default CopyCodeButton;
