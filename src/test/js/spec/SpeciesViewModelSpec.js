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