describe("ImageViewModel Spec", function () {
    it("adds a current licence that is not an exact dropdown value", function () {
        ["CC BY 3.0", "CC BY"].forEach(function (licence) {
            var image = new ImageViewModel({url: "/image", filesize: 1, licence: licence}, true);
            var option = image.licenceOptions().find(function (item) { return item.value === licence; });

            expect(option).toBeDefined();
        });
    });

    it("supports configured licences without aliases", function () {
        var originalLicences = ImageViewModel.IMAGE_LICENCES();
        ImageViewModel.IMAGE_LICENCES([{value: "Custom", name: "Custom licence", default: true}]);
        var image = new ImageViewModel({url: "/image", filesize: 1, licence: "Custom"}, true);

        expect(ImageViewModel.findLicence("Custom").name).toBe("Custom licence");
        expect(image.licenceOptions()).toEqual([{value: "Custom", name: "Custom licence", default: true}]);
        expect(ImageViewModel.defaultLicence()).toBe("Custom");

        ImageViewModel.IMAGE_LICENCES(originalLicences);
    });

    it("updates image options from the generic licences event", function () {
        var image = new ImageViewModel({url: "/image", filesize: 1, licence: "Custom"}, true);
        var options = [{value: "Custom", name: "Custom licence", default: true}];

        window.dispatchEvent(new CustomEvent("ecodata:licences-loaded", {detail: options}));

        expect(image.licenceOptions()).toEqual(options);

        window.dispatchEvent(new CustomEvent("ecodata:licences-loaded", {detail: []}));
    });
});