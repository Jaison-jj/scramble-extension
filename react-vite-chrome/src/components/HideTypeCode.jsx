import { cn } from "../utils/cn";
import PropTypes from "prop-types";

const HideTypeCode = ({ className, icon, text, isShow }) => {
  return (
    <div
      className={cn(
        "flex w-[260px] h-[100px] flex-col justify-center items-center gap-3 shrink-0 backdrop-blur-[10px]",
        className,
        { hidden: !isShow }
      )}
    >
      <img src={icon} alt="refresh" className="invert-[1]" />
      <p>{text}</p>
    </div>
  );
};

HideTypeCode.propTypes = {
  className: PropTypes.string,
  icon: PropTypes.any,
  text: PropTypes.string,
  isShow:PropTypes.bool
};

export default HideTypeCode;
