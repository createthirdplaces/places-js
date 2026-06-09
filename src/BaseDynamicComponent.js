import {freezeState} from "./state/StateUtils.js";
import {DataStore} from "./state/update/DataStore.js";

export class BaseDynamicComponent extends HTMLElement {

  #attachedEventsToShadowRoot = false;
  #componentIsRendering = false;
  #loadingFromStores = new Set();
  #loadingStarted = 0;
  #loadingIndicatorConfig;
  #subscribedStores = [];

	//Stores state for the component.
  componentStore = {};

	/**
	 * @param dataStoreSubscriptions - An array of data stores the component should
	 * subscribe to.
	 * @param loadingIndicatorConfig - Configuration for a custom loading
	 * indicator.
	 **/
  constructor(dataStoreSubscriptions = [], loadingIndicatorConfig) {
    super();

    if(loadingIndicatorConfig){
      this.#loadingIndicatorConfig = loadingIndicatorConfig;
    }

		// Make sure component is subscribed to data stores.
    this.#subscribedStores = dataStoreSubscriptions
    for(let i=0;i <this.#subscribedStores.length;i++){
      this.#subscribedStores[i].dataStore.subscribeComponent(this);
    }

    this.updateFromSubscribedStores();
  }

	/**
	 * Shows custom loading indicator if it exists. This custom loading indicator
	 * replaces UI components and disables any user events.
	 **/
  lockComponent(dataStore){

    if(!this.#loadingFromStores.has(dataStore)){
      this.#loadingFromStores.add(dataStore);
    } else {
      console.warn(`Attempting to lock component ${this.constructor.name} multiple times`);
    }

		// Save the timestamp for when the loading started.
    if(this.#loadingStarted === 0){
      this.#loadingStarted = Date.now();
    }

    if(this.#loadingIndicatorConfig){
      if (this.shadowRoot === null) {
        this.attachShadow({ mode: "open" });
        const template = document.createElement("template");
        this.shadowRoot.appendChild(template.content.cloneNode(true));
      }
      // @ts-ignore
      this.shadowRoot.innerHTML =
        this.getTemplateStyle() + this.#loadingIndicatorConfig.generateLoadingIndicatorHtml();
    }
  }

  unlockComponent(dataStore) {
    this.#loadingFromStores.delete(dataStore);
  }

	/**
	 * Unsubscribe component when it is removed from the UI.
	 **/
  disconnectedCallback(){
    for(let i = 0; i < this.#subscribedStores.length; i++){
      this.#subscribedStores[i].dataStore.unsubscribeComponent(this);
    }
  }

	/**
	 * Update component with state data
	 **/
  updateData(storeUpdates) {

    if(this.#componentIsRendering){
      console.warn(`Attempting to trigger multiple renders at the same time on component ${this.constructor.name}`)
    }

    if (!storeUpdates) {
      return;
    }

    this.#componentIsRendering = true;
    this.componentStore = {...this.componentStore,...freezeState(storeUpdates)};
    this.#generateAndSaveHTML(this.componentStore);

    if(this.shadowRoot){
      if(this.attachHandlersToShadowRoot && !this.#attachedEventsToShadowRoot){
        this.attachHandlersToShadowRoot(this.shadowRoot);
        this.#attachedEventsToShadowRoot = true;
      }
    }

    this.#componentIsRendering = false;
  }

  updateFromSubscribedStores() {

    let allSubscribedStoresHaveData = true;
    for(let i = 0; i < this.#subscribedStores.length; i++){
      allSubscribedStoresHaveData = 
				allSubscribedStoresHaveData &&
        (this.#subscribedStores[i].dataStore.isWaitingForData())
    }

		// Make sure a component state is updated only when all the subscribed
		// stores have data 
    if(allSubscribedStoresHaveData){

      let dataToUpdate = {}
      for(let i =0; i < this.#subscribedStores.length; i++){

        const item = this.#subscribedStores[i];
        let storeData = item.dataStore.getStoreData();
        if(item.componentReducer){
          storeData = item.componentReducer(storeData);
        }

        if(item.fieldName) {
          dataToUpdate[item.fieldName] = storeData;
        } else {
          dataToUpdate = storeData;
          if(this.#subscribedStores?.length > 1){
            throw new Error(`Component ${this.constructor.name} is subscribed to multiple data stores. 
              Each one must be associated with a specified field name`)
          }
        }
      }
      this.updateData(
        dataToUpdate,
      );
    }
  }

  #generateAndSaveHTML(data) {
    if (this.shadowRoot === null) {
      this.attachShadow({ mode: "open" });
      const template = document.createElement("template");
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    if(this.#loadingStarted > 0){
      const current = Date.now();
      const loadTime = current - this.#loadingStarted;

      console.log(`Loaded data for ${this.constructor.name} in ${loadTime} milliseconds`)
      this.#loadingStarted = 0;
      
			//Handle case where loading indicator is configured to stay visible for a
			//minimum amount of time.
			if(this.#loadingIndicatorConfig?.minTimeMs){
        const remainingTime = this.#loadingIndicatorConfig.minTimeMs - loadTime;

        const self = this;
        if(remainingTime > 0){
          setTimeout(()=>{
            self.shadowRoot.innerHTML = this.getTemplateStyle() + this.render(data)
          },remainingTime);
        } else {
          this.shadowRoot.innerHTML = this.getTemplateStyle() + this.render(data)
        }
      } else {
        this.shadowRoot.innerHTML = this.getTemplateStyle() + this.render(data)
      }
    }
    else {
      this.shadowRoot.innerHTML = this.getTemplateStyle() + this.render(data)
    }
  }

  render(data){
    throw new Error(`render(data) function for ${this.constructor.name} must be defined` )
  }

  /*
		Returns CSS styles specific to the component. The string should be in the format <style> ${CSS styles} </style>
  */
  getTemplateStyle(){
    throw new Error(`getTemplateStyle function for ${this.constructor.name} must be defined` )
  }
}
