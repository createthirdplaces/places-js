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

    const tests = [];

    const testNames = Object
      .getOwnPropertyNames(Object.getPrototypeOf(testConfig))
      .filter((name)=>{
        const field = testConfig[name];
        return (typeof field === "function") && field.name.startsWith("test")
      });

    for(let i=0; i< testNames.length; i++){
      tests.push({
        "id": testNames[i],
        "testName":testNames[i],
        "testFunction":testConfig[testNames[i]]
      });
    }

    const testRunner = new TestRunner(testConfig.getName(), tests);
    TestRunner.#runnerList.push(testRunner);
  }

  static saveResultToTest(result){
    TestRunner.#activeResults.set(TestRunner.#activeTestName, result);
  }

  static runAllTests(){
    for(let i=0; i<TestRunner.#runnerList.length;i++){
      TestRunner.#runnerList[i].runAllTests();
    }
  }

  getName() {
    return this.#name;
  }

  runAllTests() {

    TestRunner.activeResults = new Map();
    for(let i=0;i<this.#tests.length;i++){
      const test = this.#tests[i];
      TestRunner.#activeTestName = test.testName;
      test.testFunction();
    }


    const resultArray = [];
    TestRunner.#activeResults.forEach((value,key)=>{
      resultArray.push({...value,id:key});
    });

    this.#resultStore.updateStoreData({"testResults":resultArray});
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
