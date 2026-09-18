export class StaticComponent extends HTMLElement {
  static #clickSplitRegex = new RegExp('onclick="{', "i");
  #handlerMap = {};

  constructor() {
    super();

    const split = this.innerHTML.split(StaticComponent.#clickSplitRegex);
    for (let i = 1; i < split.length; i++) {
      const sectionSplit = split[i].split("}");
      const handlerName = sectionSplit[0];
      split[i] =
        `data-${this.nodeName}-click="${handlerName}"${sectionSplit[1]}`;
    }
    this.innerHTML = split.join("");
  }

  setClickEvents(handlerConfig) {
    const clickSelectorName = `data-${this.nodeName.toLowerCase()}-click`;

    this.querySelectorAll(`[${clickSelectorName}]`).forEach((node) => {
      const eventHandlerName = node.attributes[clickSelectorName].value;

      node.id = eventHandlerName;
      node.removeAttribute(clickSelectorName);

      this.#handlerMap[node.id] = handlerConfig[eventHandlerName];
    });

    this.addEventListener("click", (e) => {
      const clickId = e.target?.id;

      if (this.#handlerMap[clickId]) {
        this.#handlerMap[clickId](e);
      }
    });
  }
}
