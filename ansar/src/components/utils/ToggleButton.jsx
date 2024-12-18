import LogoBlack from "../../assets/icons/toggle.svg";
import PropTypes from "prop-types";

const ToggleButton = (props) => {
  const {isOn, setIsOn} = props

  return (
    <button
      onClick={setIsOn}
      style={{
        width: "60px",
        height: "30px",
        borderRadius: "15px",
        backgroundColor: isOn ? "#ccc" : "#ccc",
        display: "flex",
        alignItems: "center",
        padding: "2px",
        cursor: "pointer",
        transition: "background-color 0.3s ease",
        position: "relative",
      }}
    >
      <img
        src={LogoBlack}
        alt="toggle"
        style={{
          width: "35px",
          height: "35px",
          borderRadius: "50%",
          backgroundColor: "#fff",
          position: "absolute",
          top: "-px",
          left: isOn ? "32px" : "0px",
          transition: "left 0.3s ease",
        }}
      />
    </button>
  );
};

ToggleButton.propTypes = {
  isOn: PropTypes.bool,
  setIsOn: PropTypes.func,
};


export default ToggleButton;