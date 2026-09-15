Places.js is a framework for building HTML-first websites with progressive enhancements to provide interactivity.  It has these key features.

- No build step required.
- HTML-first templating with fine-grained reactivity.
- Cross-component state management using signals.
- Data fetching.

Places.js is designed to have a mininal learning curve and be customizable for advanced use.

Performance testing on Firefox with 1000 components shows Places.js
rendering is more than 16% faster than [React](https://react.dev/) and 23%
faster than [Lit](https://lit.dev/docs/api/LitElement/). [custom HTML components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components). All code was written by hand without LLM assistance from tools such as ChatGPT or Claude Code, and LLMs will not be used for future changes.

## Comparison to React and Lit

| Tool  | Asnychronous data fetching | Integrated state mangement and data fetching  | [Islands architecture support](https://jasonformat.com/islands-architecture/) | Build step required |
|-----------|------|------ | --- | ------ | -- |
| Places.js | Yes  | Yes   | Yes  | No |
| [React(v19.2)](https://react.dev/)  | No | No  | Yes, except for cross-island state updates. | Yes |
| [Lit(v3.3.3)](https://lit.dev/docs/api/LitElement/) | No  | No | Yes, except for cross-island state updates. | No |

React and Lit require third party libraries or manual code to fully support the features listed above.

 ## Getting started

 To get started, download the [places-js-latest.js file](https://codeberg.org/createthirdplaces/places-js/src/branch/main/places-js-latest.js) from this repo or use the [CDN version](https://cdn.jsdelivr.net/gh/createthirdplaces/places-js@0.1.0/places-js-latest.js)

### More details

- [API reference](https://createthirdplaces.org/tech/placesjs/reference.html)  
- [Example of how places.js is used in production](https://codeberg.org/createthirdplaces/DMVBoardGames/src/branch/main/src/ui)
  
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
 
 - Places.js prioritizes a minialist feature set. Developers are encouraged to create custom implementations of the Places.js component and data store classes.  
