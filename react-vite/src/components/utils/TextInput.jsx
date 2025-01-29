import CopyIcon from "../../assets/icons/copy.svg";
import PropTypes from "prop-types";

const TextInput = (props) => {
  const { type, htmlFor, name, label, value, placeholder } = props;

  async function onClickCopy(textToCopy) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      console.log("Text copied to clipboard:", textToCopy);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }

  return (
    <div className="flex flex-col gap-1 w-full relative">
      <label
        htmlFor={htmlFor}
        className="text-sm font-normal dark:text-[#737066]"
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        name={name}
        className="rounded-2xl w-full dark:text-white border border-[#E1E0DE] dark:border-[#E1E0DE1A] h-[60px] p-4 bg-transparent outline-none text-lg font-medium text-[#151515]"
        value={value}
        disabled
        key={value}
      />

      <button
        onClick={() => onClickCopy(value)}
        className="absolute top-[37px] right-[2px] bg-[#f5f5f5] dark:bg-[#1f1f1f] w-9 h-9 flex items-center justify-center"
      >
        <img src={CopyIcon} alt="copy" className="dark:invert-[1]" />
      </button>
    </div>
  );
};

TextInput.propTypes = {
  type: PropTypes.string,
  htmlFor: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
};

export default TextInput;
