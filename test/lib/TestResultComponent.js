import {PresentationComponent} from '/lib/places-js-min.js'

export class TestResultComponent extends HTMLElement {
  constructor(){
    super();
    console.log("Hi");
  }

  connectedCallback(){
    console.log("Hasdf");
    this.innerHTML = `
      <h2>Unit tests</h2>
    `;
    /*
     * TODO
     *
     * -Add template here.
     * -Make sure this component takes store as argument.
     * -Add button for running tests on the store. 
     * -The store object should take a test runner object, run the tests, and
     *  publish the results
     * -Have the store report results to the embedded presentation component.
     *
     *
     */
  }

}
