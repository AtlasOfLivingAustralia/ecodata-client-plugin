describe("SpeciesViewModel Spec", function () {
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

        console.log("speciesViewModel.toJS()" + speciesViewModel.toJS().outputSpeciesId);
        expect(data.outputSpeciesId).toEqual(speciesViewModel.toJS().outputSpeciesId);

    });

    it("New outputSpeciesId is passed when the species has changed", function (){
        let data = {
            outputSpeciesId: "",
            scientificName: "Test Scientific Name",
            name:"Test name",
            guid:"Test guid"
        };

        let options = {searchBieUrl: '/test/searchBie', bieUrl: '/test/bie/', getOutputSpeciesIdUrl: 'test/getOutputSpeciesIdUrl'}
        let responseData = {outputSpeciesId: "55555"};

        spyOn($, 'ajax').and.callFake(function () {
            var d = $.Deferred();
            d.resolve(responseData);
            return d.promise();
        });

        let speciesViewModel = new SpeciesViewModel({}, options, {});
        speciesViewModel.loadData(data);

        expect($.ajax).toHaveBeenCalled();
        expect(data.outputSpeciesId).toEqual(speciesViewModel.outputSpeciesId());

    });

    function ajax_response(response) {
        var deferred = $.Deferred().resolve(response);
        return deferred.promise();
    }
});