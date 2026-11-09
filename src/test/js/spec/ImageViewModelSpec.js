import catalogue from '../../../main/resources/ecodata-client-plugin/licences.json';

describe("ImageViewModel Spec", function () {
    var originalLicences, originalJson, fixture;

    beforeEach(function () {
        originalLicences = ecodataLicences.options();
        originalJson = ecodataLicences.json;
        ecodataLicences.options([]);
        ecodataLicences.json = null;
        fixture = document.createElement('div');
        document.body.appendChild(fixture);
    });

    afterEach(function () {
        fixture.remove();
        ecodataLicences.options(originalLicences);
        ecodataLicences.json = originalJson;
    });

    function renderConfig(options) {
        var config = document.createElement('div');
        config.setAttribute('data-ecodata-licences', JSON.stringify(options));
        fixture.replaceChildren(config);
    }

    it("loads licences for the first upload and preserves supplied upload licences", function () {
        var originalUpload = $.fn.fileupload;
        var element = document.createElement('table');
        var target = ko.observableArray([]);
        var context = {pActivity: {dataSharingLicense: 'survey-url'}};
        renderConfig([{value: 'Survey licence', name: 'Survey licence', aliases: ['survey-url']}]);
        $.fn.fileupload = function() { return this; };
        try {
            ko.bindingHandlers.imageUpload.init(element, function() {
                return {target: target, context: context};
            }, null, {}, new ko.bindingContext({}));
            $(element).trigger('fileuploaddone', {result: {files: [
                {url: '/image', name: 'new.jpg', size: 1},
                {url: '/image', name: 'licensed.jpg', size: 1, licence: 'Existing licence'}
            ]}});
            expect(target()[0].licence()).toBe('Survey licence');
            expect(target()[1].licence()).toBe('Existing licence');
        } finally {
            $(element).off();
            ko.cleanNode(element);
            $.fn.fileupload = originalUpload;
        }
    });

    it("excludes UI licences from saved data and releases unused subscriptions", function () {
        var image = new ImageViewModel({url: '/image', filesize: 1, licence: 'Saved licence'}, true);
        var subscriptions = ecodataLicences.options.getSubscriptionsCount();
        var observer = image.transients.licenceOptions.subscribe(function() {});
        try {
            expect(ecodataLicences.options.getSubscriptionsCount()).toBeGreaterThan(subscriptions);
        } finally {
            observer.dispose();
        }
        image.transients.licenceOptions();
        image.transients.licenceUrl();
        expect(ecodataLicences.options.getSubscriptionsCount()).toBe(subscriptions);
        var saved = ko.mapping.toJS(image, {ignore: ['transients']});
        expect(saved.transients).toBeUndefined();
        expect(saved.licenceOptions).toBeUndefined();
        expect(saved.licenceUrl).toBeUndefined();
        ecodataLicences.options([{value: 'Other', name: 'Other licence'}]);
        expect(ko.mapping.toJS(image, {ignore: ['transients']})).toEqual(saved);
    });

    it("does not map older survey licences to current catalogue entries", function () {
        ecodataLicences.options(catalogue);
        [
            'https://creativecommons.org/licenses/by-nc/3.0/au/',
            'https://creativecommons.org/licenses/by-nc/2.5/'
        ].forEach(function(url) {
            expect(ecodataLicences.find(url)).toBeNull();
            expect(ImageViewModel.licenceFromSurvey({pActivity: {dataSharingLicense: url}})).toBeUndefined();
        });
    });

    it("uses short labels and updates the selected licence link", function () {
        var choices = [
            {value: "CC BY 0", name: "Creative Commons Zero", shortName: "CC0", url: "https://creativecommons.org/publicdomain/zero/1.0/"},
            {value: "Custom", name: "Custom licence", url: "javascript:alert(1)"}
        ];
        ecodataLicences.options(choices);
        var image = new ImageViewModel({url: "/image", filesize: 1, licence: "CC BY 0"}, true);
        expect(ecodataLicences.shortNameFor(choices[0])).toBe("CC0");
        expect(ecodataLicences.shortNameFor(choices[1])).toBe("Custom");
        expect(image.transients.licenceUrl()).toBe(choices[0].url);
        image.licence("Custom");
        expect(image.transients.licenceUrl()).toBe("");
        image.licence("Legacy licence");
        expect(ecodataLicences.shortNameFor({value: image.licence()})).toBe("Legacy licence");
        expect(image.transients.licenceUrl()).toBe("");
    });

    it("keeps stored licences, including aliases, alongside configured choices", function () {
        var choices = [{value: "CC BY 4.0", name: "Attribution", aliases: ["CC BY"]}];
        ecodataLicences.options(choices);
        ["Legacy licence", "CC BY 3.0", "CC BY"].forEach(function (licence) {
            var image = new ImageViewModel({url: "/image", filesize: 1, licence: licence}, true);
            expect(image.licence()).toBe(licence);
            expect(image.transients.licenceOptions()).toEqual(choices.concat([{value: licence, name: ecodataLicences.descriptionFor(licence)}]));
        });
    });

    it("does not assign a survey licence to saved images", function () {
        var surveyLicence = "https://creativecommons.org/licenses/by/4.0/";
        ecodataLicences.options([{value: "CC BY 4.0", name: "Creative Commons Attribution 4.0", aliases: [surveyLicence]}]);
        var image = new ImageViewModel({url: "/image", filesize: 1, documentId: "saved-image"}, true, {
            pActivity: {dataSharingLicense: surveyLicence}
        });
        expect(image.licence()).toBeUndefined();
        expect(ImageViewModel.licenceFromSurvey({pActivity: {dataSharingLicense: surveyLicence}})).toBe("CC BY 4.0");
    });

    it("loads configured licences from replacement helper markup", function () {
        var options = [{value: "Custom", name: "Custom licence"}];
        renderConfig(options);
        var image = new ImageViewModel({url: "/image", filesize: 1, licence: "Custom"}, true);
        expect(image.transients.licenceOptions()).toEqual(options);
        expect(ecodataLicences.options()).toEqual(options);
        expect(ImageViewModel.licenceFromSurvey({pActivity: {dataSharingLicense: "not configured"}})).toBeUndefined();

        var updatedOptions = [{value: "Updated", name: "Updated licence"}];
        renderConfig(updatedOptions);
        var updatedImage = new ImageViewModel({url: "/image", filesize: 1, licence: "Updated"}, true);
        expect(updatedImage.transients.licenceOptions()).toEqual(updatedOptions);
    });
});