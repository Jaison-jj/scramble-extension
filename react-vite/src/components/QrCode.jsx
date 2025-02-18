import { useEffect, useState, useRef } from "react";
import { QrCodeGenerator } from "../utils/qr-code-generator";
import PropTypes from "prop-types";
import HideQrCode from "./HideQrCode";

const QrCode = ({
  value = "",
  parentId = "qr-container",
  qrId = "dv_canvas",
  size = 170,
  onResetQr,
  showQrMask,
  overlayIcon,
  overlayText,
}) => {
  const [qrValue] = useState(value);
  const [qrSize] = useState(size);
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
      <HideQrCode
        text={overlayText}
        icon={overlayIcon}
        className="absolute top-[13px] left-[13px] z-50 -scale-x-100 scale-y-100"
        isShow={showQrMask}
        onClick={onResetQr}
      />
    </section>
  );
};

QrCode.propTypes = {
  value: PropTypes.string,
  parentId: PropTypes.string,
  qrId: PropTypes.string,
  size: PropTypes.number,
  onResetQr: PropTypes.func,
  showQrMask: PropTypes.bool,
};

export default QrCode;
