window.WebSocket = window.WebSocket || window.MozWebSocket;
if (!window.WebSocket) {
  document.write("Sorry, your browser doesn't support WebSocket.");
  throw new Error("Browser does not support WebSocket");
}

const connection = new WebSocket(`ws://${window.location.host}`);

const state = {
  x: null,
  y: null,
};

connection.onopen = () => {
  console.log("Connected to server");
};

connection.onclose = () => {
  console.log("Disconnected from server");
};

connection.onerror = (error) => {
  console.error(error);
};

connection.onmessage = (message) => {
  try {
    const data = JSON.parse(message.data);
    console.log("Received: ", data);
    state.x = data.x;
    state.y = data.y;
  } catch (e) {
    console.error(e);
  }
};

// ========================================

const MAP_SIZE = 512;

let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
  type = "canvas";
}

PIXI.utils.sayHello(type);

//Create a Pixi Application
let app = new PIXI.Application({ width: MAP_SIZE, height: MAP_SIZE });

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

// ========================================

const gr = new PIXI.Graphics();
gr.beginFill(0xffffff);
gr.drawCircle(MAP_SIZE / 2, MAP_SIZE / 2, 10);
gr.endFill();
app.stage.addChild(gr);
gr.visible = false;

setInterval(() => {
  if (state.x === null || state.y === null) return;
  gr.visible = true;
  gr.x = state.x * (MAP_SIZE / 2);
  gr.y = state.y * (MAP_SIZE / 2);
}, 200);
