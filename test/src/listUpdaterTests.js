import {assertEquals, assertResult, assertTrue, createMock, observeCalls, TestRunner} from '/lib/TestRunner.js'

import {ListUpdater, PresentationComponent} from '/src/places-js-latest.js';

export class ListUpdaterTests {

  #mockComponent;

  #rowDataA;
  #rowDataB;

  #testUpdater;

  constructor() {
    const rows = [];
    for(let i=0; i<5; i++){
      rows.push({
        "fieldA": "test_"+i,
        "fieldB": "second_"+i,
        "id": i
      });
    }
    this.#rowDataA = {
      "data": rows
    } 
  }

  beforeEach() {
    const presentationSignals = {
      data:{
        update: {
          fieldA: (data)=>{
            return data.fieldA+"_data";
          },
          fieldB: (data)=>{
            return data.fieldB+"_data";
          }
        },
        deps: {
          fieldA:["fieldA"],
          fieldb:["fieldB"]
        }
      }
    }

    this.#testUpdater = new ListUpdater(presentationSignals)
    this.#mockComponent = createMock(PresentationComponent);
    observeCalls(this.#mockComponent);
  }

  getName(){
    return "list-updater-tests";
  }

  testUpdateAfterAdd() {    
   
    const updatedData = structuredClone(this.#rowDataA);

    this.#testUpdater.updateStoreData(
      structuredClone(this.#rowDataA),
      [this.#mockComponent],
      {}
    );
 
    updatedData.data[2].fieldA = "updated";

    this.#testUpdater.updateStoreData(
      updatedData,
      [this.#mockComponent],
      this.#rowDataA
    );
    
    const lastUpdate = this.#mockComponent.getLastCallParams("updateVisible").data;

    assertEquals(lastUpdate.length, 1, "Length not equal"); 
    assertEquals(lastUpdate[0].fieldA, "updated_data", "Value not equal");
  }

}
