import {CustomLoadSignal, DataStore} from '/lib/places-js-min.js';

import {TestStore} from '/lib/TestStore.js';

export class TestRunner {
 
  #name;
  #tests;

  constructor(name, tests) {
    this.#name = name;
    this.#tests = tests;
  }

  static CreateRunnerWithTests(testConfig){
    const testRunner = new TestRunner(testConfig.getName(), testConfig.getTests());
    TestStore.createStore(testRunner);
  }

  runTests() {
    console.log("Tests should run here");
  }

}
