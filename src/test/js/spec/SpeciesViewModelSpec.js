describe("SpeciesViewModel Spec", function () {
    it("Can participate in the DataModelItem calls like checkWarnings", function () {

        let speciesViewModel = new SpeciesViewModel({}, {searchBieUrl:'/species/searchBie'}, {});
        expect(speciesViewModel.checkWarnings()).toBeUndefined();
    });
});