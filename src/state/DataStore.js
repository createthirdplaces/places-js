import { ApiLoadAction } from "./ApiLoadAction.js";
import { CustomLoadSignal } from "./CustomLoadSignal.js";
import { DataStoreSignal } from "./DataStoreSignal.js";
import { ItemUpdater } from "./ItemUpdater.js";
import { ListUpdater } from "./ListUpdater.js";

class DefaultUpdater {
  /**
   * Update data in the store and trigger a render of components subscribed to the store.
   * @param storeUpdates Updated store data. Fields not specified in storeData will not be updated.
   */
  updateStoreData(storeUpdates, subscribers) {
    for (let i = 0; i < subscribers.length; i++) {
      subscribers[i].updateFromSubscribedStores();
    }
    return storeUpdates;
  }
}

export class DataStore {
  static #storeCount = 0;
  static #storeNameMap = new Map();

	#dataStoreSubscribers = new Map();
  #dataStoreSubscriberSelectors = new Map();

	#fieldTypeMapping = {};
  #isLoading = false;
  #loadAction;


  #presentationUpdates = {};
  #presentationSignals = {};
  #presentationSubscribers = [];

  #prevOrdering = {};
  #requestStoreId;
  #storeData = null;
	#storeName;
	#updateCallbacks = [];

  #updater;

  constructor(loadAction, storeName, updater = new DefaultUpdater()) {

		this.#storeName = storeName;
    this.#presentationSubscribers = [];
    this.#requestStoreId = `store-${DataStore.#storeCount}`;

    this.#updater = updater;

    sessionStorage.setItem(this.#requestStoreId, JSON.stringify({}));

    if (storeName) {
      if (DataStore.#storeNameMap.has(storeName)) {
        throw new Error(
          "Cannot create new store with duplicate name:" + storeName,
        );
      }
      DataStore.#storeNameMap.set(storeName, this);
    }

    this.#loadAction = loadAction;

    DataStore.#storeCount++;

    this.#presentationUpdates["removed"] = [];
    this.#presentationUpdates["moved"] = [];
    this.#presentationUpdates["updated"] = [];
  }

  static getStore(storeName) {
    return this.#storeNameMap.get(storeName);
  }

  static clearStores(){
    this.#storeNameMap.clear();
  }

  static createWithApiLoadSignal({
    presentationSignals,
    queryConfig,
    storeName,
  }) {
    if (presentationSignals) {
      let isArray = false;
      Object.keys(presentationSignals).forEach((key) => {
        if (key !== "update") {
          isArray = true;
        }
      });

      if (isArray) {
        return new DataStore(
          new ApiLoadAction(queryConfig),
          storeName,
          new ListUpdater(presentationSignals),
        );
      } else {
        return new DataStore(
          new DataStoreSignal(queryConfig),
          storeName,
          new ItemUpdater(presentationSignals),
        );
      }
    }
    return new DataStore(new ApiLoadAction(queryConfig), storeName);
  }

  static createWithDataStoreSignals({
    presentationSignals,
    storeSignals,
    storeName,
  }) {
    if (!storeSignals) {
      throw new Error("storeSignals is undefined");
    }

		let dataStore;
    if (presentationSignals) {
      let isArray = false;
      Object.keys(presentationSignals).forEach((key) => {
        if (key !== "update") {
          isArray = true;
        }
      });

      if (isArray) {
        dataStore =  new DataStore(
          new DataStoreSignal(storeSignals),
          storeName,
          new ListUpdater(presentationSignals),
        );
      } else {
				dataStore = new DataStore(
          new DataStoreSignal(storeSignals),
          storeName,
          new ItemUpdater(presentationSignals),
        );
      }
    } else {
			dataStore = new DataStore(new DataStoreSignal(storeSignals), storeName);
		}

		for(let i =0; i < storeSignals.length; i++){
			storeSignals[i].store.subscribeDataStore(dataStore, storeSignals[i].fieldName,storeSignals[i].selector);
		}
		return dataStore;
  }

  static createWithCustomLoadSignal({loadAction, storeName,presentationSignals}) {
    
     if (presentationSignals) {
      let isArray = false;
      Object.keys(presentationSignals).forEach((key) => {
        if (key !== "update") {
          isArray = true;
        }
      });

      if (isArray) {
        return new DataStore(
          new CustomLoadSignal(loadAction),
          storeName,
          new ListUpdater(presentationSignals),
        );
      } else {
        return new DataStore(
          new CustomLoadSignal(loadAction),
          storeName,
          new ItemUpdater(presentationSignals),
        );
      }
    }
    return new DataStore(new CustomLoadSignal(loadAction), storeName);
  }

  /** * Returns store data.
   * @returns A JSON object representing store data.
   */
  getStoreData() {
    return this.#storeData;
  }

  getComponentUpdateData() {
    if (Object.keys(this.#presentationSignals).length > 0) {
      return this.#presentationUpdates;
    }

    return this.#storeData;
  }

  updateStoreData(storeUpdates) {

    
    const updates = this.#updater.updateStoreData(
      storeUpdates,
      this.#presentationSubscribers,
      this.#storeData || [],
    );

    if(!this.#storeData){
      this.#storeData = {};
    }

    Object.keys(updates).forEach((field)=>{
      this.#storeData[field] = updates[field];
    });


		for(let i=0; i < this.#updateCallbacks.length; i++){
			this.#updateCallbacks[i](this.#storeData);
		}
  }

  /**
   * @returns {boolean} false if the data in the store is null or undefined and is not in a loading state true otherwise.
   */
  hasLatestData() {
    return (
      this.#storeData !== null &&
      this.#storeData !== undefined &&
      !this.#isLoading
    );
  }

  getSubscribedComponents() {
    return this.#presentationSubscribers;
  }

  /**
   * Retrieves data from an external source.
   * @param params Parameters for the request.
   * @param dataStore Optional data store that will be subscribed to updates from this store.
   */
  async fetchData(params = {}, dataStore) {
    // Do not make a data request if there is an active one in progress. The active one will push data to subscribed components.
    if (!this.#isLoading) {
      this.#isLoading = true;
      const requestConfig = this.#loadAction.getRequestConfig
        ? this.#loadAction.getRequestConfig(params)
        : {};

      let response = null;
      let requestKey = null;

      // Retrieve cached response if one exists.
      if (this.#requestStoreId || this.#requestStoreId.length > 0) {
        requestKey = `${requestConfig.method ?? ""}_${requestConfig.url}_${JSON.stringify(requestConfig.body) ?? ""}`;

        const dataStr = sessionStorage.getItem(requestKey);
        if (dataStr) {
          const data = JSON.parse(dataStr);

          if (!(Object.keys(data).length === 0) && requestKey in data) {
            response = data[requestKey];
          }
        }
      }

      // Make an API call if a cached response does not exist.
      if (response === null) {

        if (dataStore) {
          const dataStoreSubscribedComponents =
            dataStore.getSubscribedComponents();
					//TODO: This should be removed. Locking component is no longer necessary.
          for (let i = 0; i < dataStoreSubscribedComponents.length; i++) {
            dataStoreSubscribedComponents[i].lockComponent(dataStore);
          }
        }
        response = await this.#loadAction.fetch(
          params,
          this.#requestStoreId,
          requestKey,
        );
      }

      this.updateStoreData(response);

      this.#isLoading = false;

      if (dataStore) {
        const dataStoreSubscribedComponents =
          dataStore.getSubscribedComponents();
				//TODO: This should be removed. Locking components should be done with a loading overlay
				//that is decoupled from DataStore.js
        for (let i = 0; i < dataStoreSubscribedComponents.length; i++) {
          dataStoreSubscribedComponents[i].unlockComponent(dataStore);
        }
        dataStore.updateStoreData(response);
      }

			if(this.#dataStoreSubscribers){
				this.#dataStoreSubscribers.forEach((fieldName, subscriber)=>{

          const selector = this.#dataStoreSubscriberSelectors.get(subscriber);
          if(selector){
            response = selector(response);
          }

          if(!response){
            response = {};
          }
          if(fieldName){
            subscriber.updateStoreData({
              [fieldName]: structuredClone(response)
            });
          } else {
            subscriber.updateStoreData(structuredClone(response));
          }
				});
			}
			
			
      return response;
    }
  }

  unsubscribeComponent(subscriber) {
    this.#presentationSubscribers.splice(this.#presentationSubscribers.indexOf(subscriber), 1);
  }

	/**
	 * Subscribe with custom callback function. This can be used to subscribe external 
	   components to a Places.js store
	 **/
	subscribeWithCallback(callback){
		this.#updateCallbacks.push(callback);
	}

	subscribeDataStore(dataStore,fieldName,selector){
		this.#dataStoreSubscribers.set(dataStore, fieldName);
    this.#dataStoreSubscriberSelectors.set(dataStore,selector)
	}

  subscribeComponent(subscriber, loadingIndicatorStart) {	
		if(!loadingIndicatorStart){
			this.#updater.updateWithState(subscriber,this.#storeData || {});
		}
    let i = 0;
    while (i < this.#presentationSubscribers.length) {
      if (this.#presentationSubscribers[i] === subscriber) {
        this.#presentationSubscribers = this.#presentationSubscribers.splice(i, 1);
        break;
      }
      i++;
    }
		
    this.#presentationSubscribers.push(subscriber);
  }
}
