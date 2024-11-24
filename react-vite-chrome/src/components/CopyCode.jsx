import CopyIcon from "../assets/icons/copy.svg"
import { cn } from "../utils/cn";
import PropTypes from "prop-types";

const CopyCodeButton = (props) => {
  const { className } = props;

  return (
    <button
      className={cn(
        "flex gap-1",
        className
      )}
    >
        <img src={CopyIcon} alt="copy" />
      <span className="text-base font-normal">Copy</span> 
    </button>
  );
};

CopyCodeButton.propTypes = {
    className: PropTypes.string,
  };

export default CopyCodeButton;
