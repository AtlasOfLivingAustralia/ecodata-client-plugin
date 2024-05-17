
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

