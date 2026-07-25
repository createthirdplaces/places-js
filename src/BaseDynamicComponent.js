import {freezeState} from './StateUtils'

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

    //Performance optimization if component is not subscribed to data stores.
    if(dataStoreSubscriptions.length === 0) {
      this.updateData({});
      return;
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
    }

		// Save the timestamp for when the loading started.
    if(this.#loadingStarted === 0){
      this.#loadingStarted = Date.now();
    }

    if(this.#loadingIndicatorConfig){ 
      this.innerHTML = this.#loadingIndicatorConfig.generateLoadingIndicatorHtml();
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
    if (storeUpdates) {
      this.#componentIsRendering = true;
      this.componentStore = {...this.componentStore,...freezeState(storeUpdates)};
      this.#generateAndSaveHTML(this.componentStore);
      this.#componentIsRendering = false;
    }
  }

  updateFromSubscribedStores() {

    let allSubscribedStoresHaveData = true;
    for(let i = 0; i < this.#subscribedStores.length; i++){
      allSubscribedStoresHaveData = 
				allSubscribedStoresHaveData &&
        (this.#subscribedStores[i].dataStore.hasLatestData())
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
        }
      }
      this.updateData(
        dataToUpdate,
      );
    }
  }

  #generateAndSaveHTML(data) {
    if(this.#loadingStarted > 0){
      const current = Date.now();
      const loadTime = current - this.#loadingStarted;

      this.#loadingStarted = 0;
      
      //Handle case where loading indicator is configured to stay visible for a
      //minimum amount of time.
      if(this.#loadingIndicatorConfig?.minTimeMs){
        const remainingTime = this.#loadingIndicatorConfig.minTimeMs - loadTime;
        const self = this;
        if(remainingTime > 0){
          setTimeout(()=>{
            self.innerHTML = this.render(data)
          },remainingTime);
        } else {
          this.innerHTML = this.render(data)
        }
      } else {
        this.innerHTML = this.render(data)
      }
    }
    else {
      this.innerHTML = this.render(data)
    }
  }


}
