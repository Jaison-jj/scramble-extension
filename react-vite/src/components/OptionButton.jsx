import InfoIcon from "../assets/icons/infoIcon.svg?react";
import ArrowIcon from "../assets/icons/filledRightArrowIcon.svg?react";
import { cn } from "../utils/cn";

const OptionButton = (props) => {
  const {
    title,
    selectedOption,
    type,
    setSelectedOption,
    isDisabled = false,
    infoText,
  } = props;
  return (
    <button
      className={cn(
        `flex justify-between items-center border  rounded-xl p-4 w-full
      border-gray-300 dark:border-gray-600`,
        {
          "border-black dark:border-white": selectedOption === type,
        }
      )}
      onClick={() => setSelectedOption(type)}
      disabled={isDisabled}
    >
      <div className="flex gap-2 items-center">
        <span title={infoText}>
          <InfoIcon className="w-6 h-6 text-black dark:fill-white" />
        </span>
        <span
          className={cn("text-black text-base font-semibold dark:text-white", {
            "font-bold": selectedOption === type,
          })}
        >
          {title}
        </span>
      </div>
      <ArrowIcon className="w-6 h-6 text-black dark:stroke-white" />
    </button>
  );
};

export default OptionButton;
