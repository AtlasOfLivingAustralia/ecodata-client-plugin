describe("Feature Data Type Spec", function () {
    var turf ;
    beforeEach(function() {
        turf = window.turf;
        window.turf = {
            area:function(geoJSON) {
                return 1000;
            },
            length: function(geoJSON, units) {
                return 1;
            }

        };

    });
    afterEach(function() {
        window.turf = turf;
    });


    it("should augment an observable with geojson type methods", function() {
        var feature = ko.observable().extend({feature:{}});

        expect(feature.areaHa()).toBe(0);
        expect(feature.lengthKm()).toBe(0);

        var geojson = {type:'FeatureCollection', features:[{type:'Feature', geometry:{type:'Point', coordinates:[0,1]}}]};
        feature(geojson);

        expect(feature.areaHa()).toBe(0.1);
        expect(feature.lengthKm()).toBe(1);
    });

    it("Should convert other geojson values into a feature collection", function() {
        var feature = ko.observable().extend({feature:{}});
        var geojson = {type:'Feature', geometry:{type:'Point', coordinates: [0,1]}, properties:{name:'test'}};

        feature(geojson);

        var value = feature();
        expect(value).toEqual({type:"FeatureCollection", features:[geojson]});

        geojson = {type:'Point', coordinates: [0,1]};
        feature(geojson);

        value = feature();
        expect(value).toEqual({type:"FeatureCollection", features:[{type:'Feature', geometry:geojson}]});
    });

    it("Should play nicely with other extenders", function() {
        var feature = ko.observable().extend({feature:{}}).extend({metadata:{metadata:{}}});
        expect(_.isFunction(feature.getId)).toBeTruthy();

        feature = ko.observable().extend({metadata:{metadata:{}}}).extend({feature:{}});
        expect(_.isFunction(feature.getId)).toBeTruthy();
    });

    it("Should support integration with the FeatureCollection class if supplied", function() {
        var feature = ko.observable().extend({feature:{featureCollection: new ecodata.forms.FeatureCollection()}});
        feature({type:'Point', coordinates: [0,1]});
        expect(_.isFunction(feature().toJSON)).toBeTruthy();
    });

});
