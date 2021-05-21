import PIXI from "pixi.js";

import BaseContainer from "./basecontainer";
import { isIntersecting } from "./helpers";
import { LoaderContainer } from "./others";

export class OptionsContainer extends BaseContainer {
  /**
   * Responsible for drawing options on board
   * This assumes that assets are already loaded
   */

  constructor(options) {
    super();
    this.x = 150;
    this.y = 400;
    this.optionNames = options;
    this.drawCircles();
    this.drawText();
    this.drawFruit();
  }

  drawCircles() {
    for (let i = 0; i < 3; i += 1) {
      const option = new PIXI.Sprite(PIXI.Texture.fromFrame("circle.png"));
      option.width = 200;
      option.height = 200;
      option.x = 250 * i;
      if (i == 1) option.y = -100;
      this.add("optionCircles", option);
    }
  }

  detectSelection(mouseData) {
    if (mouseData.length < 2) return;

    const [p1, p2] = mouseData;

    const optionCircles = this.getAll("optionCircles");

    for (let i = 0; i < optionCircles.length; i += 1) {
      const option = optionCircles[i];
      if (isIntersecting(p1, p2, option.getBounds()))
        return this.optionNames[i];
    }
  }

  drawText() {
    const imageExtraPadding = 20;
    const optionCircles = this.getAll("optionCircles");

    for (let i = 0; i < optionCircles.length; i += 1) {
      const option = optionCircles[i];
      const r = option.width / 2;
      let text = this.optionNames[i].split(" ");
      text.forEach((word, i) => {
        word = word[0].toUpperCase() + word.slice(1);
        text[i] = word;
      });
      text = text.join(" ");

      const textContainer = new TextOnPerimiterContainer(
        {
          x: option.x + r,
          y: option.y + r,
        },
        r - imageExtraPadding,
        text
      );
      this.add("textsContainer", textContainer);
    }
  }

  drawFruit() {
    const optionCircles = this.getAll("optionCircles");

    for (let i = 0; i < optionCircles.length; i += 1) {
      const option = optionCircles[i];
      const r = option.width / 2;

      const fruit = new PIXI.Sprite(PIXI.Texture.fromFrame(`option${i}.png`));
      fruit.anchor.x = 0.5;
      fruit.anchor.y = 0.5;
      fruit.width = (4 * r) / 5;
      fruit.height = (4 * r) / 5;
      fruit.x = option.x + r;
      fruit.y = option.y + r;
      fruit.rotation -= 1;
      this.add("fruitsContainer", fruit);
    }
  }

  animate() {
    this.getAll("textsContainer").forEach((text) => {
      text.animate();
    });

    // animate fruits
    this.getAll("fruitsContainer").forEach((fruit, i) => {
      let rotation = 0.05;
      if (i == 1) fruit.rotation -= rotation;
      else fruit.rotation += rotation;
    });
  }
}

export class TextOnPerimiterContainer extends BaseContainer {
  constructor(center, radius, text) {
    super();
    this.center = center;
    this.r = radius;
    this.text = text;
    this.style = {
      fontFamily: "Arial",
      fontSize: 30,
      fill: "#686868",
      align: "center",
      fontWeight: "bolder",
      strokeThickness: 5,
    };
    this.drawText();
  }

  drawText() {
    // PIXI pivot abnormal behaviour

    let theta = -Math.PI / 2;
    for (let i = 0; i < this.text.length; i += 1) {
      const text = new PIXI.Text(this.text[i], this.style);
      text.anchor.x = 0.5;
      text.anchor.y = 0.5;
      text.pivot.x = 0;
      text.x = this.center.x;
      text.pivot.y = this.r;
      text.y = text.pivot.y + (this.center.y - this.r);
      text.rotation = theta + i * 0.3;
      this.addChild(text);
    }
  }

  animate() {
    this.children.forEach((text) => {
      text.rotation += 0.01;
    });
  }
}

export class GameLabelContainer extends BaseContainer {
  /**
   * Responsible for displaying label "Fruit Ninja" on board
   * This assumes that assets are already loaded
   */

  constructor(...args) {
    super(...args);
    this.x = 100;
    this.y = 50;
    this.drawLabel();
  }

  drawLabel() {
    const fruit = new PIXI.Sprite(PIXI.Texture.fromFrame("logofruit.png"));
    fruit.width = 400;
    fruit.height = 150;
    this.addChild(fruit);

    const ninja = new PIXI.Sprite(PIXI.Texture.fromFrame("logoninja.png"));
    ninja.x = 450;
    ninja.width = 300;
    ninja.height = 150;
    this.addChild(ninja);
  }
}

export default class GameOptionsContainer extends BaseContainer {
  constructor(options) {
    super();
    this.optionNames = options;
    this.loading = true;
    this.timestart = +new Date();
  }

  handleOptionSelection() {
    let mouseData = this.parent.mouseData;
    if (this.get("optionsContainer") == undefined) return;
    let selected = this.get("optionsContainer").detectSelection(mouseData);
    return selected;
  }

  animate() {
    const getPercentLoad = () => {
      let percentage = this.parent.filesLoaded / this.parent.filesToLoad;
      percentage = Math.max(percentage, (+new Date() - this.timestart) / 500);
      percentage = Math.min(percentage, 1);
      return percentage;
    };

    if (
      this.parent.filesLoaded < this.parent.filesToLoad ||
      (+new Date() - this.timestart) / 1000 < 0.5
    ) {
      return getPercentLoad();
    }

    if (this.loading) {
      this.loading = false;
      window.dispatchEvent(new Event("resize"));
    }

    this.remove("loaderContainer");

    // Draw stuff on load once
    if (this.get("gameLabelContainer") == undefined) {
      const gameLabelContainer = new GameLabelContainer();
      this.add("gameLabelContainer", gameLabelContainer);
    }

    if (this.get("optionsContainer") == undefined) {
      const optionsContainer = new OptionsContainer(this.optionNames);
      this.add("optionsContainer", optionsContainer);
    } else this.get("optionsContainer").animate();
  }
}
