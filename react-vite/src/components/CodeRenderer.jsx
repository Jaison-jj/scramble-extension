import React from "react";

import QrCode from "./QrCode";
import TypeCode from "./TypeCode";
import LoaderIcon from "../assets/icons/loading.svg";
import { cn } from "../utils/cn";
import NewCircularLoader from "./loader/NewCircularLoader";
import RectangularProgressbar from "./loader/RectangularProgressbar";

// w-[95%]

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
//   if (codeData === null || !Object.keys(codeData).length) {
//     return (
//       <div
//         className={cn(
//           "h-full w-full rounded-md authBackground mx-auto flex justify-center items-center",
//           {
//             hidden: step?.length,
//           }
//         )}
//       >
//         <img src={LoaderIcon} alt="loading" className="animate-rotate" />
//       </div>
//     );
//   }

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
      >
        <TypeCode code={codeData?.did || "123456"} key={codeData?.did} />
      </RectangularProgressbar>
    </>
  );
};

export default CodeRenderer;

//   className="w-333 h-130"
