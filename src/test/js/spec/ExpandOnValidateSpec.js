describe("Expand on validate Spec", function () {

    beforeEach(function() {
        jasmine.clock().install();
    });

    afterEach(function() {
        jasmine.clock().uninstall();
    });

    it("", function() {
        var mockForm = document.createElement('div');
        $(mockForm).addClass("validationEngineContainer")

        var section = document.createElement('div');
        $(section).attr("data-bind", "expandOnValidate:'.validationEngineContainer'");
        $(mockForm).append(section);

        ko.applyBindings({}, section);

        $(section).hide();
        expect($(section).css('display')).toEqual('none');
        $(mockForm).trigger("jqv.form.validating");

        expect($(mockForm).css('display')).toBeFalsy();

    });

});
