import PIXI from "pixi.js";

import "./index.html";
import BaseContainer from "./basecontainer";
import Knife from "./knife";
import GameOptionsContainer from "./gameoptions";
import GamePlayContainer from "./gameplay";
import {
  HighScoreContainer,
  AboutGameContainer,
  LoaderContainer,
} from "./others";
import { Config } from "./config";

const renderer = PIXI.autoDetectRenderer(
  window.innerWidth,
  window.innerHeight,
  {
    antialiasing: false,
    transparent: false,
    resolution: window.devicePixelRatio,
    autoResize: true,
    backgroundColor: 0x5d371a,
  }
);

document.body.appendChild(renderer.view);

class Root extends BaseContainer {
  constructor(...args) {
    super(...args);
    this.interactive = true;

    this.pause = false;
    // true if Knife in cutting mode
    this.cutting = false;
    // mouse movement data
    this.mouseData = [];

    // used as a trigger for resizing
    this.containerChange = true;
    this.state = "initial";
    this.counter = 0;

    this.filesToLoad = 1;
    this.filesLoaded = 0;
    this.on("mousedown", this.onMouseDown())
      .on("touchstart", this.onMouseDown())
      .on("mousemove", this.onMouseMove())
      .on("touchmove", this.onMouseMove())
      .on("mouseup", this.onMouseUp())
      .on("mouseupoutside", this.onMouseUp())
      .on("touchend", this.onMouseUp())
      .on("touchendoutside", this.onMouseUp());
    //.on('click', this.onClick)

    const options = ["about game", "new game", "high score"];
    const gameContainer = new GameOptionsContainer(options);
    this.add("gameContainer", gameContainer);

    this.loadTextures();
  }

  gameInit() {
    const bg = new PIXI.Sprite(PIXI.Texture.fromFrame("bg.png"));
    bg.height = Config.wh;
    bg.width = Config.ww;
    bg.interactive = true;
    this.add("bg", bg, 0);
  }

  assetsLoaded() {
    this.gameInit();
    this.filesLoaded += 1;
    resize();
  }

  loadTextures() {
    PIXI.loader.add("assets/basics.json").load(() => {
      this.assetsLoaded();
    });
  }

  onClick(e) {
    this.pause = !this.pause;
  }

  onMouseDown() {
    return (e) => {
      this.cutting = true;
      let position = e.data.global;
      this.mouseData.push({
        x: position.x,
        y: position.y,
      });
      if (this.get("knife") === undefined) {
        this.add("knife", new Knife());
      }
    };
  }

  onMouseUp() {
    return (e) => {
      this.cutting = false;
      this.mouseData = [];
    };
  }

  onMouseMove() {
    return (e) => {
      let position = e.data.global;
      if (this.cutting) {
        this.mouseData.push({
          x: position.x,
          y: position.y,
        });

        let knife = this.get("knife");
        while (knife.shifts > 0) {
          this.mouseData.shift();
          knife.shifts -= 1;
        }
      }
    };
  }

  reduceInitial(action) {
    /**
     * Reduce from Initial state to next state
     * Possible actions: about game, new game, high score
     */

    let gameContainer;

    switch (action) {
      case "about game":
        gameContainer = new AboutGameContainer();
        break;
      case "new game":
        const options = ["archade mode", "zen mode", "back"];
        gameContainer = new GameOptionsContainer(options);
        break;
      case "high score":
        gameContainer = new HighScoreContainer();
        break;
    }
    return gameContainer;
  }

  reduceNewGame(action) {
    // Possible actions: zen mode, archade mode, back

    let gameContainer;

    switch (action) {
      case "zen mode":
      case "archade mode":
        gameContainer = new GamePlayContainer(action);
        break;
      case "back":
        const options = ["about game", "new game", "high score"];
        gameContainer = new GameOptionsContainer(options);
        break;
    }
    return gameContainer;
  }

  reduce(action) {
    // Return new state given action

    const prevState = this.state;

    if (this.state == "about game" || this.state == "high score")
      this.state = "initial";
    else this.state = action;

    let gameContainer;

    switch (prevState) {
      case "initial":
        gameContainer = this.reduceInitial(action);
        break;
      case "about game":
      case "high score":
        // go back
        const options = ["about game", "new game", "high score"];
        gameContainer = new GameOptionsContainer(options);
        break;
      case "new game":
        gameContainer = this.reduceNewGame(action);
        break;
    }
    return gameContainer;
  }

  animate() {
    if (this.pause) return;

    const animateLoader = (percentage) => {
      this.remove("loaderContainer");
      const loader = new LoaderContainer(percentage);
      this.add("loaderContainer", loader);
    };

    let percentage = this.get("gameContainer").animate();
    if (percentage !== undefined) {
      animateLoader(percentage);
    } else {
      this.remove("loaderContainer");
    }

    let action = this.get("gameContainer").handleOptionSelection();
    if (action != undefined) {
      this.remove("gameContainer");
      this.containerChange = true;
      this.add("gameContainer", this.reduce(action));
      resizeGameContainer();
    }

    if (this.get("knife") != undefined) this.get("knife").animate();
  }
}

const stage = new Root();

let prev = null;

function resizeGameContainer() {
  const gameContainer = stage.get("gameContainer");
  const state = stage.state;

  if (state === "archade mode" || state === "zen mode") {
    if (stage.containerChange) {
      gameContainer.scale.x *= window.innerWidth / Config.ww;
      gameContainer.scale.y *= window.innerHeight / Config.wh;
      stage.containerChange = false;
    } else {
      gameContainer.scale.x *= renderer.width / stage.w - 0.1;
      gameContainer.scale.y *= renderer.height / stage.h;
    }
  } else {
    if (gameContainer.loading) {
      /*prev = {'x': gameContainer.scale.x, 'y': gameContainer.scale.y};
      gameContainer.scale.x *= window.innerWidth / Config.ww;
      gameContainer.scale.y *= window.innerHeight / Config.wh;*/
    } else {
      if (prev !== null) {
        gameContainer.scale.x = prev.x;
        gameContainer.scale.y = prev.y;
        prev = null;
      }

      if (stage.containerChange) {
        let scale = window.innerHeight / Config.wh;
        if (window.innerHeight < 400) scale += 0.05;
        //  let scale = window.innerWidth / Config.ww;
        gameContainer.scale.x *= scale;
        gameContainer.scale.y *= scale;
        stage.containerChange = false;
      } else {
        let scale = renderer.height / stage.h;
        if (renderer.width < 400) scale += 0.05;
        // let scale = window.innerWidth/Config.ww;
        gameContainer.scale.x *= scale;
        gameContainer.scale.y *= scale;
      }
    }
  }
}

function resize() {
  renderer.resize(window.innerWidth, window.innerHeight);

  stage.w = renderer.width;
  stage.h = renderer.height;

  if (stage.filesLoaded === stage.filesToLoad) {
    const bg = stage.get("bg");
    bg.width = window.innerWidth;
    bg.height = window.innerHeight;
    resizeGameContainer();
  }
}

function animate() {
  stage.animate();
  renderer.render(stage);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
animate();
