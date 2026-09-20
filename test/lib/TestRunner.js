import {CustomLoadSignal, DataStore} from '/lib/places-js-min.js';

import {TestStore} from '/lib/TestStore.js';

export class TestRunner {
  
  static #activeResults = new Map();
  static #activeTestName = "";
  static #runnerList = [];

  #name;
  #resultStore;
  #testConfig;
  #tests;
 
  constructor(testConfig, tests) {

    this.#name = testConfig.getName();
    this.#resultStore = TestStore.createStore(this);
    this.#testConfig = testConfig;
    this.#tests = tests;
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
        "testFunction":testConfig[testNames[i]].bind(testConfig)
      });
    }

    const testRunner = new TestRunner(testConfig, tests);
    TestRunner.#runnerList.push(testRunner);
  }
  
  
  static runAllTests(){
    for(let i=0; i<TestRunner.#runnerList.length;i++){
      TestRunner.#runnerList[i].runAllTests();
    }
  }

  static saveResultToTest(result){
    TestRunner.#activeResults.set(TestRunner.#activeTestName, result);
  }

  getName() {
    return this.#name;
  }

  runAllTests() {

    TestRunner.activeResults = new Map();
    for(let i=0;i<this.#tests.length;i++){
      const test = this.#tests[i];
      TestRunner.#activeTestName = test.testName;

      if(this.#testConfig.beforeEach){
        this.#testConfig.beforeEach(); 
      }

      test.testFunction();

      if(this.#testConfig.afterEach){
        this.#testConfig.afterEach(); 
      } 
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


export function createMock(classRef){
  const mock = new Object();

  const propNames = Object.getOwnPropertyNames(classRef.prototype);
  
  for(let i=0; i<propNames.length;i++){
    const func = function(){return null};
    const name = propNames[i]
    mock[name] = func;
  }
  return mock;
}

export function observeCalls(testObject){
    console.log(Object.keys(testObject));

    let functionNames = [];

    if(testObject.prototype){
      functionNames = Object
        .getOwnPropertyNames(Object.getPrototypeOf(testObject))
        .filter((name)=>{
          console.log(name);
          const field = testObject[name];
          return (typeof field === "function")
        });
    } else {
      const props = Object.keys(testObject);
      for(let i=0; i<props.length; i++){
        functionNames.push(props[i]);
      }
    }

    testObject.observedCalls = new Map();

    testObject.getLastCallParams = (functionName) => {
      console.log(testObject.observedCalls);
      const params = testObject.observedCalls.get(functionName);
      return params[params.length - 1];
    }

    for(let i =0; i<functionNames.length; i++){

      const name = functionNames[i];
      const copyName = `${name}_a`;

      testObject.observedCalls.set(name,[]);
      
      testObject[copyName] = testObject[name];
      testObject[name] = (data)=>{
        testObject.observedCalls.get(name).push(data);
        testObject[copyName](data);
      }
    }
  }

