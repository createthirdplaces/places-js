export class TemplateItem {
  #changeTemplateEvents;
  #changeTemplateHandlers;

  #clickTemplateEvents;
  #clickTemplateHandlers;

  #handlerDepthMap = new Map();
  #nodes = {};

  #templateNode;
  #templateRoot = null;
  #templateSignals;
  #signalMap = new Map();
  #signalList;

  static #templateFunctions = new Map();

  static addTemplateFunction(name, templateFunction) {
    TemplateItem.#templateFunctions.set(name, templateFunction);
  }

  constructor(html) {
    this.#defineComponent(html);
  }

  #initSignalMap() { 
    for (let i = 0; i < this.#templateSignals.length; i++) {
      this.#signalMap.set(
        this.#templateSignals[i].fieldName,
        this.#templateSignals[i],
      );
    }
  }

  setupChangeEventHandlers(events) {
    if (events) {
      this.#changeTemplateHandlers = events;

      (function (
        templateRoot,
        handlerDepthMap,
        changeTemplateEvents,
        changeTemplateHandlers,
      ) {
        const getItemIdForEvent = ({ eventItem, key }) => {
          const depth = handlerDepthMap.get(key);
          for (let i = 0; i < depth; i++) {
            eventItem = eventItem.parentNode;
          }
          return eventItem.data_id;
        };

        templateRoot.addEventListener("change", (e) => {
          const changeId =
            e.target.getAttribute("data-change-id") ||
            e.target.parentNode.getAttribute("data-change-id") ||
            e.target.parentNode.parentNode.getAttribute("data-change-id");
          if (changeId) {
            const key = "data-click-id_" + changeId;
            const componentId = getItemIdForEvent({
              eventItem: e.target,
              key: key,
            });

            const handlerName = changeTemplateEvents[changeId];
            changeTemplateHandlers[handlerName]({
              componentId: componentId,
            });
          }
        });
      })(
        this.#templateRoot,
        this.#handlerDepthMap,
        this.#changeTemplateEvents,
        this.#changeTemplateHandlers,
      );
    }
  }

  setupClickEventHandlers(events) {
    if (events) {
      this.#clickTemplateHandlers = events;

      (function (
        templateRoot,
        handlerDepthMap,
        clickTemplateEvents,
        clickTemplateHandlers,
      ) {
        const getItemIdForEvent = ({ eventItem, key }) => {
          const depth = handlerDepthMap.get(key);

          for (let i = 0; i < depth; i++) {
            eventItem = eventItem.parentNode;
          }
          return eventItem.data_id;
        };

        templateRoot.addEventListener("click", (e) => {
          const clickId =
            e.target.getAttribute("data-click-id") ||
            e.target.parentNode.getAttribute("data-click-id") ||
            e.target.parentNode.parentNode.getAttribute("data-click-id");

          if (clickId) {
            const key = "data-click-id_" + clickId;
            const componentId = getItemIdForEvent({
              eventItem: e.target,
              key: key,
            });

            const handlerName = clickTemplateEvents[clickId];
            clickTemplateHandlers[handlerName]({
              componentId: componentId,
            });
          }
        });
      })(
        this.#templateRoot,
        this.#handlerDepthMap,
        this.#clickTemplateEvents,
        this.#clickTemplateHandlers,
      );
    }
  }

  getSignalByFieldName(fieldName) {
    return this.#signalMap.get(fieldName);
  }

  getAllSignals() {
    return this.#templateSignals;
  }

  #evaluateConditional(templateStr) {
    const split = templateStr.split("\n");

    while (true) {
      let depth = 0;

      let firstIfPos;
      let elsePos;
      let endPos;

      for (let i = 0; i < split.length; i++) {
        if (split[i].includes("{#if")) {
          depth++;
          if (!firstIfPos) {
            firstIfPos = i;
          }
        }

        if (split[i].includes("{else}")) {
          if (depth === 1) {
            elsePos = i;
          }
        }

        if (split[i].includes("{/if}")) {
          depth--;
          if (depth === 0) {
            endPos = i;
            break;
          }
        }
      }

      if (!firstIfPos) {
        break;
      } else {
        const ifCheckName = split[firstIfPos]
          .trim()
          .split(" ")[1]
          .split("}")[0];
        const ifCheck = TemplateItem.#templateFunctions.get(ifCheckName);

        if (!ifCheck) {
          throw new Error(`No template function defined for ${ifCheckName}`);
        }

        if (ifCheck()) {
          split.splice(endPos, 1);

          if (elsePos) {
            split.splice(elsePos, endPos - elsePos);
          }
          split.splice(firstIfPos, 1);
        } else {
          split.splice(endPos, 1);
          split.splice(firstIfPos, elsePos - firstIfPos + 1);
        }
        firstIfPos = null;
        elsePos = null;
        endPos = null;
      }
    }
    return split.join("\n");
  }

  #defineComponent(templateStr) {
    templateStr = this.#evaluateConditional(templateStr);

    this.#changeTemplateEvents = [];
    this.#clickTemplateEvents = [];

    this.#templateSignals = [];

    let tokens = [];

    let startPos;
    let isHtmlTagSection;

    //Tokenize template string.
    for (let i = 0; i < templateStr.length; i++) {
      const templateChar = templateStr.charAt(i);

      if (!startPos) {
        startPos = i;
        isHtmlTagSection = templateChar === "<";
      } else if (isHtmlTagSection && templateChar === ">") {
        const token = templateStr.substring(startPos, i + 1);

        const sections = token.split("}");
        let startSection;

        const templateAttrs = [];
        for (let j = 0; j < sections.length; j++) {
          const section = sections[j];
          const equalPos = section.lastIndexOf("=");
          const spacePos = section.lastIndexOf(" ", equalPos);

          if (j === 0) {
            startSection = section.substring(0, spacePos + 1);
          }

          if (j < sections.length - 1) {
            templateAttrs.push({
              attr: section.substring(spacePos + 1, equalPos),
              fieldName: section.substring(equalPos + 3),
            });
          }
        }

        let endSection = sections[sections.length - 1];
        if (templateAttrs.length > 0) {
          if (endSection.startsWith('">')) {
            endSection = endSection.substring(0, endSection.length - 2) + ">";
          }
        } else {
          startSection = token.substring(0, token.length - 1);
          endSection = ">";
        }
        tokens.push({
          endSection: endSection,
          isHtml: true,
          startSection: startSection,
          templateAttrs: templateAttrs,
        });

        startPos = null;
        isHtmlTagSection = false;
      } else {
        if (templateChar === "<") {
          let token = templateStr
            .substring(startPos, i)
            .replaceAll("\t", "")
            .replaceAll("\n", "")
            .trim();
          if (token.trim().length > 0) {
            tokens.push({
              isHtml: false,
              token: token,
            });
          }

          startPos = null;
          i--;
        }
      }
    }

    //Determine signals and event handlers.
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.isHtml) {
        for (let j = 0; j < token.templateAttrs.length; j++) {
          let attr = token.templateAttrs[j].attr;
          if (attr.startsWith("on")) {
            if (attr === "onchange" || attr === "onChange") {
              token.templateAttrs[j].signalRef =
                `data-change-id=${this.#changeTemplateEvents.length}`;
              this.#changeTemplateEvents.push(token.templateAttrs[j].fieldName);
            }
            if (attr === "onclick" || attr === "onClick") {
              token.templateAttrs[j].signalRef =
                `data-click-id=${this.#clickTemplateEvents.length}`;
              this.#clickTemplateEvents.push(token.templateAttrs[j].fieldName);
            }
          } else {
            const signalId = this.#templateSignals.length;
            const signalRef = i > 0 ? `data-signal-id-${signalId}` : ``;

            if (attr === "innerhtml") {
              attr = "innerHTML";
            }

            const signalData = {
              attr: attr,
              fieldName: token.templateAttrs[j].fieldName,
              signalId: i > 0 ? signalId : -1,
              signalPath: signalRef,
            };

            token.templateAttrs[j].signalRef = signalRef;
            this.#templateSignals.push(signalData);
          }
        }
      } else {
        if (tokens[i].token.includes("{")) {
          const nameStart = tokens[i].token.indexOf("{");
          const nameEnd = tokens[i].token.indexOf("}");
          const fieldName = tokens[i].token.substring(nameStart + 1, nameEnd);

          const signalId = this.#templateSignals.length;
          const signalRef = i > 0 ? `data-signal-id-${signalId}` : ``;

          const signalData = {
            attr: "textcontent",
            fieldName: fieldName,
            signalId: signalId,
            signalPath: signalRef,
          };

          tokens[i - 1].templateAttrs.push({
            attr: "textcontent",
            fieldName: fieldName,
            signalRef: signalRef,
          });
          this.#templateSignals.push(signalData);
        } else {
          tokens[i].textcontent = tokens[i].token;
        }
      }
    }

    // Create new string with references to event handlers and signals.
    let templateArr = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.isHtml) {
        if (token.templateAttrs.length > 0) {
          templateArr.push(token.startSection);

          let hasText = false;
          for (let j = 0; j < token.templateAttrs.length; j++) {
            if(token.templateAttrs[j].attr==="textcontent"){
              hasText = true;
            }
            templateArr.push(" " + token.templateAttrs[j].signalRef + " ");
          }
          templateArr.push(token.endSection);
          if(hasText){
            templateArr.push(" ");
          }
        } else {
          templateArr.push(token.startSection + token.endSection);
        }
      } else {
        if (token.textcontent) {
          templateArr.push(token.textcontent);
        }
      }
    }

    let template = document.createElement("template");
    template.innerHTML = templateArr.join("");
    this.#templateNode = template.content.firstChild;
 
    const handlerAttrs = ["data-click-id", "data-change-id"];
		
    handlerAttrs.forEach((handlerAttr) => {
      const attrSelector = `[${handlerAttr}]`;


      this.#templateNode.querySelectorAll(attrSelector).forEach((node) => {
        const clickNum = node.attributes[handlerAttr].value;

        let depth = 0;
        while (node.parentNode.nodeName !== "#document-fragment") {
          if (node.parentNode !== null) {
            node = node.parentNode;
            depth++;
          }
        }
        const handlerDepthKey = `${handlerAttr}_${clickNum}`;
        this.#handlerDepthMap.set(handlerDepthKey, depth);
      });
    });

    for (let i = 0; i < this.#templateSignals.length; i++) {
      const signal = this.#templateSignals[i];

      // A signal id of less than one means that the data is
      // at the root.
      if (signal.signalId >= 0) {
        const selector = `[${signal.signalPath}]`;

        let childNodePath = [];
        let node = template.content.querySelector(selector);
        let searchNode = node;

        while (searchNode.parentNode.nodeName !== "#document-fragment") {
          for (let j = 0; j < searchNode.parentNode.childNodes.length; j++) {
            if (Object.is(searchNode.parentNode.childNodes[j], searchNode)) {
              childNodePath.push(`:nth-child(${j + 1})`);
            }
          }
          searchNode = searchNode.parentNode;
        }

        childNodePath = childNodePath.reverse();
        node.attributes.removeNamedItem(signal.signalPath);
        signal.signalPath = childNodePath.join(">");
      }
    }

    this.#initSignalMap();
  }

  isAttributeChar(str) {
    const code = str.charCodeAt(0);
    return (code > 64 && code < 91) || (code > 96 && code < 123);
  }

  setDataField(dataField) {
    this.dataField = dataField;
  }

  getDataField() {
    return this.dataField;
  }

  setId(id) {
    this.id = id;
  }

  setTemplateName(templateName) {
    this.templateName = templateName.toUpperCase();
  }

  setTemplateRoot(root) {
    this.#templateRoot = root;
  }

  //TOOD: Fix bug related to this.#templateNode no longer being valid.
  setSingleNode(node) {
    this.#templateNode = document.querySelector("[data-template]");
    this.#templateNode.replaceChildren(node);
  }

  appendNode(node) {
    this.#templateRoot.appendChild(node);
  }

  appendChild(fragment) {
    this.#templateRoot.appendChild(fragment);
  }

  getTemplateNode() {
    return this.#templateNode;
  }

  addNode(id, node) {
    this.#nodes[id] = node;
  }

  getNode(id) {
    return this.#nodes[id];
  }

  getFirstNode() {
    return this.#nodes[0];
  }

  removeChild(id) {
    this.#templateRoot.removeChild(this.#nodes[id]);
  }

  clearNodes() {
    this.#templateRoot.replaceChildren([]);
    setTimeout(() => {
      Object.keys(this.#nodes).forEach((id) => {
        this.#nodes[id] = null;
      });
      this.#nodes = {};
    }, 0);
  }

  setTemplateHtml(html) {
    this.#templateRoot.innerHTML = html;
  }

  getTemplateHtml() {
    return this.#templateNode.innerHTML;
  }
}

TemplateItem.addTemplateFunction("isMobile", () => {
  return window.matchMedia("(max-width: 32em)").matches;
});
