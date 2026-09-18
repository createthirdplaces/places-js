class PresentationUpdater {

  #prevOrdering;
  #presentationSignals;

  #moved = [];
  #removed= [];
  #updated = [];
  #isClear = false;

  constructor(presentationSignals){ 
    this.#presentationSignals = presentationSignals; 
  }

  updateStoreData(storeUpdates, subscribers, prevStoreData) {
    let changeData = new Map();

    
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

        const dataItem = storeUpdates[field];
        const dataItemOld = this.#prevOrdering[field] || [];

        const updatedOrdering = [];

        const prevIds = new Set();
        const newIds = new Set();

        this.#removed = new Set(dataItemOld);
        let sameLocs = true;
        for (
          let num = 0;
          num < Math.max(dataItem.length, dataItemOld.length);
          num++
        ) {
          if (num < dataItem.length) {
            updatedOrdering.push(dataItem[num].id);
            newIds.add(dataItem[num].id);
            this.#removed.delete(dataItem[num].id);
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
          this.#addToSubscribers(added, subscribers);
        }
    

        if (!updatedOrdering || updatedOrdering.length === 0) {
          this.#isClear = true;
        }

        this.#removeFromSubscribers(this.#removed,storeUpdates);
        this.#moveItems(updatedOrdering,subscribers,prevStoreData);
     

        if (!isReplace && !isClear) {
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
        changeData[field] = storeUpdates[field];
      }
    });
    
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
      this.#updates = this.#generatePresentationUpdates(changeData);
        for (let i = 0; i < this.#subscribers.length; i++) {
          this.#subscribers[i].updateVisible(this.#updates);
        }
      }

      Object.keys(storeUpdates).forEach((field) => {
        this.#storeData[field] = storeUpdates[field];
      });
    }
  }

  #addToSubscribers(added,subscribers) {
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

      for (let i = 0; i < subscribers.length; i++) {
        subscribers[i].addItems(addFragments);
      }
    }
  }

  #removeFromSubscribers(removed, storeUpdates){
    if (removed.size > 0) {
      let updatedPrev = [];

      for (let a = 0; a < this.#storeData[field].length; a++) {
        const item = this.#storeData[field][a];
        if (!this.#presentationUpdates["removed"].has(item.id)) {
          updatedPrev.push(item);
        }
      }

      storeUpdates[field] = updatedPrev;
      this.#prevOrdering[field] = updatedOrdering;
      for (let i = 0; i < this.#subscribers.length; i++) {
        this.#subscribers[i].removeItems(
          this.#presentationUpdates["removed"],
          isReplace,
          this.#presentationUpdates["isClear"],
        );
      }
    }
  }

  #moveItems(updatedOrdering,subscribers,prevStoreData){
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
            const item = prevStoreData[field][a];

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
      subscribers[a].swapUpdates(
        this.#presentationUpdates["moved"],
      );
    }
    for (let a = swapUpdates.length - 1; a >= 0; a--) {
      const swapItem = swapUpdates[a];
      prevStoreData[field][swapItem.updateIndex] =
        swapItem.updateData;
    }
    this.#prevOrdering[field] = updatedOrdering;
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





}
