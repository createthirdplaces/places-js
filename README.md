Places.js is a HTML-first progressive enhancement framework. It has these key features.

- No build step required. [Places.js can be directly downloaded from a CDN and immediately be used](https://cdn.jsdelivr.net/gh/createthirdplaces/places-js@0.1.0/places-js-latest.js)
- HTML-first templating with web components.
- State management using signals for fine-grained reactivity.
- Data fetching.

The HTML-first templating provides flexibility for developers to chose how the HTML will be generated on a server. Developers can also dynamically add Places.js components with JavaScript.

Places.js is optimized for fast rendering. Performance benchmarking shows that Places.js outperforms React, Solid, and Svelte. ![Performance testing results](https://codeberg.org/createthirdplaces/places-js/src/branch/main/performanceTesting/PerformanceTestingResults.png "Performance benchmark results")

The benchmarks were run using a Lenovo Legion Pro 5 16IRX8 82WK(13th Gen Intel Core i7-13700HX, 16GB RAM) with Linux Mint 22.1. Benchmark code is from a [fork](https://github.com/createthirdplaces/js-framework-benchmark/tree/master/frameworks/keyed/places-js) of the [krauset/js-framework-benchmark repo](https://github.com/krausest/js-framework-benchmark)



## Getting started

Download the [places-js-latest.js file from the jsDelivr
CDN](https://cdn.jsdelivr.net/gh/createthirdplaces/places-js@0.1.0/places-js-latest.js)
or run `npx jsr add @createthirdplaces/places-js`


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

### Dynamically adding Places.js components with JavaScript.

```
<html>
  <head>
    <script type="module">

      import {TestRunner} from '/lib/TestRunner.js';
      import {ListUpdaterTests} from '/src/listUpdaterTests.js';
      import {PerformanceTests} from '/src/performanceTests.js';
      import {PresentationComponent} from '/lib/places-js-min.js'; 

      customElements.define('presentation-component',PresentationComponent);
 
      const tests = [
        new ListUpdaterTests(),
        new PerformanceTests()
      ];
      
      window.addEventListener("load",()=>{

        const testDOM = [];
        for(let i=0; i<tests.length;i++){

          const test = tests[i];
          TestRunner.createRunnerWithTests(test);

          testDOM.push(`
            <details open>
              <summary>${test.constructor.name}</summary>
              <presentation-component data-store="${test.getName()}">
                <ul data-template="testResults">
                  <li>
                    <h2>{name}</h2>
                    <p>{message}</p>
                    <p>{isPass}</p>
                  </li>
                </ul>
              </presentation-component>
            </details>
          `);
        }
        document.getElementById("test-results")
          .innerHTML = testDOM.join("\n");

        document.getElementById("run-all")
          .addEventListener("click",()=>{
            TestRunner.runAllTests(); 
        });
      });  
    </script>
  </head>
  <body>
    <h1>Tests</h1>
    <button id="run-all">Run all tests</button>
    <div id="test-results"></div>
  </body>
</html>
```

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
