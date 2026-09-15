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

## Examples

### Creating a component with a template to list events
```
<presentation-component data-store = "search-results-store">
  <div> 
      <p id="no-events-found">No events found</p>
      <h1 id="search-results-header">Event search results</h1>
      <ul data-template=data>
          <li>
            <a class="btn secondary" href="{url}">
              {eventName}
            </a>
            <div class="event-time"> 
              {eventTime}
            </div>
            <div class="event-location"> 
              {location}
            </div> 
          </li>
      </ul>
  </div>
</presentation-component>
```
### Defining a store for component with backend data fetching and reactivity configured by signals.

```
function getSearchResultsQueryConfig(searchParams) {
  let url;
  // Logic to determine API url for store goes here.
  return {
    url: url,
  };
}

const presentationSignals = {
  groupData: {
    update: {
      recurringEventDays: (groupData) => {
        if (groupData.recurringEventDays.length > 0) {
          return `
<span class="group-search-details"><b>Days:</b> ${groupData.recurringEventDays.join(", ")}</span>`;
        }
        return ``;
      },
      gameTypeTags: (groupData) => {
        if (groupData.gameTypeTags.length > 0) {
          return `<span class="group-search-details"><b>Game types:</b> ${groupData.gameTypeTags.join(", ")}</span>`;
        }
        return ``;
      },
    },
  },
  eventData: {
    id: (eventData) => eventData.eventId,
    update: {
      eventTime: (eventData) => {
        if (eventData.isRecurring) {
          return `
            ${eventData.dayOfWeek}s at 
            ${eventData.nextEventTime}`;
        }
        return `
          ${eventData.nextEventDate} at 
          ${eventData.nextEventTime}`;
      },
      location: (eventData) => {
        return `${convertLocationDataForDisplay(eventData.eventLocation)}`;
      },
      url: (eventData) => {
        return `/html/groups/event.html?id=${eventData.eventId}&groupId=${eventData.groupId}`;
      },
    },
  },
};

export const SEARCH_RESULTS_STORE = DataStore.createWithApiLoadSignal({
  queryConfig: getSearchResultsQueryConfig,
  presentationSignals: presentationSignals,
  storeName: "search-results-store",
});


```

### Component with conditional statement to show a different UI and a [Handlebars partial](https://handlebarsjs.com/guide/partials.html)

```
<search-component
  api-url="/searchEvents"
  data-store="search-component-store"
  id="search-section" 
>
  <div data-template>
      {#if isMobile}
        <details open>
          <summary class="btn secondary">Modify search parameters</summary>
          <form id=${SEARCH_FORM_ID} onsubmit="return false">		
            {{>searchTemplate}}
          </form>
          </hr> 
        </details>
      {else}
        <form onsubmit="return false">
          <h1>Search events</h1>
          {{>searchTemplate}}
        </form>
      {/if}
  </div>
</search-component>
```

###

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
