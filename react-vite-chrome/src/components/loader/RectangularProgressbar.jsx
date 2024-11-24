import { useEffect, useState, useRef } from "react";
import CopyCodeButton from "../CopyCode";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const RectangularProgressbar = (props) => {
  const { children, isShow } = props;

  const [progress, setProgress] = useState(100); // Starts full (100%)
  const timerRef = useRef(null);

  const startTimer = () => {
    clearInterval(timerRef.current);

    setProgress(100);

    const duration = 60000; // 60 seconds
    const step = 100 / duration; // Decrement per millisecond

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - (step * 1000) / 60; // Decrement for ~60fps
      });
    }, 1000 / 60);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  // Calculate the stroke-dashoffset for the progress bar
  const strokeDashoffset = 400 - (progress / 100) * 400;

  return (
    <div
      className={cn(
        "authBackground relative w-[95%] pt-[80px]  h-[408px] mx-auto rounded-md",
        {
          hidden: !isShow,
        }
      )}
    >
      <svg
        className="rectProgressSvg "
        style={{
          "--progress": progress / 100,
        }}
        viewBox={`0 0 ${104 + 20} ${40 + 20}`}
      >
        <rect className="bgRect" stroke="#f8efc4" />
        <rect
          stroke="#FFD700"
          strokeDasharray="400 400"
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 0.1s linear",
          }}
        />
      </svg>
      <button onClick={startTimer} className="typeCode">
        {children}
      </button>

      <CopyCodeButton className="absolute bottom-[43px] left-[131px]" />
    </div>
  );
};

RectangularProgressbar.propTypes = {
  children: PropTypes.any,
  isShow:PropTypes.bool
};

export default RectangularProgressbar;
