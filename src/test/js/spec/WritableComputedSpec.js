describe("Writable computed Spec", function () {


    var context = {};

    var config = {
        outputName:'Feature_Test'
    };

    it("will return the evaluated expression until the value is manually specified", function() {

        var metadata = {
            name:'item',
            dataType:'text'
        };
        context = {
            anotherItem:ko.observable("3")
        };

        var dataItem = ko.observable().extend({metadata:{metadata:metadata, context:context, config:config}}).extend({writableComputed:{expression:'anotherItem*4', context:context}});


        expect(dataItem()).toBe("12.00");

        dataItem("100");

        expect(dataItem()).toBe("100");


    });

    it("it allows the precision of calculations to be specified if the default value is derived from an expression", function() {

        var metadata = {
            name:'item',
            dataType:'text'
        };
        context = {
            anotherItem:ko.observable("3.0001")
        };

        // If no precision is specified via the "decimalPlaces" option, the default is 2.
        var dataItem = ko.observable()
            .extend({metadata:{metadata:metadata, context:context, config:config}})
            .extend({writableComputed:{expression:'anotherItem*4', context:context}});


        expect(dataItem()).toBe("12.00");

        dataItem("100");

        expect(dataItem()).toBe("100");

        // If the decimalPlaces option is specified, it should be used.
        dataItem = ko.observable()
            .extend({metadata:{metadata:metadata, context:context, config:config}})
            .extend({writableComputed:{expression:'anotherItem*4', context:context, decimalPlaces:4}});

        expect(dataItem()).toBe("12.0004");

        // If the decimalPlaces option is specified, it should be used.
        dataItem = ko.observable()
            .extend({metadata:{metadata:metadata, context:context, config:config}})
            .extend({writableComputed:{expression:'anotherItem*4', context:context, decimalPlaces:3}});

        expect(dataItem()).toBe("12.000");

    });

});