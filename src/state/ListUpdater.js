export class ListUpdater {

  #computedStateCache = new Map();
  #listFields = [];

  #prevOrdering = {};
  #presentationSignals;

  #moved = [];
  #removed = [];
  #updated = [];
  #isClear = false;
  #isReplace = false;

  constructor(presentationSignals) {
    this.#presentationSignals = presentationSignals;
    Object.keys(this.#presentationSignals).forEach((field) => {
      if (this.#presentationSignals[field]["update"]) {
        this.#listFields.push(field);
        this.#prevOrdering[field] = [];
      }
    });
  }

	updateWithState(subscriber, state){
		subscriber.addItems(state)
	}

  updateStoreData(storeUpdates, subscribers, prevStoreData) {
		let changeData = new Map();

    for (let i = 0; i < this.#listFields.length; i++) {
      const field = this.#listFields[i];

      if (!storeUpdates[field]) {
        continue;
      }
      //Assign id value to items.
      if (this.#presentationSignals[field]?.id) {
        for (let j = 0; j < storeUpdates[field].length; j++) {
          storeUpdates[field][j].id = this.#presentationSignals[field].id(
            storeUpdates[field][j],
          );
        }
      }

      const dataItem = storeUpdates[field];
      const updatedOrdering = [];

      const newIds = new Set();
      const prevIds = new Set();

      const prevOrdering = this.#prevOrdering[field];

      this.#removed = new Set(prevOrdering);
      const maxNum = Math.max(dataItem.length, prevOrdering.length);

      let sameLocs = true;

      for (let num = 0; num < maxNum; num++) {
        if (num < dataItem.length) {
          updatedOrdering.push(dataItem[num].id);
          newIds.add(dataItem[num].id);
          this.#removed.delete(dataItem[num].id);
        }
        if (num < prevOrdering.length) {
          prevIds.add(prevOrdering[num]);
        }
        if (!dataItem[num] || dataItem[num].id !== prevOrdering[num]) {
          sameLocs = false;
        }
      }

      this.#isReplace = false;

      if (!sameLocs) {
        let added = new Set();
        if (prevIds.size === 0) {
          added = newIds;
        } else {
          added = sameLocs ? new Set() : newIds.difference(prevIds);
        }
        this.#addToSubscribers(
          added,
          subscribers,
          field,
          updatedOrdering,
          dataItem,
        );
      }

      if (!updatedOrdering || updatedOrdering.length === 0) { 
        this.#isClear = true;
      } else {
        this.#isClear = false;
      }
    
      
      this.#removeFromSubscribers(
        this.#removed,
        subscribers,
        storeUpdates,
        prevStoreData,
        field,
        updatedOrdering,
      );

      this.#moveItems(updatedOrdering, subscribers, prevStoreData, field);
     
      if (!this.#isReplace && !this.#isClear) {

        const arrayChanges = [];

        const reactiveData = this.#presentationSignals[field]["update"];
       
        let reactiveFields;
        if(!Array.isArray(reactiveData)){
          reactiveFields = Object.keys(reactiveData);
        } else {
          reactiveFields = reactiveData;
        }

        for (let i = 0; i < storeUpdates[field].length; i++) {
          let oldStateRow = prevStoreData[field][i];

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
            storeUpdates[field][i].prevStateIndex = i;
            arrayChanges.push(storeUpdates[field][i]); 
          }
        }
        changeData.set(field, arrayChanges);
      } else {
        changeData.set(field,storeUpdates[field]);
      }
    }

    //Look at storeUpdates if changeData is empty
    if (changeData.size === 0 && !this.#isReplace) {
      changeData = new Map();
      Object.keys(storeUpdates).forEach((key) => {
        if (!Array.isArray(storeUpdates[key])) {
          changeData.set(key, storeUpdates[key]);
        }
      });
    }
    if (changeData.size > 0 && !this.#isReplace) {
      this.#updated = this.#generatePresentationUpdates(
        changeData,
        prevStoreData,
      );
      for (let i = 0; i < subscribers.length; i++) {
        subscribers[i].updateVisible(this.#updated);
      }
    }
   
    return storeUpdates;
  }

  #addToSubscribers(added, subscribers, field, updatedOrdering, dataItem) {
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
        this.#isReplace = true;
      }
      this.#prevOrdering[field] = updatedOrdering;

      for (let i = 0; i < subscribers.length; i++) {
        subscribers[i].addItems(addFragments);
      }
    }
  }

  #removeFromSubscribers(
    removed,
    subscribers,
    storeUpdates,
    prevStoreData,
    field,
    updatedOrdering,
  ) {
    if (removed.size > 0) {
      let updatedPrev = [];

      for (let a = 0; a < prevStoreData[field].length; a++) {
        const item = prevStoreData[field][a];
        if (!this.#removed.has(item.id)) {
          updatedPrev.push(item);
        }
      }

      prevStoreData[field] = updatedPrev;


      storeUpdates[field] = updatedPrev;
      this.#prevOrdering[field] = updatedOrdering;
      for (let i = 0; i < subscribers.length; i++) {
        subscribers[i].removeItems(
          this.#removed,
          this.#isReplace,
          this.#isClear,
        );
      }
    }
  }

  #moveItems(updatedOrdering, subscribers, prevStoreData, field) {
    
    this.#moved = [];
    let sameNumber = false;

    if (
      !this.#isReplace &&
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

          this.#moved.push({
            moveNodeId: updatedOrdering[num],
            moveBeforeId: insertBefore,
          });

          for (let a = 0; a < prevStoreData[field].length; a++) {
            const item = prevStoreData[field][a];
 
            if (item.id === updatedOrdering[num]) {
              if (!(updatedOrdering[num] === this.#prevOrdering[num])) {
                swapUpdates.push({
                  updateIndex: num,
                  updateData: item,
                });
              }
            }
          }
        }
      }

      for (let a = 0; a < subscribers.length; a++) {
        subscribers[a].swapUpdates(this.#moved);
      }
      for (let a = swapUpdates.length - 1; a >= 0; a--) {
        const swapItem = swapUpdates[a];
        prevStoreData[field][swapItem.updateIndex] = swapItem.updateData;
      }
      this.#prevOrdering[field] = updatedOrdering;
    }
  }

  #generatePresentationUpdates(updates, prevStoreData) {

    const presentationUpdates = {};

    const keys = Object.keys(this.#presentationSignals);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      const presentationField =
        this.#presentationSignals[key]["presentationField"] || key;

      const dataToUpdate = updates[presentationField];

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


      if (!Array.isArray(update) && !(typeof update ==="object")) {
        let changeData;


        if (typeof update === "function") {
          //TODO: Add check if state field is array.
          changeData = update({
            prevState: prevStoreData[stateField],
            newState: updates.get(stateField),
          });
        } else {
          changeData = { param: updates.get(stateField) };
        }

        const dataToUpdate = prevStoreData[presentationField];
        if (Array.isArray(dataToUpdate)) {

          presentationUpdates[presentationField] = [];
          for (let j = 0; j < changeData.length; j++) {
            if(changeData[j].id){
              presentationUpdates[presentationField].push(changeData[j]);
            }
          }
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
            const prevIdx = updateData.prevStateIndex;
            Object.keys(reactiveFields).forEach((fieldName) => {

               
              //if(updateData[fieldName] === 
              const newData = reactiveFields[fieldName](
                updateData 
              );
              
              const prevState = prevStoreData[stateField][prevIdx]

              const oldData = reactiveFields[fieldName](prevState);

              if(oldData !== newData){
                changeData.push({
                  id: id,
                  [fieldName]: newData 
                });
              }
            });
          }
        }
        presentationUpdates[stateField] = changeData;
      }
    }
    return presentationUpdates;
  }
}
