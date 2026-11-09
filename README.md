
## Ecodata Client Plugin

### [![Build Status](https://github.com/AtlasOfLivingAustralia/ecodata-client-plugin/actions/workflows/build.yml/badge.svg)](https://github.com/AtlasOfLivingAustralia/ecodata-client-plugin/actions/workflows/build.yml)

### About
The ecodata client plugin is a grails plugin used to generate data entry forms from a metadata definition. It is used by the [MERIT](https://github.com/AtlasOfLivingAustralia/fieldcapture) and [BioCollect](https://github.com/AtlasOfLivingAustralia/biocollect) applications.


### Technologies
* Grails framework 8.0.0
* Java 25
* Groovy 5
* Knockout JS
* Bootstrap 5

### Setup
* Clone the repository to your development machine.
* Install npm and nodejs (see https://www.npmjs.com/get-npm)
* Install the node dependencies (used for building the turf libraries and for running the JavaScript tests):

```
npm install
```
## Testing
* Grails unit, integration and functional (Geb) tests run through the Gradle wrapper:
```
./gradlew check
```
The functional tests use a headless Chrome driver by default. When running locally you can select a different GEB environment, e.g. `-Dgeb.env=chrome`.

* JavaScript unit tests are run with [Vitest](https://vitest.dev/) via npm:
```
npm test
```
To run the JavaScript tests in watch mode use:
```
npm run test:watch
```

## Running
The ecodata client plugin includes a simple servlet that reads a data model and displays a form generated from that model. It is normally consumed in-place by BioCollect/MERIT, but can be run standalone with the Gradle wrapper:

```
./gradlew bootRun
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