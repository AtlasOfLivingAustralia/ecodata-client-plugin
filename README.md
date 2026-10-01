
## Ecodata Client Plugin

### [![Build Status](https://github.com/AtlasOfLivingAustralia/ecodata-client-plugin/actions/workflows/build.yml/badge.svg)](https://github.com/AtlasOfLivingAustralia/ecodata-client-plugin/actions/workflows/build.yml)

### About
The ecodata client plugin is a grails plugin used to generate data entry forms from a metadata definition. It is used by the [MERIT](https://github.com/AtlasOfLivingAustralia/fieldcapture) and [BioCollect](https://github.com/AtlasOfLivingAustralia/biocollect) applications.

### Technologies
* Grails framework 7.1.1
* Java 17
* Groovy 4
* Knockout JS
* Bootstrap 5

### Setup
* Clone the repository to your development machine.
* Install npm and nodejs (see https://www.npmjs.com/get-npm)
* Install the node dependencies (used for building the turf libraries and for running the JavaScript tests):

```
npm install
```
* Run the npm script to package the turf geojson libraries and copy them to the grails-app/assets/javascripts folder.
```
npm run package-turf
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

