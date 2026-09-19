import { DataStore } from "../state/DataStore.js";
import { TemplateItem } from "./TemplateItem";

export class PresentationComponent extends HTMLElement {
  #changeTemplateEvents = {};
  #clickTemplateEvents = {};

  #lightDomHTML = "<p>Use light DOM or render() method to show HTML</p>";
  #loadingAnimationStart;
  #loadingIndicatorConfig;

  #selectorCache = new Map();
  #subscribedStore;

  #templateItem;

  static #templateCount = 0;
  static clickHandlerCount = 0;
  static changeHandlerCount = 0;

  /**
   * @param dataStore The data store a component is subscribed to.
   * @param loadingIndicatorConfig Configuration for the loading indicator
   **/
  constructor(dataStore) {
    super();
    this.#subscribedStore = dataStore;
  }

  startLoadingIndicator() {
    this.#lightDomHTML = this.innerHTML;
    this.innerHTML =
      this.#loadingIndicatorConfig.generateLoadingIndicatorHtml();
    this.#loadingAnimationStart = Date.now();
  }

  connectedCallback() {
    const defaultStore = this.dataset["store"];

    if (defaultStore) {
      const loadingIndicatorComponent = this.dataset["loadingIndicator"];
      if (loadingIndicatorComponent) {
        const imagePath = this.dataset["loadingImage"];
        const loadingHTML = `
            <${loadingIndicatorComponent}
						  ${imagePath ? `image-path=${imagePath}` : ``}	
            >
					  </${loadingIndicatorComponent}>`;

        this.#loadingIndicatorConfig = {
          generateLoadingIndicatorHtml: () => {
            return loadingHTML;
          },
          minTimeMs: 500,
        };
        this.startLoadingIndicator();
      }

      const dataStore = DataStore.getStore(defaultStore);
      this.#subscribedStore = DataStore.getStore(defaultStore);

      dataStore.subscribeComponent(this);
    }

    if (this.querySelector("[data-template]")) {
      this.#setupTemplate();
    }
  }

  init(initialState) {
    this.updateData(initialState);
  }

  setClickEvents(events) {
    this.#clickTemplateEvents = events;
  }

  setChangeEvents(events) {
    this.#changeTemplateEvents = events;
  }

  #generateSignal(params) {
    const { fieldName, attr, signalId, signalPath } = params.signalConfig;

    const { signalData, elementRoot } = params.updateData;

    if (signalData[fieldName] === undefined) {
      return;
    }

    let element = elementRoot;

    if (signalPath) {
      const cacheId = `${elementRoot.data_id}-${signalId}`;

      if (!this.#selectorCache.has(cacheId)) {
        element = element.querySelector(signalPath);
        this.#selectorCache.set(cacheId, element);
      } else {
        element = this.#selectorCache.get(cacheId);
      }
    }

    if (attr === "textcontent") {
      element.innerText = signalData[fieldName];
    }
    else if (attr === "innerHTML") {
      element.innerHTML = signalData[fieldName];
    } else {
      element.setAttribute(attr, `${signalData[fieldName]}`);
    }
  }

  /**
   * Unsubscribe component when it is removed from the UI.
   **/
  disconnectedCallback() {
    this.#subscribedStore.unsubscribeComponent(this);
  }

  async #completeLoadAnimation() {
    if (!this.#loadingIndicatorConfig) {
      return;
    }
    const remainTime = Date.now() - this.#loadingAnimationStart;

    const promise = new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, remainTime);
    });

    await Promise.resolve(promise);
    this.innerHTML = this.#lightDomHTML;
    this.#loadingAnimationStart = null;
  }

  #setupTemplate() {
    let templateNode = this.querySelector("[data-template]");

    //Component does not have a temnplate
    if (!templateNode) {
      return;
    }

    templateNode.style.visibility = "initial";

    let templateHTML = templateNode.innerHTML;

    templateNode.innerHTML = "";
    this.#templateItem = new TemplateItem(templateHTML);

    templateNode.innerHTML = "";
    this.#templateItem.setTemplateRoot(templateNode);
    this.#templateItem.setDataField(
      templateNode?.getAttributeNode("data-template").value,
    );
    this.#templateItem.setId(
      `template-${PresentationComponent.#templateCount}`,
    );
    this.#templateItem.setTemplateName(this.nodeName);

    this.#templateItem.setupClickEventHandlers(this.#clickTemplateEvents);
    this.#templateItem.setupChangeEventHandlers(this.#changeTemplateEvents);
  }

  updateSingleItem(state) {
    if (!this.#templateItem) {
      this.#setupTemplate();
    }
    const node = this.#templateItem.getFirstNode();
    const templateNode = this.#templateItem.getTemplateNode();

    if (!node) {
      const addNode = templateNode.cloneNode(true);
      const iter = this.#templateItem.getAllSignals();
      while (true) {
        const signalConfig = iter.next().value;

        if (!signalConfig) {
          break;
        }

        if (state[signalConfig.fieldName] === undefined) {
          console.error(
            `No state defined for template field ${signalConfig.fieldName}`,
          );
        }
        this.#generateSignal({
          signalConfig: signalConfig,
          updateData: {
            signalData: state,
            elementRoot: addNode,
          },
        });
      }
      //TODO: Refactor. Having addNode and appendNode can
      // be confusing.
      this.#templateItem.addNode(0, addNode);
      this.#templateItem.setSingleNode(addNode);
    } else {
      const iter = this.#templateItem.getAllSignals();
      while (true) {
        const signalConfig = iter.next().value;

        if (!signalConfig) {
          break;
        }

        if (state[signalConfig.fieldName]) {
          this.#generateSignal({
            signalConfig: signalConfig,
            updateData: {
              signalData: state,
              elementRoot: this.#templateItem.getNode(0),
            },
          });
        }
      }
    }
  }

  async addItems(addFragments) {
    if (this.#loadingAnimationStart) {
      await this.#completeLoadAnimation();
    }
    if (!this.#templateItem) {
      this.#setupTemplate();
    }

    const templateNode = this.#templateItem.getTemplateNode();

    for (let j = 0; j < addFragments.length; j++) {
      const { insertBefore, insertData } = addFragments[j];
      let addFragment = document.createDocumentFragment();

      for (let k = 0; k < insertData.length; k++) {
        const addNode = templateNode.cloneNode(true);
        const iter = this.#templateItem.getAllSignals();

        addNode.data_id = insertData[k].id;
        this.#templateItem.addNode(insertData[k].id, addNode);

        while (true) {
          const signalConfig = iter.next().value;

          if (!signalConfig) {
            break;
          }

          //if(insertData[k][signalConfig.fieldName]){
          this.#generateSignal({
            signalConfig: signalConfig,
            updateData: {
              signalData: insertData[k],
              elementRoot: addNode,
            },
          });
          //}
        }
        addFragment.appendChild(addNode);
      }

      if (insertBefore !== -1) {
        const lastNode = this.#templateItem.getNode(insertBefore);
        lastNode.parentNode.insertBefore(addFragment, lastNode);
      } else {
        this.#templateItem.appendChild(addFragment);
      }
    }
  }

  removeItems(removeData, isReplace, isClear) {
    if (this.#loadingAnimationStart !== null) {
      this.#completeLoadAnimation();
    }
    if (isClear && !isReplace) {
      this.#templateItem.clearNodes();
    } else {
      removeData.forEach((id) => {
        this.#templateItem.removeChild(id);
      });
    }

    setTimeout(() => {
      if (isClear) {
        this.#selectorCache.clear();
      } else {
        for (const [key] of this.#selectorCache) {
          const nodeId = key.split("-")[0];
          if (removeData.has(parseInt(nodeId))) {
            this.#selectorCache.delete(key);
          }
        }
      }
    }, 0);
  }

  swapUpdates(swapUpdates) {
    for (let m = 0; m < swapUpdates.length; m++) {
      const { moveNodeId, moveBeforeId } = swapUpdates[m];
      const nodeToMove = this.#templateItem.getNode(moveNodeId);

      if (moveBeforeId !== null) {
        const moveBefore = this.#templateItem.getNode(moveBeforeId);
        moveBefore.parentNode.insertBefore(nodeToMove, moveBefore);
      } else {
        nodeToMove.parentNode.appendChild(nodeToMove);
      }
    }
  }

  async updateVisible(data) {
    if (!this.#templateItem) {
      this.#completeLoadAnimation();
      return;
    }
    if (this.#loadingAnimationStart !== null) {
      this.#completeLoadAnimation();
    }

    const updates = data[this.#templateItem.dataField] || [];
    for (let i = 0; i < updates.length; i++) {
      let attrName, attrValue, id;

      Object.keys(updates[i]).forEach((key) => {
        if (key === "id") {
          id = updates[i][key];
        } else {
          attrName = key;
          attrValue = updates[i][key];
        }
      });

      if (id) {
        const updateConfig = {
          signalConfig: this.#templateItem.getSignalByFieldName(attrName),
          updateData: {
            signalData: { [attrName]: attrValue },
            elementRoot: this.#templateItem.getNode(id),
          },
        };

        this.#generateSignal(updateConfig);
      }
    }
  }
}
