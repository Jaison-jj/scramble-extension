import { useEffect } from "react";
import "./App.css";
import Header from "./components/Header";

function App() {
  async function getQidOrDid() {
    const res = await fetch(
      "https://wsp2.dev.scrambleid.com/login/portal/ZGVtfHxkZW0tcG9ydGFs?format=json",
      {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          origin: "http://localhost:3100",
          priority: "u=1, i",
          referer: "http://localhost:3100/",
          "sec-ch-ua":
            '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      }
    );
    const data = await res.json()

    console.log(data);
  }

  useEffect(() => {
    getQidOrDid();
  }, []);

  return (
    <>
      <div className="w-[340px] min-h-[424px] bg-green-200">
        <Header />
      </div>
    </>
  );
}

export default App;
