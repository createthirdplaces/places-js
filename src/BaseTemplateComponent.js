export class BaseTemplateComponent extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });

    const shadowRoot = this.shadowRoot;
    const template = document.createElement("template");
    
    template.innerHTML = this.getTemplateStyle() + `<div></div>`;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.querySelector("div").innerHTML = this.render(); 
  }
}
