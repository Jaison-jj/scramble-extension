const displayElement = document.getElementById("close-timer");
let seconds = 4;

const countdown = setInterval(() => {
  seconds--;
  displayElement.textContent = seconds;
  if (seconds === 0) {
    clearInterval(countdown);
    displayElement.textContent = "";
  }
}, 1000);

function makeSVG(tag, attrs) {
  console.log("in makeSVG()");
  var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (var k in attrs)
    if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
  return el;
}

function drawBorder(
  canvas_div,
  canvas_size,
  qr_size,
  center_pt,
  qr_radius,
  borderColor
) {
  var svg = makeSVG("svg", { width: canvas_size, height: canvas_size });
  svg.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink"
  );
  canvas_div.appendChild(svg);
  const stroke_width = qr_size * 0.075; // border width = 7.5% of qr_size
  const qr_border_static_radius = qr_radius + stroke_width / 2;
  var qr_border_static = makeSVG("circle", {
    id: "qr_border_static",
    fill: borderColor,
    cx: center_pt,
    cy: center_pt,
    r: qr_border_static_radius,
  });
  svg.appendChild(qr_border_static);
  qr_border_static.style.transform = "rotate(270deg)";
  qr_border_static.style.transformOrigin = "center";
}

function waitForQRCode(callback, maxAttempts = 10, interval = 100) {
  if (typeof QRCode !== "undefined") {
    callback();
  } else if (maxAttempts > 0) {
    setTimeout(
      () => waitForQRCode(callback, maxAttempts - 1, interval),
      interval
    );
  } else {
    console.error("QRCode library failed to load");
  }
}

var dimension = 0;
var js_qrcode = undefined;

// async function makeCode() {
//   document.getElementById("container").style.backgroundColor = "#363642";
//   dimension = 200;

//   var elText =
//     "https://app.uat.scrambleid.com/qr?id=dem:d605037c-6e4a-421d-85b0-fc9363415068";

//   // Create a temporary div to hold the QR code
//   var tempDiv = document.createElement("div");

//   js_qrcode = await new QRCode(tempDiv, {
//     width: dimension,
//     height: dimension,
//     colorDark: "#2e2e3a",
//     colorLight: "#FFFFFF",
//     correctLevel: QRCode.CorrectLevel.H, // Highest error correction level
//   });

//   // Make the QR code
//   await js_qrcode.makeCode(elText);

//   // Wait for the QR code to be generated
//   setTimeout(async () => {
//     // Get the canvas element from the temporary div
//     var canvas = tempDiv.getElementsByTagName("canvas")[0];

//     // Get the data URL from the canvas
//     var dataURL = canvas.toDataURL("image/png");
//     await draw(dataURL);
//   }, 500);
// }

async function makeCode() {
  waitForQRCode(async () => {
    try {
      document.getElementById("container").style.backgroundColor = "#363642";
      dimension = 200;

      var elText =
        "https://app.uat.scrambleid.com/qr?id=dem:d605037c-6e4a-421d-85b0-fc9363415068";

      // Create a temporary div to hold the QR code
      var tempDiv = document.createElement("div");

      js_qrcode = new QRCode(tempDiv, {
        width: dimension,
        height: dimension,
        colorDark: "#2e2e3a",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.H, // Highest error correction level
      });

      // Make the QR code
      js_qrcode.makeCode(elText);

      // Wait for the QR code to be generated
      setTimeout(() => {
        // Get the canvas element from the temporary div
        var canvas = tempDiv.getElementsByTagName("canvas")[0];

        // Get the data URL from the canvas
        var dataURL = canvas.toDataURL("image/png");

        // Call the draw function with the data URL
        draw(dataURL);
      }, 100); // Wait 100ms to ensure QR code is generated
    } catch (error) {
      console.error("Error in makeCode:", error);
    }
  });
}

function draw(dataURL) {
  let qr_size = dimension;
  const cropSize = Math.floor(qr_size / 3);
  const canvas_size = Math.floor(qr_size + 2 * cropSize);
  // console.log(canvas_size);
  const circle_x = Math.floor(canvas_size / 2);
  const circle_y = Math.floor(canvas_size / 2);
  // diagonal of circle will be hypotenuse of QR code square
  const new_radius = Math.floor(Math.sqrt(2 * Math.pow(qr_size, 2)) / 2);

  const canvas_div = document.getElementById("dv_canvas");
  canvas_div.innerHTML = "";
  canvas_div.style.maxWidth = "332px";
  canvas_div.style.top = "50%";
  canvas_div.style.left = "50%";
  canvas_div.style.transform = "translate(-50%, -50%)";

  const canvas = document.createElement("canvas");
  canvas.id = "canvas";
  canvas.width = canvas_size;
  canvas.height = canvas_size;
  canvas.style.zIndex = 8;
  canvas.style.border = "1px solid grey";
  canvas_div.appendChild(canvas);

  let timelessQrCode = true;

  if (timelessQrCode) {
    drawBorder(
      canvas_div,
      canvas_size,
      qr_size,
      circle_x,
      new_radius,
      "#ffd000"
    );
  }

  let image = new Image();
  image.src = dataURL;

  image.onload = function () {
    console.log("Image loaded");
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.arc(circle_x, circle_y, new_radius, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.clip();

    ctx.drawImage(image, cropSize, cropSize);

    // Estimate detection dimension (usually about 7 units in a 21x21 QR code)
    const detectionDimension = Math.floor(qr_size / 3);
    const qr_size_2 = Math.ceil(qr_size * 0.207); // 0.207 is sqrt of 2 divided by 2

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
      qr_size_2
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
      qr_size_2
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
      qr_size
    ); // dHeight

    // FILL RIGHT
    ctx.drawImage(
      image,
      detectionDimension, // sx
      0, // sy
      qr_size_2, // sWidth
      qr_size, // sHeight
      qr_size + cropSize, // dx
      cropSize, // dy
      qr_size_2, // dWidth
      qr_size
    ); // dHeight

    ctx.fillRect(
      cropSize + qr_size - (detectionDimension * 8) / 7, //x
      cropSize - detectionDimension / 7, //y
      (detectionDimension * 8) / 7, //width
      detectionDimension / 7 //height
    );
    ctx.fillRect(
      cropSize - detectionDimension / 7, //x
      cropSize + qr_size - (detectionDimension * 8) / 7, //y
      detectionDimension / 7, //width
      (detectionDimension * 8) / 7 //height
    );
  };
}

makeCode();

chrome.cookies.get(
  {
    url: "https://portal.qa.scrambleid.com",
    name: "scramble-session-dem",
  },
  (cookie) => {
    if (cookie) {
      console.log(cookie.value);
      /**
       * if  cookie then hide the button
       * call the api and populate the fields
       */
      const openButton = document.getElementById("openNewTabBtn");
      openButton.remove();
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        const openButton = document.getElementById("openNewTabBtn");
        openButton.addEventListener("click", () => {
          chrome.runtime.sendMessage({ action: "openWebsite" });
        });
      });
      console.log("No scrambled cookie found!!");
    }
  }
);
