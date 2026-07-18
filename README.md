Places.js is a lightweight Javascript framework for creating interactive websites promoting in person interaction. All code was written by hand without LLM assistance from tools such as ChatGPT or Claude Code, and LLMs will not be used for future changes.


 Places.js is designed to be an alternative to [Lit](https://lit.dev/docs/api/LitElement/) and [React](https://react.dev/)

 ## Comparison to React and Lit

 
| Framework  | Asnychronous data fetching | Integrated state mangement and data fetching  | [Island architecture support](https://jasonformat.com/islands-architecture/)
|-------|-----|------------| ------------|
| Places.js | Yes  | Yes   | Yes |
| React(v19.2)  | No | No  | Yes, except for cross-island state updates. |
| Lit(v3) | No  | No | Yes, except for cross-island state updates. |


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

 ## Extending Places.js
 
 - Places.js prioritizes a minialist feature set. Developers are encouraged to create custom implementations of the Places.js component and data store classes.  [See the documentation](https://createthirdplaces.org/tech/placesjs.html) for more details on methods that can be overwritten.                                                                 