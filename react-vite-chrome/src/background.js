import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const RectangularProgressbar = (props) => {
  const { children, isShow } = props;

  const [progress, setProgress] = useState(100);
  const [showQrMask, setShowQrMask] = useState(false);

  const timerRef = useRef(null);
  const duration = 60000; // 60 seconds
  const totalLength = 400; // Total stroke length of the progress bar

  const startTimer = () => {
    setProgress(100); // Reset progress to 100%
    setShowQrMask(false);
    clearInterval(timerRef.current); // Clear any existing timer

    const step = 100 / duration; // Progress decrement per millisecond

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

  // Calculate the stroke-dashoffset based on progress
  const strokeDashoffset = totalLength - (progress / 100) * totalLength;

  return (
    <div
      className={cn(
        "authBackground relative w-[95%] pt-[80px] h-[408px] mx-auto rounded-md",
        {
          hidden: !isShow,
        }
      )}
    >
      <svg
        className="rectProgressSvg"
        viewBox={`0 0 ${104 + 20} ${40 + 20}`}
      >
        {/* Background rectangle */}
        <rect
          className="bgRect"
          x="10"
          y="10"
          width="400"
          height="20"
          fill="none"
          stroke="#f8efc4"
          strokeWidth="10"
        />
        {/* Progress rectangle */}
        <rect
          x="10"
          y="10"
          width="400"
          height="20"
          fill="none"
          stroke="#FFD700"
          strokeWidth="10"
          strokeDasharray={totalLength}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 0.1s linear",
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
    </div>
  );
};

RectangularProgressbar.propTypes = {
  children: PropTypes.any,
  isShow: PropTypes.bool,
};

export default RectangularProgressbar;
