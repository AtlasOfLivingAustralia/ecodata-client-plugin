
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
Defaults are packaged in `src/main/resources/ecodata-client-plugin/licences.json`. To override them, set `licences.file` to a mounted JSON file. The file is read on each render; missing or invalid files fall back to packaged defaults.

Entries require `value` and `name`; `shortName`, HTTP(S) `url`, and `aliases` are optional. Aliases must refer to the same licence version.

```yaml
licences:
  file: /etc/biocollect/licences.json
```

The file contains a non-empty JSON array. See [src/main/resources/ecodata-client-plugin/licences.json](src/main/resources/ecodata-client-plugin/licences.json) for a reference on how to format the JSON.

`<md:modelView/>` emits the catalogue automatically, outside conditional and deferred content. Standalone pages should render `<md:licences/>` there instead. Its closed, hidden JSON element avoids executable scripts interfering with Knockout bindings.

Include `licences.js` alongside Knockout and call `ecodataLicences.load()` to read the catalogue. The helper provides:
- `options()` and `optionsFor(value)`: the observable catalogue, or a copy including an unlisted current value.
- `find(value)` and `valueFor(value)`: lookup by code/alias; `valueFor` also loads the catalogue and returns the stored code.
- `descriptionFor(value)`, `shortNameFor(option)`, and `urlFor(value)`: display text and safe links.

Use `optionsText: ecodataLicences.shortNameFor` with `optionsValue: 'value'` for images or `'url'` for BioCollect survey settings. Keep derived UI fields under `transients` as `ko.pureComputed` values to exclude them from saves.

Only new uploads without a supplied licence inherit a matching survey licence. Saved images retain their licence, including an unset value; unlisted values remain selectable.