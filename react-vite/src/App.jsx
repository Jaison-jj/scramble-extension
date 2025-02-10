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
import ClockIcon from "./assets/icons/clock.svg";
import RefreshIcon from "./assets/icons/refresh.svg";
import InvalidSession from "./components/InvalidSession";
import WsError from "./components/WsError";
import AutoPopup from "./components/Autopopup";
import NotSupportedUrl from "./components/NotSupportedUrl";

function App() {
  const [codeData, setCodeData] = useState(null);
  const [codeType, setCodeType] = useState("qrCode");
  const [step, setStep] = useState("");
  const [appEnv, setAppEnv] = useState(null);
  const [wsMessage, setWsMessage] = useState("");
  const [closeText, setCloseText] = useState("Logout");
  const [canShowCodeLoader, setCanShowCodeLoader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPopup, setIsAutoPopup] = useState(false);

  const [creds, setCreds] = useState({
    username: "empty",
    password: "empty",
  });

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
        setIsLoading(false);
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
        setIsLoading(true);
        break;
      case "hideLoaderShowCredentials":
        setStep("showCredentials");
        setCodeType("");
        setCodeData(null);
        setCreds({
          username: request?.user?.userName || "",
          password: request?.user?.password || "",
        });
        setIsLoading(false);
        break;
      case "restartQrTimer":
        setMask({ showMask: false });
        setCodeData(request.newCodeData);
        setCanShowCodeLoader(true);
        setIsLoading(false);
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
      case "websocketError":
        setCodeType(null);
        setStep("wsError");
        setWsMessage(request?.message);
        setCloseText("Close");
        break;
      case "unsupportedSite":
        setCodeType(null);
        setIsLoading(false);
        setStep("unsupportedSite");
        setCloseText("Close");
        break;
      case "appEnvToPopup":
        setAppEnv(request.selectedEnv);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const isAutoPopupContext =
      window.location.search.includes("context=autoPopup");
    if (!chrome || !chrome.runtime || !chrome.runtime.id) return;
    chrome?.runtime?.sendMessage({ action: "open_popup" });
    chrome?.runtime?.onMessage?.addListener(handleMessages);

    chrome.storage.local.get("isAutoPopup").then(({ isAutoPopup }) => {
      if (isAutoPopup && isAutoPopupContext) {
        setIsAutoPopup(true);
      } else {
        setIsAutoPopup(false);
      }
    });

    return () => {
      chrome?.runtime?.onMessage?.removeListener(handleMessages);
    };
  }, []);

  const codeUrl = `https://app.${appEnv}.scrambleid.com/qr?id=${codeData?.code}:${codeData?.qid}`;

  window.onbeforeunload = function (event) {
    chrome?.runtime?.sendMessage({ action: "popupWindowClosed" });
  };

  const renderCode = () => {
    if (isLoading) {
      return <Loader isShow={true} />;
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
          isLoading={isLoading}
          setIsLoading={setIsLoading}
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
    <>
      {isAutoPopup ? (
        <AutoPopup
          codeData={codeData}
          step={step}
          codeType={codeType}
          setCodeType={setCodeType}
          mask={mask}
          canShowCodeLoader={canShowCodeLoader}
          setCanShowCodeLoader={setCanShowCodeLoader}
          setMask={setMask}
          codeUrl={codeUrl}
          creds={creds}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      ) : (
        <div className="w-[340px] min-h-[424px] font-switzer dark:bg-black flex flex-col">
          <Header />
          <div className="flex-grow flex">{renderCode()}</div>
          <Credentials
            isShow={step === "showCredentials"}
            userId={creds.username}
            password={creds.password}
          />
          <NotSupportedUrl isShow={step === "unsupportedSite"} />
          <InvalidSession
            isShow={step === "error"}
            onClickReload={onClickReload}
          />
          <WsError isShow={step === "wsError"} message={wsMessage} />
          <Footer
            codeType={codeType}
            setCodeType={setCodeType}
            closeText={closeText}
          />
        </div>
      )}
    </>
  );
}

export default App;
