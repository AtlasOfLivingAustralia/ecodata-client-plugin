function resolveSites(sites) {
    return sites;
}

function Emitter(viewModel) {
    viewModel.emit = function () {

    };
}

describe("Enmapify Spec", function () {

    var mockElement = null;
    var options = null;
    beforeEach(function () {
        window.Biocollect = {
            "MapUtilities": {
                "getBaseLayerAndOverlayFromMapConfiguration": function () {
                    return {};
                },
                "featureToValidGeoJson": function (geometry) {
                    var pointGeoJSON =  {"type":"Feature","geometry":{"type":"Point","coordinates":[1,1]},"properties":{}};
                    var lineGeoJSON = {"type":"Feature","geometry":{"type":"LineString","coordinates":[[1,1]]},"properties":{}};
                    var circleGeoJSON = {"type":"Feature","geometry":{"type":"Point","coordinates":[142.38647371530533,-24.55378515626474]},"properties":{"point_type":"Circle","radius":31597.605228685392}};
                    var pidPointGeoJSON = {"type":"Feature","geometry":{"type":"Point","coordinates":["143","-35"]},"properties":{"pid":600}};
                    var pidPolygonGeoJSON = {"type":"Feature","geometry":{"type":"Polygon","coordinates":[]},"properties":{"pid":620}};
                    switch (geometry.type) {
                        case "point":
                            return  pointGeoJSON;
                        case "linestring":
                            return lineGeoJSON;
                        case "circle":
                            return circleGeoJSON;
                        case "pid":
                            switch (geometry.aream2) {
                                case 0:
                                    return pidPointGeoJSON;
                                default:
                                    return pidPolygonGeoJSON;
                            }
                    }
                }
            },
            "Modals": {
                "showModal":function(){return $.Deferred()}
            }
        };

        window.fcConfig = {};
        window.ALA = {
            "Map": function () {
                return {
                    subscribe: function () {
                    },
                    markMyLocation: function () {
                    },
                    getGeoJSON: function () {
                    },
                    registerListener: function () {
                    },
                    addButton: function () {
                    },
                    addMarker: function () {
                    },
                    startLoading: function(){},
                    finishLoading: function(){},
                    clearLayers: function(){},
                    clearBoundLimits: function(){},
                    setGeoJSON: function(){},
                    fitToBoundsOf: function(){},
                    getGeoJSON: function () {
                        return {
                            features: [{
                                properties: {},
                                geometry: {
                                    "type": "Point",
                                    "coordinates": [
                                        143.1205701828002930,
                                        -18.3232404604433903
                                    ]
                                }
                            }]
                        };
                    }
                }
            },
            "MapConstants": {
                /**
                 * Types of drawing objects
                 */
                DRAW_TYPE: {
                    POINT_TYPE: "Point",
                    CIRCLE_TYPE: "Circle",
                    POLYGON_TYPE: "Polygon",
                    LINE_TYPE: "LineString"
                },

                /**
                 * Types of layers
                 */
                LAYER_TYPE: {
                    MARKER: "marker"
                }
            },
            "MapUtils": {
                "calculateAreaKmSq": function(){}
            }
        };

        window.blockUIWithMessage = function() {}
        window.$.unblockUI = function(){}
        window.bootbox = {alert: function(){},confirm: function(){}}

        options = {
            viewModel: {mapElementId: "map"}
            , container: {"Test": "ghh"}
            , name: "Test"
            , edit: true
            , readonly: false
            , markerOrShapeNotBoth: true
            , proxyFeatureUrl: ''
            , spatialGeoserverUrl: ''
            , updateSiteUrl: ''
            , listSitesUrl: ''
            , getSiteUrl: ''
            , checkPointUrl: ''
            , uniqueNameUrl: ''
            , activityLevelData: {
                pActivity: {
                    name: 'Test',
                    projectId: 'abc',
                    projectActivityId: 'def',
                    defaultZoomArea: 'aaa',
                    sites: [{
                        siteId: "ghh",
                        extent: {
                            geometry: {
                                type: "point",
                                coordinates: [1, 1]
                            }
                        }
                    },
                    {
                        siteId: "site2",
                        extent: {
                            geometry: {
                                type: "linestring",
                                coordinates: [[1, 1]]
                            }
                        }
                    },
                    {
                        siteId: "site3",
                        extent: {
                            geometry: {
                                type: "circle",
                                coordinates: [1, 1]
                            }
                        }
                    },
                    {
                        extent: {
                            geometry: {
                                centre: ["143", "-35"],
                                aream2: 0,
                                pid: 600,
                                type: "pid"
                            },
                            source: "pid"
                        },
                        name: "site 4",
                        siteId: "site4",
                        status: "active"
                    },
                    {
                        extent : {
                            source : "pid",
                            geometry : {
                                pid : 620,
                                type : "pid",
                                aream2 : 103
                            }
                        },
                        name : "site 5",
                        siteId : "site5"
                    }],
                    allowPolygons: true,
                    allowPoints: true,
                    allowLine: true,
                    selectFromSitesOnly: false,
                    surveySiteOption: 'sitecreate',
                    addCreatedSiteToListOfSelectedSites: undefined
                },
                project: {
                    projectId: 'abc',
                    projectSiteId: 'ghh',
                    sites: [
                        {
                            siteId: "ghh",
                            extent: {
                                geometry: {
                                    type: "point",
                                    coordinates: [1, 1]
                                }
                            }
                        },
                        {
                            siteId: "site2",
                            extent: {
                                geometry: {
                                    type: "polygon",
                                    coordinates: [1, 1]
                                }
                            }
                        },
                        {
                            siteId: "site3",
                            extent: {
                                geometry: {
                                    type: "circle",
                                    coordinates: [1, 1]
                                }
                            }
                        },
                        {
                            extent: {
                                geometry: {
                                    centre: ["143", "-35"],
                                    aream2: 0,
                                    pid: 600,
                                    type: "pid"
                                },
                                source: "pid"
                            },
                            geoIndex: {
                                type: "Point",
                                coordinates: [143, -35]
                            },
                            name: "site 4",
                            siteId: "site4",
                            status: "active"
                        },
                        {
                            extent : {
                                source : "pid",
                                geometry : {
                                    pid : 620,
                                    type : "pid",
                                    aream2 : 103
                                }
                            },
                            name : "site 5",
                            siteId : "site5"
                        }
                    ]
                },
                siteId: 'ghh',
                activity: {
                    siteId: 'ghh'
                }
            }
            , hideSiteSelection: false
            , hideMyLocation: false
            , context: {}
        };
        mockElement = document.createElement('div');
        mockElement.setAttribute('id', 'map');
    });

    it("when config is to pick from a list of pre-defined sites, then map config should not show drawing controls", function () {
        options.activityLevelData.pActivity.allowPolygons = false;
        options.activityLevelData.pActivity.allowLine = false;
        options.activityLevelData.pActivity.allowPoints = false;
        options.activityLevelData.pActivity.surveySiteOption = 'sitepick';
        options.activityLevelData.pActivity.addCreatedSiteToListOfSelectedSites = true;

        var result = enmapify(options);
        expect(result.mapOptions.drawOptions.polygon).toBe(false);
        expect(result.mapOptions.drawOptions.marker).toBe(false);
        expect(result.mapOptions.drawOptions.polyline).toBe(false);
        expect(result.mapOptions.drawOptions.rectangle).toBe(false);
        expect(result.mapOptions.drawOptions.circle).toBe(false);
        expect(result.mapOptions.drawOptions.edit).toBe(false);
    });

    it("when config is to allow user to create site and not to pick from pre-defined list, then map config should show drawing controls", function () {
        options.activityLevelData.pActivity.allowPolygons = true;
        options.activityLevelData.pActivity.allowPoints = true;
        options.activityLevelData.pActivity.allowLine = false;
        options.activityLevelData.pActivity.surveySiteOption = 'sitecreate';
        options.activityLevelData.pActivity.sites = [];
        options.activityLevelData.pActivity.addCreatedSiteToListOfSelectedSites = false;

        var result = enmapify(options);
        expect(result.mapOptions.drawOptions.polygon).toEqual(jasmine.any(Object));
        expect(result.mapOptions.drawOptions.marker).toBe(true);
        expect(result.mapOptions.drawOptions.polyline).toBe(false);
        expect(result.mapOptions.drawOptions.rectangle).toBe(true);
        expect(result.mapOptions.drawOptions.circle).toBe(true);
        expect(result.mapOptions.drawOptions.edit).toBe(true);

        options.activityLevelData.pActivity.allowPolygons = false;
        options.activityLevelData.pActivity.allowPoints = false;
        options.activityLevelData.pActivity.allowLine = true;
        options.activityLevelData.pActivity.surveySiteOption = 'sitecreate';
        options.activityLevelData.pActivity.sites = [];
        options.activityLevelData.pActivity.addCreatedSiteToListOfSelectedSites = false;

        result = enmapify(options);
        expect(result.mapOptions.drawOptions.polygon).toEqual(false);
        expect(result.mapOptions.drawOptions.marker).toBe(false);
        expect(result.mapOptions.drawOptions.polyline).toBe(true);
        expect(result.mapOptions.drawOptions.rectangle).toBe(false);
        expect(result.mapOptions.drawOptions.circle).toBe(false);
        expect(result.mapOptions.drawOptions.edit).toBe(true);

    });

    it("when config is to allow user to create site and to pick from pre-defined list, then map config should show drawing controls", function () {
        options.activityLevelData.pActivity.allowPolygons = true;
        options.activityLevelData.pActivity.allowPoints = true;
        options.activityLevelData.pActivity.allowLine = true;
        options.activityLevelData.pActivity.selectFromSitesOnly = true;
        options.activityLevelData.pActivity.surveySiteOption = 'sitepickcreate';
        options.activityLevelData.pActivity.addCreatedSiteToListOfSelectedSites = true;

        var result = enmapify(options);
        expect(result.mapOptions.drawOptions.polygon).toEqual(jasmine.any(Object));
        expect(result.mapOptions.drawOptions.marker).toBe(true);
        expect(result.mapOptions.drawOptions.polyline).toBe(true);
        expect(result.mapOptions.drawOptions.rectangle).toBe(true);
        expect(result.mapOptions.drawOptions.circle).toBe(true);
        expect(result.mapOptions.drawOptions.edit).toBe(true);
    });

    it("site selection should be visible or invisible according to the number of sites selected", function () {
        options.activityLevelData.pActivity.surveySiteOption = 'sitepick';
        options.activityLevelData.pActivity.sites = ['abc'];

        var result = enmapify(options);
        expect(result.hideSiteSelection()).toEqual(true);

        options.activityLevelData.pActivity.surveySiteOption = 'sitecreate';
        options.activityLevelData.pActivity.sites = ['abc'];

        result = enmapify(options);
        expect(result.hideSiteSelection()).toEqual(false);
    });

    it("map should validate if site id is set", function () {
        options.activityLevelData.activity.siteId = "ghh";
        var result = enmapify(options);
        result.viewModel.loadActivitySite();
        expect(result.checkMapInfo().validation).toEqual(true);

        options.activityLevelData.activity.siteId = "";
        var result = enmapify(options);
        result.viewModel.loadActivitySite();
        expect(result.checkMapInfo().validation).toEqual(false);
    });

    it("should show latitude, longitude and centroid latitude and centroid longitude depending on current site selected", function () {
        var result = enmapify(options);
        result.viewModel.loadActivitySite();
        expect(result.viewModel.transients.showCentroid()).toEqual(false);
        expect(result.viewModel.transients.showPointLatLon()).toEqual(true);

        options.activityLevelData.activity.siteId = "site2";
        result = enmapify(options);
        result.viewModel.loadActivitySite();
        expect(result.viewModel.transients.showCentroid()).toEqual(true);
        expect(result.viewModel.transients.showPointLatLon()).toEqual(false);

        // test circle
        options.activityLevelData.activity.siteId = "site3";
        result = enmapify(options);
        result.viewModel.loadActivitySite();
        expect(result.viewModel.transients.showCentroid()).toEqual(true);
        expect(result.viewModel.transients.showPointLatLon()).toEqual(false);

        // test point with pid
        options.activityLevelData.activity.siteId = "site4";
        result = enmapify(options);
        result.viewModel.loadActivitySite();
        expect(result.viewModel.transients.showCentroid()).toEqual(false);
        expect(result.viewModel.transients.showPointLatLon()).toEqual(true);

        // test polygon with pid
        options.activityLevelData.activity.siteId = "site5";
        result = enmapify(options);
        result.viewModel.loadActivitySite();
        expect(result.viewModel.transients.showCentroid()).toEqual(true);
        expect(result.viewModel.transients.showPointLatLon()).toEqual(false);

    });

    it("centroid for line should be the first coordinate", function () {
        var result = enmapify(options);
        var line = {
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [
                        143.1205701828002930,
                        -18.3232404604433903
                    ],
                    [
                        143.2633924484252930,
                        -18.1536815535150886
                    ],
                    [
                        143.6753797531127930,
                        -18.0414212218919410
                    ],
                    [
                        143.8676404953002930,
                        -18.0884226646362016
                    ]
                ]
            }
        }

        var centroid = result.centroid(line);

        expect(centroid[0]).toEqual(143.1205701828002930);
        expect(centroid[1]).toEqual(-18.3232404604433903);
    });

    it("addMarker function should create site", function () {
        var result = enmapify(options);
        var resp = result.viewModel.addMarker({decimalLatitude: -18.3232404604433903, decimalLongitude: 143.1205701828002930});
        expect(resp).toEqual(false);

        options.activityLevelData.pActivity.surveySiteOption = 'sitepickcreate';
        options.activityLevelData.pActivity.addCreatedSiteToListOfSelectedSites = true;
        result = enmapify(options);
        resp = result.viewModel.addMarker({decimalLatitude: -18.3232404604433903, decimalLongitude: 143.1205701828002930});
        expect(resp).toEqual(true);
    });

    it("showMyLocationAndLocationByAddress should be hidden or shown by map configuration", function () {

        var result = enmapify(options);
        var resp = result.showMyLocationAndLocationByAddress();
        expect(resp).toEqual(true);

        options.activityLevelData.pActivity.surveySiteOption = 'sitepickcreate';
        options.activityLevelData.pActivity.allowPoints = false;
        result = enmapify(options);
        resp = result.showMyLocationAndLocationByAddress();
        expect(resp).toEqual(false);

        options.activityLevelData.pActivity.surveySiteOption = 'sitepick';
        options.activityLevelData.pActivity.allowPoints = true;
        result = enmapify(options);
        resp = result.showMyLocationAndLocationByAddress();
        expect(resp).toEqual(false);
    });

    it("should zoom to project area if no site is selected", function() {
        result = enmapify(options);
        expect(result.zoomToDefaultSite()).toEqual(options.activityLevelData.project.projectSiteId);

        options.activityLevelData.activity.siteId = "site2";
        result = enmapify(options);
        result.viewModel.loadActivitySite();
        expect(result.zoomToDefaultSite()).toBe(undefined);
    }) ;

    it("should show manual entry button/form with appropriate project activity configuration", function () {
        var result;

        // test point with pid
        options.activityLevelData.activity.siteId = "site4";
        result = enmapify(options);
        result.viewModel.loadActivitySite();
        expect(result.viewModel.transients.showManualCoordinateForm()).toEqual(true);

        // do not show form field or button when user has to pick site from dropdown list
        options.activityLevelData.activity.siteId = "site4";
        options.activityLevelData.pActivity.surveySiteOption = "sitepick";
        result = enmapify(options);
        result.viewModel.loadActivitySite();
        expect(result.viewModel.transients.showManualCoordinateForm()).toEqual(false);
    });

    describe("Test ajax call to manual create point", function() {
        var request, result;
        jasmine.Ajax.install();

        beforeEach(function() {
            result = enmapify(options);
            result.viewModel.transients.editCoordinates(true);
            options.container["TestLatitude"](0);
            options.container["TestLongitude"](0);
            result.viewModel.transients[options.name + "LatitudeStaged"](10);
            result.viewModel.transients[options.name + "LongitudeStaged"](9);
            result.viewModel.transients.saveCoordinates();

            request = jasmine.Ajax.requests.mostRecent();
            expect(request.url).toBe('?lat=10&lng=9&projectId=abc');
            expect(request.method).toBe('GET');
        });

        it("should add point to map and dismiss coordinate fields", function() {
            request.respondWith({
                status: 200,
                responseJSON: { "isPointInsideProjectArea": true, "address": null }
            });

            expect(result.viewModel.transients.editCoordinates()).toBe(false);
            expect(options.container["TestLatitude"]()).toBe(10);
            expect(options.container["TestLongitude"]()).toBe(9);
        });

        it("should prompt user to add point to map and coordinate fields is still visible", function() {

            request.respondWith({
                status: 200,
                responseJSON: { "isPointInsideProjectArea": false, "address": null }
            });

            expect(result.viewModel.transients.editCoordinates()).toBe(true);
            expect(options.container["TestLatitude"]()).toBe(0);
            expect(options.container["TestLongitude"]()).toBe(0);
        });

        it("should add point if ajax request failed", function() {
            request.respondWith({
                status: 404
            });

            expect(result.viewModel.transients.editCoordinates()).toBe(false);
            expect(options.container["TestLatitude"]()).toBe(10);
            expect(options.container["TestLongitude"]()).toBe(9);
        });
    });
});