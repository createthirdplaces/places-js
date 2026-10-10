export class ItemUpdater {
  #presentationSignals;
  #topLevelUpdateFields;

  constructor(presentationSignals) {
    this.#presentationSignals = presentationSignals;
    this.#topLevelUpdateFields = Object.keys(presentationSignals.update);
  }

	updateWithState(subscriber, state){
		subscriber.updateItem(state)
	}

  updateStoreData(storeUpdates, subscribers, prevStoreData) {

    let renderUpdates = {};

    //Logic to support updating specific fields while making sure existing data
    //for other fields is considered.
    const stateToCompare = {};
    Object.keys(prevStoreData).forEach((field)=>{
      if(!storeUpdates.hasOwnProperty(field)){
        stateToCompare[field] = prevStoreData[field];
      }
    });
    Object.keys(storeUpdates).forEach((field)=>{
      stateToCompare[field]=storeUpdates[field]; 
    });

    for (let i = 0; i < this.#topLevelUpdateFields.length; i++) {
      const fieldName = this.#topLevelUpdateFields[i];

      const updateData =
        this.#presentationSignals.update[fieldName](stateToCompare);
      if (!prevStoreData || updateData !== prevStoreData[fieldName]) {
        renderUpdates[fieldName] = updateData;
      }
    }

    //Add non reactive fields.
    Object.keys(storeUpdates).forEach((field)=>{
      if(!renderUpdates[field]){
        renderUpdates[field] = storeUpdates[field];
      }
    });

    for (let i = 0; i < subscribers.length; i++) {
      subscribers[i].updateItem(renderUpdates);
    }

    return stateToCompare;
  }
}
