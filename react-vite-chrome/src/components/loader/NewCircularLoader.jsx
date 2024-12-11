import React, { useEffect, useState, useRef } from "react";
import { clearInterval, setInterval } from "worker-timers";
import PropTypes from "prop-types";
import CopyCodeButton from "../CopyCode";
import { cn } from "../../utils/cn";
import RefreshIcon from "../../assets/icons/refresh.svg";

const NewCircularLoader = ({
  children,
  isShow,
  showQrMask,
  showLoader,
  setCanShowCodeLoader,
  setMask,
  copyCodeValue,
  currentStep,
}) => {
  const radius = 130;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius; // Circle circumference
  const timerRef = useRef(null);

  const [progress, setProgress] = useState(100);

  const startTimer = () => {
    setProgress(100);
    if (currentStep !== "waitingForConfirmationFromMob") {
      setMask({
        showMask: false,
      });
    }

    clearInterval(timerRef.current);

    const duration = 60000;
    const step = 100 / duration;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current);
          setMask({
            showMask: true,
            text: "Refresh code",
            icon: RefreshIcon,
          });
          setCanShowCodeLoader(false);
          return 0;
        }
        return prev - (step * 1000) / 60;
      });
    }, 1000 / 60);
  };

  const onResetTimer = async () => {
    await chrome?.runtime?.sendMessage({
      action: "restart_qr_timer",
    });
  };

  useEffect(() => {
    if (showLoader) {
      startTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [showLoader, isShow, currentStep]);

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
          className={cn({ hidden: !showLoader })}
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
          <CopyCodeButton
            copyCodeValue={copyCodeValue}
            className={cn(
              "absolute bottom-[-50px] left-[110px] -scale-x-100 scale-y-100",
              {
                hidden: !showLoader,
              }
            )}
          />
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
