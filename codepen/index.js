function makeSVG(tag, attrs) {
	console.log("in makeSVG()");
	var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
	for (var k in attrs)
		if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
	return el;
}

function drawBorder(canvas_div, canvas_size, qr_size, center_pt, qr_radius, borderColor) {
	var svg = makeSVG("svg" , {'width': canvas_size, 'height': canvas_size});
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
	canvas_div.appendChild(svg);
	const stroke_width = qr_size * 0.075; // border width = 7.5% of qr_size
	const qr_border_static_radius = qr_radius + stroke_width / 2;
	var qr_border_static = makeSVG("circle", {"id": "qr_border_static", "fill": borderColor, "cx": center_pt, "cy": center_pt, "r": qr_border_static_radius});
	svg.appendChild(qr_border_static);
	qr_border_static.style.transform = "rotate(270deg)";
	qr_border_static.style.transformOrigin = "center";
}

function drawTimer(canvas_div, canvas_size, qr_size, center_pt, qr_radius, borderColor) {
	var svg = makeSVG("svg" , {'width': canvas_size, 'height': canvas_size});
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
	canvas_div.appendChild(svg);
	const stroke_width = qr_size * 0.075; // border width = 7.5% of qr_size
	const qr_border_static_radius = qr_radius + stroke_width / 2;
	var qr_border_static = makeSVG("circle", {"id": "qr_border_static", "fill": borderColor, "cx": center_pt, "cy": center_pt, "r": qr_border_static_radius});
	svg.appendChild(qr_border_static);
	qr_border_static.style.transform = "rotate(270deg)";
	qr_border_static.style.transformOrigin = "center";
	
	var qr_border = makeSVG("circle", {"id": "qr_border", "fill": "none", "stroke": "gray", "stroke-width": stroke_width, "cx": center_pt, "cy": center_pt, "r": qr_radius});
	qr_border.style.transform = "rotate(270deg)";
	qr_border.style.transformOrigin = "center";
	svg.appendChild(qr_border);
	startTimer(qr_border, 10);
}

//let timer;
function startTimer(qr_border, timer_length){
	let count = 0;
	const length = qr_border.getTotalLength();
	qr_border.style.strokeDasharray = length;
	qr_border.style.strokeDashoffset = length;
	console.log("qr_border.style.strokeDashoffset - " + qr_border.style.strokeDashoffset);
	let timer = setInterval(function(){
		count++;
		qr_border.style.strokeDashoffset = length - (count / timer_length) * length;
		qr_border.style.transition = "1s linear";
		console.log("qr_border.style.strokeDashoffset - " + qr_border.style.strokeDashoffset);
		if (qr_border.style.strokeDashoffset <= 0) {
			clearInterval(timer);
		}
	}, 1000)
}

var dimension;
var js_qrcode;
function makeCode () {		
	document.getElementById("container").style.backgroundColor = bgColor.value;
	dimension = parseInt(document.getElementById("qrsize").value); // NOT WORKING - NEED TO CHECK
	console.log("dimension - " + dimension);
	var elText = document.getElementById("qrtext");
	
	if (!elText.value) {
		alert("Input a text");
		elText.focus();
		return;
	}
	js_qrcode = new QRCode(document.createElement("js_qrcode"), {
		width : dimension,
		height : dimension,
		colorDark : "#2e2e3a",
		colorDark : document.getElementById("qrDark").value,
		colorLight : document.getElementById("qrLight").value,
		edgeGap : parseInt(document.getElementById("edgeGap").value), // value between 0 and 24. 0 for no gap between dots in qrcode and 24 for max gap.
		cornerRadius : parseInt(document.getElementById("cornerRadius").value) // value between 0 and 100. 0 for square and 100 for round.
	});
	
	//js_qrcode.makeCode(elText.value);
	draw(js_qrcode.getDataURL(elText.value));
}

function draw(dataURL) {
	let qr_size = dimension;
	const cropSize = Math.floor(qr_size / 3);
	const canvas_size = Math.floor(qr_size + 2 * cropSize);
	console.log(canvas_size);
	const circle_x = Math.floor(canvas_size / 2);
	const circle_y = Math.floor(canvas_size / 2);
	// diagonal of circle will be hypotenuse of QR code square
	const new_radius = Math.floor(Math.sqrt(2 * Math.pow(qr_size, 2)) / 2);

	const canvas_div = document.getElementById("dv_canvas");
	canvas_div.innerHTML = "";

	const canvas = document.createElement("canvas");
	canvas.id = "canvas";
	canvas.width = canvas_size;
	canvas.height = canvas_size;
	canvas.style.zIndex = 8;
	// canvas.style.position = "absolute";
	canvas.style.border = "1px solid grey";
	canvas_div.appendChild(canvas);
	if (document.getElementById('static').checked) {
		drawBorder(canvas_div, canvas_size, qr_size, circle_x, new_radius, document.getElementById("borderColor").value);
	} else {
		drawTimer(canvas_div, canvas_size, qr_size, circle_x, new_radius, document.getElementById("borderColor").value);
	}
	//return;
	
	let image = new Image();
	image.src = dataURL;
	
	image.onload = function () {
		console.log("Image loaded");
		const ctx = canvas.getContext("2d");
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.arc(circle_x, circle_x, new_radius, 0, 2 * Math.PI);
		ctx.fillStyle = "white";
		ctx.fillStyle = document.getElementById("qrLight").value;
		ctx.fill();
		ctx.clip();
		
		ctx.drawImage(image, cropSize, cropSize);
		
		//new code
		const detectionDimension = js_qrcode.getDetectionDimension();
		const qr_size_2 = Math.ceil(qr_size * 0.207); // 0.207 is sqrt of 2 divided by 2
		// console.log("detectionDimension - " + detectionDimension);
		// console.log("qr_size_2 - " + qr_size_2);
		
		// FILL TOP
		ctx.drawImage(
		image,
		0,											// sx
		qr_size - detectionDimension - qr_size_2,	// sy
		qr_size,									// sWidth
		qr_size_2,									// sHeight
		cropSize,									// dx
		cropSize - qr_size_2,						// dy
		qr_size,									// dWidth
		qr_size_2);									// dHeight
		
		// FILL BOTTOM
		ctx.drawImage(
		image,
		0,					 // sx
		detectionDimension,  // sy
		qr_size,             // sWidth
		qr_size_2,           // sHeight
		cropSize,            // dx
		cropSize + qr_size,  // dy
		qr_size,             // dWidth
		qr_size_2);          // dHeight

		// FILL LEFT
		ctx.drawImage(
		image,
		qr_size - detectionDimension - qr_size_2,	// sx
		0,        									// sy
		qr_size_2, 									// sWidth
		qr_size,  									// sHeight
		cropSize - qr_size_2,   					// dx
		cropSize, 									// dy
		qr_size_2,									// dWidth
		qr_size); 									// dHeight

		// FILL RIGHT
		ctx.drawImage(
		image,
		detectionDimension, // sx
		0,                  // sy
		qr_size_2,          // sWidth
		qr_size,            // sHeight
		qr_size + cropSize, // dx
		cropSize,           // dy
		qr_size_2,          // dWidth
		qr_size);           // dHeight

		ctx.fillRect(
			cropSize + qr_size - detectionDimension * 8/7, //x
			cropSize - detectionDimension / 7, //y
			detectionDimension * 8/7, //width
			detectionDimension / 7 //height
		);
		ctx.fillRect(
			cropSize - detectionDimension / 7, //x
			cropSize + qr_size - detectionDimension * 8/7, //y
			detectionDimension / 7, //width
			detectionDimension * 8/7 //height
		);

	};
}

makeCode();
