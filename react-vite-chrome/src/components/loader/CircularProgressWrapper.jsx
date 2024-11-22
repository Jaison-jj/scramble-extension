import React from "react";
import CircularProgress from "./CircularProgress";

const CircularProgressWrapper = ({
  radialDiameter = 300,
  startColor = "#FFD000",
  stopColor = "#FFD000",
  completedSteps = 1,
  totalSteps = 10,
  children,
}) => {
  return (
    <div className="flex items-center justify-center">
      <CircularProgress
        diameter={radialDiameter}
        isClockwise={false}
        startColor={startColor}
        stopColor={stopColor}
        strokeWidth={6}
        strokeLinecap="square"
        innerStrokeColor="transparent"
        timingFunc="linear"
        completedSteps={completedSteps}
        totalSteps={totalSteps}
      >
        {children}
      </CircularProgress>
    </div>
  );
};

export default CircularProgressWrapper;
