import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createId, toNumber } from "./utils";
import { clearInterval, setInterval } from "worker-timers";

const CircularProgress = ({
  diameter = 200,
  totalSteps = 10,
  completedSteps = 0,
  startColor = "#00C58E",
  stopColor = "#00E0A1",
  innerStrokeColor = "#2F495E",
  strokeWidth = 10,
  innerStrokeWidth = 4,
  strokeLinecap = "round",
  animateSpeed = 1000,
  fps = 60,
  timingFunc = "linear",
  isClockwise = true,
  children,
}) => {
  const id = useMemo(() => createId(), []); // Unique ID for gradients
  const gradient = useRef({ fx: 0.99, fy: 0.5, cx: 0.5, cy: 0.5, r: 0.65 });
  const gradientAnimation = useRef(null);
  const currentAngle = useRef(0);
  const strokeDashoffset = useRef(0);

  const [containerStyle, setContainerStyle] = useState({});
  const [progressStyle, setProgressStyle] = useState({});
  const [strokeStyle, setStrokeStyle] = useState({});
  const [innerCircleStyle, setInnerCircleStyle] = useState({});

  const radius = diameter / 2;
  const innerCircleDiameter = diameter - innerStrokeWidth * 2;
  const circumference = Math.PI * innerCircleDiameter;
  const stepSize = totalSteps === 0 ? 0 : 100 / totalSteps;
  const finishedPercentage = stepSize * completedSteps;
  const circleSlice = (2 * Math.PI) / totalSteps;
  const animationIncrements = 100 / fps;
  const totalPoints = animateSpeed / animationIncrements;
  const animateSlice = circleSlice / totalPoints;
  const innerCircleRadius = innerCircleDiameter / 2;

  const direction = useMemo(() => (isClockwise ? 1 : -1), [isClockwise]);

  const getPointOfCircle = (angle) => {
    const radius = 0.5;
    const x = radius + radius * Math.cos(angle);
    const y = radius + radius * Math.sin(angle);
    return { x, y };
  };

  const gotoPoint = useCallback(() => {
    const point = getPointOfCircle(currentAngle.current);
    if (point.x && point.y) {
      gradient.current.fx = point.x;
      gradient.current.fy = point.y;
    }
  }, []);

  const changeProgress = useCallback(() => {
    strokeDashoffset.current =
      ((100 - finishedPercentage) / 100) * circumference * direction;

    if (gradientAnimation.current) {
      clearInterval(gradientAnimation.current);
    }

    const angleOffset = (completedSteps - 1) * circleSlice;
    let i = (currentAngle.current - angleOffset) / animateSlice;
    const incrementer = Math.abs(i - totalPoints) / totalPoints;
    const isMoveForward = i < totalPoints;

    gradientAnimation.current = setInterval(() => {
      if (
        (isMoveForward && i >= totalPoints) ||
        (!isMoveForward && i < totalPoints)
      ) {
        gradientAnimation.current && clearInterval(gradientAnimation.current);
        return;
      }

      currentAngle.current = angleOffset + animateSlice * i;
      gotoPoint();

      i += isMoveForward ? incrementer : -incrementer;
    }, animationIncrements);
  }, [
    finishedPercentage,
    circumference,
    direction,
    completedSteps,
    circleSlice,
    animateSlice,
    totalPoints,
    gotoPoint,
  ]);

  useEffect(() => {
    setContainerStyle({
      height: `${diameter}px`,
      width: `${diameter}px`,
    });

    setInnerCircleStyle({
      width: `${innerCircleDiameter}px`,
    });

    setProgressStyle({
      height: `${diameter}px`,
      width: `${diameter}px`,
      strokeWidth: `${strokeWidth}px`,
      strokeDashoffset: Math.abs(strokeDashoffset.current),
      transition: `stroke-dashoffset ${animateSpeed}ms ${timingFunc}`,
    });

    setStrokeStyle({
      height: `${diameter}px`,
      width: `${diameter}px`,
      strokeWidth: `${innerStrokeWidth}px`,
    });

    changeProgress();

    return () => {
      gradientAnimation.current && clearInterval(gradientAnimation.current);
    };
  }, [
    diameter,
    innerCircleDiameter,
    strokeWidth,
    animateSpeed,
    timingFunc,
    changeProgress,
  ]);

  const progressClass = isClockwise ? "" : "mirror-progress -scale-x-100 scale-y-100";

  return (
    <div className="vrp__wrapper relative " style={containerStyle}>
      <div
        className="vrp__inner absolute flex items-center justify-center z-[1] mx-auto my-0 rounded-[50%] inset-0"
        style={innerCircleStyle}
      >
        {children}
      </div>

      <svg
        width={diameter}
        height={diameter}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        className={progressClass}
      >
        <defs>
          <radialGradient id={id} {...gradient.current}>
            <stop offset="30%" stopColor={startColor} />
            <stop offset="100%" stopColor={stopColor} />
          </radialGradient>
        </defs>

        <circle
          r={innerCircleRadius}
          cx={radius}
          cy={radius}
          fill="transparent"
          stroke={innerStrokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={0}
          strokeLinecap={strokeLinecap}
          style={strokeStyle}
        ></circle>

        <circle
          transform={`rotate(270, ${radius}, ${radius})`}
          r={innerCircleRadius}
          cx={radius}
          cy={radius}
          fill="transparent"
          stroke={`url(#${id})`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap={strokeLinecap}
          style={progressStyle}
        ></circle>
      </svg>

    </div>
  );
};

export default CircularProgress;
