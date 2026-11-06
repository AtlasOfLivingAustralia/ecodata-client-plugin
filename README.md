
## Ecodata Client Plugin

### [![Build Status](https://travis-ci.com/AtlasOfLivingAustralia/ecodata-client-plugin.svg?branch=master)](https://travis-ci.com/AtlasOfLivingAustralia/ecodata-client-plugin)

### About
The ecodata client plugin is a grails plugin used to generate data entry forms from a metadata definition. It is used by the [MERIT](https://github.com/AtlasOfLivingAustralia/fieldcapture) and [BioCollect](https://github.com/AtlasOfLivingAustralia/fieldcapture) applications.

### Licences
Licence options are configured with `licences.options` in `application.yml`. Applications using the plugin, including BioCollect, can override the list; each entry needs a `value` and `name`, one entry should have `default: true`, and entries may include `aliases`:

```yaml
licences:
  options:
    - value: 'CC BY 4.0'
      name: 'Creative Commons Attribution 4.0 International'
      default: true
      aliases:
        - 'https://creativecommons.org/licenses/by/4.0/'
```
Use `<md:licences/>` in a GSP page to emit the configured options as `window.ecodataLicences` and dispatch the generic `ecodata:licences-loaded` event. Image forms consume the event to update their dropdown.

To override the packaged list without rebuilding the plugin, point `licences.file` at a mounted JSON file. The file must contain the same array of licence objects, with exactly one entry marked `"default": true`. It is read when the tag renders; a missing or invalid file is logged and the configured `licences.options` list is used instead. The old `images.licences` and `images.licencesFile` settings are still accepted as fallbacks.

```yaml
licences:
  file: /etc/biocollect/licences.json
```

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

