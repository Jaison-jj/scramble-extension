/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import QrCode from "./components/QrCode";
import NewCircularLoader from "./components/loader/NewCircularLoader";
import Footer from "./components/Footer";
import RectangularProgressbar from "./components/loader/RectangularProgressbar";
import TypeCode from "./components/TypeCode";
// import Credentials from "./components/Credentials";
// import Loader from "./components/Loader";
// import InvalidSession from "./components/InvalidSession";
import LoaderIcon from "./assets/icons/loading.svg";

function App() {
  const [codeData, setCodeData] = useState(null);
  const [codeType, setCodeType] = useState("qrCode");

  useEffect(() => {
    chrome?.runtime?.sendMessage({
      action: "open_popup",
    });

    const getAuthCodeData = (request) => {
      if (request.action === "transfer_auth_code") {
        setCodeData(request.scrambleState.Auth.data);
      }
    };

    chrome?.runtime?.onMessage.addListener(getAuthCodeData);
    return () => {
      chrome?.runtime?.onMessage.removeListener(getAuthCodeData);
    };
  }, []);

  const renderCode = codeData ? (
    <>
      <NewCircularLoader isShow={codeType === "qrCode"}>
        <QrCode
          loading={!codeData}
          value={`https://app.qa.scrambleid.com/qr?id=${codeData?.code}:${codeData?.qid}`}
        />
      </NewCircularLoader>
      <RectangularProgressbar isShow={codeType === "typeCode"}>
        <TypeCode />
      </RectangularProgressbar>
    </>
  ) : (
    <div className="h-[408px] w-[95%] rounded-md authBackground mx-auto flex justify-center items-center">
      <img src={LoaderIcon} alt="loading" className="animate-rotate" />
    </div>
  );

  return (
    <>
      <div className="w-[340px] min-h-[424px] font-switzer dark:bg-black flex flex-col">
        <Header />
        <div className="flex-grow flex">{renderCode}</div>

        {/* <Loader/> */}
        {/* <Credentials /> */}
        {/* <InvalidSession /> */}

        <Footer codeType={codeType} setCodeType={setCodeType} />
      </div>
    </>
  );
}

export default App;
