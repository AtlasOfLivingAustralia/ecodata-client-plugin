describe("Specification for the featureCollection", function () {

    var turf;
    var context;
    beforeEach(function () {
        turf = window.turf;
        window.turf = {
            area:function() { return 1000; },
            length: function() { return 1; },
            convex: function() { return {}; }
        };
        context = {
            featureCollection: new ecodata.forms.FeatureCollection([])
        };
    });
    afterEach(function() {
        window.turf = turf;
    });

    var newModel = function() {
        return new ecodata.forms.MultiFeatureViewModel({}, ecodata.forms.multiFeatureViewModelMetadata, context, {outputName:"MultiFeatureModel"});
    };

    var polygon = function() {
        return {
            type: 'Polygon',
            coordinates: [[
                [100.0, 100.0],
                [100.1, 100.0],
                [100.1, 100.1],
                [100.0, 100.1],
                [100.0, 100.0]
            ]]
        };
    };

    var geojson = function() {
        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: polygon()
                }
            ]
        };
    };

    var featureWithId = function(id, name) {
        return {
            type:'Feature',
            geometry: polygon(),
            properties:{
                id:id,
                name:name
            }
        }
    };

    it("can collect data from individual feature data types into a site for further processing", function() {
        // Create the knockout view model used on the form
        var multiFeatureModel = newModel();

        // Load an empty dataset
        multiFeatureModel.loadData({});

        // Notify the featureCollection the load is complete.  This is required to be done by the form.
        context.featureCollection.loadComplete();

        // Simulate adding a new row to the table containing features.
        multiFeatureModel.features.addRow({});

        // Simulate clicking on the feature in the first row, drawing a polygon and pressing save.
        multiFeatureModel.features()[0].feature(geojson());

        // Simulate a save (or this can happen on a dirty check)
        var dataStringified = multiFeatureModel.modelAsJSON();
        var data = JSON.parse(dataStringified);

        expect(data.features[0].feature).toEqual({modelId:1, featureIds:['1-MultiFeatureModel-feature-0-0']});

        var site = context.featureCollection.toSite();
        expect(site.features.length).toBe(1);
        var expected = geojson().features[0];
        expect(site.features[0].type).toEqual(expected.type);
        expect(site.features[0].geometry).toEqual(expected.geometry);
    });

    it("can support features being deleted and updates the site accordingly", function() {
        var multiFeatureModel = newModel();
        multiFeatureModel.loadData({});
        context.featureCollection.loadComplete();

        multiFeatureModel.features.addRow({});
        multiFeatureModel.features()[0].feature(geojson());

        multiFeatureModel.features.addRow({});
        multiFeatureModel.features()[1].feature(geojson());

        var dataStringified = multiFeatureModel.modelAsJSON();
        var data = JSON.parse(dataStringified);

        expect(data.features[0].feature).toEqual({modelId:1, featureIds:['1-MultiFeatureModel-feature-0-0']});
        expect(data.features[1].feature).toEqual({modelId:2, featureIds:['2-MultiFeatureModel-feature-1-0']});

        var site = context.featureCollection.toSite();
        expect(site.features.length).toBe(2);
        var expected = geojson().features[0];
        expect(site.features[0].type).toEqual(expected.type);
        expect(site.features[0].geometry).toEqual(expected.geometry);


        expect(site.features[1].type).toEqual(expected.type);
        expect(site.features[1].geometry).toEqual(expected.geometry);

        // Delete the row holding the feature
        var row = multiFeatureModel.features()[0];
        multiFeatureModel.features.removeRow(row);
        row.feature.onDispose(); // This fakes the disposal callback initiated by the component.

        dataStringified = multiFeatureModel.modelAsJSON();
        data = JSON.parse(dataStringified);

        expect(data.features[0].feature).toEqual({modelId:2, featureIds:['2-MultiFeatureModel-feature-1-0']});
        site = context.featureCollection.toSite();
        expect(site.features.length).toBe(1);
        expect(site.features[0].properties.id).toBe('2-MultiFeatureModel-feature-1-0');

    });

    it("Can load features into individual data models from the site associated with the form", function() {
        var data = {
            features: [
                {
                    feature:{modelId:'1', featureIds:['1-MultiFeatureModel-feature-0-0', '1-MultiFeatureModel-feature-0-1']}
                },
                {
                    feature:{modelId:'2', featureIds:['2-MultiFeatureModel-feature-1-0']}
                }
            ]
        };
        var ids = ['1-MultiFeatureModel-feature-0-0', '1-MultiFeatureModel-feature-0-1', '2-MultiFeatureModel-feature-1-0'];
        var features = _.map(ids, featureWithId);
        context.featureCollection = new ecodata.forms.FeatureCollection(features);
        var multiFeatureModel = newModel();
        multiFeatureModel.loadData(data);
        context.featureCollection.loadComplete();

        var dataStringified = multiFeatureModel.modelAsJSON();
        var savedData = JSON.parse(dataStringified);
        expect(savedData.features.length).toEqual(2);
        expect(savedData.features[0]).toEqual({test:'test', feature:data.features[0].feature});
        expect(savedData.features[1]).toEqual({test:'test', feature:data.features[1].feature});

    });

    it("should assign ids to new features starting from the maximum saved id + 1", function() {
        var data = {
            features: [
                {
                    feature:{modelId:12, featureIds:['12-MultiFeatureModel-feature-0-0', '12-MultiFeatureModel-feature-0-1']}
                },
                {
                    feature:{modelId:5, featureIds:['5-MultiFeatureModel-feature-1-0']}
                }
            ]
        };
        var ids = ['12-MultiFeatureModel-feature-0-0', '12-MultiFeatureModel-feature-0-1', '5-MultiFeatureModel-feature-1-0'];
        var features = _.map(ids, featureWithId);
        context.featureCollection = new ecodata.forms.FeatureCollection(features);
        var multiFeatureModel = newModel();
        multiFeatureModel.loadData(data);
        context.featureCollection.loadComplete();

        multiFeatureModel.features.addRow();
        var dataStringified = multiFeatureModel.modelAsJSON();
        var savedData = JSON.parse(dataStringified);
        expect(savedData.features.length).toEqual(3);
        expect(savedData.features[0]).toEqual({test:'test', feature:data.features[0].feature});
        expect(savedData.features[1]).toEqual({test:'test', feature:data.features[1].feature});
        expect(savedData.features[2]).toEqual({test:'test'}); // No data for the feature yet.

        multiFeatureModel.features()[2].feature(polygon());
        dataStringified = multiFeatureModel.modelAsJSON();
        savedData = JSON.parse(dataStringified);

        expect(savedData.features.length).toEqual(3);
        expect(savedData.features[0]).toEqual({test:'test', feature:data.features[0].feature});
        expect(savedData.features[1]).toEqual({test:'test', feature:data.features[1].feature});
        expect(savedData.features[2]).toEqual({test:'test', feature:{modelId:13, featureIds:['13-MultiFeatureModel-feature-2-0']}});

    });

    it("should handle loaded data that does not contain modelIds to support upgrading old forms if necessary", function() {

        // There is saved data in the database with no model ids (from forms saved before v1.11)
        var data = {
            features: [
                {
                    feature:{featureIds:['MultiFeatureModel-feature-0-0', 'MultiFeatureModel-feature-0-1']}
                },
                {
                    feature:{featureIds:['MultiFeatureModel-feature-1-0']}
                }
            ]
        };
        var ids = ['MultiFeatureModel-feature-0-0', 'MultiFeatureModel-feature-0-1', 'MultiFeatureModel-feature-1-0'];
        var features = _.map(ids, function(id, i) {return featureWithId(id, i)});

        // There is an associated site containing these same ids in the feature collection of the site
        context.featureCollection = new ecodata.forms.FeatureCollection(features);

        // Create the view model
        var multiFeatureModel = newModel();

        // Load our saved data
        multiFeatureModel.loadData(data);

        // Let the featureCollection know the load is complete
        context.featureCollection.loadComplete();

        // Check the data returned by each feature model (which is what will be drawn on the page) is what we
        // loaded
        var feature1 = multiFeatureModel.features()[0].feature();
        expect(feature1.features.length).toBe(2);
        expect(feature1.features[0].properties.name).toEqual(0);
        expect(feature1.features[1].properties.name).toEqual(1);

        var feature2 = multiFeatureModel.features()[1].feature();
        expect(feature2.features.length).toBe(1);
        expect(feature2.features[0].properties.name).toEqual(2);
    });

    it("should assign ids to features from old forms saved without model ids if required", function() {

        // There is saved data in the database with no model ids (from forms saved before v1.11)
        var data = {
            features: [
                {
                    feature:{featureIds:['MultiFeatureModel-feature-0-0', 'MultiFeatureModel-feature-0-1']}
                },
                {
                    feature:{featureIds:['MultiFeatureModel-feature-1-0']}
                }
            ]
        };
        var ids = ['MultiFeatureModel-feature-0-0', 'MultiFeatureModel-feature-0-1', 'MultiFeatureModel-feature-1-0'];
        var features = _.map(ids, function(id, i) {return featureWithId(id, i)});
        features[0].properties.originalId = 'originalId';
        // There is an associated site containing these same ids in the feature collection of the site
        context.featureCollection = new ecodata.forms.FeatureCollection(features);

        // Create the view model
        var multiFeatureModel = newModel();

        // Load the saved data into the view model
        multiFeatureModel.loadData(data);

        // Let the featureCollection know the load has finished (the form is responsible for this)
        context.featureCollection.loadComplete();


        // Check the data returned by the features is what we loaded (this is what will be displayed on the page)
        var feature1 = multiFeatureModel.features()[0].feature();
        expect(feature1.features.length).toBe(2);
        expect(feature1.features[0].properties.id).toEqual('1-MultiFeatureModel-feature-0-0');
        expect(feature1.features[0].properties.originalId).toEqual("originalId");
        expect(feature1.features[1].properties.id).toEqual('1-MultiFeatureModel-feature-0-1');

        var feature2 = multiFeatureModel.features()[1].feature();
        expect(feature2.features.length).toBe(1);
        expect(feature2.features[0].properties.id).toEqual('2-MultiFeatureModel-feature-1-0');


        // Simulate a save or dirty check
        var dataStringified = multiFeatureModel.modelAsJSON();
        var savedData = JSON.parse(dataStringified);

        // Expect that the data to be saved now will have been assigned model ids (and the associated feature ids
        // include the model ids).
        expect(savedData.features.length).toEqual(2);
        expect(savedData.features[0]).toEqual({test:'test', feature:{modelId:1, featureIds:['1-MultiFeatureModel-feature-0-0', '1-MultiFeatureModel-feature-0-1']}});
        expect(savedData.features[1]).toEqual({test:'test', feature:{modelId:2, featureIds:['2-MultiFeatureModel-feature-1-0']}});


    });
});