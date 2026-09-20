import {assertEquals, assertResult, assertTrue, createMock, observeCalls, TestRunner} from '/lib/TestRunner.js'

import {DataStore, PresentationComponent} from '/src/places-js-latest.js';

const generateEmptyData = () =>{
  return {
    data: []
  }
}

export class PerformanceTests {

  #mockComponent;
  #rowDataA;
  #rowDataB;
  #testStore;

  constructor() {
    const rows = [];
    for(let i=0; i<1000; i++){
      rows.push({
        "fieldA": "test_"+i,
        "fieldB": "second_"+i,
        "id": i
      });
    }
    this.#rowDataA = {
      "data": rows
    }

    const rowsB = [];
    for(let i=0; i<100000; i++){
      rowsB.push({
        "fieldA": "test_"+i,
        "fieldB": "second_"+i,
        "id": i
      });
    }
    this.#rowDataB = {
      "data": rowsB
    }
  }

  beforeEach() {
    const presentationSignals = {
      data:{
        update: {
          fieldA: (data)=>{
            return data.fieldA
          },
          fieldB: (data)=>{
            return data.fieldB
          }
        }
      }
    }
    this.#testStore = DataStore.createWithCustomLoadSignal({
      "loadAction": generateEmptyData,
      "storeName": "test-store",
      "presentationSignals": presentationSignals
    });

    this.#mockComponent = createMock(PresentationComponent);
    this.#testStore.subscribeComponent(this.#mockComponent);
    observeCalls(this.#mockComponent);
  }

  afterEach() {
    DataStore.clearStores();
  }

  getName(){
    return "performance-tests";
  }

  testStorePerformance_addList() {    

    const start = performance.now();
    this.#testStore.updateStoreData(this.#rowDataA);

    const end = performance.now();

    const lastAdd = this.#mockComponent.getLastCallParams("addItems");
    
    let isValid = true;
    let error = null;

    if(lastAdd.length !== 1){
      isValid = false;
      error = "Incorrect add segments";
    }
    if(lastAdd[0].insertBefore !== -1){
      isValid = false;
      error = "Invalid insertBefore value";
    }

    for(let i=0; i<lastAdd[0].length;i++){
      const item = lastAdd[0][i];

      if(!lastAdd.fieldA || !lastAdd.fieldB || !lastAdd.id){
        isValid = false;
        error = "Invalid data for field";
      }
    }

    if(lastAdd[0].insertData.length !== 1000){
      isValid = false;
      error = `Incorrect length`;
    }

    let timeStr = '';
    if((end-start)>0){
      timeStr = `Run time is ${(end-start)} miliseconds`;
    }
    assertResult({
      message: isValid ? timeStr : error,
      "isPass": isValid,
    });
  }

  testStorePerformance_largeList(){

    const start = performance.now();
    this.#testStore.updateStoreData(this.#rowDataB);

    const end = performance.now();
    const lastAdd = this.#mockComponent.getLastCallParams("addItems");
 
    if(lastAdd[0].insertData.length !== 100000){
      assertResult({
        message:"Incorrect length",
        "isPass":false
      });
    } else {
      const runTime = end-start;
      assertResult({
        "message": `Run time is ${runTime} miliseconds`,
        "isPass":true
      });
    }

  }

  testFillerTest() {
    assertResult({time: 22, isPass: false, message: "Test not implemented"});
  }

}
