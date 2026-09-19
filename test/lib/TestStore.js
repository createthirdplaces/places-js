import {CustomLoadSignal, DataStore} from '/lib/places-js-min.js';

export class TestStore extends DataStore {


  static createStore(testRunner) {
    const loadFunction = () => {
      return testRunner.runTests();
    }
    return new TestStore(new CustomLoadSignal(loadFunction), testRunner.getName());
  }

}
