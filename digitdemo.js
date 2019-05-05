let model;
window.onload = Init;

let drawCanvas;
let ctx_draw;
let drawing = false;
let lastPos;
let lineWidth = 20;
let drawingPathIndex = -1;
let drawingDotsIndex = 0;
let drawingPaths = [];
let drawingDots = [];
const TAU = Math.PI * 2;
let freshCanvas = true;
let chart;

async function Init() {
  drawCanvas = document.getElementById("drawCanvas");
  ctx_draw = drawCanvas.getContext("2d");
  ctx_draw.mozImageSmoothingEnabled = false;
  ctx_draw.webkitImageSmoothingEnabled = false;
  ctx_draw.msImageSmoothingEnabled = false;
  ctx_draw.imageSmoothingEnabled = false;

  resetDrawingCanvas();

  drawCanvas.addEventListener("mousedown", onMouseDown, false);
  window.addEventListener("mouseup", onMouseUp, false);
  drawCanvas.addEventListener("mousemove", onMouseMove, false);
  drawCanvas.addEventListener("contextmenu", onContextMenu, false);
  drawCanvas.addEventListener("mouseout", onMouseOut, false);
  drawCanvas.addEventListener("mouseover", onMouseOver, false);

  var ctx = document.getElementById("myChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "bar",

    data: {
      labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      datasets: [
        {
          label: "Confident",
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)"
        }
      ]
    }
  });

  // Load tensorflow trained model
  model = await tf.loadLayersModel("file://model.json");
}

function resetDrawingCanvas() {
  if (ctx_draw == undefined) return;

  drawingDotsIndex = 0;
  drawingDots = [];
  freshCanvas = true;
  ctx_draw.fillStyle = "black";
  ctx_draw.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
  ctx_draw.fillStyle = "rgb(0,0,0)";
  ctx_draw.font = "22px Verdana";
  ctx_draw.fillText("Draw a digit (0-9) here", 24, 150);
}

function onContextMenu(e) {
  e.preventDefault();
}

function onMouseDown(e) {
  if (freshCanvas) {
    freshCanvas = false;
    ctx_draw.fillStyle = "black";
    ctx_draw.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
  }
  drawing = true;
  drawingPathIndex++;
  drawingPaths[drawingPathIndex] = [];
  lastPos = [e.offsetX, e.offsetY];
  drawingDots[drawingDotsIndex] = lastPos;
  drawingDotsIndex++;
  ctx_draw.strokeStyle = "white";
  ctx_draw.fillStyle = "white";
  ctx_draw.lineCap = "round";
  ctx_draw.lineJoin = "round";
  ctx_draw.beginPath();
  ctx_draw.arc(e.offsetX, e.offsetY, lineWidth / 2, 0, TAU);
  ctx_draw.fill();
}

function onMouseUp(e) {
  if (drawing) {
    guessNumber();
    drawing = false;
    lastPos = undefined;
  }
}

function onMouseOut(e) {
  drawing = false;
  lastPos = undefined;
}

function onMouseOver(e) {}

function onMouseMove(e) {
  if (!drawing) return;
  if (e.target != drawCanvas) {
    drawing = false;
    lastPos = undefined;
    return;
  }

  var x = Math.max(0, Math.min(e.target.width, e.offsetX));
  var y = Math.max(0, Math.min(e.target.height, e.offsetY));

  if (
    e.offsetX > 0 &&
    e.offsetX < e.target.width &&
    e.offsetY > 0 &&
    e.offsetY < e.target.height
  ) {
    ctx_draw.lineWidth = lineWidth;

    if (lastPos != undefined) {
      ctx_draw.beginPath();
      ctx_draw.moveTo(lastPos[0], lastPos[1]);
      ctx_draw.lineTo(x, y);
      ctx_draw.stroke();
    } else {
      drawingPathIndex++;
      ctx_draw.beginPath();
      ctx_draw.arc(x, y, lineWidth / 2, 0, TAU);
      ctx_draw.fill();
    }

    if (drawingPaths[drawingPathIndex] == undefined) {
      drawingPaths[drawingPathIndex] = [];
    }

    drawingPaths[drawingPathIndex].push([x, y]);
    lastPos = [x, y];
  } else {
    lastPos = undefined;
  }
}

function buttonClick(n) {
  switch (n) {
    case 1: {
      guessNumber();
      break;
    }

    case 2: {
      drawingPaths = [];
      drawingPathIndex = -1;
      lastPos = undefined;

      resetDrawingCanvas();
      break;
    }
  }
}

function guessNumber() {
  const inputImageData = ctx_draw.getImageData(
    0,
    0,
    ctx_draw.canvas.width,
    ctx_draw.canvas.height
  );

  console.log(inputImageData);

  var tfImg = tf.browser.fromPixels(inputImageData, 1);
  var smalImg = tf.image.resizeBilinear(tfImg, [28, 28]);
  smalImg = tf.cast(smalImg, "float32").reshape([28, 28]);
  var tensor = smalImg.expandDims(0);
  tensor = tensor.div(tf.scalar(255));

  console.log(tensor.arraySync());

  var result = model.predict(tensor).arraySync()[0];

  for (var i = 0; i < 10; i++) chart.data.datasets[0].data[i] = result[i];
  chart.update();
  console.log(result);
}
