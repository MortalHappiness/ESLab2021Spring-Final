window.WebSocket = window.WebSocket || window.MozWebSocket;
if (!window.WebSocket) {
  document.write("Sorry, your browser doesn't support WebSocket.");
  throw new Error("Browser does not support WebSocket");
}

const connection = new WebSocket(`ws://${window.location.host}`);

connection.onopen = () => {
  connection.send("a");
};

connection.onerror = (error) => {
  console.error(error);
};

connection.onmessage = (message) => {
  console.log(message);
};

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
