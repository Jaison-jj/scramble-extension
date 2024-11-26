import { cn } from "../utils/cn";
import PropTypes from "prop-types";

const HideQrCode = ({ className, icon, text, isShow, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex w-64 h-64 flex-col justify-center items-center gap-3 shrink-0 backdrop-blur-[10px] rounded-[999px] cursor-pointer",
        className,
        { hidden: !isShow }
      )}
    >
      <img src={icon} alt="refresh" />
      <p className="text-lg font-semibold dark:text-white">{text}</p>
    </div>
  );
};

HideQrCode.propTypes = {
  className: PropTypes.string,
  icon: PropTypes.any,
  text: PropTypes.string,
  isShow: PropTypes.bool,
  onClick: PropTypes.func,
};

export default HideQrCode;
