import { DataStoreLoadAction } from "./DataStoreLoadAction";

/**
 * Class to define a custom data store load action with direct control over any async calls that are made.
 * It is intended for use when additional processing needs to be done after an async call, or if a store needs
 * to combine data from multiple sources.
 */
export class CustomLoadAction extends DataStoreLoadAction {

  #loadFunction;

  constructor(loadFunction) {
    super();
    this.#loadFunction = loadFunction;
  }

  async fetch(params) {
    return await this.#loadFunction(
      params,
    );
  }
}
