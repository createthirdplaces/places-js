export class DataStoreLoadAction {
  fetch(params, cacheKey){
    throw new Error(`fetch(params, cacheKey) method must be defined for ${this.constructor.name}`);
  }
}
