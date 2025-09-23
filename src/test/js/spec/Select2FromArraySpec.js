describe("select2FromArray binding handler Spec", function () {

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

    it("The select2FromArray can work with an array of strings", function() {

        model = {
            data:ko.observable("1")
        }
        model.data.constraints = ['1', '2', '3', '4'];

        $(mockElement).attr('data-bind', 'select2FromArray:{dataArray:data.constraints,value:data}');

        ko.applyBindings(model, mockElement);
        jasmine.clock().tick(100);
        // expect($(mockElement).children().length).toEqual(1);

        var select2 = $(document).find('span.select2');
        expect(select2.length).toEqual(1);
        expect($(mockElement).val()).toEqual('1');

        model.data("3");
        jasmine.clock().tick(1000);
        expect($(mockElement).val()).toEqual('3');

    });

    it("The select2FromArray can work with an array of numbers", function() {

        model = {
            data:ko.observable(1)
        }
        model.data.constraints = [1, 2, 3, 4];

        $(mockElement).attr('data-bind', 'select2FromArray:{dataArray:data.constraints,value:data}');

        ko.applyBindings(model, mockElement);
        jasmine.clock().tick(100);

        var select2 = $(document).find('span.select2');
        expect(select2.length).toEqual(1);
        expect($(mockElement).val()).toEqual('1');

        model.data(3);
        jasmine.clock().tick(100);
        expect($(mockElement).val()).toEqual('3');
    });

    it("The select2FromArray can work with an array of objects", function() {
        var array = [{siteId:1,name:'one'},{siteId:2,name:'two'},{siteId:3,name:'three'},{siteId:4,name:'four'}];
        model = {
            data:ko.observable(array[3].siteId),
            array: array
        }

        $(mockElement).attr('data-bind', 'select2FromArray:{dataArray:array,value:data, optionsValue:"siteId", optionsText:"name"}');

        ko.applyBindings(model, mockElement);
        jasmine.clock().tick(100);

        var select2 = $(document).find('span.select2');
        expect(select2.length).toEqual(1);
        expect($(mockElement).val()).toEqual('4');

        model.data(2);
        jasmine.clock().tick(100);
        expect($(mockElement).val()).toEqual('2');
    });
});