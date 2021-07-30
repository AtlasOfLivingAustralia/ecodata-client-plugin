describe("Specification for the featureCollection", function () {

    var turfBackup;

    var feature = function() {
        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[[1, 0], [1, 1], [0, 1], [0, 0], [1, 0]]]
            },
            properties: {
                id:'1'
            }
        };
    };
    beforeEach(function () {
        turfBackup = window.turf;
        window.turf = {
            area: function (geoJSON) {
                return 1000;
            },
            length: function (geoJSON, units) {
                return 1;
            },
            convex: function (geoJSON) {
                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[1, 0], [1, 1], [0, 1], [0, 0], [1, 0]]]
                    }
                };
            },
            bbox: function (geoJSON) {
                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[1, 0], [1, 1], [0, 1], [0, 0], [1, 0]]]
                    }
                };
            }

        };
    });

    afterEach(function () {
        window.turf = turfBackup;
    });


    it("can be converted to an ecodata 'compound' site", function () {

        var featureCollection = new ecodata.forms.FeatureCollection();

        expect(featureCollection.allFeatures()).toEqual([]);

        var expectedSite = {
            type: 'compound',
            extent: {
                source: 'drawn',
                geometry: null
            },
            features: []
        };
        expect(featureCollection.toSite()).toEqual(expectedSite);
    });



    it("will not return multiple features with the same id", function () {
        var featureCollection = new ecodata.forms.FeatureCollection();

        var featureModel = ko.observable(feature());
        featureCollection.registerFeature(featureModel);
        featureCollection.registerFeature(new ko.observable(feature()));

        expect(featureCollection.allFeatures().length).toEqual(2);

        var feature2 = feature();
        feature2.properties.id = 2;
        featureCollection.registerFeature(new ko.observable(feature2));
        expect(featureCollection.allFeatures().length).toEqual(3);

    });

    it("will remove deleted features from the collection", function() {
        var featureCollection = new ecodata.forms.FeatureCollection();

        var featureModel1 = ko.observable(feature());
        var featureModel2 = ko.observable(feature());
        var featureModel3 = ko.observable(feature());
        featureCollection.registerFeature(featureModel1);
        featureCollection.registerFeature(featureModel2);
        featureCollection.registerFeature(featureModel3);

        expect(featureCollection.allFeatures().length).toEqual(3);

        featureCollection.deregisterFeature(featureModel2);

        expect(featureCollection.allFeatures().length).toEqual(2);
    });


    it("will save the original feature id in an original id property to track the origin of the feature", function () {
        var featureCollection = new ecodata.forms.FeatureCollection();
        featureCollection.loadComplete();

        var featureModel = ko.observable();
        featureCollection.registerFeature(featureModel);

        var featureCollection = {
            type:"FeatureCollection",
            features:[feature()]
        };
       featureModel(featureCollection);

        expect(featureModel.modelId).toBe(1);
        expect(featureCollection.features[0].properties.originalId).toBe(feature().properties.id);
        expect(featureCollection.features[0].properties.id).toBe("1-0");

    });

    it("will not overwrite the original id if the id is already there", function () {
        var featureCollection = new ecodata.forms.FeatureCollection();
        featureCollection.loadComplete();

        var featureModel = ko.observable();
        featureCollection.registerFeature(featureModel);

        var featureCollection = {
            type:"FeatureCollection",
            features:[feature()]
        };
        featureCollection.features[0].properties.id="2";
        featureCollection.features[0].properties.originalId="original";
        featureModel(featureCollection);

        expect(featureModel.modelId).toBe(1);
        expect(featureCollection.features[0].properties.originalId).toBe("original");
        expect(featureCollection.features[0].properties.id).toBe("1-0");
    });
});