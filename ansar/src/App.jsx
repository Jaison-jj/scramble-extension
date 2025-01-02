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

const NotSupportedUrl = ({ isShow }) => (
  <div
    className={cn(
      "hidden h-[410px] w-[95%] authBackground rounded-md mx-auto flex-col items-center justify-center px-5 pt-[32px]",
      {
        flex: isShow,
      }
    )}
  >
    <p className="font-semibold text-lg dark:text-white">
      This url is not supported!
    </p>
  </div>
);

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

  const handleMessages = (request) => {
    switch (request.action) {
      case "transfer_auth_code":
        setCodeData(request.authCodeData);
        setCanShowCodeLoader(true);
        setCodeType("qrCode");
        setStep("");
        break;

      case "firstTimeLoginShowTypeCode":
        setCodeData({
          ...codeData,
          did: JSON.parse(request.wsEvent.value).uqId,
        });
        setCodeType("typeCode");
        setCanShowCodeLoader(true);
        setStep("");
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
          username: request?.user?.userName || "",
          password: request?.user?.password || "",
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
      case "unsupportedSite":
        setCodeType(null);
        setStep("unsupportedSite");
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    chrome?.runtime?.sendMessage({ action: "open_popup" });
    chrome?.runtime?.onMessage.addListener(handleMessages);

    return () => {
      chrome?.runtime?.onMessage.removeListener(handleMessages);
    };
  }, []);

  const codeUrl = `https://app.${
    import.meta.env.VITE_SUBDOMAIN
  }.scrambleid.com/qr?id=${codeData?.code}:${codeData?.qid}`;

  const renderCode = () => {
    if (!codeData) {
      return (
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
        >
          <TypeCode code={codeData?.did || "NULL"} key={codeData?.did} />
        </RectangularProgressbar>
      </>
    );
  };

  return (
    <div className="w-[340px] min-h-[424px] font-switzer dark:bg-black flex flex-col">
      <Header />
      <div className="flex-grow flex">{renderCode()}</div>
      <Loader isShow={step === "callingCredsApi"} />
      <Credentials
        isShow={step === "showCredentials"}
        userId={creds.username}
        password={creds.password}
      />
      <NotSupportedUrl isShow={step === "unsupportedSite"} />
      <InvalidSession isShow={step === "error"} onClickReload={onClickReload} />
      <Footer
        codeType={codeType}
        setCodeType={setCodeType}
        closeText={step === "unsupportedSite" ? "Close" : "Logout"}
      />
    </div>
  );
}

export default App;
