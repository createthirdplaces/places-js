import {LitElement, html, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class InnerElement extends LitElement { 
  render() {
    return html`<button>Test</button>`;
  }
}

export class MyElement extends LitElement {
  static properties = {
    version: {},
  };


  constructor() {
    super();
    this.version = 'STARTING';
 
    let self = this;
    let i = setInterval(function(){
      if(self.shadowRoot.getHTML().length > 1000){
        clearInterval(i);
        console.log("Render time:"+(Date.now() - window.startTime));
      }
    },10);
  }

  render() {

    window.startTime = Date.now();
    let buttons = [];
    for(let i=0;i<1000;i++){
      buttons.push(html`<inner-element></inner-element>`);
    }
    return html`
      ${buttons} 
    `;
  }
}

customElements.define('my-element', MyElement);
customElements.define('inner-element',InnerElement);


document.addEventListener('DOMContentLoaded', function(){
  document.getElementById("app").innerHTML="<my-element></my-element>";
});

