describe("Utils Spec", function () {
    it("can format file sizes in a human readable form", function() {
        expect(formatBytes(10)).toBe("0.01 KB");
        expect(formatBytes(1000000000)).toBe("1.00 GB");
        expect(formatBytes(1000000)).toBe("1.00 MB");
    });

    it("can format a date to the financial year in which it falls", function() {

        expect(isoDateToFinancialYear("2017-12-31T13:00:00Z")).toBe("2017/2018");
        expect(isoDateToFinancialYear("2017-05-30T14:00:00Z")).toBe("2016/2017");
        expect(isoDateToFinancialYear("2017-07-01T14:00:00Z")).toBe("2017/2018");

    });

    it("will treat a date at midnight of July 1 as the previous financial year", function() {
        expect(isoDateToFinancialYear("2017-06-30T14:00:00Z")).toBe("2016/2017");
    });

    it("can parse a date from an iso string", function() {
        var date = Date.fromISO("2019-02-01T03:23:55Z");
        expect(date.getUTCDate()).toBe(1);
        expect(date.getUTCMonth()).toBe(1);
        expect(date.getUTCFullYear()).toBe(2019);
        expect(date.getUTCMinutes()).toBe(23);
        expect(date.getUTCHours()).toBe(3);
    });

    it("can tell if a date is valid", function() {
        expect(isValidDate("3")).toBeFalsy();
        expect(isValidDate(new Date())).toBeTruthy();
    });

    it("can format a UTC date into a simple date string", function() {
        expect(convertToSimpleDate("2019-01-31T13:00:00Z")).toBe("01-02-2019");
    });

    it("can format a date in ISO 8601 format", function() {
        expect(convertToIsoDate("2019-01-31T13:00:00Z")).toBe("2019-01-31T13:00:00Z");
        expect(convertToIsoDate("31-01-2019")).toBe("2019-01-30T13:00:00Z"); // Potentially problematic due to time zones in travis...
    })
});