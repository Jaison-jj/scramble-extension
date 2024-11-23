/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import QrCode from "./components/QrCode";
import NewCircularLoader from "./components/loader/NewCircularLoader";
import Footer from "./components/Footer";
import RectangularProgressBar from "./components/loader/RectangualrPregressBar";

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
      <div className="w-[340px] min-h-[424px] bg-green-300">
        <Header />
        {/* <NewCircularLoader isShow={true}>
          <QrCode
            value={`https://app.qa.scrambleid.com/qr?id=${codeData?.code}:${codeData?.qid}`}
          />
        </NewCircularLoader> */}

        <RectangularProgressBar isShow={true}>
          <div style={{ color: "#000", fontWeight: "bold" }}>Loading...</div>
        </RectangularProgressBar>
        <Footer codeType={codeType} setCodeType={setCodeType} />
      </div>
    </>
  );
}

export default App;
