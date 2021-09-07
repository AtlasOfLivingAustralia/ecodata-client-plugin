describe("select2 binding handler Spec", function () {

    var mockElement;
    var model;
    beforeEach(function() {
        jasmine.clock().install();

        mockElement = document.createElement('select');
        document.body.appendChild(mockElement);

    });

    afterEach(function() {
        jasmine.clock().uninstall();
        document.body.removeChild(mockElement);
        var select2 = $(document).find('span.select2')[0];
        document.body.removeChild(select2);
    });

    it("The select2 binding applies the select2 javascript library to a select element", function() {

        model = {
            data:ko.observable("1")
        }
        model.data.constraints = ['1', '2', '3', '4'];

        $(mockElement).attr('data-bind', 'options:data.constraints,value:data,select2:{}');

        ko.applyBindings(model, mockElement);
        jasmine.clock().tick(10);
        expect($(mockElement).children().length).toEqual(4);

        var select2 = $(document).find('span.select2');
        expect(select2.length).toEqual(1);
        expect($(mockElement).val()).toEqual('1');

        model.data("3");
        jasmine.clock().tick(10);
        expect($(mockElement).val()).toEqual('3');

        $(mockElement).val("4").trigger("change");
        jasmine.clock().tick(10);
        expect(model.data()).toEqual("4");

    });

    it("The order of bindings doesn't matter", function() {

        model = {
            data:ko.observable("1")
        }
        model.data.constraints = ['1', '2', '3', '4'];

        $(mockElement).attr('data-bind', 'options:data.constraints,select2:{}, value:data');

        ko.applyBindings(model, mockElement);
        jasmine.clock().tick(10);
        expect($(mockElement).children().length).toEqual(4);

        var select2 = $(document).find('span.select2');
        expect(select2.length).toEqual(1);
        expect($(mockElement).val()).toEqual('1');

        model.data("3");
        jasmine.clock().tick(10);
        expect($(mockElement).val()).toEqual('3');

        $(mockElement).val("4").trigger("change");
        jasmine.clock().tick(10);
        expect(model.data()).toEqual("4");
    });

});