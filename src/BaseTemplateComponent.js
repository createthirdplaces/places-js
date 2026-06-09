export class BaseTemplateComponent extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });

    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) {
      throw new Error("shadowRoot is not defined");
    }

    const templateStyle = this.getTemplateStyle();
    const template = document.createElement("template");
    template.innerHTML = templateStyle + `<div></div>`;
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    const div = this.shadowRoot?.querySelector("div");
    if (!div) {
      throw new Error("Failed to create template with a <div></div> section");
    }

    div.innerHTML = this.render();

    if(this.attachEventHandlersToDom){
      this.attachEventHandlersToDom(this.shadowRoot);
    }
  }

}
