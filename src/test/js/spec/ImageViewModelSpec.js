describe("ImageViewModel Spec", function () {
    it("adds a current licence that is not an exact dropdown value", function () {
        ["CC BY 3.0", "CC BY"].forEach(function (licence) {
            var image = new ImageViewModel({url: "/image", filesize: 1, licence: licence}, true);
            var option = image.licenceOptions().find(function (item) { return item.value === licence; });

            expect(option).toBeDefined();
        });
    });

    it("keeps an existing licence and adds configured choices without a default", function () {
        var originalLicences = ImageViewModel.IMAGE_LICENCES();
        var choices = [{value: "Custom", name: "Custom licence"}];
        ImageViewModel.IMAGE_LICENCES(choices);
        var image = new ImageViewModel({url: "/image", filesize: 1, licence: "Legacy licence"}, true);

        expect(image.licence()).toBe("Legacy licence");
        expect(image.licenceOptions()).toEqual(choices.concat([{value: "Legacy licence", name: "Legacy licence"}]));

        ImageViewModel.IMAGE_LICENCES(originalLicences);
    });

    it("uses the matching survey licence for a new image", function () {
        var originalLicences = ImageViewModel.IMAGE_LICENCES();
        var surveyLicence = "https://creativecommons.org/licenses/by/4.0/";
        ImageViewModel.IMAGE_LICENCES([{value: "CC BY 4.0", name: "Creative Commons Attribution 4.0", aliases: [surveyLicence]}]);

        var image = new ImageViewModel({url: "/image", filesize: 1}, true, {
            pActivity: {dataSharingLicense: surveyLicence}
        });

        expect(image.licence()).toBe("CC BY 4.0");

        ImageViewModel.IMAGE_LICENCES(originalLicences);
    });

    it("loads configured licences from generic helper markup", function () {
        var originalLicences = ImageViewModel.IMAGE_LICENCES();
        var originalJson = ImageViewModel.licencesJson;
        var options = [{value: "Custom", name: "Custom licence"}];
        var config = document.createElement("div");
        config.setAttribute("data-ecodata-licences", JSON.stringify(options));
        document.body.appendChild(config);

        try {
            var image = new ImageViewModel({url: "/image", filesize: 1, licence: "Custom"}, true);

            expect(image.licenceOptions()).toEqual(options);
            expect(ImageViewModel.IMAGE_LICENCES()).toEqual(options);
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
            ImageViewModel.IMAGE_LICENCES(originalLicences);
            ImageViewModel.licencesJson = originalJson;
            document.querySelectorAll('[data-ecodata-licences]').forEach(function(element) {
                element.remove();
            });
        }

    });
});