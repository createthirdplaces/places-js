import {CustomLoadSignal, DataStore, ListUpdater} from '/lib/places-js-min.js';

export class TestStore extends DataStore {

  static createStore(testRunner) {

    const presentationSignals = {
      testResults:{
        update: {
          message: (testData)=>{
            return testData.pass ? "success" : "fail"
          },
          name: (testData)=>{
            return testData.id;
          }
        }
      }
    }

    const loadFunction = () => {
      return testRunner.runTests();
    }

    return new TestStore(
      new CustomLoadSignal(loadFunction), 
      testRunner.getName(),
      new ListUpdater(presentationSignals)
    );
  }

}
