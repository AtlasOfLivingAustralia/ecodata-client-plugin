describe("warning binding handler Spec", function () {

    var mockElement;
    var model;
    beforeEach(function () {
        jasmine.clock().install();

        mockElement = document.createElement('input');
        document.body.appendChild(mockElement);

    });

    afterEach(function () {
        jasmine.clock().uninstall();
        document.body.removeChild(mockElement);
    });

    it("The warningPopup binding ...", function () {

        var metadata = {
            name:'item',
            dataType:'number',
            "warning": {
                "numericality": {
                    "message": "Are you sure no plants survived?",
                    "greaterThan": 0
                }
            },
        };
        var context = {};
        var config = {};
        var dataItem = ko.observable().extend({metadata:{metadata:metadata, context:context, config:config}});
        dataItem.load("3");

        var model = {
            item:dataItem
        }
        $(mockElement).attr('data-bind', 'warning:item');
        ko.applyBindings(model, mockElement);

        jasmine.clock().tick(10);
        expect($('.popover.warning').length).toEqual(0);

        model.item(0);
        jasmine.clock().tick(10);
        expect($('.popover.warning').length).toEqual(1);
        expect($('.popover-body').text()).toEqual(metadata.warning.numericality.message);

        model.item(1);
        jasmine.clock().tick(1);
        expect($('.popover.warning').length).toEqual(0);

        model.item(0);
        jasmine.clock().tick(10);
        expect($('.popover.warning').length).toEqual(1);

        $('.popover.warning').click();
        jasmine.clock().tick(10);
        expect($('.popover.warning').length).toEqual(0);

    });
});