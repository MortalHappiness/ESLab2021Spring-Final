import PIXI from "pixi.js";

import BaseContainer from "./basecontainer";
import { isIntersecting } from "./helpers";
import constants from "../../constants.json";

class BaseWithBack extends BaseContainer {
  // Class holding back functionality in bottom right corner

  constructor(...args) {
    super(...args);

    const back = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
    back.anchor.x = 0.5;
    back.anchor.y = 0.5;
    back.x = constants.WIDTH * 0.8;
    back.y = constants.HEIGHT * 0.8;
    this.add("back", back);
  }

  animate() {
    this.get("back").rotation += 0.1;
  }

  detectSelection(mouseData) {
    if (mouseData.length < 2) return;

    let [p1, p2] = mouseData;
    if (isIntersecting(p1, p2, this.get("back").getBounds())) return true;
  }

  handleOptionSelection() {
    let mouseData = this.parent.mouseData;
    return this.detectSelection(mouseData);
  }
}

export class HighScoreContainer extends BaseWithBack {
  constructor(...args) {
    super(...args);
    this.init();
  }

  init() {
    const label = new PIXI.Sprite.fromImage("assets/highscore.png");
    label.anchor.x = 0.5;
    label.anchor.y = 0.5;
    label.width = 300;
    label.x = constants.WIDTH / 2;
    label.y = (constants.HEIGHT * 1) / 4;
    this.addChild(label);
  }
}

export class AboutGameContainer extends BaseWithBack {
  constructor(...args) {
    super(...args);
    this.init();
  }

  init() {
    const board = new PIXI.Sprite.fromImage("assets/board.png");
    board.width = 600;
    board.x = 100;
    board.y = 100;
    this.addChild(board);

    const content =
      "In Fruit Ninja, the player slices fruit with a blade " +
      "controlled via the mouse. As the fruit is thrown onto " +
      "the screen, the player swipes the mouse pointer across " +
      "the screen to create a slicing motion, attempting to " +
      "slice the fruit in half.Extra points are awarded for " +
      "slicing multiple fruits with one swipe, Players must slice " +
      "all fruit if three fruits are missed, the game end. Bombs " +
      "are occasionally thrown onto the screen, and will also end " +
      "the game should the player slice them.";

    const text = new PIXI.Text(content, {
      fontFamily: "Comic Sans MS",
      align: "center",
      fontSize: 30,
      wordWrap: true,
      wordWrapWidth: board.width - 50,
    });

    text.x = board.x + 30;
    text.fontSize = 5;
    text.y = board.y + 50;
    this.addChild(text);
  }
}

export class StateTransitionContainer extends BaseContainer {
  constructor(...args) {
    super(...args);
    this.h = constants.HEIGHT;
    this.w = constants.WIDTH;
    this.init();
  }

  init() {
    const topLayer = new PIXI.Graphics();
    topLayer.beginFill(0x000000, 1);
    topLayer.drawRect(0, 0, this.w, this.h);
    topLayer.alpha = 0.0;
    this.add("topLayer", topLayer);

    /*const topLayerImage = new PIXI.Sprite.fromImage('assets/transition.gif');
    topLayerImage.height = 100;
    topLayerImage.width = 100;
    topLayerImage.x = (this.w - 100) / 2;
    topLayerImage.y = (this.h - 100) / 2;
    this.addChild(topLayerImage);*/
  }

  animate() {
    // transitioning timer is 100 frames
    this.get("topLayer").alpha += 0.007;
  }
}

export class LoaderContainer extends BaseContainer {
  constructor(percentage) {
    super();
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.percentage = percentage;
    this.loaderWidth = this.w / 2;
    this.loaderHeight = 20;
    this.init();
  }

  init() {
    const layer = new PIXI.Graphics();
    layer.beginFill(0x000000, 1);
    layer.drawRect(0, 0, this.w, this.h);
    layer.alpha = 0.5;
    this.add("layer", layer);

    const loader = new PIXI.Graphics();
    loader.beginFill(0x999999, 1);
    loader.drawRect(
      this.w / 2 - this.loaderWidth / 2,
      this.h / 2 - this.loaderHeight / 2,
      this.loaderWidth * this.percentage,
      this.loaderHeight
    );
    this.add("loader", loader);

    const boundary = new PIXI.Graphics();
    boundary.lineStyle(3, 0xffffff);
    boundary.beginFill(0xffffff, 0);
    boundary.drawRect(
      this.w / 2 - this.loaderWidth / 2,
      this.h / 2 - this.loaderHeight / 2,
      this.loaderWidth,
      this.loaderHeight
    );
    this.add("boundary", boundary);
  }
}
