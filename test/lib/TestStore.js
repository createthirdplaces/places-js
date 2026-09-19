import {CustomLoadSignal, DataStore, ListUpdater} from '/lib/places-js-min.js';

export class TestStore extends DataStore {

  static createStore(testRunner) {

    const presentationSignals = {
      testResults:{
        message: (testData)=>{
          return `<p>${JSON.stringify(testData)}</p>`;
        }
      }
    }

    const loadFunction = () => {
      return testRunner.runTests();
    }

    console.log(testRunner.getName());
    return new TestStore(
      new CustomLoadSignal(loadFunction), 
      testRunner.getName(),
      new ListUpdater(presentationSignals)
    );
  }

}
