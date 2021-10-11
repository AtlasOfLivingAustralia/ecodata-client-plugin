describe("Validate on change binding handler Spec", function () {

    beforeEach(function() {
        jasmine.clock().install();
    });

    afterEach(function() {
        jasmine.clock().uninstall();
    });

    it("Should replace the text of the element with the result of evaluating the expression against the binding context", function() {
        var mockElement = document.createElement('input');
        $(mockElement).attr('readonly', 'readonly');

        var observable = ko.observable();
        ko.bindingHandlers.validateOnChange.init(mockElement, function() { return observable });

        spyOn($.fn, 'validationEngine');
        observable("new value");

        jasmine.clock().tick(101);
        expect($.fn.validationEngine).toHaveBeenCalledWith('validate');
    });

});