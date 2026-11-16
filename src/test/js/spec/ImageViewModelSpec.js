describe("ImageViewModel Spec", function () {
    var originalLicences, originalCatalogue, originalJson, originalCatalogueJson, originalDefault, fixture;
    var by = 'https://creativecommons.org/licenses/by/4.0/';
    var catalogue = [
        {name: 'Creative Commons Attribution (International)', acronym: 'CC-BY 4.0 (Int)',
            url: by, imageUrl: '', version: '4.0'},
        {name: 'Creative Commons Zero', acronym: 'CC0',
            url: 'https://creativecommons.org/publicdomain/zero/1.0/', imageUrl: '', version: '1.0'},
        {name: 'Creative Commons Attribution-Noncommercial (Australia)', acronym: 'CC-BY-NC 3.0 (Aus)',
            url: 'https://creativecommons.org/licenses/by-nc/3.0/au/', imageUrl: '', version: '3.0'},
        {name: 'Creative Commons Attribution-Noncommercial (International)', acronym: 'CC-BY-NC 2.5 (Int)',
            url: 'https://creativecommons.org/licenses/by-nc/2.5/', imageUrl: '', version: '2.5'}
    ];

    beforeEach(function () {
        originalLicences = ecodataLicences.options();
        originalCatalogue = ecodataLicences.catalogue();
        originalJson = ecodataLicences.json;
        originalCatalogueJson = ecodataLicences.catalogueJson;
        originalDefault = ecodataLicences.defaultLicence();
        ecodataLicences.json = null;
        ecodataLicences.catalogueJson = null;
        ecodataLicences.options(catalogue);
        ecodataLicences.catalogue(catalogue);
        fixture = document.createElement('div');
        document.body.appendChild(fixture);
    });

    afterEach(function () {
        fixture.remove();
        ecodataLicences.options(originalLicences);
        ecodataLicences.catalogue(originalCatalogue);
        ecodataLicences.json = originalJson;
        ecodataLicences.catalogueJson = originalCatalogueJson;
        ecodataLicences.defaultLicence(originalDefault);
    });

    function renderConfig(options, defaultLicence, fullCatalogue) {
        var config = document.createElement('div');
        config.setAttribute('data-ecodata-licences', JSON.stringify(options));
        config.setAttribute('data-ecodata-licence-catalogue', JSON.stringify(fullCatalogue === undefined ? options : fullCatalogue));
        config.setAttribute('data-ecodata-default-licence', defaultLicence === undefined ? by : defaultLicence);
        fixture.replaceChildren(config);
        ecodataLicences.load();
    }

    it("loads the default for the first upload and preserves supplied licences", function () {
        var originalUpload = $.fn.fileupload;
        var element = document.createElement('table');
        var target = ko.observableArray([]);
        renderConfig(catalogue);
        $.fn.fileupload = function() { return this; };
        try {
            ko.applyBindings({}, element);
            ko.bindingHandlers.imageUpload.init(element, function() {
                return {target: target, context: {}};
            }, null, {}, ko.contextFor(element));
            $(element).trigger('fileuploaddone', {result: {files: [
                {url: '/image', name: 'new.jpg', size: 1},
                {url: '/image', name: 'licensed.jpg', size: 1, licence: 'Existing licence'}
            ]}});
            expect(target()[0].licence()).toBe('CC-BY 4.0 (Int)');
            expect(target()[1].licence()).toBe('Existing licence');
        } finally {
            $(element).off();
            ko.cleanNode(element);
            $.fn.fileupload = originalUpload;
        }
    });

    it("inherits historical licences without upgrading versions or jurisdictions", function () {
        [
            ['https://creativecommons.org/licenses/by-nc/3.0/au/', 'CC-BY-NC 3.0 (Aus)'],
            ['http://creativecommons.org/licenses/by-nc/2.5', 'CC-BY-NC 2.5 (Int)']
        ].forEach(function(pair) {
            expect(ImageViewModel.licenceFromSurvey({pActivity: {dataSharingLicense: pair[0]}})).toBe(pair[1]);
            expect(ecodataLicences.descriptionFor(pair[0])).toContain(pair[1]);
        });
        expect(ecodataLicences.find('https://creativecommons.org/licenses/by-nc/3.0/nz/')).toBeNull();
        expect(ecodataLicences.find('HTTPS://creativecommons.org/licenses/by/4.0')).toEqual(catalogue[0]);
    });

    it("preserves unknown and unavailable historical survey values instead of applying the default", function () {
        ecodataLicences.options([ecodataLicences.find(by)]);
        ecodataLicences.catalogue(ecodataLicences.options());
        ['https://example.org/unknown-licence', 'https://creativecommons.org/licenses/by-nc/3.0/au/'].forEach(function(value) {
            var inherited = ImageViewModel.licenceFromSurvey({pActivity: {dataSharingLicense: value}});
            var image = new ImageViewModel({url: '/image', filesize: 1, licence: inherited}, true);
            expect(image.licence()).toBe(value);
            expect(image.transients.licence.warning()).toContain('Unrecognised licence');
            expect(image.transients.licence.options().some(function(option) { return option.acronym === value; })).toBe(true);
        });
    });

    it("supports configurable defaults without assigning them to saved images", function () {
        var zero = 'https://creativecommons.org/publicdomain/zero/1.0/';
        renderConfig(catalogue, zero);
        expect(ImageViewModel.licenceFromSurvey({})).toBe('CC0');
        var image = new ImageViewModel({url: '/image', filesize: 1, documentId: 'saved-image'}, true);
        expect(image.licence()).toBeUndefined();
        expect(ecodataLicences.defaultValue('url')).toBe(zero);
    });

    it("preserves legacy codes and URLs without duplicate choices or saved UI fields", function () {
        ecodataLicences.options([ecodataLicences.find(by)]);
        ['CC BY', 'CC BY 4.0', by].forEach(function(value) {
            var image = new ImageViewModel({url: '/image', filesize: 1, licence: value}, true);
            expect(image.licence()).toBe(value);
            expect(image.transients.licence.options().length).toBe(1);
            expect(image.transients.licence.options()[0].acronym).toBe('CC-BY 4.0 (Int)');
            expect(image.transients.licence.selection()).toBe('CC-BY 4.0 (Int)');
            expect(image.transients.licence.url()).toBe(by);
            expect(ko.mapping.toJS(image, {ignore: ['transients']}).transients).toBeUndefined();
        });
    });

    it("uses safe links and warns about unrecognised licences", function () {
        renderConfig(catalogue);
        var licence = ecodataLicences.find('https://creativecommons.org/licenses/by-nc/3.0/au/');
        var value = ko.observable('javascript:alert(1)');
        var vm = new LicenceViewModel(value);
        expect(vm.url()).toBe('');
        expect(vm.warning()).toContain('Unrecognised');
        value(licence.acronym);
        expect(vm.warning()).toBe('');
    });

    it("keeps a survey URL selected through the shared view model", function () {
        ecodataLicences.options([ecodataLicences.find(by)]);
        var value = ko.observable('http://creativecommons.org/licenses/by/4.0');
        var vm = new LicenceViewModel(value, 'url');
        var select = document.createElement('select');
        select.setAttribute('data-bind', "options: options, optionsText: 'acronym', optionsValue: 'url', value: selection, valueAllowUnset: true");
        fixture.appendChild(select);
        try {
            ko.applyBindings(vm, select);
            expect(select.value).toBe(by);
            expect(value()).toBe('http://creativecommons.org/licenses/by/4.0');
            expect(select.options.length).toBe(1);
            expect(select.selectedOptions[0].text).toBe('CC-BY 4.0 (Int)');
        } finally {
            ko.cleanNode(select);
        }
    });

    it("retains a recognised historical licence without offering it as a new choice", function () {
        renderConfig([catalogue[0]], by, catalogue);
        var historical = catalogue[2];
        var inherited = ImageViewModel.licenceFromSurvey({pActivity: {dataSharingLicense: historical.url}});
        var image = new ImageViewModel({url: '/image', filesize: 1, licence: inherited}, true);
        var select = document.createElement('select');
        select.setAttribute('data-bind', "options: transients.licence.options, optionsText: 'acronym', optionsValue: 'acronym', value: transients.licence.selection, valueAllowUnset: true");
        fixture.appendChild(select);
        try {
            ko.applyBindings(image, select);
            expect(inherited).toBe(historical.acronym);
            expect(select.selectedOptions[0].text).toBe(historical.acronym);
            expect(image.transients.licence.description()).toContain(historical.name);
            expect(image.transients.licence.warning()).toContain('not in the allowlist');
            expect(ecodataLicences.options().length).toBe(1);
            select.value = catalogue[0].acronym;
            select.dispatchEvent(new Event('change'));
            expect(image.licence()).toBe(catalogue[0].acronym);
            expect(select.options.length).toBe(1);
            expect(image.transients.licence.warning()).toBe('');
        } finally {
            ko.cleanNode(select);
        }
    });

    it("loads replacement catalogue and preserves unrecognised defaults in the selector", function () {
        var custom = {name: 'Custom licence', acronym: 'Custom', url: 'https://example.org/licence', imageUrl: '', version: '1'};
        renderConfig([custom], 'Custom');
        expect(ImageViewModel.licenceFromSurvey({})).toBe('Custom');
        renderConfig([custom], 'Missing default');
        var inherited = ImageViewModel.licenceFromSurvey({});
        expect(inherited).toBe('Missing default');
        expect(ecodataLicences.defaultValue('url')).toBe('Missing default');
        var image = new ImageViewModel({url: '/image', filesize: 1, licence: inherited}, true);
        var select = document.createElement('select');
        select.setAttribute('data-bind', "options: transients.licence.options, optionsText: 'acronym', optionsValue: 'acronym', value: transients.licence.selection, valueAllowUnset: true");
        fixture.appendChild(select);
        try {
            ko.applyBindings(image, select);
            expect(select.selectedOptions[0].text).toBe('Missing default');
            expect(image.licence()).toBe('Missing default');
            expect(image.transients.licence.warning()).toContain('Unrecognised licence');
        } finally {
            ko.cleanNode(select);
        }
        renderConfig([custom], '');
        expect(ecodataLicences.defaultValue()).toBe('');
    });
});
