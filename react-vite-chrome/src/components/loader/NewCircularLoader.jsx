import { useEffect, useState, useRef } from "react";
import { clearInterval, setInterval } from "worker-timers";
import PropTypes from "prop-types";
import CopyCodeButton from "../CopyCode";
import { cn } from "../../utils/cn";

const NewCircularLoader = ({ children, isShow }) => {
  const [progress, setProgress] = useState(100); // Starts full (100%)
  const radius = 130; // Circle radius
  const strokeWidth = 6; // Stroke width
  const circumference = 2 * Math.PI * radius; // Circle circumference
  const timerRef = useRef(null);

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

  // Calculate stroke-dashoffset for the red progress part
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={cn(
        "authBackground pt-[38px] w-[95%] h-[408px] mx-auto rounded-md",
        {
          hidden: !isShow,
        }
      )}
    >
      <div
        style={{
          position: "relative",
          width: `${radius * 2 + strokeWidth * 2}px`,
          height: `${radius * 2 + strokeWidth * 2}px`,
          transform: "scale(-1, 1)",
          margin: "auto",
        }}
      >
        <svg
          width={radius * 2 + strokeWidth * 2}
          height={radius * 2 + strokeWidth * 2}
          viewBox={`0 0 ${radius * 2 + strokeWidth * 2} ${
            radius * 2 + strokeWidth * 2
          }`}
        >
          {/* Full red background */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="transparent"
            stroke="#FF0000" // Red
            strokeWidth={strokeWidth - 1}
          />
          {/* Yellow progress */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="transparent"
            stroke="#FFD700" // Yellow
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
              transition: "stroke-dashoffset 0.1s linear",
            }}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
          <CopyCodeButton className="absolute bottom-[-50px] left-[110px] -scale-x-100 scale-y-100" />
        </div>
      </div>
    </div>
  );
};

NewCircularLoader.propTypes = {
  children: PropTypes.any,
  isShow: PropTypes.bool,
};

export default NewCircularLoader;
