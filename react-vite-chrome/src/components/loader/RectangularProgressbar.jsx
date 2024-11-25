import React, { useEffect, useState, useRef } from "react";
import CopyCodeButton from "../CopyCode";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const RectangularProgressbar = (props) => {
  const { children, isShow } = props;

  const [progress, setProgress] = useState(100);
  const [showQrMask, setShowQrMask] = useState(false);

  const timerRef = useRef(null);

  const startTimer = () => {
    setProgress(100); // Reset progress to 100%
    setShowQrMask(false);
    clearInterval(timerRef.current); // Clear any existing timer

    const duration = 60000;
    const step = 100 / duration; // Reduction per millisecond

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current);
          setShowQrMask(true);
          return 0;
        }
        return prev - (step * 1000) / 60; // Decrement per frame (~60fps)
      });
    }, 1000 / 60);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  // Calculate the stroke-dashoffset for the progress bar
  const strokeDashoffset = 400 - (progress / 100) * 500;

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
            // strokeDashoffset:"calc((1 - var(--progress)) * (-400))"
          }}
        />
      </svg>
      <div className="typeCode">
        {React.isValidElement(children)
          ? React.cloneElement(children, {
              onResetTimer: startTimer,
              showQrMask,
            })
          : children}
      </div>

      <CopyCodeButton className="absolute bottom-[43px] left-[131px]" />
    </div>
  );
};

RectangularProgressbar.propTypes = {
  children: PropTypes.any,
  isShow: PropTypes.bool,
};

export default RectangularProgressbar;
