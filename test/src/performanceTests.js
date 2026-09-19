import {assertEquals, assertResult, assertTrue} from '/lib/TestRunner.js'

export class PerformanceTests {

  getName(){
    return "performance-tests";
  }

  testStorePerformance_addLargeList() {    
    assertResult({time: 22});
  }

  testFillerTest() {
    assertResult({time: 22, success: false, error: "Test not implemented"});
  }

  testFillerTest_Two(){
    assertTrue(true);
  }

  testFillerTest_Three(){
    assertEquals(1,1);
  }
}
