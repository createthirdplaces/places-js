import {assertEquals, assertResult, assertTrue, createMock, observeCalls, TestRunner} from '/lib/TestRunner.js'

import {ListUpdater, PresentationComponent, TemplateItem} from '/src/places-js-latest.js';

export class TemplateTests {



  constructor() {
  
  }

  getName(){
    return "template-tests";
  }

  testSimpleTemplate(){
    const templateItem = new TemplateItem(
      `
        <div>
          {fieldA} 
        </div>
      `
    )

    console.log(templateItem.getAllSignals());
    assertEquals(templateItem.getAllSignals().length,1);

    //TODO: Add test to verify correctness of signals

  }

  /*
   TODO: Other test cases for verifying signal correctness. Keep adding until I find source of bug that
   is causing parsing issues with edit profile template.

   - Verify correctness of including event handler
   - Verify correctness of two reactive fields with a depth of 1
   - Verify correctness of two reactive fields with a depth of 2
   - Verify correctness of two reactive fields in the first child node with a depth of 2.
   - Verify correctness of third reactive field with a depth of 1, and earlier elements according to previous test case.
   - Verify test cases related to string formatting

   Note: Verify signal paths, and consider empty path to refer to simple teplate with a reactive top level element field
   */

  /*
  testComplexTemplate(){
    //Use edit profile template that is causing bug
  }
  */

}
