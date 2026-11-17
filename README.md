
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
The plugin fetches `${collectory.service.url}/ws/licence` (production by default) and caches results for a day. Configure Collectory, the default, or the allowlist externally:

```yaml
collectory:
  service:
    url: https://collections.test.ala.org.au
licences:
  default: https://creativecommons.org/licenses/by/4.0/
  allowlist:
    - https://creativecommons.org/licenses/by/4.0/
    - https://creativecommons.org/licenses/by-nc/3.0/au/
```

The default is CC-BY 4.0 and may be a URL or acronym. The allowlist defaults to CC0 and all six CC 4.0 licences (BY, BY-SA, BY-ND, BY-NC, BY-NC-SA, BY-NC-ND); the configured list replaces it. Failed catalogue fetches use these seven built-in licences. Existing values outside the list are retained and warned about; known historical values use their catalogue name.

`<md:modelView/>` emits the hidden licence config; standalone pages can use `<md:licences/>`. Load `licences.js` and call `ecodataLicences.load()`. Bind selectors through `LicenceViewModel` (`new LicenceViewModel(observable)` for image codes, or add `'url'` for survey URLs) and keep it under `transients`. Show `name` in the options and link the selected licence with `acronym`. New uploads inherit the survey licence; unknown saved values are not replaced.
