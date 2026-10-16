import {assertEquals, assertResult, assertTrue, createMock, observeCalls, TestRunner} from '/lib/TestRunner.js'

import {ListUpdater, PresentationComponent, TemplateItem} from '/src/places-js-latest.js';

export class TemplateTests {

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

    const signals = templateItem.getAllSignals();
    assertEquals(signals.length,1);
    assertEquals(signals[0].signalPath,":nth-child(1)");
    assertEquals(signals[0].fieldName,"fieldA");
  }

  testTemplate_staticTextChildNode_beforeReactiveField(){
    const templateItem = new TemplateItem(
      `
        <div>
          <div>
            <p>
              Test
            </p>
            <p>
              {fieldA} 
            </p>
          </div>
        </div>
      `
    )

    const signals = templateItem.getAllSignals();

    
    assertEquals(signals.length,1);
    assertEquals(signals[0].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(2)");
    assertEquals(signals[0].fieldName,"fieldA");
  }


  testTemplate_staticTextChildNodeWithTwoAttributes_beforeReactiveField(){
    const templateItem = new TemplateItem(
      `
        <div>
          <div> 
            <p id="test-id" class="test-class">
              Test
            </p>
            <p>
              {fieldA} 
            </p>
          </div>
        </div>
      `
    )

    const signals = templateItem.getAllSignals();

    
    assertEquals(signals.length,1);
    assertEquals(signals[0].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(2)");
    assertEquals(signals[0].fieldName,"fieldA");
  }

  testTemplate_inputNodeWithTwoAttributes_noSeparateClosingTag_correctMarkup(){
    const templateItem = new TemplateItem(
      `
        <div>
          <div> 
            <input id="bbbb" name="cccc" value="{fieldA}"/>
            <span>{fieldB}</span>
          </div>
        </div>
      `
    )

    const signals = templateItem.getAllSignals();

    assertEquals(signals.length,2);
    assertEquals(signals[0].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(1)");
    assertEquals(signals[0].fieldName,"fieldA");
    assertEquals(signals[1].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(2)");
    assertEquals(signals[1].fieldName,"fieldB");
  }
  
  testTemplateWithEventHandler() {
    const templateItem = new TemplateItem(
      `
        <div>
          <button onClick={handleClick}></button>
        </div>
      `
    );
    assertEquals(templateItem.getEventHandlerCount(),1);
  }

  testTemplateWithTwoReactiveFields(){
    const templateItem = new TemplateItem(
      `
        <div>
          <span>{fieldA}</span>
          <span>{fieldB}</span>
        </div>
      `
    )

    const signals = templateItem.getAllSignals();
    
    assertEquals(signals.length,2);
    
    assertEquals(signals[0].signalPath,":nth-child(1)>:nth-child(1)");
    assertEquals(signals[0].fieldName,"fieldA");
    assertEquals(signals[1].signalPath,":nth-child(1)>:nth-child(2)");
    assertEquals(signals[1].fieldName,"fieldB");
  }

  testTemplateWithThreeReactiveFieldsAndSpaceBetweenEach(){
    
    const templateItem = new TemplateItem(
      `
        <div>
          <h2>{name}</h2>

          <span>{fieldA}</span>

          <span>{fieldB}</span>
        </div>
      `
    )

    const signals = templateItem.getAllSignals();
    
    assertEquals(signals.length,3);
    
    assertEquals(signals[0].signalPath,":nth-child(1)>:nth-child(1)");
    assertEquals(signals[0].fieldName,"name");   
    assertEquals(signals[1].signalPath,":nth-child(1)>:nth-child(2)");
    assertEquals(signals[1].fieldName,"fieldA");
    assertEquals(signals[2].signalPath,":nth-child(1)>:nth-child(3)");
    assertEquals(signals[2].fieldName,"fieldB");
  }


  testTemplateWithThreeReactiveFieldsAndSpaceBetweenEach_AllOnOwnLines(){
    
    const templateItem = new TemplateItem(
      `
        <div>
          <h2>
            {name}
          </h2>

            <span>
            {fieldA}
          </span>

          <span>
            {fieldB}
            </span>
        </div>
      `
    )

    const signals = templateItem.getAllSignals();
    
    assertEquals(signals.length,3);
    
    assertEquals(signals[0].signalPath,":nth-child(1)>:nth-child(1)");
    assertEquals(signals[0].fieldName,"name");   
    assertEquals(signals[1].signalPath,":nth-child(1)>:nth-child(2)");
    assertEquals(signals[1].fieldName,"fieldA");
    assertEquals(signals[2].signalPath,":nth-child(1)>:nth-child(3)");
    assertEquals(signals[2].fieldName,"fieldB");
  }

  testTemplateWithTwoReactiveFields_depthOfTwo(){
    const templateItem = new TemplateItem(
      `
        <div>
          <div>
            <span>{fieldA}</span>
          </div>
          <div>
            <span>{fieldB}</span>
          </div>
        </div>
      `
    )

    const signals = templateItem.getAllSignals();
   
    assertEquals(signals.length,2);
    
    assertEquals(signals[0].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(1)");
    assertEquals(signals[0].fieldName,"fieldA");
    assertEquals(signals[1].signalPath,":nth-child(1)>:nth-child(2)>:nth-child(1)");
    assertEquals(signals[1].fieldName,"fieldB");
  }

  testTemplateWithTwoReactiveFields_depthOfTwo_inFirstChild(){
    const templateItem = new TemplateItem(
      `
        <div>
          <div>
            <span>{fieldA}</span>
            <span>{fieldB}</span>
          </div>
        </div>
      `
    )

    const signals = templateItem.getAllSignals();
   
    assertEquals(signals.length,2);
    
    assertEquals(signals[0].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(1)");
    assertEquals(signals[0].fieldName,"fieldA");
    assertEquals(signals[1].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(2)");
    assertEquals(signals[1].fieldName,"fieldB");
  }

  testTemplateWithTwoReactiveFieldsInNode_followedByThird(){
    const templateItem = new TemplateItem(
      `
        <div>
          <div>
            <span>{fieldA}</span>
            <span>{fieldB}</span>
          </div>
          <span>{fieldC}</span>
        </div>
      `
    )

    const signals = templateItem.getAllSignals();
   
    assertEquals(signals.length,3);
    
    assertEquals(signals[0].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(1)");
    assertEquals(signals[0].fieldName,"fieldA");
    assertEquals(signals[1].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(2)");
    assertEquals(signals[1].fieldName,"fieldB");
    assertEquals(signals[2].signalPath,":nth-child(1)>:nth-child(2)");
    assertEquals(signals[2].fieldName,"fieldC");

  }

  testComplexTemplate_fourReactiveFields_oneEvent(){
    const templateItem = new TemplateItem(
      `
          <form>
            <div>
              <span>{successMessage}</span>
              <span>{errorMessage}</span>
              <div id="username-input-two" name="username-input-two">
              </div>
              <span class="error-message">{usernameError}</span>
            </div>

            <div class ="form-section" id="image-upload">
              <image-upload-component
                id="image-upload-ui"
                image-path="{imageFilePath}"
              ></image-upload-component>
            </div> 
            <button 
              class="primary" 
              id="update-user-profile" 
              onClick={updateUserProfile}
              type="submit"
            >
              Submit
            </button>
          </form>
      `
    );

    const signals = templateItem.getAllSignals();
   
    assertEquals(signals.length,4);
    
    assertEquals(signals[0].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(1)");
    assertEquals(signals[0].fieldName,"successMessage");
    assertEquals(signals[1].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(2)");
    assertEquals(signals[1].fieldName,"errorMessage");
    assertEquals(signals[2].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(4)");
    assertEquals(signals[2].fieldName,"usernameError");
    assertEquals(signals[3].signalPath,":nth-child(1)>:nth-child(2)>:nth-child(1)");
    assertEquals(signals[3].fieldName,"imageFilePath");

    assertEquals(templateItem.getEventHandlerCount(),1);


  }

  testComplexTemplate_threeReactiveFields_oneEventExtraTabs(){
    const templateItem = new TemplateItem(
      `
        <create-account-component
          data-template
        >
          <div class="container-xl" id="login-component-container"> 
            <h1>Create account</h1>
            <form id="create-account-form" onsubmit="return false">
              <div id="ui-input">
                <div class="form-section">
                  <label class="required-field" id="email">Email</label>
                  <input id="username-input" type="email"/>
                 </input>   
                </div> 
                <div class="form-section">
                  <label class="required-field">Password</label>
                  <input id="password-input" type="password"/>
                  </input>
                </div>

                <div class="form-section">
                  <label class="required-field">Confirm password</label>
                  <input        
                    id="confirm-password-input"
                  />
                      </input>          
                </div> 
              </div>
 
              <span class="error-message">{error}</span>

                  <span class={successStyle}>
                {successMessage}
              </span>

              <div id="agree-rules-input">
                <label for="agree-rules-checkbox">I agree to the site rules listed below</label>
                <input type="checkbox" id="agree-rules-checkbox">         
              </div>
              <button id="create-account-button" onClick={createAccount} class="primary">Create account</button>
              <button id="create-account-button-disabled" class="neutral">Create account</button>
       
              <site-rules-component></site-rules-component>
              <faq-component></faq-component>
            </form>
          </div>
        </create-account-component>
      
      `
    );

    const signals = templateItem.getAllSignals();
  
    assertEquals(signals.length,3,"Length not equal");  
    
    assertEquals(signals[0].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(2)>:nth-child(2)");
    assertEquals(signals[0].fieldName,"error"); 
    
    assertEquals(signals[1].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(2)>:nth-child(3)");
    assertEquals(signals[1].fieldName,"successStyle");
    assertEquals(signals[2].signalPath,":nth-child(1)>:nth-child(1)>:nth-child(2)>:nth-child(3)");
    assertEquals(signals[2].fieldName,"successMessage");
    
    assertEquals(templateItem.getEventHandlerCount(),1);

    const node = templateItem.getTemplateNode();

  }

}
