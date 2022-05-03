describe("score binding handler Spec", function () {

    var mockElement;
    beforeEach(function () {
        jasmine.clock().install();

        mockElement = document.createElement('input');
        document.body.appendChild(mockElement);

    });

    afterEach(function () {
        jasmine.clock().uninstall();
        document.body.removeChild(mockElement);
    });

    it("should add the score class and a tooltip to the element", function () {
        var metadata = {
            name:'item',
            dataType:'number',
            "scores": [
                {label:"A score"}
            ]
        };
        var context = {};
        var config = {};
        var dataItem = ko.observable().extend({metadata:{metadata:metadata, context:context, config:config}});
        dataItem.load("3");

        var model = {
            item:dataItem
        }
        $(mockElement).attr('data-bind', 'score:item.get("scores")');
        ko.applyBindings(model, mockElement);

        jasmine.clock().tick(10);
        expect($(mockElement).attr("class")).toEqual("score");
        expect($(mockElement).popover).toBeTruthy();

    });

});