import { DataStoreLoadAction } from "./DataStoreLoadAction";
import {freezeState} from "../StateUtils";
import {getItemFromSessionStorage} from "../../utils/SessionStorageUtils.js";

export class DataStore {

  static #storeCount = 0;

  #componentSubscriptions = [];
	#isLoading = false; 
  #loadAction;
  #requestStoreId;
	#storeData = null;

  constructor(loadAction) {
    this.#loadAction = loadAction;
    this.#componentSubscriptions = [];
    this.#requestStoreId = `data-store-${DataStore.#storeCount}`;
    
		sessionStorage.setItem(this.#requestStoreId, JSON.stringify({}))
    DataStore.#storeCount++;
  }

  /**
   * Returns data from the store.
   * @returns A JSON object representing an immutable copy of store data.
   */
  getStoreData() {
    return this.#storeData;
  }

  /**
   * @returns {boolean} false if the data in the store is null or undefined and is not in a loading state true otherwise.
   */
  isWaitingForData() {
    return this.#storeData !== null && this.#storeData !== undefined  && !this.#isLoading;
  }

  /**
   * Update data in the store and trigger a render of components subscribed to the store.
   * @param storeUpdates Updated store data. Fields not specified in storeData will not be updated.
   */
  updateStoreData(storeUpdates){
    this.#storeData = {...this.#storeData,...freezeState(storeUpdates)};
    for(let i = 0; i < this.#componentSubscriptions.length; i++){
      this.#componentSubscriptions[i].updateFromSubscribedStores();
    }
  }

  getSubscribedComponents(){
    return this.#componentSubscriptions;
  }

  /**
   * Retrieves data from an external source.
   * @param params Parameters for the request.
   * @param dataStore Optional data store that will be subscribed to updates from this store.
   */
  async fetchData(params = {}, dataStore){

    const self = this;

    // Do not make a data request if there is an active one in progress. The active one will push data to subscribed components.
    if(!this.#isLoading) {
      this.#isLoading = true;

      const requestConfig = this.#loadAction.getRequestConfig ? this.#loadAction.getRequestConfig(params) : {};

      let response = null;
      let requestKey = null;
      
      // Retrieve cached response if one exists.
			if(self.#requestStoreId || self.#requestStoreId.length > 0){
        requestKey = `${requestConfig.method ?? ''}_${requestConfig.url}_${JSON.stringify(requestConfig.body) ?? ''}`;
        response = getItemFromSessionStorage(this.#requestStoreId, requestKey);
      }

      // Make an API call if a cached response does not exist.
      if(response === null) {
        //Replace component with loading indicator if one exists.
        for (let i = 0; i < self.#componentSubscriptions.length; i++) {
          self.#componentSubscriptions[i].lockComponent(self);
        }
        if (dataStore) {
          const dataStoreSubscribedComponents = dataStore.getSubscribedComponents();
          for (let i = 0; i < dataStoreSubscribedComponents.length; i++) {
            dataStoreSubscribedComponents[i].lockComponent(dataStore);
          }
        }
        response = await this.#loadAction.fetch(params, self.#requestStoreId,requestKey); 
      } 
      
			self.#storeData = response;
      self.#isLoading = false;

      for(let i = 0; i < self.#componentSubscriptions.length; i++){
        self.#componentSubscriptions[i].unlockComponent(self);
        self.#componentSubscriptions[i].updateFromSubscribedStores();
      }

      if(dataStore){
        const dataStoreSubscribedComponents = dataStore.getSubscribedComponents();
        for(let i = 0; i < dataStoreSubscribedComponents.length; i++){
          dataStoreSubscribedComponents[i].unlockComponent(dataStore);
        }
        dataStore.updateStoreData(response);
      }
      return response;
    }
  }

  unsubscribeComponent(component){
    const idx = this.#componentSubscriptions.indexOf(component);
    if(idx === -1){
      console.warn(`Attempt to unsubscribe ${component.constructor.name} from store it is not subscribed to`)
      return;
    }
    this.#componentSubscriptions.splice(idx, 1);
  }

  subscribeComponent(component){

    let i = 0;
    while(i < this.#componentSubscriptions.length){
      if(this.#componentSubscriptions[i] === component){
        this.#componentSubscriptions = this.#componentSubscriptions.splice(i, 1);
        break;
      }
      i++;
    }
    this.#componentSubscriptions.push(component);

    if(!this.isWaitingForData()){
      this.fetchData();
    }
  }
}
