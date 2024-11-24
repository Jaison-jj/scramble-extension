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
import Loader from "./components/Loader";

function App() {
  const [codeData, setCodeData] = useState(null);
  const [codeType, setCodeType] = useState("qrCoder");

  useEffect(() => {
    chrome?.runtime?.sendMessage({
      action: "open_popup",
    });

    const getAuthCodeData = (request) => {
      if (request.action === "transfer_auth_code") {
        setCodeData(request.scrambleState.Auth.data);
      }

      if (request.action === "received_ws_message") {
        console.log(request);
      }
    };

    chrome?.runtime?.onMessage.addListener(getAuthCodeData);

    return () => {
      chrome?.runtime?.onMessage.removeListener(getAuthCodeData);
    };
  }, []);

  return (
    <>
      <div className="w-[340px] min-h-[424px] bg-violet-300">
        <Header />
        <NewCircularLoader isShow={codeType === "qrCode"}>
          <QrCode
            value={`https://app.qa.scrambleid.com/qr?id=${codeData?.code}:${codeData?.qid}`}
          />
        </NewCircularLoader>

        <RectangularProgressbar isShow={codeType === "typeCode"}>
          <TypeCode />
        </RectangularProgressbar>

        <Loader/>
        {/* <Credentials /> */}

        <Footer codeType={codeType} setCodeType={setCodeType} />
      </div>
    </>
  );
}

export default App;
