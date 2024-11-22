import React, { useEffect, useState, useRef } from "react";
import { QrCodeGenerator } from "../utils/qr-code-generator";

const QrCode = ({
  value = "",
  parentId = "qr-container",
  qrId = "dv_canvas",
  size = 200,
}) => {
  const [qrValue, setQrValue] = useState(value);
  const [qrSize, setQrSize] = useState(size);
  const qrGeneratorRef = useRef(null);

  // Initialize QRCodeGenerator
  useEffect(() => {
    qrGeneratorRef.current = new QrCodeGenerator({ canvasId: qrId });
    createQRCanvas(); // Create canvas on mount
  }, []);

  // Watch for `value` changes
  useEffect(() => {
    if (qrGeneratorRef.current) {
      generateQRCode(qrValue);
    }
  }, [qrValue]);

  // Watch for `size` changes
  useEffect(() => {
    if (qrGeneratorRef.current) {
      createQRCanvas();
    }
  }, [qrSize]);

  const createQRCanvas = () => {
    qrGeneratorRef.current.createCanvas(
      { dimension: qrSize, edgeGap: 3, cornerRadius: 30 },
      () => generateQRCode(qrValue)
    );
  };

  const generateQRCode = (code) => {
    qrGeneratorRef.current.generateQRCode(code || "XXX");
  };

  return (
    <section>
      <div id={parentId} className="">
        <div id={qrId}></div>
      </div>
    </section>
  );
};

export default QrCode;
