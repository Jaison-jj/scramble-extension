import React, { useEffect, useState, useRef } from "react";
import { clearInterval, setInterval } from "worker-timers";
import PropTypes from "prop-types";
import CopyCodeButton from "../CopyCode";
import { cn } from "../../utils/cn";

const NewCircularLoader = ({ children, isShow }) => {
  const radius = 130;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius; // Circle circumference
  const timerRef = useRef(null);

  const [progress, setProgress] = useState(100);
  const [showQrMask, setShowQrMask] = useState(false);

  const onResetTimer = async () => {
    await chrome?.runtime?.sendMessage(
      {
        action: "restart_qr_timer",
      },
      async (response) => {
        console.log(response);
      }
    );
  };

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

  useEffect(() => {
    chrome?.runtime?.onMessage.addListener((request) => {
      if (request.action === "") {
        setShowQrMask(false);
      }
    });
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
          className={cn({ hidden: showQrMask })}
        >
          {/* Full red background */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="transparent"
            stroke="transparent" // Red
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
          {React.isValidElement(children)
            ? React.cloneElement(children, {
                onResetQr: onResetTimer,
                showQrMask,
              })
            : children}
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
