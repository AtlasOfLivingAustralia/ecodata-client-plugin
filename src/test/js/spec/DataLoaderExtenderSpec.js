describe("dataLoader extender spec", function () {
    var turf ;
    beforeEach(function() {
        jasmine.clock().install();
    });
    afterEach(function() {
        jasmine.clock().uninstall();
    });


    it("should augment an observable with geojson type methods", function() {
        var metadata = {
            name:'item',
            dataType:'text',
            computed: {
                source: {
                    "context-path": "test"
                }
            }
        };

        var context = {
            test:"test-value"
        };
        var config = {};

        var dataItem = ko.observable().extend({metadata:{metadata:metadata, context:context, config:config}});
        var withDataLoader = dataItem.extend({dataLoader:true});
        jasmine.clock().tick();
        expect(withDataLoader()).toEqual("test-value");

    });


});
