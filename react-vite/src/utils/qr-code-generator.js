import QRCode from './qrcode';

export class QrCodeGenerator {
  constructor({ canvasId }) {
    this.dimension = 300;
    this.edgeGap = 3;
    this.cornerRadius = 30;
    this.jsQrCode = null;
    this.canvasId = canvasId;
  }

  createCanvas({ dimension, edgeGap, cornerRadius }, callbackFn) {
    this.dimension = dimension;
    this.edgeGap = edgeGap;
    this.cornerRadius = cornerRadius;

    const element = document.createElement('js_qrcode');

    const options = {
      width: dimension,
      height: dimension,
      edgeGap: edgeGap,
      cornerRadius: cornerRadius,
    };

    this.jsQrCode = new QRCode(element, options);

    if (typeof callbackFn === 'function') {
      setTimeout(() => callbackFn(), 0);
    }
  }

  generateQRCode(qrText) {
    if (!this.jsQrCode) return;
    this.drawQrCanvas(this.jsQrCode.getDataURL(qrText), this.jsQrCode);
  }

  drawQrCanvas(dataURL, jsQrCode) {
    const canvas_div = document.getElementById(this.canvasId);
    if (!canvas_div) return;

    const qr_size = this.dimension;
    const cropSize = Math.floor(qr_size / 3);
    const canvas_size = Math.floor(qr_size + 2 * cropSize);

    const circle_x = Math.floor(canvas_size / 2);
    // const circle_y = Math.floor(canvas_size / 2);

    // diagonal of circle will be hypotenuse of QR code square
    const new_radius = Math.floor(Math.sqrt(2 * Math.pow(qr_size, 2)) / 2);

    canvas_div.innerHTML = '';

    canvas_div.style.display = 'flex';
    canvas_div.style.alignItems = 'center';
    canvas_div.style.justifyContent = 'center';
    canvas_div.style.flex = '1';

    const canvas = document.createElement('canvas');
    canvas.id = 'canvas';

    canvas.width = canvas_size;
    canvas.height = canvas_size;
    canvas.style.zIndex = 8;
    // canvas.style.position = 'absolute';
    canvas_div.appendChild(canvas);

    const image = new Image();
    image.src = dataURL;

    image.onload = function () {
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.arc(circle_x, circle_x, new_radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.clip();
      // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

      ctx.drawImage(image, cropSize, cropSize);

      //new code
      const detectionDimension = jsQrCode.getDetectionDimension();
      const qr_size_2 = Math.ceil((detectionDimension * qr_size * 0.207) / detectionDimension); // 0.207 is sqrt of 2 divided by 2

      // FILL TOP
      ctx.drawImage(
        image,
        0, // sx
        qr_size - detectionDimension - qr_size_2, // sy
        qr_size, // sWidth
        qr_size_2, // sHeight
        cropSize, // dx
        cropSize - qr_size_2, // dy
        qr_size, // dWidth
        qr_size_2,
      ); // dHeight

      // FILL BOTTOM
      ctx.drawImage(
        image,
        0, // sx
        detectionDimension, // sy
        qr_size, // sWidth
        qr_size_2, // sHeight
        cropSize, // dx
        cropSize + qr_size, // dy
        qr_size, // dWidth
        qr_size_2,
      ); // dHeight

      // FILL LEFT
      ctx.drawImage(
        image,
        qr_size - detectionDimension - qr_size_2, // sx
        0, // sy
        qr_size_2, // sWidth
        qr_size, // sHeight
        cropSize - qr_size_2, // dx
        cropSize, // dy
        qr_size_2, // dWidth
        qr_size,
      ); // dHeight

      // FILL RIGHT
      ctx.drawImage(
        image,
        detectionDimension, // sx
        0, // sy
        qr_size * 0.22, // sWidth
        qr_size, // sHeight
        qr_size + cropSize, // dx
        cropSize, // dy
        qr_size * 0.22, // dWidth
        qr_size,
      ); // dHeight

      //ctx.fillStyle = "white";
      ctx.fillRect(
        cropSize + qr_size - (detectionDimension * 8) / 7, //x
        cropSize - detectionDimension / 7, //y
        (detectionDimension * 8) / 7, //width
        detectionDimension / 7, //height
      );
      ctx.fillRect(
        cropSize - detectionDimension / 7, //x
        cropSize + qr_size - (detectionDimension * 8) / 7, //y
        detectionDimension / 7, //width
        (detectionDimension * 8) / 7, //height
      );
    };
  }
}

export default QrCodeGenerator;