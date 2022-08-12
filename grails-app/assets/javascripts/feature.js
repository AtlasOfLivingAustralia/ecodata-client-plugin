/*
import ko from 'knockout';
import geojson2svg from 'geojson2svg';
import area from '@turf/area';
import length from '@turf/length';
import bbox from '@turf/bbox';
*/

if (!window.ecodata) {
    ecodata = {};
}
if (!ecodata.forms) {
    ecodata.forms = {};
}
if (!ecodata.forms.maps) {
    ecodata.forms.maps = {};
}

/** The google mutant leaflet plugin uses ES6 Map and Symbol so excludes IE11 */
function supportsGoogleMutant() {
    return _.isFunction(Map) && _.isFunction(Symbol);
}

/**
 * This knockout extender adds utility
 * @param target
 * @param options
 */
ko.extenders.feature = function (target, options) {

    var SQUARE_METERS_IN_HECTARE = 10000;
    function m2ToHa(areaM2) {
        return areaM2 / SQUARE_METERS_IN_HECTARE;
    }

    target.areaHa = function () {
        var geojson = ko.utils.unwrapObservable(target());
        if (!geojson) {
            return 0;
        }
        var areaInM2 = turf.area(geojson);
        return m2ToHa(areaInM2);
    };

    target.lengthKm = function () {
        var geojson = ko.utils.unwrapObservable(target());
        if (!geojson) {
            return 0;
        }
        return turf.length(geojson, {units: 'kilometers'});
    };

    function toFeatureCollection(geoJson) {
        var featureCollection;
        if (geoJson.type == 'FeatureCollection') {
            featureCollection = geoJson;
        }
        else if (geoJson.type == 'Feature') {
            featureCollection = {
                type:'FeatureCollection',
                features:[geoJson]
            }
        }
        else {
            featureCollection = {
                type:'FeatureCollection',
                features:[{
                    type:'Feature',
                    geometry: geoJson
                }]
            }
        }
        return featureCollection;
    }

    var result = ko.computed({
        read: function () {
            var geojson = target();
            // This is so we can return valid geojson, but when it comes time to serialize the model
            // for saving, we have the option of using the FeatureCollection to store the JSON and
            // just reference it here.
            if (geojson && result.toJSON) {
                geojson.toJSON = result.toJSON;
            }
            return geojson;
        },
        write: function (geojson) {
            if (!geojson || !geojson.type) {
                target(null);
            }
            else {
                // We always store data as a FeatureCollection so that we can support different
                // geometry types.
                var featureCollection = toFeatureCollection(geojson);
                target(featureCollection);
            }
        }
    });

    if (options.featureCollection) {
        options.featureCollection.registerFeature(result);

        /**
         * This callback is invoked when the component this model is bound to is disposed, which happens when
         * a section or table row is deleted.  It is used to remove this model from the activity featureCollection.
         */
        target.onDispose = function() {
            options.featureCollection.deregisterFeature(result);
        };
    }
    else {
        target.loadData = function(data) {
            result(data);
        }
    }
    // Copy the utilities and any augmentations done in earlier extenders into the return value.
    _.defaults(result, target);

    return result;

};


/**
 * Produces an svg drawing of the supplied geojson and adds it as a child element to the bound container.
 * The svg will take the size of the container.
 */
ko.bindingHandlers.geojson2svg = {
    update: function (element, valueAccessor) {
        var geojson = ko.utils.unwrapObservable(valueAccessor());
        var pointBuffer = 0.1;
        if (geojson) {

            var $element = $(element);
            var width = $element.width() || 100;
            var height = $element.height() || 100;

            var bounds = turf.bbox(geojson);
            var newbounds = [0,0,0,0];

            // Buffer the bounding box so the site is not drawn right on the edge of the canvas.
            var w = bounds[2] - bounds[0];
            var buffer = w != 0 ? w * 0.1 : pointBuffer;
            newbounds[0] = bounds[0] - buffer;
            newbounds[2] = bounds[2] + buffer;

            var h = bounds[3] - bounds[1];
            buffer = h != 0 ? h * 0.1 : pointBuffer;
            newbounds[1] = bounds[1] - buffer;
            newbounds[3] = bounds[3] + buffer;

            var s = geojson2svg({
                viewportSize: {width: width, height: height},
                pointToCircle: true,
                r:2,
                mapExtent: {left: newbounds[0], right: newbounds[2], bottom: newbounds[1], top: newbounds[3]}
            }).convert(geojson);

            $element.html('<svg xmlns="http://www.w3.org/2000/svg"  width="' + width + '" height="' + height + '" x="0" y="0">' + s + '</svg>');
        }

    }
};

/**
 * Extends the ALA.Map to provide feature selection functionality.
 * TODO needs to be fixed to no longer be a half singleton / half constructor...
 *
 * @returns {ecodata.forms.maps}
 */
ecodata.forms.maps.featureMap = function (options) {

    var self = this;
    var DRAWN_LAYER_STYLE = {
        weight: 4,
        fillOpacity: 0.2,
        color: "#f00"
    };
    var PLANNING_LAYER_STYLE = {
        weight: 4,
        fillOpacity: 0.2,
        color: "#0f0"
    };



    function initialise(options) {
        self.editableSites = ko.observableArray();
        var defaults = {
            mapElementId: 'map-holder',
            selectFromSitesOnly: false,
            allowPolygons: true,
            allowPoints: false,
            markerOrShapeNotBoth: true,
            hideMyLocation: false,
            baseLayersName: 'Open Layers',
            showReset: true,
            singleMarker: false,
            zoomToObject: true,
            markerZoomToMax: true,
            singleDraw: false,
            selectedStyle: {},
            displayScale: true,
            shapeOptions: {
                color: '#f00',
                fillOpacity: 0.2,
                weight: 4
            }
        };
        var config = _.defaults(options, defaults);
        var mapOptions = _.extend(config, {
            wmsFeatureUrl: config.proxyFeatureUrl + "?featureId=",
            wmsLayerUrl: config.spatialGeoserverUrl + "/wms/reflect?",
            drawControl: !config.readonly,
            useMyLocation: config.userMyLocation,
            allowSearchLocationByAddress: !config.readonly,
            allowSearchRegionByAddress: false,
            drawOptions: config.readonly ?
                {
                    polyline: false,
                    polygon: false,
                    rectangle: false,
                    circle: false,
                    edit: false
                }
                :
                {
                    polyline: !config.selectFromSitesOnly && config.allowPolygons,
                    polygon: !config.selectFromSitesOnly && config.allowPolygons ? {
                        allowIntersection: false,
                        shapeOptions: config.shapeOptions
                    } : false,
                    circle: false,
                    rectangle: !config.selectFromSitesOnly && config.allowPolygons,
                    marker: !config.selectFromSitesOnly && config.allowPoints,
                    edit: !config.selectFromSitesOnly
                }
        });


        // undefined/null, Google Maps or Default should enable Google Maps view
        if (config.baseLayersName !== 'Open Layers' && supportsGoogleMutant()) {
            var googleLayer = L.gridLayer.googleMutant({maxZoom: 21, nativeMaxZoom: 21, type:'roadmap'});
            var otherLayers = {
                Roadmap: googleLayer,
                Hybrid: L.gridLayer.googleMutant({maxZoom: 21, nativeMaxZoom: 21, type:'hybrid'}),
                Terrain: L.gridLayer.googleMutant({maxZoom: 21, nativeMaxZoom: 21, type:'terrain'})
            };

            mapOptions.baseLayer = googleLayer;
            mapOptions.otherLayers = otherLayers;
        }


        ALA.Map.call(self, mapOptions.mapElementId, mapOptions);

        self.getMapImpl().eachLayer(function (layer) {
            if (layer instanceof L.FeatureGroup) {
                self.drawnItems = layer;
            }
        });

        if (config.displayScale) {
            L.control.scale({metric: true, imperial: false}).addTo(self.getMapImpl());
        }

        self.editableSitesHeading = options.editableSitesHeading || 'Site/s for this service';
        self.categories = ko.observableArray();
        if (options.selectableFeatures) {
            self.selectableFeatures = options.selectableFeatures;
            self.configureSelectionLayer(self.selectableFeatures);
        }

        self.drawnItems.on({
            'layeradd': function (e) {

                var layer = e.layer;
                if (layer.setStyle) {
                    layer.setStyle(DRAWN_LAYER_STYLE);
                }

                var name = ko.observable('New works area');
                if (layer.feature && layer.feature.properties && layer.feature.properties.name) {
                    name(layer.feature.properties.name);
                }
                var feature = {properties: {name: name}, layer: layer};
                if (!layer.feature){
                    var geoJson = layer.toGeoJSON();
                    geoJson.properties.name = name();
                    layer.feature = geoJson;
                }
                name.subscribe(function(){
                    layer.feature.properties.name = name();
                });
                self.editableSites.push(feature);

            }
        });

        self.areaHa = ko.observable(0).extend({numericString:2});
        self.lengthKm = ko.observable(0).extend({numericString:2});

        function updateStatistics() {
            var geoJson = self.drawnItems.toGeoJSON();
            self.areaHa(ecodata.forms.utils.areaHa(geoJson));
            self.lengthKm(ecodata.forms.utils.lengthKm(geoJson, true));
        }

        self.editableSites.subscribe(function() {
            updateStatistics();
        });

        var editStartEvents = ["draw:editstart", "draw:drawstart", "draw:deletestart"];
        var editStopEvents = ["draw:editstop", "draw:deletestop", "draw:drawstop"];

        self.editing = ko.observable(false);
        _.each(editStartEvents, function (e) {
            self.getMapImpl().on(e, function() {
                self.editing(true);
            });
        });
        _.each(editStopEvents, function (e) {
            self.getMapImpl().on(e, function() {
                self.editing(false);
                updateStatistics();
            });
        });

        self.getMapImpl().on("draw:deleted", function(e) {
            var layer = e.layers;
            var toDelete = [];
            _.each(self.editableSites(), function(site) {
                if (layer._layers[site.layer._leaflet_id]) {
                    toDelete.push(site);
                }
            });
            if (toDelete.length > 0) {
                self.editableSites.removeAll(toDelete);
            }
        });

        return self;
    }

    self.copyFeature = function (feature) {
        feature = turf.clone(feature);
        if (feature.geometry && feature.geometry.coordinates && feature.geometry.type == 'MultiPolygon') {
            // Split to polygons as the leaflet draw plugin doesn't support MultiPolygons.
            // This also allows the user to delete each part separately if desired.
            for (var i=0; i<feature.geometry.coordinates.length; i++) {
                var polygon = {
                    type:'Feature',
                    properties:_.clone(feature.properties),
                    geometry: {
                        type:'Polygon',
                        coordinates:feature.geometry.coordinates[i]
                    }
                };
                self.setGeoJSON(polygon);
            }
        }
        else {
            self.setGeoJSON(feature);
        }

    };

    self.copyEnabled = function(feature) {
        var type = feature.type;
        return type != 'Point' && type != 'MultiPoint';
    };

    self.unhighlightFeature = function (feature) {
        var layer = feature.layer;

        if (layer.setStyle) {


            if (self.selectableSitesLayer && self.selectableSitesLayer.hasLayer(layer)) {
                self.selectableSitesLayer.resetStyle(layer);
            }
            else {
                var options = layer.options;
                if (options && layer.setStyle) {
                    var style = {
                        weight: options.weight / 3,
                        fillOpacity: 0.2,
                        color: options.color
                    };
                    layer.setStyle(style);
                }

            }
        }
        else if (layer.options && layer.options.icon) {
            var icon = layer.options.icon;
            icon.options.iconSize = [icon.options.iconSize[0]/1.5, icon.options.iconSize[1]/1.5];
            icon.options.iconAnchor = [icon.options.iconAnchor[0]/1.5, icon.options.iconAnchor[1]/1.5];
            feature.layer.setIcon(icon);
        }

    };

    self.highlightFeature = function (feature) {
        var options = feature.layer.options;
        if (!options) {
            return;  // TODO Known shapes don't have options
        }
        if (feature.layer.setStyle) {

            var style = {
                weight: options.weight * 3,
                fillOpacity: 1,
                color: options.color
            };
            feature.layer.setStyle(style);
            if (feature.layer.bringToFront()) {
                feature.layer.bringToFront();
            }
        }
        else if (options.icon) {
            var icon = options.icon;
            icon.options.iconSize = [icon.options.iconSize[0]*1.5, icon.options.iconSize[1]*1.5];
            icon.options.iconAnchor = [icon.options.iconAnchor[0]*1.5, icon.options.iconAnchor[1]*1.5];
            feature.layer.setIcon(icon);
        }
    };

    self.zoomToFeature = function (feature) {
        var layer = feature.layer;
        var boundsContainer = layer;
        if (!layer.getBounds) {
            boundsContainer = new L.FeatureGroup();
            boundsContainer.addLayer(layer);
        }
        map.getMapImpl().fitBounds(boundsContainer.getBounds());
    };
    self.deleteFeature = function (feature) {
        map.drawnItems.removeLayer(feature.layer);
        self.editableSites.remove(feature);

    };

    self.editSites = function () {

        map.drawnItems.bringToFront();
        map.drawnItems.eachLayer(function (layer) {
            if (layer.bringToFront) {
                layer.bringToFront();
            };
        });
        self.selectableSitesLayer.bringToBack();

        // this is gross hack around the map plugin not giving access to the Draw Control
        var event = document.createEvent('Event');
        event.initEvent('click', true, true);
        var cb = document.getElementsByClassName('leaflet-draw-edit-edit');
        !cb[0].dispatchEvent(event);
    };

    self.zoomToDrawnSites = function () {
        map.fitBounds();
    };

    self.zoomToCategorySites = function(category) {

        var group = new L.featureGroup();
        _.each(category.features || [], function(feature) {
            if (feature.layer) {
                group.addLayer(feature.layer);
            }
        });
        self.getMapImpl().fitBounds(group.getBounds());
    };

    self.defaultZoom = function() {
        if (self.drawnItems.getLayers().length > 0) {
            self.fitBounds();
        }
        else if (self.selectableSitesLayer) {
            var bounds = self.selectableSitesLayer.getBounds();
            if (bounds && bounds.isValid()) {
                self.getMapImpl().fitBounds(bounds);
            }

        }
    };

    self.clearDrawnItems = function() {
        self.resetMap();
        self.editableSites([]);
    };

    self.configureSelectionLayer = function (selectableFeatures) {

        if (selectableFeatures) {

            _.each(selectableFeatures, function (feature) {
                if (feature.properties && feature.properties.name) {
                    self.categories.push({category: feature.properties.name, features: feature.features});
                }
            });
            self.selectableSitesLayer = L.geoJson(selectableFeatures,
                {
                    style: PLANNING_LAYER_STYLE,
                    onEachFeature: function (f, layer) {
                        f.layer = layer;
                    }
                }
            );
            self.selectableSitesLayer.addTo(self.getMapImpl());
        }
    };

    var mapKey = 'featureMap';
    var $mapStorage = $('body');
    var map = $mapStorage.data(mapKey);

    if (!map) {
        map = initialise(options);
        $mapStorage.data(mapKey, map);
    }

    return self;

};

/**
 * Displays the modal identified by mapPopupSelector which is expected to be the _mapInDialogEditTemplate or
 * _mapInDialogViewTemplate and attaches a callback to the OK button.
 * This function maintains a single instance of the featureMap.
 *
 * @param options {mapPopupSelector:, mapElementId, okCallback}
 * @returns {ecodata.forms|*}
 */
ecodata.forms.maps.showMapInModal = function(options) {
    var self = this;

    var defaults = {
        mapPopupSelector: '#map-modal',
        editingMessageSelector: '#editing-in-progress-reminder', // shown when the user tries to press OK in the middle of an edit/delete operation
        mapElementId: 'map-holder' // Needed to size the map....
    };

    var config = _.defaults(defaults, options);

    var $modal = $(config.mapPopupSelector);
    var $mapElement = $('#' + config.mapElementId);


    if (!self.featureMapInstance) {
        self.featureMapInstance = ecodata.forms.maps.featureMap(config);
        $(window).on('hashchange', function () {
            // This is to have the back button close the modal.
            if(window.location.hash != mapHash) {
                $modal.modal('hide');
            }
        });
    }

    function sizeMap() {
        // Set the map to fit the screen.  The full screen modal plugin will have set the max-height
        // on the modal-body, use that to set the map height.
        var $body = $modal.find('.modal-body');
        var maxHeight = $body.css('max-height');
        var height = Number(maxHeight.substring(0, maxHeight.length - 2));
        if (!height) {
            height = $body.innerHeight();
        }
        $mapElement.height(height - 20);
    }
    var mapHash = '#map';
    var $ok = $modal.find('.btn-primary');

    function okPressed() {
        if (self.featureMapInstance.editing()) {
            var message = $(config.editingMessageSelector).html();

            var $leafletDrawActions = $('.leaflet-draw-actions');

            var oldborder = $leafletDrawActions.css('border');
            $leafletDrawActions.css('border', '4px red solid');

            bootbox.alert(message, function() {
                $leafletDrawActions.css('border', oldborder);
            });
            // re-add the event listener as we didn't close the dialog.
            $ok.one('click', okPressed);
        }
        else {
            if (options.okCallback) {
                options.okCallback(self.featureMapInstance);
            }
            $modal.modal('hide');
        }
    }
    $ok.one('click', okPressed);

    $modal.one('shown.bs.modal', function (e) {

        // This check is necessary because the accordion also fires these events which bubble to the modal.
        if (e.target == this) {
            sizeMap();

            // This is setting up a history entry so the back button can close the modal.
            window.location.hash = mapHash;
            self.featureMapInstance.redraw();

            if (_.isFunction(options.shownCallback)) {
                options.shownCallback(self.featureMapInstance);
            }
            self.featureMapInstance.defaultZoom();
        }

    })
    .one('hidden.bs.modal', function (e) {
        // This check is necessary because the accordion also fires these events which bubble to the modal.
        if (e.target == this) {
            self.featureMapInstance.clearDrawnItems();
        }
        if (window.location.hash == mapHash) {
            // If the map was closed with a button (rather than back), clear the map history entry.
            window.history.back();
        }

    }).modal();

    return self.featureMapInstance;
};

/**
 * A FeatureCollection is responsible for managing the lifecycle and data
 * of model elements with the dataType of 'feature'.
 * It's purpose is to allow a single site to be created from all of the
 * geographic data entered into the form.  The specific use case is
 * MERIT RLP output reporting where users report different areas where different
 * activities have been performed in a single activity form.
 *
 * The feature dataType when used in an activity form has the lifecycle:
 * - register
 * - load -> reassign ids to features with saved data
 * - change.. 1..n -> assign ids to new features
 * - save
 *
 * In the case of multiple features in form or table, multiple features may
 * be registered before any are loaded.
 *
 * @param features
 * @constructor
 */
ecodata.forms.FeatureCollection = function (features) {
    var self = this;
    // Tracks the maximum id assigned to a model
    var maxId = 0;
    // Tracks the individual feature data types that contribute to the collection
    var featureModels = [];

    var legacyModelData = [];

    // It's not safe to assign ids to new features until we have
    // finished the load so we need to be notified when the load is complete.
    var loadComplete = false;

    function assignModelId(featureModel) {
        maxId++;
        featureModel.modelId = maxId;
        return maxId;
    }

    function assignFeatureIds(featureModel) {

        var featureCollection = featureModel();
        if (featureCollection && featureCollection.features) {

            if (!featureModel.modelId) {
                throw "Attempted to assign a feature id to a feature belonging to a model with no id!";
            }

            var featureId = featureModel.modelId + "-";
            if (_.isFunction(featureModel.getId)) {
                featureId += featureModel.getId()+'-';
            }

            _.each(featureCollection.features, function(feature, i) {
                if (!feature.properties) {
                    feature.properties = {};
                }
                if (!feature.properties.originalId) {
                    feature.properties.originalId = feature.properties.id;
                }
                feature.properties.id = featureId+i;
            });
        }

    }

    self.loadComplete = function() {

        // Do the update after the load so as to ensure the models are marked as
        // dirty.
        _.each(legacyModelData, function(data) {
            var id = assignModelId(data.model);
            _.each(data.features || [], function(feature) {
                feature.properties.id = id+"-"+feature.properties.id;
            });
        });

        loadComplete = true;

        // Notify subscribers of the change.
        _.each(legacyModelData, function(data) {
            data.model.notifySubscribers();
        });
        legacyModelData = [];

    };

    self.loadDataForFeature = function(featureModel, data) {

        if (!data) {
            return;
        }
        var featureIds = data.featureIds || [];
        var featuresForModel = _.filter(features, function (feature) {
            if (feature.properties && feature.properties.id) {
                return _.indexOf(featureIds, feature.properties.id) >= 0;
            }
            return false;
        });

        if (data.modelId) {
            maxId = data.modelId > maxId ? data.modelId : maxId;
            featureModel.modelId = data.modelId;
        }
        else {
            // Legacy situation = we have data but not an id.
            // Store the details to "fix" after the load is complete.  It
            // has to be done after the dirty flag is reset or the changed
            // features will not be saved (unless other edits are made to the same outputs)
            legacyModelData.push({model:featureModel, features:featuresForModel});
        }

        var geoJson = null;
        if (featuresForModel.length > 0) {
            geoJson = {
                type:'FeatureCollection',
                features: featuresForModel
            };
        };
        featureModel(geoJson);
    };

    self.saveDataForFeature = function(featureModel) {
        var featureCollection = featureModel();

        if (!featureCollection) {
            return;
        }

        if (loadComplete && !featureModel.modelId) {
            // This shouldn't be possible, but it could be a dirty check
            // somehow triggers this?
            console.log("Attempted to save featureModel with no id");
            console.log(featureModel);
            throw "Attempted to save featureModel with no id";
        }

        var featureIds = [];
        if (featureCollection) {
            featureIds = _.map(featureCollection.features, function(feature) {
                return feature.properties.id;
            });
        }

        return {
            modelId: featureModel.modelId,
            featureIds: featureIds
        };
    };

    self.featureChanged = function(featureModel) {
        var featureCollection = featureModel();

        // Check if we need to assign ids to our features if/when they change.
        if (loadComplete && featureCollection && featureCollection.features) {
            // if we don't have a model id, assign one now.
            if (!featureModel.modelId) {
                assignModelId(featureModel);
            }
            assignFeatureIds(featureModel);
        }
    };

    self.registerFeature = function (featureModel) {
        featureModels.push(featureModel);
        featureModel.loadData = function(data) { self.loadDataForFeature(featureModel, data) };
        featureModel.toJSON = function() { return self.saveDataForFeature(featureModel) };
        featureModel.subscribe(function(newValue) {
            self.featureChanged(featureModel);
        });
    };

    self.deregisterFeature = function(feature) {
        featureModels = _.without(featureModels, feature);
    };

    self.savedFeatures = function() {
        return features;
    };

    /**
     * Returns the superset of the originally supplied features, and any features that have been added or
     * modified by the supplied feature models.
     * @returns {*}
     */
    self.allFeatures = function () {
        return _.flatten(
            _.map(featureModels, function (feature) {
                var geojson = ko.utils.unwrapObservable(feature);
                return geojson ? geojson.features : [];
            }));
    };


    self.isDirty = function () {
        return _.difference(self.allFeatures(), features).length > 0;
    };

    /**
     * Creates an object in the format of an ecodata site based on the supplied data and the features.
     *
     * @returns {{siteId: *, name: *, type: string, extent: {geometry: *, type: string}, features: *}}
     */
    self.toSite = function (site) {

        var featureGeoJson = {type: 'FeatureCollection', features: self.allFeatures()};
        var extent = null;
        if (featureGeoJson.features.length > 0) {
            extent = turf.convex(featureGeoJson);
        }

        return _.extend(site || {}, {
            type: 'compound',
            extent: {geometry: (extent && extent.geometry), source: 'drawn'},
            features: featureGeoJson.features
        });
    };

};
