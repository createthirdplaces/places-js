Places.js is a lightweight human-centric Javascript framework for creating interactive websites. All code was written by hand without LLM assistance from tools such as ChatGPT or Claude Code, and LLMs will not be used for future changes.


 Places.js is designed to be an alternative to [Lit](https://lit.dev/docs/api/LitElement/) and [React](https://react.dev/).

 ## Comparison to React and Lit

| Tool  | Asnychronous data fetching | Integrated state mangement and data fetching  | [Islands architecture support](https://jasonformat.com/islands-architecture/) | Minified bundle size| Build step required |
|-----------|------|------ | --- | ------ | -- |
| Places.js | Yes  | Yes   | Yes | 4.6 kB | No |
| [React(v19.2)](https://react.dev/)  | No | No  | Yes, except for cross-island state updates. | [7.4 kB](https://bundlephobia.com/package/react@19.2.7) | Yes |
| [Lit(v3.3.3)](https://lit.dev/docs/api/LitElement/) | No  | No | Yes, except for cross-island state updates. | [15.1 kB](https://bundlephobia.com/package/lit@3.3.3) | No |


React and Lit require third party libraries or manual code to fully support the features listed above.

 ## Getting started

 To get started, download the [places-js-latest.js file](https://codeberg.org/createthirdplaces/places-js/src/branch/main/places-js-latest.js) from this repo. See the places.js documentation at [https://createthirdplaces.org/tech/placesjs.html](https://createthirdplaces.org/tech/placesjs.html) for a more detailed guide
 
- [This repo](https://codeberg.org/createthirdplaces/DMVBoardGames/src/branch/main/src/ui) has an example of how places.js is used.

## Contributing

Contributions to address bugs or optimize performance are welcome. If you are interested in contributing, create an issue first before starting work on a PR. 

Also, places.js has a zero LLM use policy. In accordance with the policy, these rules should be followed:

 - All PRs and issues should be created without LLM assistance. 
 - Comments on PRs or issues should be created without LLM assistance.
 - Skill files or other files used to support LLM use should not be added.


## Creating a minified build

Run the command `npx terser places-js-latest.js -o places-js-min.js --compress
--mangle`
 ## Extending Places.js
 
 - Places.js prioritizes a minialist feature set. Developers are encouraged to create custom implementations of the Places.js component and data store classes.  [See the documentation](https://createthirdplaces.org/tech/placesjs.html) for more details on methods that can be overwritten.                                                                 
