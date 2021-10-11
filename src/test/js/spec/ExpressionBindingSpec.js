describe("Expression data binding Spec", function () {

    beforeEach(function() {
        jasmine.clock().install();
    });

    afterEach(function() {
        jasmine.clock().uninstall();
    });

    it("Should replace the text of the element with the result of evaluating the expression against the binding context", function() {
        var mockElement = document.createElement('span');
        var expression = "x + y";
        ko.bindingHandlers.expression.update(mockElement, function() { return expression }, null, {}, {x:10, y:20});

        expect($(mockElement).text()).toBe("30.00");
    });

    it("The ifexpression binding should behave as an if binding except the argument is an ecodata forms expression to be evaluated against the viewmodel", function() {
        var mockElement = document.createElement('div');
        mockElement.setAttribute('data-bind', 'ifexpression:"x>10"');
        $(mockElement).append(document.createElement('span'));
        var x = ko.observable(11);

        ko.applyBindings({x:x}, mockElement);
        jasmine.clock().tick(10);

        expect($(mockElement).find('span').length).toBe(1);

        x(9);
        jasmine.clock().tick(10);

        expect($(mockElement).find('span').length).toBe(0);
    });

    it("The visibleexpression binding should behave as an if binding except the argument is an ecodata forms expression to be evaluated against the viewmodel", function() {
        var mockElement = document.createElement('div');
        $(mockElement).css("display", "block");

        mockElement.setAttribute('data-bind', 'visibleexpression:"y>10"');
        $(mockElement).append(document.createElement('span'));
        var y = ko.observable(11);
        ko.applyBindings({y:y}, mockElement);
        jasmine.clock().tick(100);
        expect($(mockElement).css('display')).toBe("block");

        y(9);
        jasmine.clock().tick(10);
        expect($(mockElement).css("display")).toBe('none');
    });
});
