import CopyIcon from "../assets/icons/copy.svg";
import PropTypes from "prop-types";

const TextInput = (props) => {
  const { type, htmlFor, name, label, value } = props;

  const onClickCopy = () => {
    navigator.clipboard.writeText(value)
      .then(() => {
        console.log('Text copied to clipboard:', value);
      })
      .catch(err => {
        console.error('Error copying text:', err);
      });
  };

  return (
    <div className="flex flex-col gap-1 w-full relative">
      <label htmlFor={htmlFor} className="text-sm font-normal">
        {label}
      </label>
      <input
        type={type}
        placeholder="username"
        name={name}
        className="rounded-2xl w-full border border-[#E1E0DE] h-[60px] p-4 bg-transparent outline-none text-lg font-medium text-[#151515]"
        value={value}
        disabled
      />

      <button
        onClick={onClickCopy}
        className="absolute top-[44px] right-[11px] active:scale-50 transition-transform duration-150"
      >
        <img src={CopyIcon} alt="copy" className="" />
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
