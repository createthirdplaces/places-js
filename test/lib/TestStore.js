import {CustomLoadSignal, DataStore, ListUpdater} from '/lib/places-js-min.js';

export class TestStore extends DataStore {

  static createStore(testRunner) {

    const presentationSignals = {
      testResults:{
        update: {
          message: (testData) => {
            if(testData.message){
              return testData.message;
            }
            return "";
          },
          isPass: (testData)=>{
            return testData.isPass ? "success" : "fail"
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
