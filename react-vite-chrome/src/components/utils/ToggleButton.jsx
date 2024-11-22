import React, { useState } from "react";
import LogoBlack from "../../assets/icons/toggle.svg";

const ToggleButton = () => {
  const [isOn, setIsOn] = useState(false);

  const handleToggle = () => {
    setIsOn((prev) => !prev);
  };

  return (
    <div
      onClick={handleToggle}
      style={{
        margin:"auto",
        width: "60px",
        height: "30px",
        borderRadius: "15px",
        backgroundColor: isOn ? "#4caf50" : "#ccc",
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
          top: "-2px",
          left: isOn ? "32px" : "0px",
          transition: "left 0.3s ease",
        }}
      />
    </div>
  );
};

export default ToggleButton;