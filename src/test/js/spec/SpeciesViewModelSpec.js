describe("SpeciesViewModel Spec", function () {
    var request, result;
    // jasmine.Ajax.install();

    // beforeEach(function() {
    //     request = jasmine.Ajax.requests.mostRecent();
    //     expect(request.method).toBe('GET');
    // });
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

    describe("Test outputSpeciesId", function () {
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

            // spyOn($, 'ajax').and.callFake(function () {
            //     var d = $.Deferred();
            //     d.resolve(responseData);
            //     return d.promise();
            // });





            let speciesViewModel = new SpeciesViewModel(oldSpeciesSelectedData, options, {});
            // spyOn($, 'ajax').and.callFake(function () {
            //     var d = $.Deferred();
            //     d.resolve(responseData);
            //     return d.promise();
            // });

            // request = jasmine.Ajax.requests.mostRecent();
            // request.respondWith({
            //     status: 200,
            //     responseJSON: responseData
            // });

            speciesViewModel.loadData(newSpeciesSelectedData);
            request = jasmine.Ajax.requests.filter('test/getOutputSpeciesIdUrl')[0];
            request.respondWith({
                status: 200,
                responseJSON: responseData
            });


            // expect(request.url).toBe('test/getOutputSpeciesIdUrl');
            expect(speciesViewModel.toJS().outputSpeciesId).toEqual(responseData.outputSpeciesId)

            expect(speciesViewModel.outputSpeciesId()).not.toEqual(oldSpeciesSelectedData.outputSpeciesId);
// expect($.ajax).toHaveBeenCalled();
            // expect(speciesViewModel.toJS().outputSpeciesId).toEqual(responseData.outputSpeciesId);

        });
    })

});