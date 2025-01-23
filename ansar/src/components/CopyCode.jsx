import CopyIcon from "../assets/icons/copy.svg?react";
import { cn } from "../utils/cn";
import PropTypes from "prop-types";

const CopyCodeButton = (props) => {
  const { className, copyCodeValue = "null" } = props;

  const onClickCopy = () => {
    navigator.clipboard
      .writeText(copyCodeValue)
      .then(() => {
        console.log("Code copied to clipboard:", copyCodeValue);
      })
      .catch((err) => {
        console.error("Error copying Code:", err);
      });
  };

  return (
    <button
      className={cn(
        "flex gap-1 items-center group hover:text-yellow-500",
        className
      )}
      onClick={onClickCopy}
      title="Copy code to clipboard"
    >
      <CopyIcon
        src={CopyIcon}
        alt="copy"
        className="mt-[3px] dark:invert-[1] group-hover:invert-[72%] group-hover:sepia-[53%] group-hover:saturate-[457%] group-hover:hue-rotate-[8deg] group-hover:brightness-[98%] group-hover:contrast-[103%]"
      />
      <span className="text-base font-normal dark:text-[#B3B3B3] group-hover:text-[#fed000]">
        Copy
      </span>
    </button>
  );
};

CopyCodeButton.propTypes = {
  className: PropTypes.string,
};

export default CopyCodeButton;
