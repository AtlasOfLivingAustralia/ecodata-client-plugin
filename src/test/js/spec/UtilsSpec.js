describe("Utils Spec", function () {
    beforeEach(function () {
        jasmine.Ajax.install();
    });

    afterEach(function () {
        jasmine.Ajax.uninstall();
    });

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

    it("should identify if system is online or offline", async function() {
        simulateOnline();
        var result = await new Promise( (resolve, reject) => {
            isOffline().then(reject, resolve);
        });

        expect(result.status).toBe("ok");

        simulateOffline();
        result = await new Promise( (resolve, reject) => {
            isOffline().then(function (){
                resolve();
            }, function (){
                reject();
            });
        });

        expect(result).toBeUndefined();
    });

    describe('resolveSite', function() {
        beforeEach(function() {
        });

        afterEach(async function() {
            await new Promise((resolve, reject) => {
                entities.deleteTable("site").then(resolve, reject);
            });
        });

        it('should add a site by ID when it is a UUID string', async function() {
            var resolved = [];
            var selectedSiteAdded = false;
            const siteId = '123e4567-e89b-12d3-a456-426614174000';
            const result = await resolveSites([siteId], true, siteId);
            expect(result).toEqual([{ name: 'User created site', siteId: siteId }]);
        });

        it('should not add a site by ID when it is a UUID string but addNotFoundSite is false', async function() {
            var resolved = [];
            var selectedSiteAdded = false;

            const siteId = '123e4567-e89b-12d3-a456-426614174000';

            const result = await resolveSite(siteId, false, siteId, resolved, selectedSiteAdded);

            expect(result).toBe(false);
            expect(resolved).toEqual([]);
        });

        it('should add a site from indexedDB', async function() {
            var resolved = [];
            var selectedSiteAdded = false;

            const siteId = 'indexedDBSiteId';
            await new Promise((resolve, reject) =>
                entities.saveSite({ siteId: siteId, name: 'IndexedDB Site' }).then(resolve, reject)
            ); // Wait for the async operation to complete

            const result = await resolveSite(siteId, true, siteId, resolved, selectedSiteAdded);

            expect(result).toBe(true); // Since the site is added asynchronously
            // await new Promise((resolve) => setTimeout(resolve, 200)); // Wait for the async operation to complete
            expect(resolved).toEqual([{ siteId: siteId, name: 'IndexedDB Site' }]);
        });

        it('should add a site object by reference', async function() {
            var resolved = [];
            var selectedSiteAdded = false;

            const siteObject = { siteId: 'siteId', name: 'Site Object' };

            const result = await resolveSite(siteObject, true, siteObject.siteId, resolved, selectedSiteAdded);

            expect(result).toBe(true);
            expect(resolved).toEqual([siteObject]);
        });

        it('should not add a site object when it does not match the selectedSiteId', async function() {
            var resolved = [];
            var selectedSiteAdded = false;

            const siteObject = { siteId: 'siteId', name: 'Site Object' };

            const result = await resolveSite(siteObject, true, 'differentSiteId', resolved, selectedSiteAdded);

            expect(result).toBe(false);
            expect(resolved).toEqual([siteObject]);
        });

        it('should set selectedSiteAdded to false when site cannot be found', async function() {
            var resolved = [];
            var selectedSiteAdded = false;

            const siteId = 'selectedSiteId';

            const result = await resolveSite(siteId, true, siteId, resolved, selectedSiteAdded);

            expect(result).toBe(false);
            expect(selectedSiteAdded).toBe(false);
        });
    });

    describe("getSiteIdForSites", function() {
        it("should return an empty array if input is an empty array", function() {
            expect(getSiteIdForSites([])).toEqual([]);
        });

        it("should extract site IDs from an array of objects", function() {
            const input = [{ siteId: 1 }, { siteId: 2 }, { siteId: 3 }];
            expect(getSiteIdForSites(input)).toEqual([1, 2, 3]);
        });

        it("should keep non-object elements in the resulting array", function() {
            const input = ["string", 123, { siteId: 1 }, "another string", { siteId: 2 }];
            expect(getSiteIdForSites(input)).toEqual(["string", 123, 1, "another string", 2]);
        });

        it("should ignore non-string, non-number, and non-object elements", function() {
            const input = [true, false, null, undefined];
            expect(getSiteIdForSites(input)).toEqual([]);
        });
    });



    function simulateOnline() {
        clearAllRequests();
        jasmine.Ajax.stubRequest('/noop').andReturn({
            "responseText": '{"status": "ok"}',
            "status": 200,
            "contentType": "application/json"
        });
    }

    function simulateOffline() {
        clearAllRequests();
        jasmine.Ajax.stubRequest('/noop').andError({
            "status": 500
        });
    }

    function clearAllRequests() {
        jasmine.Ajax.requests.reset();
    }
});