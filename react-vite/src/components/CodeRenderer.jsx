import React from "react";

import QrCode from "./QrCode";
import TypeCode from "./TypeCode";
import LoaderIcon from "../assets/icons/loading.svg";
import { cn } from "../utils/cn";
import NewCircularLoader from "./loader/NewCircularLoader";
import RectangularProgressbar from "./loader/RectangularProgressbar";
import Loader from "./Loader";

const CodeRenderer = ({
  codeData,
  step,
  codeType,
  mask,
  canShowCodeLoader,
  setCanShowCodeLoader,
  setMask,
  codeUrl,
}) => {
  if (codeData === null || !Object.keys(codeData).length) {
    return null;
  }

  return (
    <>
      <NewCircularLoader
        isShow={codeType === "qrCode"}
        showQrMask={mask.showMask}
        showLoader={canShowCodeLoader}
        setCanShowCodeLoader={setCanShowCodeLoader}
        setMask={setMask}
        copyCodeValue={`dem:${codeData?.qid}`}
        currentStep={step}
      >
        <QrCode
          loading={!codeData}
          value={codeUrl}
          overlayIcon={mask.icon}
          overlayText={mask.text}
          key={codeData?.qid}
        />
      </NewCircularLoader>
      <RectangularProgressbar
        isShow={codeType === "typeCode"}
        currentStep={step}
        code={codeData?.did}
        isAutoPopup={true}
      >
        <TypeCode
          code={codeData?.did || "123456"}
          key={codeData?.did}
          className="w-[333px] h-[130px]"
        />
      </RectangularProgressbar>
    </>
  );
};

export default CodeRenderer;
