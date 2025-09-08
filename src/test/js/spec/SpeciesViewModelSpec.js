UUID = function() {}
UUID.generate = function() {
    return "666666";
}
describe("SpeciesViewModel Spec", function () {
    var request, result;
    it("Can participate in the DataModelItem calls like checkWarnings", function () {
        var options = {
            searchBieUrl: '/species/searchBie'
        }
        let speciesViewModel = new SpeciesViewModel({}, options, {});
        expect(speciesViewModel.checkWarnings()).toBeUndefined();
    });

    it("Same outputSpeciesId is passed when the species has not changed", function (){
        var data = {
            outputSpeciesId: "5555555",
            scientificName: "Test Scientific Name",
            name:"Test name",
            guid:"Test guid"
        };

        let options = {searchBieUrl: '/test/searchBie', bieUrl: '/test/bie/', getOutputSpeciesIdUrl: 'test/getOutputSpeciesIdUrl'}

        let speciesViewModel = new SpeciesViewModel({}, options, {});
        speciesViewModel.loadData(data);

        expect(data.outputSpeciesId).toEqual(speciesViewModel.toJS().outputSpeciesId);

    });

    describe("Test ajax call to supply new outSpeciesId", function () {
        beforeEach(function() {
            jasmine.Ajax.install();
        });

        afterEach(function() {
            jasmine.Ajax.uninstall();
        });

        it("New outputSpeciesId is passed when the species has changed", function (){
            let oldSpeciesSelectedData = {
                outputSpeciesId: '5555555',
                scientificName: 'Current scientific Name',
                name: 'Current name',
                guid: 'Current guid'
            }

            let newSpeciesSelectedData = {
                scientificName: 'New scientific Name',
                name: 'New name',
                guid: 'New guid'
            };

            let options = {searchBieUrl: '/test/searchBie', bieUrl: '/test/bie/', getOutputSpeciesIdUrl: 'test/getOutputSpeciesIdUrl'}
            let responseData = {outputSpeciesId: "666666"};

            let speciesViewModel = new SpeciesViewModel(oldSpeciesSelectedData, options, {});

            speciesViewModel.loadData(newSpeciesSelectedData);
            expect(speciesViewModel.toJS().outputSpeciesId).toEqual(responseData.outputSpeciesId)
            expect(speciesViewModel.outputSpeciesId()).not.toEqual(oldSpeciesSelectedData.outputSpeciesId);

        });
    })

});

describe("speciesFormatters utility functions", function () {
    describe("formatTaxonName function", function () {
        const COMMON_SCIENTIFIC_NAME = "COMMONNAME(SCIENTIFICNAME)",
            SCIENTIFIC_COMMON_NAME = "SCIENTIFICNAME(COMMONNAME)",
            SCIENTIFIC_NAME = "SCIENTIFICNAME",
            COMMON_NAME = "COMMONNAME";
        var formatTaxonName = speciesFormatters.formatTaxonName, data;

        beforeEach(function () {
            data = {
                commonName: "Kangaroo",
                scientificName: "Macropus"
            };
        });

        it("should format as 'common (scientific)' when display format is COMMONNAME(SCIENTIFICNAME)", function () {
            const config = { speciesDisplayFormat: COMMON_SCIENTIFIC_NAME };

            expect(formatTaxonName(data, config, false)).toBe("Kangaroo (Macropus)");
            expect(formatTaxonName(data, config, true))
                .toBe('<span class="common-name"/>Kangaroo</span> <span class="scientific-name">(Macropus)</span>');
        });

        it("should format as 'scientific (common)' when display format is SCIENTIFICNAME(COMMONNAME)", function () {
            const config = { speciesDisplayFormat: SCIENTIFIC_COMMON_NAME };

            expect(formatTaxonName(data, config, false)).toBe("Macropus (Kangaroo)");
            expect(formatTaxonName(data, config, true))
                .toBe('<span class="scientific-name">Macropus</span> <span class="common-name">(Kangaroo)</span>');
        });

        it("should return only common name when display format is COMMONNAME", function () {
            const config = { speciesDisplayFormat: COMMON_NAME };

            expect(formatTaxonName(data, config, false)).toBe("Kangaroo");
            expect(formatTaxonName(data, config, true))
                .toBe('<span class="common-name">Kangaroo</span>');
        });

        it("should return only scientific name when display format is SCIENTIFICNAME", function () {
            const config = { speciesDisplayFormat: SCIENTIFIC_NAME };

            expect(formatTaxonName(data, config, false)).toBe("Macropus");
            expect(formatTaxonName(data, config, true))
                .toBe('<span class="scientific-name">Macropus</span>');
        });

        it("should fallback to scientific name if display format is not set", function () {
            const config = {}; // no speciesDisplayFormat
            expect(formatTaxonName(data, config, false)).toBe("Macropus (Kangaroo)");
            expect(formatTaxonName(data, config, true))
                .toBe('<span class="scientific-name">Macropus</span> <span class="common-name">(Kangaroo)</span>');
        });

        it("should fallback to scientific name if common name is missing", function () {
            const config = { speciesDisplayFormat: COMMON_SCIENTIFIC_NAME };
            const input = { scientificName: "Homo sapiens" };

            expect(formatTaxonName(input, config, false)).toBe("Homo sapiens");
            expect(formatTaxonName(input, config, true)).toBe("<span class=\"scientific-name\">Homo sapiens</span>")
        });

        it("should fallback to common name if scientific name is missing", function () {
            const config = { speciesDisplayFormat: SCIENTIFIC_COMMON_NAME };
            const input = { commonName: "Platypus" };

            expect(formatTaxonName(input, config, false)).toBe("Platypus");
            expect(formatTaxonName(input, config, true)).toBe("<span class=\"common-name\">Platypus</span>");
        });

        it("should return empty string if neither name is present", function () {
            const config = { speciesDisplayFormat: COMMON_NAME };
            const input = {};

            expect(formatTaxonName(input, config, false)).toBe("");
            expect(formatTaxonName(input, config, true)).toBe("");
        });
    });
});

describe("speciesSearchEngines Spec", function (){
    describe("speciesId", function () {
        var mockEngine, config, speciesId = speciesSearchEngines.speciesId;

        beforeEach(function () {
            config = {
                scientificNameField: "scientific name",
                commonNameField: "common name"
            };

            // mock search engine
            mockEngine = {
                all: jasmine.createSpy("all").and.returnValue([
                    {
                        id: 1,
                        scientificName: "Macropus rufus",
                        commonName: "Red Kangaroo",
                        kvpValues: [
                            {key: 'common name', value: "Kangaroo"},
                            {key: "scientific name", value: "Osphranter rufus"}
                        ]
                    },
                    {
                        id: 2,
                        scientificName: "Gymnorhina tibicen",
                        commonName: "Australian Magpie",
                        kvpValues: [
                            {key: 'common name', value: "Australian Magpie"},
                            {key: "scientific name", value: "Cracticus tibicen"}
                        ]
                    }
                ])
            };

            // mock global objects
            speciesSearchEngines = {
                get: jasmine.createSpy("get").and.returnValue(mockEngine)
            };

        });

        it("should return species.id if present", function () {
            const species = { id: 99, scientificName: "X" };
            const result = speciesId(species, config);

            expect(result).toBe(99);
            expect(speciesSearchEngines.get).not.toHaveBeenCalled();
        });

        it("should search engine list if species.id not present", function () {
            const species = { scientificName: "Osphranter rufus" };
            const result = speciesId(species, config);

            expect(result).toBe(1);
            expect(speciesSearchEngines.get).toHaveBeenCalledWith(config);
        });

        it("should match by scientificName and commonName", function () {
            const species = { scientificName: "Cracticus tibicen", commonName: "Australian Magpie" };
            const result = speciesId(species, config);

            expect(result).toBe(2);
            expect(speciesSearchEngines.get).toHaveBeenCalledWith(config);
        });

        it("should not return id if scientific names don’t match", function () {
            const species = { scientificName: "Unknown species" };
            const result = speciesId(species, config);

            expect(result).toBeUndefined();
        });

        it("should not return id if scientific names matches but not common name", function () {
            const species = { scientificName: "Cracticus tibicen", commonName: "Magpie" };
            const result = speciesId(species, config);

            expect(result).toBeUndefined();
        });

        it("should return undefined if config not provided", function () {
            const species = { scientificName: "Macropus" };
            const result = speciesId(species, null);

            expect(result).toBeUndefined();
            expect(speciesSearchEngines.get).not.toHaveBeenCalled();
        });
    });
});
