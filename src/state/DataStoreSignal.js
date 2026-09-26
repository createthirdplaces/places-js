/**
 * Class to determine a custom load action that includes a dependency on other stores
 **/
export class DataStoreSignal {
  constructor(stores) {
    //TODO: Make the store also subscribe to updates
    //from the dependent stores.
    this.fetch = async () => {
      const promises = [];
      stores.forEach((storeConfig) => {
        const storeFetch = new Promise((resolve) => {
          storeConfig.store.fetchData().then(() => {
            const data = storeConfig.store.getStoreData();
            const resolveState = {
              [storeConfig.fieldName]: data,
            };
            resolve(resolveState);
          });
        });

        promises.push(storeFetch);
      });

      const data = await Promise.all(promises);
      const result = {};

      for (let i = 0; i < data.length; i++) {
        Object.assign(result, data[i]);
      }

      return result;
    };
  }
}
