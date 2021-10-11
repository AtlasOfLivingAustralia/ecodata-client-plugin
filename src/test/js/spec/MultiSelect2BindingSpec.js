describe("multiSelect2 binding handler Spec", function () {

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

    it("The multiSelect2 binding uses the select2 widget to take input to an observable array", function() {

        model = {
            data:ko.observableArray([])
        }
        model.data.constraints = ['1', '2', '3', '4'];

        $(mockElement).attr('data-bind', 'options:data.constraints,multiSelect2:{value:data}').attr('multiple', 'multiple');

        ko.applyBindings(model, mockElement);
        jasmine.clock().tick(10);
        expect($(mockElement).children().length).toEqual(4);

        var select2 = $(document).find('span.select2');
        expect(select2.length).toEqual(1);

        model.data(['1']);
        expect(select2.find('li.select2-selection__choice[title="1"]').length).toEqual(1); // Selection is displayed.
    });

    it("The multiSelect2 binding initialises the select2 widget based on existing selections", function() {

        var model = {
            data:ko.observableArray(['3', '4'])
        }
        model.data.constraints = ['1', '2', '3', '4'];

        $(mockElement).attr('data-bind', 'options:data.constraints,multiSelect2:{value:data}').attr('multiple', 'multiple');

        ko.applyBindings(model, mockElement);
        jasmine.clock().tick(10);

        expect($(mockElement).children().length).toEqual(4);

        var select2 = $(document).find('span.select2');
        expect(select2.find('li.select2-selection__choice[title="1"]').length).toEqual(0);
        expect(select2.find('li.select2-selection__choice[title="2"]').length).toEqual(0);
        expect(select2.find('li.select2-selection__choice[title="3"]').length).toEqual(1);
        expect(select2.find('li.select2-selection__choice[title="4"]').length).toEqual(1);
    });

    it("The multiSelect2 binding keeps selections not in the constraints list to allow constraint list deletions without a new form version", function() {

        var model = {
            data:ko.observableArray(['3', '5'])
        }
        model.data.constraints = ['1', '2', '3', '4'];

        $(mockElement).attr('data-bind', 'options:data.constraints,multiSelect2:{value:data}').attr('multiple', 'multiple');

        ko.applyBindings(model, mockElement);
        jasmine.clock().tick(10);

        expect($(mockElement).children().length).toEqual(5);

        var select2 = $(document).find('span.select2');
        expect(select2.find('li.select2-selection__choice[title="1"]').length).toEqual(0);
        expect(select2.find('li.select2-selection__choice[title="2"]').length).toEqual(0);
        expect(select2.find('li.select2-selection__choice[title="3"]').length).toEqual(1);
        expect(select2.find('li.select2-selection__choice[title="4"]').length).toEqual(0);
        expect(select2.find('li.select2-selection__choice[title="5"]').length).toEqual(1);
    });

    it("The multiSelect2 binding supports delayed constraint population via ajax", function() {

        var model = {
            data:ko.observableArray(['3', '5'])
        }
        model.data.constraints = ko.observableArray();

        $(mockElement).attr('data-bind', 'options:data.constraints,multiSelect2:{value:data}').attr('multiple', 'multiple');

        ko.applyBindings(model, mockElement);
        jasmine.clock().tick(10);

        expect($(mockElement).children().length).toEqual(2);

        var select2 = $(document).find('span.select2');
        expect(select2.find('li.select2-selection__choice[title="1"]').length).toEqual(0);
        expect(select2.find('li.select2-selection__choice[title="2"]').length).toEqual(0);
        expect(select2.find('li.select2-selection__choice[title="3"]').length).toEqual(1);
        expect(select2.find('li.select2-selection__choice[title="4"]').length).toEqual(0);
        expect(select2.find('li.select2-selection__choice[title="5"]').length).toEqual(1);

        model.data.constraints(['1', '2', '3', '4']);

        expect($(mockElement).children().length).toEqual(5);

        expect(select2.find('li.select2-selection__choice[title="1"]').length).toEqual(0);
        expect(select2.find('li.select2-selection__choice[title="2"]').length).toEqual(0);
        expect(select2.find('li.select2-selection__choice[title="3"]').length).toEqual(1);
        expect(select2.find('li.select2-selection__choice[title="4"]').length).toEqual(0);
        expect(select2.find('li.select2-selection__choice[title="5"]').length).toEqual(1);
    });

});