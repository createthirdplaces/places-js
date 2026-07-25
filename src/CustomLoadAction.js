
/**
 * Class to define a custom data store load action with direct control over any async calls that are made.
 * It is intended for use when additional processing needs to be done after an async call, or if a store needs
 * to combine data from multiple sources.
 */
export class CustomLoadAction {
  constructor(loadFunction) {
    super();
    this.#loadFunction = loadFunction;
    this.fetch = async (params) => {
      return await loadFunction(params);
    }
  }
}
