/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import QrCode from "./components/QrCode";
import NewCircularLoader from "./components/loader/NewCircularLoader";
import Footer from "./components/Footer";
import RectangularProgressbar from "./components/loader/RectangularProgressbar";
import TypeCode from "./components/TypeCode";
import Credentials from "./components/Credentials";
import Loader from "./components/Loader";
import LoaderIcon from "./assets/icons/loading.svg";
import ClockIcon from "./assets/icons/clock.svg";
import { cn } from "./utils/cn";

function App() {
  const [codeData, setCodeData] = useState(null);
  const [codeType, setCodeType] = useState("qrCode");
  const [step, setStep] = useState("");
  const [creds, setCreds] = useState({
    username: "nill",
    password: "nil",
  });
  const [canShowCodeLoader, setCanShowCodeLoader] = useState(false);
  const [mask, setMask] = useState({
    text: null,
    icon: null,
    showMask: false,
  });

  useEffect(() => {
    chrome?.runtime?.sendMessage({ action: "open_popup" });
    
    const handleMessages = (request) => {
      switch (request.action) {
        case "transfer_auth_code":
          setCodeData(request.authCodeData);
          setCanShowCodeLoader(true);
          break;

        case "waitingForConfirmationFromMob" || "refreshCodeNoConsent":
          setMask({
            showMask: true,
            text: "Waiting for confirmation on mobile app.",
            icon: ClockIcon,
          });
          break;

        case "CALLING_CREDENTIALS_API":
          setStep("callingCredsApi");
          setCodeType("");
          setCodeData(null);
          break;

        case "hideLoaderShowCredentials":
          setStep("showCredentials");
          setCodeType("");
          setCodeData(null);
          setCreds({
            username: request.user.userName,
            password: request.user.password,
          });
          break;

        case "restartQrTimer":
          setMask({ showMask: false });
          setCodeData(request.newCodeData);
          setCanShowCodeLoader(true);
          break;

        default:
          break;
      }
    };

    chrome?.runtime?.onMessage.addListener(handleMessages);

    return () => {
      chrome?.runtime?.onMessage.removeListener(handleMessages);
    };
  }, []);

  const codeUrl = `https://app.qa.scrambleid.com/qr?id=${codeData?.code}:${codeData?.qid}`;

  const renderCode = codeData ? (
    <>
      <NewCircularLoader
        isShow={codeType === "qrCode"}
        showQrMask={mask.showMask}
        showLoader={canShowCodeLoader}
        setCanShowCodeLoader={setCanShowCodeLoader}
        setMask={setMask}
        codeValue={codeUrl}
      >
        <QrCode
          loading={!codeData}
          value={codeUrl}
          overlayIcon={mask.icon}
          overlayText={mask.text}
          key={codeData?.qid}
        />
      </NewCircularLoader>
      <RectangularProgressbar isShow={codeType === "typeCode"}>
        <TypeCode />
      </RectangularProgressbar>
    </>
  ) : (
    <div
      className={cn(
        "h-[408px] w-[95%] rounded-md authBackground mx-auto flex justify-center items-center",
        {
          hidden: step.length,
        }
      )}
    >
      <img src={LoaderIcon} alt="loading" className="animate-rotate" />
    </div>
  );

  return (
    <div className="w-[340px] min-h-[424px] font-switzer dark:bg-black flex flex-col">
      <Header />
      <div className="flex-grow flex">{renderCode}</div>
      <Loader isShow={step === "callingCredsApi"} />
      <Credentials
        isShow={step === "showCredentials"}
        userId={creds.username}
        password={creds.password}
      />
      <Footer codeType={codeType} setCodeType={setCodeType} />
    </div>
  );
}

export default App;
