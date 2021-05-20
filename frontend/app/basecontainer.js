/**
 * It implements a base container which abstracts the add, get and
 * removal of PIXI elements. In general, whenever a PIXI element is added
 * in container, a reference has to be stored to access it later. There is
 * also a need to store a set of elements for ex. all fruits as a list of
 * set. Same goes for getting and deleting these elements. BaseContainer
 * nicely abstract those things.
 *
 * > let fruit = new PIXI.Graphics();
 *
 * Now, in general, to add an element:
 * > fruit.name = <someid>
 * > this.addChild(fruit);
 * > this.fruits = new Set(); # if not created already
 * > this.fruits.add(fruit.name) # save name to access element later
 *
 * To delete:
 * > for(let e of this.fruits)
 * >   this.removeChild(e);
 * > delete this.fruits;

 * With BaseContainer, this can be done as
 * > this.add('fruits', fruit)
 *
 * To get all fruits elements, do
 * > this.getAll('fruits')
 *
 * To remove all fruits element, do
 * > this.remove('fruits')
 */

import PIXI from 'pixi.js';


export default class BaseContainer extends PIXI.Container {

  constructor(...args) {
    super(...args);
  }

  static randomUID() {
    return `${Math.random()}`;
  }

  add(name, child, at = null) {
    // Make new set container if not existing
    if (this[name] === undefined)
      this[name] = new Set();

    const uid = BaseContainer.randomUID();

    if (child === undefined)
      throw `ChildUndefined: ${name}`;
    child.name = uid;
    this[name].add(uid);

    if (at == null)
      this.addChild(child);
    else
      this.addChildAt(child, at);
  }

  get(name, uid = null) {
    if (this[name] === undefined || this[name].size === 0)
      return undefined;

    /**
     * return first element (since `get` is only called for name
     * references having single elements otherwise uid is passed)
     */
    if (uid === null)
      return this.getChildByName(this[name].keys().next().value);
    return this.getChildByName(uid);
  }

  getAll(name) {
    // Get all elements corresponding to `name` reference

    if (this[name] === undefined)
      return [];

    const children = [];

    for(let e of this[name])
      children.push(this.getChildByName(e));

    return children;
  }

  remove(name, uid = null) {
    /**
     * Remove all elements corresponding to `name` reference
     * if uid not given, else remove element with name uid.
     */

    const _remove = () => {
      if (uid === null) {
        for(let e of this.getAll(name))
          this.removeChild(e);

        delete this[name];
      } else {
        this.removeChild(this.get(name, uid));
        this[name].delete(uid);
      }
    }

    try {
      _remove();
    } catch (e) {
      console.log(`${name} already removed`);
    }
  }

}
