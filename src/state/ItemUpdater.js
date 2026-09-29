export class ItemUpdater {
  #presentationSignals;
  #topLevelUpdateFields;

  constructor(presentationSignals) {
    this.#presentationSignals = presentationSignals;
    this.#topLevelUpdateFields = Object.keys(presentationSignals.update);
  }

	updateWithState(subscriber, state){
		console.log(subscriber.nodeName);	
		subscriber.updateItem(state)
	}

  updateStoreData(storeUpdates, subscribers, prevStoreData) {
    let renderUpdates = {};

    for (let i = 0; i < this.#topLevelUpdateFields.length; i++) {
      const fieldName = this.#topLevelUpdateFields[i];
      const updateData =
        this.#presentationSignals.update[fieldName](storeUpdates);

      if (!prevStoreData || updateData !== prevStoreData[fieldName]) {
        renderUpdates[fieldName] = updateData;
      }
    }

    if (Object.keys(storeUpdates).length > 0) {
      for (let i = 0; i < subscribers.length; i++) {
        subscribers[i].updateItem(renderUpdates);
      }
    }
    return storeUpdates;
  }
}
