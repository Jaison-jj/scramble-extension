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
import RefreshIcon from "./assets/icons/refresh.svg";
import InvalidSession from "./components/InvalidSession";
import { cn } from "./utils/cn";

function App() {
  const [codeData, setCodeData] = useState(null);
  const [codeType, setCodeType] = useState("qrCode");
  const [step, setStep] = useState("");
  const [creds, setCreds] = useState({
    username: "empty",
    password: "empty",
  });
  const [canShowCodeLoader, setCanShowCodeLoader] = useState(false);
  const [mask, setMask] = useState({
    text: null,
    icon: null,
    showMask: false,
  });

  const onClickReload = () => {
    chrome?.runtime?.sendMessage({ action: "open_popup" });
    setCodeType("qrCode");
    setStep("");
  };

  useEffect(() => {
    chrome?.runtime?.sendMessage({ action: "open_popup" });

    const handleMessages = (request) => {
      console.log("currentAction", request.action);
      switch (request.action) {
        case "transfer_auth_code":
          setCodeData(request.authCodeData);
          setCanShowCodeLoader(true);
          break;

        case "waitingForConfirmationFromMob":
          setMask({
            showMask: true,
            text: "Waiting for confirmation on mobile app.",
            icon: ClockIcon,
          });
          setStep("waitingForConfirmationFromMob");
          break;

        case "refreshCodeNoConsent":
          setMask({
            showMask: true,
            text: "Refresh code",
            icon: RefreshIcon,
          });
          setCanShowCodeLoader(false);
          break;

        case "callingCredentialsApi":
          setStep("callingCredsApi");
          setCodeType("");
          setCodeData(null);
          break;

        case "hideLoaderShowCredentials":
          setStep("showCredentials");
          setCodeType("");
          setCodeData(null);
          setCreds({
            username: request?.user?.userName || "lala",
            password: request?.user?.password || "lala",
          });
          break;

        case "restartQrTimer":
          setMask({ showMask: false });
          setCodeData(request.newCodeData);
          setCanShowCodeLoader(true);
          break;

        case "restartTypeCodeTimer":
          setCodeData(request.newCodeData);
          break;

        case "validationCodeReceived":
          setCodeData(request.newCodeData);
          setStep("validationCodeReceived");
          break;

        case "userExistShowCreds":
          setStep("showCredentials");
          setCodeType("");
          setCodeData(null);
          setCreds({
            username: request.user.userName,
            password: request.user.password,
          });
          break;

        case "error":
          setCodeType(null);
          setStep("error");
          break;

        case "waitingForWsConnection":
          setStep("waitingForWsConnection");
          break;

        case "wsConnectionSuccess":
          setStep("");
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

  const codeUrl = `https://app.${
    import.meta.env.VITE_SUBDOMAIN
  }.scrambleid.com/qr?id=${codeData?.code}:${codeData?.qid}`;

  const renderCode = codeData ? (
    <>
      <NewCircularLoader
        isShow={codeType === "qrCode" && step !== "waitingForWsConnection"}
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
        isShow={codeType === "typeCode" && step !== "waitingForWsConnection"}
        currentStep={step}
        code={codeData?.did}
      >
        <TypeCode code={codeData?.did || "NULL"} key={codeData?.did} />
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
      <Loader
        className={step === "waitingForWsConnection" ? "h-[408px]" : ""}
        isShow={step === "callingCredsApi" || step === "waitingForWsConnection"}
      />
      <Credentials
        isShow={step === "showCredentials"}
        userId={creds.username}
        password={creds.password}
      />
      <InvalidSession isShow={step === "error"} onClickReload={onClickReload} />
      <Footer codeType={codeType} setCodeType={setCodeType} />
    </div>
  );
}

export default App;
