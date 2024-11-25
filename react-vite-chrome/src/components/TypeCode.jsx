import PropTypes from "prop-types";
import HideTypeCode from "./HideTypeCode";
import RefreshIcon from "../assets/icons/refresh.svg";

const TypeCode = (props) => {
  const { code = "12V43P", showQrMask, onResetTimer } = props;

  return (
    <div className="bg-white w-[260px] h-[100px] flex items-center justify-center">
      <p className="text-[hsl(0,0%,8%)] text-center text-[33px] not-italic font-medium leading-9 tracking-[16px]">
        {code.split("").map((char, index) => (
          <span
            key={index}
            className={index === code.length - 1 ? "tracking-normal" : ""}
          >
            {char}
          </span>
        ))}
      </p>
      <HideTypeCode
        icon={RefreshIcon}
        text="Refresh Code"
        className={"absolute"}
        isShow={showQrMask}
        onResetTimer={onResetTimer}
      />
    </div>
  );
};

TypeCode.propTypes = {
  code: PropTypes.string,
  onResetTimer: PropTypes.func,
  showQrMask: PropTypes.bool,
};

export default TypeCode;
