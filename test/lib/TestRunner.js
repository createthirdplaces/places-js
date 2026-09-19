import {CustomLoadSignal, DataStore} from '/lib/places-js-min.js';

import {TestStore} from '/lib/TestStore.js';

export class TestRunner {
  
  static #activeResults = new Map();
  static #activeTestName = "";
  static #runnerList = [];

  #name;
  #tests;

  #resultStore;
  
  constructor(name, tests) {
    this.#name = name;
    this.#tests = tests;
    this.#resultStore = TestStore.createStore(this);
  }

  static createRunnerWithTests(testConfig){

    const testMap = new Map();

    const testNames = Object
      .getOwnPropertyNames(testConfig)
      .filter((name)=>{
        (typeof testConfig[name] === "function") && name.startsWith("test")
      });
    for(let i=0; i< testNames.length; i++){
      testMap.push({
        "testName":testName,
        "testFunction":testFunction
      });
    }
    const testRunner = new TestRunner(testConfig.getName(), testMap);
    TestRunner.#runnerList.push(testRunner);
  }

  static saveResultToTest(result){
    TestRunner.#activeResults.set(TestRunner.#activeTestName, result);
  }

  static runAllTests(){
    for(let i=0; i<runnerList.length;i++){
      TestRunner.#runnerList[i].runAllTests();
    }
  }

  getName() {
    return this.#name;
  }

  runAllTests() {

    for(let i=0;i<tests.length;i++){
      const test = tests[i];
      TestRunner.#activeTestName = test.name;
      test[i].runTest();
    }
    this.#resultStore.updateStoreData({"testResults":TestRunner.activeResults});
    TestRunner.activeResults = new Map();
  }
}

export function assertResult(result){
  TestRunner.saveResultToTest(result);
}

export function assertTrue(result){
  TestRunner.saveResultToTest({
    pass:result
  })
}

export function assertEquals(first, second){
  TestRunner.saveResultToTest({
    pass: first === second
  });
}
