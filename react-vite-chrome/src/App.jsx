import { useEffect, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import QrCode from "./components/QrCode";
import NewCircularLoader from "./components/loader/NewCircularLoader";
// import ToggleButton from "./components/utils/ToggleButton";

function App() {
  const [codeData, setCodeData] = useState(null);

  useEffect(() => {
    chrome?.runtime?.sendMessage({
      action: "get-qid-did",
      data: "data to sw",
    });

    const getAuthCodeData = (request) => {
      if (request.action === "transfer_auth_code") {
        console.log("auth_code:", request.data);
        setCodeData(request.data);
      }
    };

    chrome?.runtime?.onMessage.addListener(getAuthCodeData);

    return () => {
      chrome?.runtime?.onMessage.removeListener(getAuthCodeData);
    };
  }, []);

  return (
    <>
      <div className="w-[340px] min-h-[424px] bg-green-200">
        <Header />
        <NewCircularLoader>
          <QrCode
            value={`https://app.qa.scrambleid.com/qr?id=${codeData?.code}:${codeData?.qid}`}
          />
        </NewCircularLoader>
      </div>
    </>
  );
}

export default App;
