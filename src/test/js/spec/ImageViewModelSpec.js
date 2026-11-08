import catalogue from '../../../main/resources/ecodata-client-plugin/licences.json';

describe("ImageViewModel Spec", function () {
    it("defaults only newly uploaded images and preserves upload licences", function () {
        var originalLicences = ecodataLicences.options();
        var originalUpload = $.fn.fileupload;
        var element = document.createElement('table');
        var target = ko.observableArray([]);
        var context = {pActivity: {dataSharingLicense: 'survey-url'}};
        ecodataLicences.options([{value: 'Survey licence', name: 'Survey licence', aliases: ['survey-url']}]);
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
            ecodataLicences.options(originalLicences);
        }
    });

    it("excludes UI licences from saved data and releases unused subscriptions", function () {
        var originalLicences = ecodataLicences.options();
        var image = new ImageViewModel({url: '/image', filesize: 1, licence: 'Saved licence'}, true);
        var subscriptions = ecodataLicences.options.getSubscriptionsCount();
        var observer = image.transients.licenceOptions.subscribe(function() {});
        expect(ecodataLicences.options.getSubscriptionsCount()).toBeGreaterThan(subscriptions);
        observer.dispose();
        image.transients.licenceOptions();
        image.transients.licenceUrl();
        expect(ecodataLicences.options.getSubscriptionsCount()).toBe(subscriptions);
        var saved = ko.mapping.toJS(image, {ignore: ['transients']});
        expect(saved.transients).toBeUndefined();
        expect(saved.licenceOptions).toBeUndefined();
        expect(saved.licenceUrl).toBeUndefined();
        try {
            ecodataLicences.options([{value: 'Other', name: 'Other licence'}]);
            expect(ko.mapping.toJS(image, {ignore: ['transients']})).toEqual(saved);
        } finally {
            ecodataLicences.options(originalLicences);
        }
    });

    it("does not map older survey licences to current catalogue entries", function () {
        var originalLicences = ecodataLicences.options();
        ecodataLicences.options(catalogue);
        try {
            [
                'https://creativecommons.org/licenses/by-nc/3.0/au/',
                'https://creativecommons.org/licenses/by-nc/2.5/'
            ].forEach(function(url) {
                expect(ecodataLicences.find(url)).toBeNull();
                expect(ImageViewModel.licenceFromSurvey({pActivity: {dataSharingLicense: url}})).toBeUndefined();
            });
        } finally {
            ecodataLicences.options(originalLicences);
        }
    });

    it("uses short labels and updates the selected licence link", function () {
        var originalLicences = ecodataLicences.options();
        var choices = [
            {value: "CC BY 0", name: "Creative Commons Zero", shortName: "CC0", url: "https://creativecommons.org/publicdomain/zero/1.0/"},
            {value: "Custom", name: "Custom licence", url: "javascript:alert(1)"}
        ];
        ecodataLicences.options(choices);
        try {
            var image = new ImageViewModel({url: "/image", filesize: 1, licence: "CC BY 0"}, true);
            expect(ecodataLicences.shortNameFor(choices[0])).toBe("CC0");
            expect(ecodataLicences.shortNameFor(choices[1])).toBe("Custom");
            expect(image.transients.licenceUrl()).toBe(choices[0].url);
            image.licence("Custom");
            expect(image.transients.licenceUrl()).toBe("");
            image.licence("Legacy licence");
            expect(ecodataLicences.shortNameFor({value: image.licence()})).toBe("Legacy licence");
            expect(image.transients.licenceUrl()).toBe("");
        } finally {
            ecodataLicences.options(originalLicences);
        }
    });

    it("adds a current licence that is not an exact dropdown value", function () {
        ["CC BY 3.0", "CC BY"].forEach(function (licence) {
            var image = new ImageViewModel({url: "/image", filesize: 1, licence: licence}, true);
            var option = image.transients.licenceOptions().find(function (item) { return item.value === licence; });

            expect(option).toBeDefined();
        });
    });

    it("keeps an existing licence and adds configured choices without a default", function () {
        var originalLicences = ecodataLicences.options();
        var choices = [{value: "Custom", name: "Custom licence"}];
        ecodataLicences.options(choices);
        var image = new ImageViewModel({url: "/image", filesize: 1, licence: "Legacy licence"}, true);

        expect(image.licence()).toBe("Legacy licence");
        expect(image.transients.licenceOptions()).toEqual(choices.concat([{value: "Legacy licence", name: "Legacy licence"}]));

        ecodataLicences.options(originalLicences);
    });

    it("does not assign a survey licence to saved images", function () {
        var originalLicences = ecodataLicences.options();
        var surveyLicence = "https://creativecommons.org/licenses/by/4.0/";
        ecodataLicences.options([{value: "CC BY 4.0", name: "Creative Commons Attribution 4.0", aliases: [surveyLicence]}]);

        var image = new ImageViewModel({url: "/image", filesize: 1, documentId: "saved-image"}, true, {
            pActivity: {dataSharingLicense: surveyLicence}
        });

        expect(image.licence()).toBeUndefined();
        expect(ImageViewModel.licenceFromSurvey({pActivity: {dataSharingLicense: surveyLicence}})).toBe("CC BY 4.0");

        ecodataLicences.options(originalLicences);
    });

    it("loads configured licences from generic helper markup", function () {
        var originalLicences = ecodataLicences.options();
        var originalJson = ecodataLicences.json;
        var options = [{value: "Custom", name: "Custom licence"}];
        var config = document.createElement("div");
        config.setAttribute("data-ecodata-licences", JSON.stringify(options));
        document.body.appendChild(config);

        try {
            var image = new ImageViewModel({url: "/image", filesize: 1, licence: "Custom"}, true);

            expect(image.transients.licenceOptions()).toEqual(options);
            expect(ecodataLicences.options()).toEqual(options);
            expect(ImageViewModel.licenceFromSurvey({pActivity: {dataSharingLicense: "not configured"}})).toBeUndefined();

            config.remove();
            var updatedOptions = [{value: "Updated", name: "Updated licence"}];
            var updatedConfig = document.createElement("div");
            updatedConfig.setAttribute("data-ecodata-licences", JSON.stringify(updatedOptions));
            document.body.appendChild(updatedConfig);

            var updatedImage = new ImageViewModel({url: "/image", filesize: 1, licence: "Updated"}, true);
            expect(updatedImage.transients.licenceOptions()).toEqual(updatedOptions);
        } finally {
            config.remove();
            ecodataLicences.options(originalLicences);
            ecodataLicences.json = originalJson;
            document.querySelectorAll('[data-ecodata-licences]').forEach(function(element) {
                element.remove();
            });
        }

    });
});