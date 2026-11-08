describe("ImageViewModel Spec", function () {
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
            expect(image.licenceUrl()).toBe(choices[0].url);
            image.licence("Custom");
            expect(image.licenceUrl()).toBe("");
            image.licence("Legacy licence");
            expect(ecodataLicences.shortNameFor({value: image.licence()})).toBe("Legacy licence");
            expect(image.licenceUrl()).toBe("");
        } finally {
            ecodataLicences.options(originalLicences);
        }
    });

    it("adds a current licence that is not an exact dropdown value", function () {
        ["CC BY 3.0", "CC BY"].forEach(function (licence) {
            var image = new ImageViewModel({url: "/image", filesize: 1, licence: licence}, true);
            var option = image.licenceOptions().find(function (item) { return item.value === licence; });

            expect(option).toBeDefined();
        });
    });

    it("keeps an existing licence and adds configured choices without a default", function () {
        var originalLicences = ecodataLicences.options();
        var choices = [{value: "Custom", name: "Custom licence"}];
        ecodataLicences.options(choices);
        var image = new ImageViewModel({url: "/image", filesize: 1, licence: "Legacy licence"}, true);

        expect(image.licence()).toBe("Legacy licence");
        expect(image.licenceOptions()).toEqual(choices.concat([{value: "Legacy licence", name: "Legacy licence"}]));

        ecodataLicences.options(originalLicences);
    });

    it("uses the matching survey licence for a new image", function () {
        var originalLicences = ecodataLicences.options();
        var surveyLicence = "https://creativecommons.org/licenses/by/4.0/";
        ecodataLicences.options([{value: "CC BY 4.0", name: "Creative Commons Attribution 4.0", aliases: [surveyLicence]}]);

        var image = new ImageViewModel({url: "/image", filesize: 1}, true, {
            pActivity: {dataSharingLicense: surveyLicence}
        });

        expect(image.licence()).toBe("CC BY 4.0");

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

            expect(image.licenceOptions()).toEqual(options);
            expect(ecodataLicences.options()).toEqual(options);
            expect(ImageViewModel.licenceFromSurvey({pActivity: {dataSharingLicense: "not configured"}})).toBeUndefined();

            config.remove();
            var updatedOptions = [{value: "Updated", name: "Updated licence"}];
            var updatedConfig = document.createElement("div");
            updatedConfig.setAttribute("data-ecodata-licences", JSON.stringify(updatedOptions));
            document.body.appendChild(updatedConfig);

            var updatedImage = new ImageViewModel({url: "/image", filesize: 1, licence: "Updated"}, true);
            expect(updatedImage.licenceOptions()).toEqual(updatedOptions);
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