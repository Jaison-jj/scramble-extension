import { cn } from "../utils/cn";
import PropTypes from "prop-types";
// backdrop-blur-[30px]
const HideTypeCode = ({ className, icon, text, isShow, onResetTimer }) => {
  return (
    <div
      onClick={onResetTimer}
      className={cn(
        "flex w-[260px] h-[100px] flex-col justify-center items-center gap-2 shrink-0  cursor-pointer bg-white dark:bg-black",
        className,
        { "hidden dark:bg-black": !isShow }
      )}
    >
      <img src={icon} alt="refresh" className="invert-[1] dark:invert-0" />
      <p className="font-semibold text-lg dark:text-white">{text}</p>
    </div>
  );
};

HideTypeCode.propTypes = {
  className: PropTypes.string,
  icon: PropTypes.any,
  text: PropTypes.string,
  isShow: PropTypes.bool,
  onResetTimer: PropTypes.func,
};

export default HideTypeCode;
