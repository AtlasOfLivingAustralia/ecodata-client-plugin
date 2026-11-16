
## Ecodata Client Plugin

### [![Build Status](https://travis-ci.com/AtlasOfLivingAustralia/ecodata-client-plugin.svg?branch=master)](https://travis-ci.com/AtlasOfLivingAustralia/ecodata-client-plugin)

### About
The ecodata client plugin is a grails plugin used to generate data entry forms from a metadata definition. It is used by the [MERIT](https://github.com/AtlasOfLivingAustralia/fieldcapture) and [BioCollect](https://github.com/AtlasOfLivingAustralia/fieldcapture) applications.


### Technologies
* Grails framework 
* Knockout JS
* Bootstrap 4.6

### Setup
* Clone the repository to your development machine.* Install npm and nodejs (see https://www.npmjs.com/get-npm)
* Install the node dependencies for MERIT.  Note these are currently only used for testing.

```
npm install
npm install -g karma
```
* Run the npm script to package the turf geojson libraries and copy them to the grails-app/assets/javascripts folder.
```
npm run-script package-turf
```
## Testing
* To run the grails unit tests, use:
```
grails test-app
```
Webdrivers for chrome and phantomjs for use by the functional tests are installed by npm, so ensure you have run npm install before running the tests.  When running locally it is convenient to supply just one GEB environment.  e.g. -Dgeb.env=chrome

* Javascript user tests are run using npm.
```
npm test
```
To run the javascript tests in debug mode use:
```
npm run-script debug
```

## Running
The ecodata client plugin application includes a simple servlet that reads a data model and displays a form generated from that model.

```
grails run-app
```

### Licences
Licences are fetched server-side from `${collectory.service.url}/ws/licence` and cached for one day, including fallback responses. The service warms the cache automatically after Spring injects its dependencies; later lookups refresh expired entries. The Collectory base URL defaults to `https://collections.ala.org.au`. Configure it for test deployments:

```yaml
collectory:
  service:
    url: https://collections.test.ala.org.au
licences:
  default: https://creativecommons.org/licenses/by/4.0/
```

The default may be a catalogue URL or acronym. It applies to new surveys and new uploads without a survey licence, not to saved records. A default outside the allowlist is logged and retained with a visible warning; CC-BY 4.0 is used only when no default is configured.

By default, the allowlist permits CC0 and all six CC 4.0 licences: CC-BY, CC-BY-SA, CC-BY-ND, CC-BY-NC, CC-BY-NC-SA and CC-BY-NC-ND. Override `licences.allowlist` with a list of licence URLs to replace these choices, for example:

```yaml
licences:
  allowlist:
    - https://creativecommons.org/licenses/by/4.0/
    - https://creativecommons.org/licenses/by-nc/3.0/au/
```

Entries use the API shape: `name`, `acronym`, `url`, `imageUrl`, and `version`. Duplicate licence URLs are collapsed; HTTP/HTTPS and trailing-slash variants identify the same licence, but different versions and jurisdictions never do. Missing standard choices are supplemented from built-in definitions; failed or invalid API responses are logged and use those definitions as the fallback. Override URLs must exist in the catalogue or built-in definitions; missing entries are logged. An empty allowlist offers no general choices, though an excluded default is still retained with a warning. Previously selected licences remain available, with their catalogue descriptions where known, even if excluded by the allowlist.

`<md:modelView/>` emits the catalogue automatically, outside conditional and deferred content. Standalone pages should render `<md:licences/>` there instead. Its closed, hidden JSON element avoids executable scripts interfering with Knockout bindings.

Include `licences.js` alongside Knockout and call `ecodataLicences.load()` to read the catalogue. The helper provides:
- `options()` and `optionsFor(value)`: allowed choices, or choices including the current value when it is excluded or unrecognised.
- `catalogue()`: the full catalogue used to recognise historical values.
- `find(value)` and `valueFor(value)`: lookup by acronym, URL or previously supported image code; `valueFor` loads the catalogue and returns the acronym.
- `defaultValue(field)`: the configured default's acronym, or URL with `field: 'url'`; unrecognised defaults retain their configured value.
- `descriptionFor(value)`, `shortNameFor(option)`, and `urlFor(value)`: display text and safe links.

Use `new LicenceViewModel(licenceObservable)` for images, or `new LicenceViewModel(licenceObservable, 'url')` for survey URLs. It exposes `selection`, `options`, `description`, `url`, and `warning` as pure computeds. Bind `value: transients.licence.selection`, `optionsText: 'acronym'` with `optionsValue: 'acronym'` for images or `'url'` for surveys. The selection adapter displays recognised historical codes/URLs without rewriting the saved value until a different licence is chosen. Keep the view model under `transients` to exclude UI fields from saves.

Only new uploads without a supplied licence inherit the same survey licence; recognised values are stored as catalogue acronyms. Unknown survey values are retained with a visible warning instead of being replaced by the default. Saved images retain their licence, including an unset value.
