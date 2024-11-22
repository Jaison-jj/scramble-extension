import { useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import QrCode from "./components/QrCode";

function App() {
 
  
  useEffect(() => {
    chrome?.runtime?.sendMessage({
      action: 'get-qid-did',
      data: 'your_data'
    });
  }, []);
  // test

  return (
    <>
      <div className="w-[340px] min-h-[424px] bg-green-200">
        <Header />
        <QrCode />
      </div>
    </>
  );
}

export default App;
