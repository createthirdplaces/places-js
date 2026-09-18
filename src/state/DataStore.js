import {ApiLoadAction} from './ApiLoadAction.js'
import {CustomLoadSignal} from './CustomLoadSignal.js'
import {DataStoreSignal} from './DataStoreSignal.js'
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

  constructor(loadAction, storeName) {
    this.#subscribers = [];
    this.#requestStoreId = `store-${DataStore.#storeCount}`;

    sessionStorage.setItem(this.#requestStoreId, JSON.stringify({}));

    if (storeName) {
      if (DataStore.#storeNameMap.has(storeName)) {
        throw new Error("Cannot create new store with duplicate name:" + storeName);
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

  static createWithApiLoadSignal({
    presentationSignals,
    queryConfig,
    storeName,
  }) {
    let store = new DataStore(new ApiLoadAction(queryConfig), storeName);
    if (presentationSignals) {
      store.setupPresentationSignals(presentationSignals);
    }
    return store;
  }

  static createWithDataStoreSignals({
    presentationSignals,
    storeSignals,
    storeName,
  }) {
    if (!storeSignals) {
      throw new Error("storeSignals is undefined");
    }

    let store = new DataStore(new DataStoreSignal(storeSignals), storeName);

    if (presentationSignals) {
      store.setupPresentationSignals(presentationSignals);
    }
    return store;
  }

  static createWithCustomLoadSignal(loadAction, storeName) {
    return new DataStore(new CustomLoadSignal(loadAction), storeName);
  }

  /**
   * Setup signals to enable fine-grained reactivity on
   * presentation components.
   */
  setupPresentationSignals(presentationSignals) {
    this.#presentationSignals = presentationSignals;

    let isArray = false;
    Object.keys(presentationSignals).forEach((key) => {
      this.#prevOrdering[key] = [];
      if (key !== "update") {
        isArray = true;
      }
    });

    let topLevelUpdateFields;
    if (presentationSignals.update) {
      topLevelUpdateFields = Object.keys(presentationSignals.update);
    }

    const singleItemUpdate = (storeUpdates) => {
      if (!this.#storeData) {
        this.#storeData = {};
      }

      let renderUpdates = {};

      for (let i = 0; i < topLevelUpdateFields.length; i++) {
        const fieldName = topLevelUpdateFields[i];
        const updateData =
          this.#presentationSignals.update[fieldName](storeUpdates);

        if (updateData !== this.#storeData[fieldName]) {
          renderUpdates[fieldName] = updateData;
        }
      }

      if (Object.keys(storeUpdates).length > 0) {
        for (let i = 0; i < this.#subscribers.length; i++) {
          this.#subscribers[i].updateSingleItem(renderUpdates);
        }
      }
      this.#storeData = storeUpdates;
    };

    const signalUpdates = (storeUpdates) => {
      if (!isArray) {
        singleItemUpdate(storeUpdates);
        return;
      }

      let changeData = new Map();

      this.#presentationUpdates["removed"] = [];
      this.#presentationUpdates["moved"] = [];
      this.#presentationUpdates["updated"] = [];
      this.#presentationUpdates["isClear"] = false;
      Object.keys(storeUpdates).forEach((field) => {
        if (Array.isArray(storeUpdates[field])) {

          //Assign id value to items.
          if (this.#presentationSignals[field]?.id) {
            for (let j = 0; j < storeUpdates[field].length; j++) {
              storeUpdates[field][j].id = this.#presentationSignals[field].id(
                storeUpdates[field][j],
              );
            }
          }

          this.#fieldTypeMapping[field] = "array";

          const dataItem = storeUpdates[field];
          const dataItemOld = this.#prevOrdering[field] || [];

          const updatedOrdering = [];

          const prevIds = new Set();
          const newIds = new Set();

          this.#presentationUpdates["removed"] = new Set(dataItemOld);
          let sameLocs = true;
          for (
            let num = 0;
            num < Math.max(dataItem.length, dataItemOld.length);
            num++
          ) {
            if (num < dataItem.length) {
              updatedOrdering.push(dataItem[num].id);
              newIds.add(dataItem[num].id);
              this.#presentationUpdates["removed"].delete(dataItem[num].id);
            }
            if (num < dataItemOld.length) {
              prevIds.add(dataItemOld[num]);
            }
            if (!dataItem[num] || dataItem[num].id !== dataItemOld[num]) {
              sameLocs = false;
            }
          }

          let isReplace = false;
          let added = new Set();

          if (!sameLocs) {
            if (prevIds.size === 0) {
              added = newIds;
            } else {
              added = sameLocs ? new Set() : newIds.difference(prevIds);
            }
          }

          if (added.size > 0) {
            let addFragments = [];
            let addFragment = null;

            const addSignals = this.#presentationSignals[field].update;
            const addSignalKeys = Object.keys(addSignals);
            for (let num = 0; num < updatedOrdering.length; num++) {
              const id = updatedOrdering[num];

              for (let key = 0; key < addSignalKeys.length; key++) {
                const signalField = addSignalKeys[key];
                const signal = addSignals[signalField];
                if (typeof signal === "function") {
                  dataItem[num][signalField] = signal(dataItem[num]);
                }
              }
              if (added.has(id)) {
                if (addFragment === null) {
                  addFragment = [];
                }
                addFragment.push(dataItem[num]);
              } else {
                if (addFragment !== null) {
                  addFragments.push({
                    insertBefore: dataItem[num].id,
                    insertData: addFragment,
                  });
                  addFragment = null;
                }
              }
            }
            if (addFragment !== null) {
              addFragments.push({
                insertBefore: -1,
                insertData: addFragment,
              });
              isReplace = true;
            }
            this.#prevOrdering[field] = updatedOrdering;

            for (let i = 0; i < this.#subscribers.length; i++) {
              this.#subscribers[i].addItems(addFragments);
            }
          }

          this.#presentationUpdates["moved"] = [];

          if (!updatedOrdering || updatedOrdering.length === 0) {
            this.#presentationUpdates["isClear"] = true;
          }

          if (this.#presentationUpdates["removed"].size > 0) {
            let updatedPrev = [];

            for (let a = 0; a < this.#storeData[field].length; a++) {
              const item = this.#storeData[field][a];
              if (!this.#presentationUpdates["removed"].has(item.id)) {
                updatedPrev.push(item);
              }
            }

            this.#storeData[field] = updatedPrev;
            this.#prevOrdering[field] = updatedOrdering;
            for (let i = 0; i < this.#subscribers.length; i++) {
              this.#subscribers[i].removeItems(
                this.#presentationUpdates["removed"],
                isReplace,
                this.#presentationUpdates["isClear"],
              );
            }
          }

          let sameNumber = false;
          if (
            !isReplace &&
            updatedOrdering.length === this.#prevOrdering[field].length
          ) {
            sameNumber = true;

            const swapUpdates = [];
            for (let num = 0; num < updatedOrdering.length; num++) {
              if (updatedOrdering[num] !== this.#prevOrdering[field][num]) {
                let insertBefore = null;
                if (num < updatedOrdering.length - 1) {
                  insertBefore = updatedOrdering[num + 1];
                }

                this.#presentationUpdates["moved"].push({
                  moveNodeId: updatedOrdering[num],
                  moveBeforeId: insertBefore,
                });

                for (let a = 0; a < this.#storeData[field].length; a++) {
                  const item = this.#storeData[field][a];

                  if (a + 1 === updatedOrdering[num]) {
                    if (!(updatedOrdering[num] === insertBefore - 1)) {
                      swapUpdates.push({
                        updateIndex: num,
                        updateData: item,
                      });
                    }
                  }
                }
              }
            }

            for (let a = 0; a < this.#subscribers.length; a++) {
              this.#subscribers[a].swapUpdates(
                this.#presentationUpdates["moved"],
              );
            }
            for (let a = swapUpdates.length - 1; a >= 0; a--) {
              const swapItem = swapUpdates[a];
              this.#storeData[field][swapItem.updateIndex] =
                swapItem.updateData;
            }
            this.#prevOrdering[field] = updatedOrdering;
          }
          if (sameNumber) {
            const arrayChanges = [];
            const reactiveFields = this.#presentationSignals[field]["update"];

            for (let i = 0; i < storeUpdates[field].length; i++) {
              let oldStateRow = this.#storeData[field][i];

              let hasChanged = false;
              for (let j = 0; j < reactiveFields.length; j++) {
                const reactiveName = reactiveFields[j];

                const oldState = oldStateRow[reactiveName];
                const newState = storeUpdates[field][i][reactiveName];
                if (oldState !== newState) {
                  hasChanged = true;
                }
              }

              if (hasChanged) {
                arrayChanges.push(storeUpdates[field][i]);
              }
            }
            changeData.set(field, arrayChanges);
          }
        } else {
          this.#fieldTypeMapping[field] = "item";
          changeData[field] = storeUpdates[field];
        }
      });

      this.#presentationUpdates["fieldTypeMapping"] = this.#fieldTypeMapping;

      if (this.#storeData === null) {
        this.#storeData = {};
      }
      //Look at storeUpdates if changeData is empty
      if (changeData.size === 0) {
        changeData = new Map();
        Object.keys(storeUpdates).forEach((key) => {
          if (!Array.isArray(storeUpdates[key])) {
            changeData.set(key, storeUpdates[key]);
          }
        });
      }
      if (changeData.size > 0) {
        this.#presentationUpdates["updates"] =
          this.#generatePresentationUpdates(changeData);
          for (let i = 0; i < this.#subscribers.length; i++) {
          this.#subscribers[i].updateVisible(
            this.#presentationUpdates["updates"],
          );
        }
      }

      Object.keys(storeUpdates).forEach((field) => {
        this.#storeData[field] = storeUpdates[field];
      });
    };
    this.updateStoreData = signalUpdates;
  }

  #generatePresentationUpdates(updates) {
    const presentationUpdates = {};

    const keys = Object.keys(this.#presentationSignals);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      const presentationField =
        this.#presentationSignals[key]["presentationField"] || key;

      const dataToUpdate = this.#storeData[presentationField];

      if (Array.isArray(dataToUpdate)) {
        presentationUpdates[presentationField] = {};
      } else {
        presentationUpdates[presentationField] = "";
      }
    }

    const signalKeys = Object.keys(this.#presentationSignals);
    for (let i = 0; i < signalKeys.length; i++) {
      const stateField = signalKeys[i];
      const { update, presentationField } =
        this.#presentationSignals[stateField];

      if (!updates.get(stateField)) {
        continue;
      }
      if (!Array.isArray(update)) {
        let changeData;

        if (typeof update === "function") {
          //TODO: Add check if state field is array.
          changeData = update({
            prevState: this.#storeData[stateField],
            newState: updates.get(stateField),
          });
        } else {
          changeData = { param: updates.get(stateField) };
        }

        const dataToUpdate = this.#storeData[presentationField];

        if (Array.isArray(dataToUpdate)) {
          for (let j = 0; j < changeData.length; j++) {
            const id = changeData[j].id;
            const updateVal = changeData[j].param;
            if (!presentationUpdates[presentationField][id]) {
              presentationUpdates[presentationField][id] = {};
            }
            presentationUpdates[presentationField][id][presentationField] =
              updateVal;
          }
          presentationUpdates[presentationField] = changeData;
        } else {
          presentationUpdates[presentationField] = changeData["param"];
        }
      } else {
        let changeData = [];
        for (let i = 0; i < updates.get(stateField).length; i++) {
          const updateData = updates.get(stateField)[i];
          const id = updateData.id;
          const reactiveFields =
            this.#presentationSignals[stateField]["update"];

          if (Array.isArray(reactiveFields)) {
            for (let j = 0; j < reactiveFields.length; j++) {
              changeData.push({
                id: id,
                [reactiveFields[j]]: updateData[`${reactiveFields}`],
              });
            }
          } else {
            Object.keys(reactiveFields).forEach((fieldName) => {
              changeData.push({
                id: id,
                [fieldName]: reactiveFields[fieldName](
                  updateData[`${reactiveFields[fieldName]}`],
                ),
              });
            });
          }
        }
        presentationUpdates[stateField] = changeData;
      }
    }

    return presentationUpdates;
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

  /**
   * Update data in the store and trigger a render of components subscribed to the store.
   * @param storeUpdates Updated store data. Fields not specified in storeData will not be updated.
   */
  updateStoreData(storeUpdates) {
    this.#storeData = storeUpdates;
    for (let i = 0; i < this.#subscribers.length; i++) {
      this.#subscribers[i].updateFromSubscribedStores();
    }
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

      //Should only run if presentation signals are being used.
      if (Object.keys(this.#presentationSignals).length === 0) {
        for (let i = 0; i < this.#subscribers.length; i++) {
          this.#subscribers[i].unlockComponent(this);
          this.#subscribers[i].updateFromSubscribedStores();
        }
      }

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
    this.#subscribers.splice(
      this.#subscribers.indexOf(subscriber),
      1,
    );
  }

  subscribeComponent(subscriber) {
    let i = 0;
    while (i < this.#subscribers.length) {
      if (this.#subscribers[i] === subscriber) {
        this.#subscribers = this.#subscribers.splice(
          i,
          1,
        );
        break;
      }
      i++;
    }
    this.#subscribers.push(subscriber);
  }
}


