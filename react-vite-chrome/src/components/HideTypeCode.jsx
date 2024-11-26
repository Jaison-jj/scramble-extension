import { cn } from "../utils/cn";
import PropTypes from "prop-types";

const HideTypeCode = ({ className, icon, text, isShow, onResetTimer }) => {
  return (
    <div
      onClick={onResetTimer}
      className={cn(
        "flex w-[260px] h-[100px] flex-col justify-center items-center gap-2 shrink-0 backdrop-blur-[10px] cursor-pointer",
        className,
        { hidden: !isShow }
      )}
    >
      <img src={icon} alt="refresh" className="" />
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
