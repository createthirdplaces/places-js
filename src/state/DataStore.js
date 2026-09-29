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

  #fieldTypeMapping = {};
  #isLoading = false;
  #loadAction;

  #presentationUpdates = {};
  #presentationSignals = {};
  #prevOrdering = {};
  #requestStoreId;
  #storeData = null;
  #subscribers = [];

  #updater;

  constructor(loadAction, storeName, updater = new DefaultUpdater()) {

    this.#subscribers = [];
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

    if (presentationSignals) {
      let isArray = false;
      Object.keys(presentationSignals).forEach((key) => {
        if (key !== "update") {
          isArray = true;
        }
      });

      if (isArray) {
        return new DataStore(
          new DataStoreSignal(storeSignals),
          storeName,
          new ListUpdater(presentationSignals),
        );
      } else {
        return new DataStore(
          new DataStoreSignal(storeSignals),
          storeName,
          new ItemUpdater(presentationSignals),
        );
      }
    }
    return new DataStore(new DataStoreSignal(storeSignals), storeName);
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
      this.#subscribers,
      this.#storeData || [],
    );

    if(!this.#storeData){
      this.#storeData = {};
    }

    Object.keys(updates).forEach((field)=>{
      this.#storeData[field] = updates[field];
    });
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
    return this.#subscribers;
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
        //Replace component with loading indicator if one exists.

        if (dataStore) {
          const dataStoreSubscribedComponents =
            dataStore.getSubscribedComponents();
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
        for (let i = 0; i < dataStoreSubscribedComponents.length; i++) {
          dataStoreSubscribedComponents[i].unlockComponent(dataStore);
        }
        dataStore.updateStoreData(response);
      }
      return response;
    }
  }

  unsubscribeComponent(subscriber) {
    this.#subscribers.splice(this.#subscribers.indexOf(subscriber), 1);
  }

  subscribeComponent(subscriber) {
		this.#updater.updateWithState(subscriber,this.#storeData || {});
    let i = 0;
    while (i < this.#subscribers.length) {
      if (this.#subscribers[i] === subscriber) {
        this.#subscribers = this.#subscribers.splice(i, 1);
        break;
      }
      i++;
    }
		
    this.#subscribers.push(subscriber);
  }
}
