describe("knockout dates spec", function () {
    it("the simpleDate extender can work with ISO dates but display dates in a human readable format", function() {
        var simpleDate = ko.observable().extend({simpleDate:false});
        var date = Date.fromISO("2019-05-30T14:00:00Z");
        simpleDate(date);

        expect(simpleDate.formattedDate()).toBe("31-05-2019"); // AEST
    });
});