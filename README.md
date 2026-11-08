
## Ecodata Client Plugin

### [![Build Status](https://travis-ci.com/AtlasOfLivingAustralia/ecodata-client-plugin.svg?branch=master)](https://travis-ci.com/AtlasOfLivingAustralia/ecodata-client-plugin)

### About
The ecodata client plugin is a grails plugin used to generate data entry forms from a metadata definition. It is used by the [MERIT](https://github.com/AtlasOfLivingAustralia/fieldcapture) and [BioCollect](https://github.com/AtlasOfLivingAustralia/fieldcapture) applications.

### Licences
Default licence options are packaged in `src/main/resources/ecodata-client-plugin/licences.json` and work without host configuration. Applications using the plugin, including BioCollect, can override the list with `licences.options` in `application.yml`; each entry needs a `value` and `name`, and may include `aliases`, `shortName`, and an HTTP(S) `url`:

```yaml
licences:
  options:
    - value: 'CC BY 4.0'
      name: 'Creative Commons Attribution 4.0 International'
      shortName: 'CC BY 4.0'
      url: 'https://creativecommons.org/licenses/by/4.0/'
      aliases:
        - 'https://creativecommons.org/licenses/by/4.0/'
```
Use `<md:licences/>` in a GSP page to emit the configured options as JSON in a hidden `data-ecodata-licences` element. Image forms read the options from that element when creating image view models.
The element is explicitly closed and contains no executable script, so it does not disrupt Knockout bindings.

Other models and apps can include the `licences.js` asset alongside Knockout and call `ecodataLicences.load()` after rendering `<md:licences/>`. The shared helper exposes `options()` (an observable list), `find(value)`, `descriptionFor(value)`, `shortNameFor(option)`, and `urlFor(value)`. Image dropdowns use the short name (or stored value when absent) and link to the selected licence when a URL is configured.

To override the packaged list without rebuilding the plugin, point `licences.file` at a mounted JSON file. The file must contain the same array of licence objects. It is read when the tag renders; if it is missing or invalid, the plugin uses `licences.options` when configured, otherwise the packaged defaults.

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

