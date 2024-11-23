import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import CopyCodeButton from "../CopyCode";

const NewRectangularLoader = ({ children, isShow }) => {
  const [progress, setProgress] = useState(100); // Starts full (100%)
  const timerRef = useRef(null);

  const width = 300; // Rectangle width
  const height = 150; // Rectangle height
  const borderWidth = 6; // Border width

  useEffect(() => {
    // Animate progress from 100 to 0 over 60 seconds
    const duration = 60000; // 60 seconds
    const step = 100 / duration; // Reduction per millisecond

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - (step * 1000) / 60; // Decrement per frame (~60fps)
      });
    }, 1000 / 60);

    return () => clearInterval(timerRef.current);
  }, []);

  // Calculate the width of the progress fill
  const progressWidth = (progress / 100) * (width - 2 * borderWidth); // Excluding border space

  return (
    <div
      className="authBackground w-[95%] pt-[38px] h-[408px] mx-auto rounded-md"
      style={{
        display: isShow ? "block" : "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: `${width}px`,
          height: `${height}px`,
          border: `${borderWidth}px solid #FF0000`, // Red border
          boxSizing: "border-box",
          margin: "auto",
        }}
      >
        {/* Progress fill */}
        <div
          style={{
            position: "absolute",
            top: borderWidth, // Leave border at the top
            left: borderWidth, // Leave border on the left
            width: `${progressWidth}px`,
            height: `${height - 2 * borderWidth}px`, // Full height minus border space
            backgroundColor: "#FFD700", // Yellow progress bar
            transition: "width 0.1s linear", // Smooth transition for width change
          }}
        ></div>

        {/* Children content inside the progress bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1, // Make sure content appears above the progress bar
            backgroundColor: "#fff",
            borderRadius: "5px",
            padding: "10px",
          }}
        >
          {children}
          <CopyCodeButton className="absolute bottom-[-50px] left-[110px] -scale-x-100 scale-y-100" />
        </div>
      </div>
    </div>
  );
};

NewRectangularLoader.propTypes = {
  children: PropTypes.any,
  isShow: PropTypes.bool,
};

export default NewRectangularLoader;
