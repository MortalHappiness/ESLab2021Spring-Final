/**
 * Implements final game container with all the logic
 * related to fruits, cut fruits, splashes and drops
 */

import PIXI from "pixi.js";

import { Config, imageMappings, dropsColor, specials } from "./config";
import constants from "../../constants.json";
import BaseContainer from "./basecontainer";
import { isIntersecting } from "./helpers";
import { LoaderContainer } from "./others";

export default class GamePlayContainer extends BaseContainer {
  constructor(mode) {
    super();

    this.filesToLoad = 5;
    this.filesLoaded = 0;
    this.boardInitialized = false;
    this.startTime = +new Date();
    this.mode = mode;
    this.score = 0;
    this.missed = 0;

    this.freezeTimer = 0;
    this.frenzyTimer = 0;
    this.doubleTimer = 0;
    this.bombTimer = 0;
    this.fruitsThrowRate = 2;

    this.loadTextures();
  }

  assetLoaded() {
    this.filesLoaded += 1;
  }

  handleOptionSelection() {
    // For pause, resume, and back
  }

  loadTextures() {
    PIXI.loader.add("assets/fruits.json").load(() => {
      this.assetLoaded();
    });
    PIXI.loader.add("assets/halffruits.json").load(() => {
      this.assetLoaded();
    });
    PIXI.loader.add("assets/splashes.json").load(() => {
      this.assetLoaded();
    });
    PIXI.loader.add("assets/nums.json").load(() => {
      this.assetLoaded();
    });
    PIXI.loader.add("assets/speciallabels.json").load(() => {
      this.assetLoaded();
    });

    const dropAsTexture = (color) => {
      let dropRenderer = new PIXI.CanvasRenderer(100, 100, {
        transparent: true,
      });
      let drop = new PIXI.Graphics();
      drop.beginFill(color, 1);
      drop.drawCircle(50, 50, Config.drops.rad);
      drop.endFill();
      dropRenderer.render(drop);
      return dropRenderer.view;
    };

    this.dropTextures = {};
    dropsColor.forEach((color, i) => {
      this.dropTextures[color] = new PIXI.Texture.fromCanvas(
        dropAsTexture(color)
      );
    });
  }

  animate() {
    if (this.parent.pause) return;

    const addNewFruits = () => {
      const sampleFruit = () => {
        // let id = Math.floor(Math.random() * 10);
        let id = Math.floor(Math.random() * 14);
        return id;
      };

      const getNewFruit = (id) => {
        const details = {
          x: Math.random() * (constants.WIDTH - 200) + 50,
          y: constants.HEIGHT,
          vx: Math.max(1, Math.random() * Config.fruit.vx),
          vy: Config.fruit.vy,
          width: Config.fruit.size,
          height: Config.fruit.size,
          anchor: {
            x: 0.5,
            y: 0.5,
          },
          omega: Math.random() * 0.01 * (Math.random() > 0.5 ? 1 : -1),
        };

        if (details.x > constants.WIDTH / 2) details.vx *= -1;

        const fruit = new PIXI.Sprite(PIXI.Texture.fromFrame(`fruit${id}.png`));

        id = id >= 10 ? specials[id - 10] : `fruit${id}`;
        Object.assign(fruit, details, { id });

        return fruit;
      };

      let fruitCount = this.getAll("fruits").length;

      if (fruitCount < this.fruitsThrowRate) {
        this.add("fruits", getNewFruit(sampleFruit()));
      }
    };

    // Define animation function for all elements

    const getPercentLoad = () => {
      let percentage = this.filesLoaded / this.filesToLoad;
      percentage = Math.max(percentage, (+new Date() - this.startTime) / 500);
      percentage = Math.min(percentage, 1);
      return percentage;
    };

    const animateFruits = () => {
      let count = 0,
        fruitsMissed = 0;

      for (const fruit of this.getAll("fruits")) {
        if (fruit.y > constants.HEIGHT) {
          fruitsMissed += 1;
          this.remove("fruits", fruit.name);
        } else {
          let ratio = this.freezeTimer > 0 ? 0.5 : 1;
          fruit.x += fruit.vx * ratio;
          fruit.y += fruit.vy * ratio;
          fruit.vy += Config.acc * ratio;
          fruit.rotation += fruit.omega * ratio;
        }
        count += 1;
      }

      return fruitsMissed;
    };

    const animateSplashes = () => {
      for (const splash of this.getAll("splashes")) {
        if (splash.alpha <= 0) this.remove("splashes", splash.name);
        else splash.alpha -= 0.01;
      }
    };

    const animateCutFruits = () => {
      for (const hf of this.getAll("halfFruits")) {
        if (hf.alpha <= 0) this.remove("halfFruits", hf.name);
        else {
          hf.x += hf.vx;
          hf.y += hf.vy;
          hf.vy += Config.acc;
        }
      }
    };

    const animateDrops = () => {
      for (const drop of this.getAll("drops")) {
        if (drop.scale.x < 0) this.remove("drops", drop.name);
        else {
          // Move drops while decreasing size
          const details = drop.details;
          drop.x += details.vx;
          drop.y += details.vy;
          drop.scale.x -= 0.05;
          drop.scale.y -= 0.05;
        }
      }
    };

    const animateSpecialFruitTakenLabels = () => {
      this.getAll("specialFruitTakenLabels").forEach((label) => {
        if (label.y < 100 || label.scale.x < 0.2)
          this.remove("specialFruitTakenLabels", label.name);

        label.scale.x -= 0.01;
        label.scale.y -= 0.01;
        label.y -= 10;
      });
    };

    const animateSpecialFruitTakenLayers = () => {
      if (this.frenzyTimer === 0) this.remove("frenzyLayer");
      if (this.freezeTimer === 0) this.remove("freezeLayer");
      if (this.doubleTimer === 0) this.remove("doubleLayer");
      if (this.bombTimer === 0) this.remove("bombLayer");

      this.freezeTimer = Math.max(this.freezeTimer - 1, 0);
      this.frenzyTimer = Math.max(this.frenzyTimer - 1, 0);
      this.doubleTimer = Math.max(this.doubleTimer - 1, 0);
      this.bombTimer = Math.max(this.bombTimer - 1, 0);

      if (this.frenzyTimer === 0) this.fruitsThrowRate = 2;

      if (this.doubleTimer === 0) this.scoreMultiplier = 1;
    };

    // Images not loaded yet
    if (
      this.filesLoaded < this.filesToLoad ||
      (+new Date() - this.startTime) / 1000 < 0.5
    ) {
      return getPercentLoad();
    }

    if (!this.boardInitialized) {
      this.boardInitialized = true;
      this.initializeBoard();
    }

    if (this.parent.cutting) {
      let cuts = this.initializeIfFruitCuts();
      this.score += cuts;

      if (cuts >= 3) {
        //
      }
    }

    this.missed += animateFruits();

    addNewFruits();

    animateDrops();

    animateCutFruits();

    animateSplashes();

    this.get("scoreBoard").animate(this.score);

    if (this.mode === "archade mode") {
      let seconds = 60 - Math.floor((+new Date() - this.startTime) / 1000);
      this.get("timeBoard").animate(seconds);
    } else if (this.mode === "zen mode") {
      this.get("crossBoard").animate(this.missed);
    }

    animateSpecialFruitTakenLabels();
    animateSpecialFruitTakenLayers();
  }

  initializeBoard() {
    this.add("scoreBoard", new ScoreBoard());

    if (this.mode === "archade mode") {
      this.add("timeBoard", new TimeBoard());
    } else if (this.mode === "zen mode") {
      this.add("crossBoard", new CrossBoard());
    }
  }

  initializeIfFruitCuts() {
    /**
     * Handle fruit cuts and it's animation Initializations. Further
     * animation is handled in animation function itself.
     */

    const checkIfIntersection = (mouseData, fruit) => {
      if (mouseData.length < 2) return false;

      let p1, p2;
      [p1, p2] = [...mouseData];

      return isIntersecting(p1, p2, fruit);
    };

    const getNewDrop = (details) => {
      const drop = new PIXI.Graphics();
      drop.x = details.x;
      drop.y = details.y;
      drop.lineStyle(2, details.color);
      drop.beginFill(details.color, 1);
      drop.drawCircle(0, 0, details.radius);
      drop.endFill();
      drop.vx = details.vx;
      drop.vy = details.vy;
      //drop.visible = details.visible;
      drop.details = details;
      return drop;
    };

    const getNewDropViaTexture = (details) => {
      const drop = new PIXI.Sprite(this.dropTextures[details.color]);
      drop.x = details.x;
      drop.y = details.y;
      drop.vx = details.vx;
      drop.vy = details.vy;
      drop.details = details;
      return drop;
    };

    const initializeDrops = (fruit) => {
      for (let i = 0; i < 40; i += 1) {
        let vx = Math.floor(Math.random() * 10);
        let vy = Math.floor(Math.random() * 10);
        let radius = Config.drops.rad;

        if (Math.floor(Math.random() * 2)) vx = -vx;
        if (Math.floor(Math.random() * 2)) vy = -vy;

        const mapping = imageMappings[fruit.id];
        const details = {
          x: fruit.x,
          y: fruit.y,
          vx,
          vy,
          radius,
          color: mapping.dropColor,
          //visibleID: (Math.floor(Math.random()*2) === 0)
        };
        this.add("drops", getNewDropViaTexture(details));
      }
    };

    const initializeCutFruit = (fruit) => {
      const mapping = imageMappings[fruit.id];

      const hf1 = new PIXI.Sprite(PIXI.Texture.fromFrame(`${mapping.hf1}.png`));
      const hf2 = new PIXI.Sprite(PIXI.Texture.fromFrame(`${mapping.hf2}.png`));

      const details = {
        x: fruit.x,
        y: fruit.y,
        vx: fruit.vx,
        vy: fruit.vy,
        width: Config.halfFruit.size,
        height: Config.halfFruit.size,
      };

      Object.assign(hf1, details, { x: fruit.x - 25 });
      Object.assign(hf2, details, { x: fruit.x + 25 });

      this.add("halfFruits", hf1);
      this.add("halfFruits", hf2);
    };

    const initializeSplash = (fruit) => {
      const mapping = imageMappings[fruit.id];

      const splash = new PIXI.Sprite(
        PIXI.Texture.fromFrame(`${mapping.splash}.png`)
      );

      const details = {
        x: fruit.x,
        y: fruit.y,
        vx: fruit.vx,
        vy: fruit.vy,
        width: Config.splash.size,
        height: Config.splash.size,
      };

      Object.assign(splash, details);

      this.add("splashes", splash);
    };

    const initializeSpecialFruitTaken = (fruit) => {
      const clearAll = () => {
        this.remove("fruits");
        this.remove("halfFruits");
        this.remove("drops");
        this.remove("splashes");

        this.remove("specialFruitTakenLabels");

        this.remove("doubleLayer");
        this.remove("frenzyLayer");
        this.remove("freezeLayer");
      };

      switch (fruit.id) {
        case "frenzy":
          this.fruitsThrowRate = 5;
          this.frenzyTimer = 500;
          break;
        case "double":
          this.scoreMultiplier = 2;
          this.doubleTimer = 500;
          break;
        case "freeze":
          this.freezeTimer = 500;
          break;
        case "bomb":
          this.bombTimer = 100;
          this.score -= 10;
          clearAll();
          break;
      }

      // Add label
      if (fruit.id !== "bomb") {
        let label = new PIXI.Sprite(PIXI.Texture.fromFrame(`${fruit.id}.png`));
        label.anchor.x = 0.5;
        label.anchor.y = 0.5;
        label.width = 300;
        label.height = 100;
        label.x = fruit.x;
        label.y = fruit.y;
        this.add("specialFruitTakenLabels", label);
      }

      // Add layer
      const layer = new PIXI.Graphics();
      layer.beginFill(Config.specialFruitLayerColor[fruit.id], 1);
      layer.drawRect(0, 0, constants.WIDTH, constants.HEIGHT);
      layer.alpha = fruit.id == "bomb" ? 1 : 0.3;
      this.add(`${fruit.id}Layer`, layer);

      if (fruit.id !== "bomb") {
        initializeDrops(fruit);
        initializeSplash(fruit);
      }
    };

    const mouseData = this.parent.mouseData;

    let noFruitCuts = 0;
    for (let fruit of this.getAll("fruits")) {
      if (!checkIfIntersection(mouseData, fruit.getBounds())) continue;

      noFruitCuts += fruit.id !== "bomb" ? 1 * this.scoreMultiplier : 0;

      // Fruit cut successfull: Add splashes, drops and remove fruit
      // Bomb

      if (!fruit.id.startsWith("fruit")) {
        initializeSpecialFruitTaken(fruit);
      } else {
        initializeDrops(fruit);
        initializeSplash(fruit);
        initializeCutFruit(fruit);
      }

      // Fruit previously removed if bomb
      this.remove("fruits", fruit.name);
    }
    return noFruitCuts;
  }

  resize() {}
}

class ScoreBoard extends BaseContainer {
  constructor() {
    super();
    this.x = 80;
    this.y = 50;
  }

  animate(score) {
    let chars = [];
    while (score > 0) {
      chars.unshift(score % 10);
      score = Math.floor(score / 10);
    }
    if (chars.length === 1) chars.unshift(0);
    if (chars.length === 0) chars = [0, 0];

    this.remove("chars");

    let x = 0;
    for (let char of chars) {
      const gr = new PIXI.Sprite(PIXI.Texture.fromFrame(`num${char}.png`));
      gr.width = 40;
      gr.height = 50;
      gr.x = x;
      gr.y = 0;
      x += 50;
      this.add("chars", gr);
    }
  }
}

class TimeBoard extends BaseContainer {
  constructor() {
    super();
    this.x = constants.WIDTH - 250;
    this.y = 70;
  }

  animate(seconds) {
    let mins = Math.floor(seconds / 60);
    let secs = seconds % 60;
    secs = [Math.floor(secs / 10), secs % 10];

    let chars = [mins, "10", ...secs]; // '10' is for ':'

    this.remove("chars");

    let x = 0;
    for (let s of chars) {
      const gr = new PIXI.Sprite(PIXI.Texture.fromFrame(`num${s}.png`));
      gr.x = x;
      gr.y = 0;
      gr.width = 40;
      gr.height = 50;
      this.add("chars", gr);
      x += 50;
    }
  }
}

class CrossBoard extends BaseContainer {
  constructor() {
    super();
    this.x = constants.WIDTH - 250;
    this.y = 70;
  }

  animate(missed) {
    let cross = [];
    for (let i = 0; i < missed && i < 3; i += 1) {
      // Push red cross
      cross.push("r");
    }
    while (cross.length < 3) {
      // Push black cross
      cross.push("b");
    }

    this.remove("crosses");

    let x = 0;
    for (let c of cross) {
      const gr = new PIXI.Sprite(PIXI.Texture.fromFrame(`${c}cross.png`));
      gr.x = x;
      gr.y = 0;
      gr.width = 30;
      gr.height = 30;
      x += 40;
      this.add("crosses", gr);
    }
  }
}
