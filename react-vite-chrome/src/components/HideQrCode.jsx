import { cn } from "../utils/cn";
import PropTypes from "prop-types";

const HideQrCode = ({ className, icon, text, isShow, onClick }) => {
  const handleClick = () => {
    if (text === "Waiting for confirmation on mobile app.") return;
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex w-64 h-64 flex-col justify-center items-center gap-3 shrink-0 backdrop-blur-[10px] rounded-[999px] cursor-pointer border-2 border-white ",
        className,
        { hidden: !isShow }
      )}
    >
      <img src={icon} alt="refresh" className="" />
      <p className="text-lg font-semibold text-white max-w-[300px] text-center">
        {text}
      </p>
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
