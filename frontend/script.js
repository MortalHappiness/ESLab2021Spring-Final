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

setInterval(() => {
  if (state.x === null || state.y === null) return;
  console.log(state);
}, 500);

// ========================================

let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
  type = "canvas";
}

PIXI.utils.sayHello(type);

//Create a Pixi Application
let app = new PIXI.Application({ width: 256, height: 256 });

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);
