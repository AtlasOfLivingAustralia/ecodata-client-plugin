/*
 * Helper functions for <md:jsViewModel> tag
 */

/**
 * Create KO observables for a given geolocation field on an Ala.Map and register various listeners to keep the two in sync.
 *
 * @param args The arguments object
 * @param args.viewModel The ViewModel to attach handlers for the UI to bind events to.
 * @param args.container The ViewModel that contains the data properties, addtional properties will be attached here
 * @param args.name The name of the model or something.
 * @param args.edit Whether this map is in edit mode
 * @param args.readonly Whether this map is readonly
 * @param args.markerOrShapeNotBoth Whether to allow both a marker and a feature.
 * @param args.proxyFeatureUrl The proxy feature URL
 * @param args.spatialGeoserverUrl The Spatial Portal geoserver URL
 * @param args.updateSiteUrl The URL to use to add or update a site.
 * @param args.listSitesUrl The URL to use to retrieve the list of sites for a project activity
 * @param args.uniqueNameUrl The URL to use to check whether a site name is unique within a project activity.
 * @param args.activityLevelData The activity level data
 */
function enmapify(args) {
    "use strict";

    var SITE_CREATE = 'sitecreate', SITE_PICK = 'sitepick', SITE_PICK_CREATE = 'sitepickcreate';
    var viewModel = args.viewModel,
        container = args.container,
        validationContainer = args.validationContainer || '#validation-container',
        name = args.name,
        edit = args.edit,
        readonly = args.readonly,
        markerOrShapeNotBoth = args.markerOrShapeNotBoth,
        activityLevelData = args.activityLevelData,
        proxyFeatureUrl = activityLevelData.proxyFeatureUrl || args.proxyFeatureUrl,
        spatialGeoserverUrl = activityLevelData.spatialGeoserverUrl || args.spatialGeoserverUrl,
        updateSiteUrl = activityLevelData.updateSiteUrl || args.updateSiteUrl,
        listSitesUrl = activityLevelData.listSitesUrl || args.listSitesUrl,
        getSiteUrl = activityLevelData.getSiteUrl || args.getSiteUrl,
        checkPointUrl = activityLevelData.checkPointUrl || args.checkPointUrl,
        context = args.context,
        uniqueNameUrl = (activityLevelData.uniqueNameUrl || args.uniqueNameUrl) + "/" + ( activityLevelData.pActivity.projectActivityId || activityLevelData.pActivity.projectId),
        projectId = activityLevelData.pActivity.projectId,
        // hideSiteSelection is now dependent on survey's mapConfiguration
        // check viewModel.transients.hideSiteSelection
        project = args.activityLevelData.project || {},
        mapConfiguration = project.mapConfiguration || args.activityLevelData.pActivity || {},
        allowPolygons = mapConfiguration.allowPolygons == undefined ? false : mapConfiguration.allowPolygons,
        allowPoints = mapConfiguration.allowPoints  == undefined ? true : mapConfiguration.allowPoints,
        allowLine = mapConfiguration.allowLine || false,
        pointsOnly = allowPoints && !allowPolygons,
        polygonsOnly = !allowPoints && allowPolygons,
        addCreatedSiteToListOfSelectedSites = ((mapConfiguration.surveySiteOption == SITE_PICK_CREATE) && mapConfiguration.addCreatedSiteToListOfSelectedSites) || false,
        selectFromSitesOnly = viewModel.selectFromSitesOnly= mapConfiguration.surveySiteOption == SITE_PICK ? true : false,


        siteIdObservable =activityLevelData.siteId = container[name] = ko.observable(),
        nameObservable = container[name + "Name"] = ko.observable(),
        latObservable = container[name + "Latitude"] = ko.observable(),
        lonObservable = container[name + "Longitude"] = ko.observable(),
        previousLatObservable = container[name + "HiddenLatitude"] = ko.observable(),
        previousLonObservable = container[name + "HiddenLongitude"] = ko.observable(),
        latLonDisabledObservable = container[name + "LatLonDisabled"] = ko.observable(!pointsOnly),
        centroidLatObservable = container[name + "CentroidLatitude"] = ko.observable(),
        centroidLonObservable = container[name + "CentroidLongitude"] = ko.observable(),
        //siteObservable filters out all private sites
        sitesObservable = ko.observableArray(resolveSites(mapConfiguration.sites)),
        //container[SitesArray] does not care about 'private' or not, only check if the site matches the survey configs
        surveySupportedSitesObservable = container[name + "SitesArray"] =  ko.computed(function(){
            return sitesObservable();
        }),


        loadingObservable = container[name + "Loading"] = ko.observable(false),
        checkMapInfo = viewModel.checkMapInfo = function(){
            var siteId = siteIdObservable();
            if (!siteId ) {
                var msg;
                switch (mapConfiguration.surveySiteOption) {
                    case SITE_CREATE:
                        msg = "A location is mandatory. Please draw a location on the below map.";
                        break;
                    case SITE_PICK:
                        msg = "A location is mandatory. Please pick a location from the above drop down list.";
                        break;
                    case SITE_PICK_CREATE:
                        msg = "A location is mandatory. Please pick a location from the above drop down list or draw on the below map.";
                        break;
                }

                return {validation:false, message: msg};
            }

            return {validation:true};
        };

    viewModel.mapElementId = name + "Map";

    // add event handling functions
    if(!viewModel.on){
        new Emitter(viewModel);
    }

    viewModel.transients = viewModel.transients || {};
    var latObservableStaged = viewModel.transients[name + "LatitudeStaged"] = ko.observable(),
        lonObservableStaged = viewModel.transients[name + "LongitudeStaged"] = ko.observable(),
        editCoordinates = viewModel.transients["editCoordinates"] = ko.observable(false),
        showLoadingOnCoordinateCheck = viewModel.transients["showLoadingOnCoordinateCheck"] = ko.observable(false);

    viewModel.transients.showCoordinateFields = function () {
        editCoordinates(true);
    };

    viewModel.transients.hideCoordinateFields = function () {
        editCoordinates(false);
    };

    viewModel.transients.saveCoordinates = function () {
        var lat = latObservableStaged(),
            lng = lonObservableStaged();

        if(isLatitudeValid(lat) && isLongitudeValid(lng) ) {
            canAddPointToMap(lat, lng, function (response) {
                if (response.isPointInsideProjectArea) {
                    addPointToMap(lat, lng);
                } else {
                    var message;
                    if (response.address) {
                        message = 'The coordinates are outside the project area.<br/>' +
                            'Address of the location is "' + response.address + '".<br/>' +
                            'Do you wish to add it anyway?';
                    } else {
                        message = 'The coordinates are outside the project area.<br/>' +
                            'Do you wish to add it anyway?';
                    }

                    bootbox.confirm( message, function (result) {
                        if (result) {
                            addPointToMap(lat, lng);
                        }
                    });
                }
            });
        } else {
            bootbox.alert("Latitude or longitude is invalid.");
        }
    };

    function isLatitudeValid (lat) {
        if (typeof lat === "string") {
            lat = parseFloat(lat);
        }

        return (lat >= -90) && (lat <= 90);
    }

    function isLongitudeValid (lng) {
        if (typeof lng === "string") {
            lng = parseFloat(lng);
        }

        return (lng >= -180) && (lng <= 180);
    }

    function addPointToMap(lat, lng) {
        if (lat && lng) {
            viewModel.addMarker ({decimalLatitude: lat,  decimalLongitude: lng});
            editCoordinates(false);
        }
    }

    function canAddPointToMap (lat, lng, callback) {
        var url = checkPointUrl + '?lat=' + lat + '&lng=' + lng + '&projectId=' + projectId;
        showLoadingOnCoordinateCheck(true);
        $.ajax({
            url: url,
            method: 'GET',
            success : function (data) {
                callback && callback(data);
                showLoadingOnCoordinateCheck(false);
            },
            error: function () {
                // add the point if error is returned.
                callback && callback({
                    isPointInsideProjectArea: true,
                    address: null
                });
                showLoadingOnCoordinateCheck(false);
            }
        });
    }

    viewModel.transients.hideSiteSelection = ko.computed(function () {
        if (mapConfiguration && ([SITE_PICK, SITE_PICK_CREATE].indexOf(mapConfiguration.surveySiteOption) >= 0)) {
            return true;
        }

        return false;
    });

    viewModel.transients.showMyLocationAndLocationByAddress = function () {
        if (readonly) {
            return true;
        }

        // only show my location control if user can add point to map
        if (mapConfiguration && ([SITE_CREATE, SITE_PICK_CREATE].indexOf(mapConfiguration.surveySiteOption) >= 0) && allowPoints) {
            return true;
        }

        return false;
    };

    viewModel.transients.showDataEntryFields = ko.computed(function () {
        switch (mapConfiguration.surveySiteOption) {
            case SITE_CREATE:
            case SITE_PICK_CREATE:
                return true;
        }

        return false;
    });

    viewModel.transients.showCentroid = function () {
        var site = viewModel.transients.getCurrentSite();
        if (site) {
            var geoJson  = Biocollect.MapUtilities.featureToValidGeoJson(site.extent.geometry);
            if (geoJson.properties.point_type === ALA.MapConstants.DRAW_TYPE.CIRCLE_TYPE) {
                return true;
            } else {
                return [ALA.MapConstants.DRAW_TYPE.POLYGON_TYPE, ALA.MapConstants.DRAW_TYPE.LINE_TYPE].indexOf(geoJson.geometry.type) >= 0;
            }
        }

        return false;
    };

    viewModel.transients.showPointLatLon = function () {
        var site = viewModel.transients.getCurrentSite();
        if (site) {
            var geoJson  = Biocollect.MapUtilities.featureToValidGeoJson(site.extent.geometry);
            if ((geoJson.properties.point_type != ALA.MapConstants.DRAW_TYPE.CIRCLE_TYPE) && (geoJson.geometry.type === ALA.MapConstants.DRAW_TYPE.POINT_TYPE)) {
                return true;
            }
        }

        return false;
    };

    viewModel.transients.showManualCoordinateForm = function () {
        if (mapConfiguration && ([SITE_CREATE, SITE_PICK_CREATE].indexOf(mapConfiguration.surveySiteOption) >= 0) && allowPoints) {
            return true;
        }

        return false;
    };

    viewModel.transients.getCurrentSite = function () {
        var siteId = siteIdObservable();
        return $.grep(sitesObservable(), function (site) {
            return siteId == site.siteId;
        })[0];
    }

    var mapOptions = {
        wmsFeatureUrl: proxyFeatureUrl + "?featureId=",
        wmsLayerUrl: spatialGeoserverUrl + "/wms/reflect?",
        //set false to keep consistance with edit mode.  We need to enter edit mode to move marker.
        //If we set it true, we can move point, but cannot update site. And if we enter edit mode and exit, marker is no longer draggable.  Could be a bug in leaflet
        draggableMarkers: false,
        drawControl: !readonly,
        showReset: false,
        singleDraw: true,
        singleMarker: true,
        markerOrShapeNotBoth: markerOrShapeNotBoth,
        useMyLocation: viewModel.transients.showMyLocationAndLocationByAddress(),
        allowSearchLocationByAddress: viewModel.transients.showMyLocationAndLocationByAddress(),
        allowSearchRegionByAddress: false,
        zoomToObject: true,
        markerZoomToMax: true,
        maxZoom: 21,
        addLayersControlHeading: true,
        autoZIndex: false,
        preserveZIndex: true,
        drawOptions:  EnmapifyUtils.getMapOptions(activityLevelData, readonly, allowPolygons, allowPoints, allowLine, mapConfiguration.surveySiteOption)
    };

    // update siteId in activity
    siteIdObservable.subscribe(function (siteId) {
        viewModel.emit('sitechanged', siteId);
    });

    var baseLayersAndOverlays = Biocollect.MapUtilities.getBaseLayerAndOverlayFromMapConfiguration(fcConfig.mapLayersConfig);
    mapOptions.baseLayer = baseLayersAndOverlays.baseLayer;
    mapOptions.otherLayers = baseLayersAndOverlays.otherLayers;
    mapOptions.overlays = baseLayersAndOverlays.overlays;
    mapOptions.overlayLayersSelectedByDefault = baseLayersAndOverlays.overlayLayersSelectedByDefault;
    var map = context.siteMap = new ALA.Map(viewModel.mapElementId, mapOptions);

    container[viewModel.mapElementId] = map;

    var latSubscriber = latObservable.subscribe(updateMarkerPosition);
    var lngSubscriber = lonObservable.subscribe(updateMarkerPosition);

    var siteIdSubscriber;

    viewModel.getSiteId = function () {
        return siteIdObservable();
    };
    viewModel.loadActivitySite = function () {
        var siteId = activityLevelData.activity && activityLevelData.activity.siteId;
        siteId && siteIdObservable(siteId);
    };

    function updateFieldsForMap(params) {
        subscribeOrDisposeLatLonObservables(false);

        var markerLocation = null;
        var markerLocations = map.getMarkerLocations();
        if (markerLocations && markerLocations.length > 0) {
            markerLocation = markerLocations[0];
        }

        var geo = map.getGeoJSON();
        var numberOfFeatures = map.countFeatures();
        var feature;

        // When removing layers, events can also be fired, we want to avoid processing those
        // otherwise we could override the siteId
        var isRemoveEvent = params && params.type && params.type == "layerremove";
        if (markerLocation) {
            // Prevent sitesubscriber from been reset, when we are in the process of clearing the map
            // If the user dropped a pin or search a location then the select location should be deselected
            if (!isRemoveEvent) {

                siteSubscriber.dispose();
                console.log("Updating location fields to pin");
                //siteIdObservable(null);
                latObservable(markerLocation.lat);
                lonObservable(markerLocation.lng);
                //latLonDisabledObservable(false);
                centroidLatObservable(null);
                centroidLonObservable(null);

                $(document).trigger('markerupdated');

                siteSubscriber = siteIdObservable.subscribe(updateMapForSite);
            }

        } else if (geo && geo.features && geo.features.length > 0) {
            console.log("Updating location fields to site");
            //latLonDisabledObservable(true);
            feature = geo.features[0];
            if (feature.geometry.type == 'Point'){
                //circle is also a point
                if (feature.properties.point_type=="Circle"){
                    var c = centroid(feature);
                    latObservable(null);
                    lonObservable(null);
                    centroidLonObservable(c[0]);
                    centroidLatObservable(c[1]);
                }else{
                    latObservable(feature.geometry.coordinates[1]);
                    lonObservable(feature.geometry.coordinates[0]);
                    centroidLonObservable(null);
                    centroidLatObservable(null);
                }

            }else{
                var c = centroid(feature);
                latObservable(null);
                lonObservable(null);
                centroidLonObservable(c[0]);
                centroidLatObservable(c[1]);
            }
        }
        else if (numberOfFeatures > 0) {
            // Feature with pid will not return a GeoJSON object instantly. GeoJSON object will be returned after an
            // AJAX request is complete. Therefore, wait for the AJAX to complete. And, do not clear any fields.
        }
        else {
            console.log("Clearing location fields");
            //latLonDisabledObservable(false);
            previousLatObservable(null);
            previousLonObservable(null);
            latObservable(null);
            lonObservable(null);
            centroidLatObservable(null);
            centroidLonObservable(null);
            siteIdObservable(null);
        }

        subscribeOrDisposeLatLonObservables(true);
    }

    function subscribeOrDisposeLatLonObservables (state) {
        // destroy existing subscription before creating new subscription
        latSubscriber && latSubscriber.dispose();
        lngSubscriber && lngSubscriber.dispose();

        if (state) {
            latSubscriber = latObservable.subscribe(updateMarkerPosition);
            lngSubscriber = lonObservable.subscribe(updateMarkerPosition);
        }
    }

    function centroid(feature) {
        var coords;
        if (feature.geometry.type == 'Polygon') {
            coords = feature.geometry.coordinates[0];
            var rcoords = _.clone(coords);
            rcoords.push(rcoords.shift());
            var zipped = _.chain(coords).zip(rcoords);
            var a = zipped.map(function (c) {
                return parseFloat(c[0][0]) * parseFloat(c[1][1]) - parseFloat(c[1][0]) * parseFloat(c[0][1]);
            });
            var sum = function (memo, v) {
                return memo + v;
            };
            var sixA = 6 * (a.reduce(sum, 0).value() / 2);
            var zippedAValue = zipped.zip(a.value());
            var cx = zippedAValue.map(function (c) {
                return ( parseFloat(c[0][0][0]) + parseFloat(c[0][1][0]) ) * parseFloat(c[1]);
            }).reduce(sum, 0).value() / sixA;
            var cy = zippedAValue.map(function (c) {
                return ( parseFloat(c[0][0][1]) + parseFloat(c[0][1][1]) ) * parseFloat(c[1]);
            }).reduce(sum, 0).value() / sixA;
            return [cx, cy];
        }
        else if (feature.geometry.type == 'LineString') {
            coords = feature.geometry.coordinates[0];
            return [parseFloat(coords[0]), parseFloat(coords[1])];
        }
        else if (feature.geometry.type == 'Point') {
            coords = feature.geometry.coordinates;
            return [parseFloat(coords[0]), parseFloat(coords[1])];
        } else {
            console.log(feature.geometry.type + ' is not a supported type for centroid()');
            return [0, 0];
        }

    }

    /**
     * Once the site selection changed, the function will be called
     * Also called in record information display
     * @param siteId
     */
    function updateMapForSite(siteId) {
        if (typeof siteId !== "undefined" && siteId) {
            if (lonObservable()) {
                previousLonObservable(lonObservable());
            }

            if (latObservable()) {
                previousLatObservable(latObservable());
            }

            var matchingSite = $.grep(sitesObservable(), function (site) {
                return siteId == site.siteId
            })[0];
            //search from site collection in case it is a private site
            if (!matchingSite){
                var siteUrl = getSiteUrl + '/' + siteId + ".json"
                //It is a sync call
                $.ajax({
                    type: "GET",
                    url: siteUrl,
                    async: false,
                    success: function (data) {
                        if (data.site){
                            var geoType =  data.site.extent.source;
                            data.site.name='Location of the sighting';
                            sitesObservable.push(data.site);
                            matchingSite = data.site;
                        }
                    },
                    error: function(xhr) {
                        console.log(xhr);
                    }
                });
            }
            // TODO: OPTIMISE THE PROCEDUE
            if (matchingSite) {
                console.log("Clearing map before displaying a new shape")
                map.clearBoundLimits();
                map.setGeoJSON(Biocollect.MapUtilities.featureToValidGeoJson(matchingSite.extent.geometry));
            }
        } else {
            // Keep the previous code to make compatible with old records
            // Can be removed after all data be migrated.
            if (previousLatObservable() && previousLonObservable()) {
                    lonObservable(previousLonObservable());
                    latObservable(previousLatObservable());

            } else {
                console.log("Resetting map because of non-previous lat long")
                map.resetMap()
                }
            }
        }

    function getProjectArea() {
        return $.grep(activityLevelData.pActivity.sites, function (item) {
            return item.name.indexOf('Project area for') == 0
        });
    }

    function createGeoJSON(geoJSON, layerOptions) {
        if (typeof geoJSON === 'string') {
            geoJSON = JSON.parse(geoJSON);
        }

        return L.geoJson(geoJSON, layerOptions);
    }

    function updateMarkerPosition() {
        if (shouldMarkerMove()) {
            console.log("Enmapify: Displaying new marker");
            map.addMarker(latObservable(), lonObservable());
            previousLatObservable(latObservable());
            previousLonObservable(lonObservable());
        }
    }

    function shouldMarkerMove () {
        var emptyValues = [null, undefined, ''];
        return ((latObservable() != previousLatObservable()) || (lonObservable() != previousLonObservable())) &&
            (emptyValues.indexOf(latObservable()) === -1) && (emptyValues.indexOf(lonObservable()) === -1);
    }

    viewModel.selectManyCombo = function (obj, event) {
        if (event.originalEvent) {
            var item = event.originalEvent.target.attributes["combolist"].value.split(".");
            var list = container[item[0]][item[1]]();
            var value = event.originalEvent.target.value;
            for (var k in list) {
                if (list[k] == value) return;
            }
            list.push(value);
            container[item[0]][item[1]](list);
        }
    };

    viewModel.removeTag = function (obj, event) {
        if (event.originalEvent) {
            event.originalEvent.preventDefault();

            var element = event.originalEvent.target;
            while (!element.attributes["combolist"]) element = element.parentElement;

            var combolist = element.attributes["combolist"];
            var value = element.firstChild.value;
            var item = combolist.value.split(".");
            var list = container[item[0]][item[1]]();
            var found = false;
            for (var k in list) {
                if (list[k] == value) {
                    list.splice(k, 1);
                    container[item[0]][item[1]](list);
                    element.remove();
                    return;
                }
            }
        }
    };

    viewModel.addMarker = function(data) {
        if (mapOptions && mapOptions.drawOptions && mapOptions.drawOptions.marker) {
            if ( (data.decimalLatitude != undefined) && (data.decimalLongitude != undefined) ) {
                var isPublicSite;
                subscribeOrDisposeLatLonObservables(false);
                latObservable(data.decimalLatitude);
                lonObservable(data.decimalLongitude);
                updateMarkerPosition();

                if (addCreatedSiteToListOfSelectedSites) {
                    createPublicSite();
                    isPublicSite = true;
                }
                else {
                    createPrivateSite();
                    isPublicSite = false;
                }

                subscribeOrDisposeLatLonObservables(true);
                return isPublicSite
            }
        }
    }

    var siteSubscriber = siteIdObservable.subscribe(updateMapForSite);

    //Listen mylocation and search events from the map plugin
    map.registerListener("searchEventFired", function (e) {
        console.log('Received search event');
        if (addCreatedSiteToListOfSelectedSites)
            createPublicSite();
        else
            createPrivateSite();
    });

    // make sure the lat/lng fields are cleared when the marker is removed by cancelling a new marker

    map.registerListener("draw:created", function (e) {
        console.log("draw created");
        var type = e.layerType,
            layer = e.layer;

        //Create site for all type including point
        if (addCreatedSiteToListOfSelectedSites)
            createPublicSite();
        else
            createPrivateSite();
    });
    var saved = false;
    map.registerListener("draw:edited", function (e) {
        console.log("edited", e);
        saved = true;
    });

    map.registerListener("draw:editstop", function (e) {
        console.log("editstop", e);
        if (!siteIdObservable() && !saved) {
            console.log("clear geo json");
            map.clearLayers();
        } else if (saved) {
            if (addCreatedSiteToListOfSelectedSites)
                createPublicSite();
            else
                createPrivateSite()
        } else {
            console.log("cancelled edit with selected site, not clearing geometry")
        }
        saved = false;
    });

    //Change on map will trigger the method.
    map.subscribe(updateFieldsForMap);

    if (!edit && !readonly) {
        map.markMyLocation();
    }

    /**
     * Public sites have a name and are indexed by ElasticSearch.
     * Hence they are visible on site listing pages.
     * Creating public site also adds the site to ProjectActivity's
     * pre-determined list. Therefore, users will be able to pick it from
     * site selection drop down after creation.
     */
    function createPublicSite() {
        siteSubscriber.dispose();
        siteIdObservable(null);
        Biocollect.Modals.showModal({
            viewModel: new AddSiteViewModel(uniqueNameUrl)
        }).then(function (newSite) {
            loadingObservable(true);
            var extent = convertGeoJSONToExtent(map.getGeoJSON());
            blockUIWithMessage("Adding Site \"" + newSite.name + "\", please stand by...");
            return addSite({
                pActivityId: activityLevelData.pActivity.projectActivityId,
                site: {
                    name: newSite.name,
                    projects: [
                        activityLevelData.pActivity.projectId
                    ],
                    extent: extent
                }
            }).then(function (data, jqXHR, textStatus) {
                return reloadSiteData().then(function () {
                    return data.id
                })
            })
                .always(function () {
                    $.unblockUI();
                    loadingObservable(false);
                })
                .done(function (id) {
                    siteIdObservable(id);
                })
                .fail(saveSiteFailed);
        }).fail(function(){
            enableEditMode()
        });


        siteSubscriber = siteIdObservable.subscribe(updateMapForSite);
    }

    /**
     * Private sites are not index by ElasticSearch. Hence not visible on site listing pages.
     */
    function createPrivateSite() {
        siteSubscriber.dispose();

        var extent = convertGeoJSONToExtent(map.getGeoJSON());
        var siteName = 'Private site';
        if (activityLevelData.pActivity){
            activityLevelData.pActivity.name? siteName += " for survey: "+activityLevelData.pActivity.name: siteName;
        }

        var site = {
            name: siteName,
            visibility:'private',//site will not be indexed
            projects: [
                activityLevelData.pActivity.projectId
            ],
            extent: extent
        }

        var uSite = lookupUpdatebleSite()
        if (uSite){
            site.siteId = uSite.siteId;
        }

        siteIdObservable(null);
        loadingObservable(true);

        blockUIWithMessage("Updating, please stand by...");
        addSite({
                pActivityId: activityLevelData.pActivity.projectActivityId,
                site: site}
            ).then(function (data, jqXHR, textStatus) {
                    var anonymousSiteId= data.id;
                        //IMPORTANT
                        //sites is a data-bind source for the selection dropdown list and bound to activity-output-data-location
                        //if the new created site id is not in this list, then the location would be empty
                        var geometryType =  extent.geometry.type;
                        var anonymousSite = {
                         name: 'The '+ geometryType + ' you created.',
                         siteId: anonymousSiteId,
                         extent: extent,
                         visibility: "private"
                        }
                    sitesObservable.remove(function(site){
                        return site.visibility == 'private';
                    })
                    sitesObservable.push(anonymousSite);
                    siteIdObservable(anonymousSiteId);
                 })
            .always(function () {
                $.unblockUI();
                loadingObservable(false);
                siteSubscriber = siteIdObservable.subscribe(updateMapForSite);
            })
            .fail(saveSiteFailed)
    }

    /**
     * find a private site id.
     * If a site is 'visibility = private, it means we should update it instead of creating a new one
     */

    function lookupUpdatebleSite(){
       return _.find(sitesObservable(),function(site){
            return site.visibility == 'private'
        })
    }

    function enableEditMode() {
        console.log('Init edit mode')
        // this is gross hack around the map plugin not giving access to the Draw Control
        var event = document.createEvent('Event');
        event.initEvent('click', true, true);
        var cb = document.getElementsByClassName('leaflet-draw-edit-edit');
        !cb[0].dispatchEvent(event);
    }

    function addSite(site) {
        var siteId = site['site'].siteId
        site['site']['asyncUpdate'] = true;  // aysnc update Metadata service for performance improvement

        return $.ajax({
            method: 'POST',
            url: siteId? updateSiteUrl+"?id="+siteId:updateSiteUrl,
            data: JSON.stringify(site),
            contentType: 'application/json',
            dataType: 'json'
        });
    }

    function saveSiteFailed(jqXHR, textStatus, errorThrown) {
        var errorMessage = jqXHR.responseText || "An error occured while attempting to save the site.";
        bootbox.alert(errorMessage);
        map.clearLayers();
    }

    function polygonCenter(vertices){
        var lowx,
            highx,
            lowy,
            highy,
            lats = [],
            lngs = [];

        for(var i=0; i<vertices.length; i++) {
           lats.push(vertices[i][0]);
           lngs.push(vertices[i][1]);
        }

        lats.sort();
        lngs.sort();
        lowx = lats[0];
        highx = lats[vertices.length - 1];
        lowy = lngs[0];
        highy = lngs[vertices.length - 1];
        var center_x = lowx + ((highx-lowx) / 2);
        var center_y = lowy + ((highy - lowy) / 2);
        return [center_x, center_y];
    }

    function convertGeoJSONToExtent(gj) {
        var feature = gj.features[0];
        //var geometryType = feature.geometry.type;
        var latLng = null;
        var extent = {
            geometry: {}
        };

        var geoType = determineExtentType(feature);

        if (geoType === ALA.MapConstants.DRAW_TYPE.POINT_TYPE || geoType === ALA.MapConstants.DRAW_TYPE.CIRCLE_TYPE) {
            if (feature.geometry.coordinates.length == 2){
                latLng = feature.geometry.coordinates;
            }

        }

        if (geoType === ALA.MapConstants.DRAW_TYPE.POLYGON_TYPE) {
            //Polygon is 2D array. Here we use the first element.
            var coordinates = feature.geometry.coordinates.length > 0?feature.geometry.coordinates[0]:[]
            latLng = polygonCenter(coordinates);
        }
        // We use the first point as the center of a polyline
        if (geoType === ALA.MapConstants.DRAW_TYPE.LINE_TYPE) {
            if (feature.geometry.coordinates.length > 1){
                latLng = feature.geometry.coordinates[0];
            }
        }


        extent.geometry.centre = latLng;
        extent.geometry.type = geoType;
        extent.source = geoType == "Point" ? "Point" : geoType == "pid" ? "pid" : "drawn";
        extent.geometry.radius = feature.properties.radius;

        // the feature created by a WMS layer will have the area in the 'area_km' property
        if (feature.properties.area_km) {
            extent.geometry.areaKmSq = feature.properties.area_km;
        } else {
            extent.geometry.areaKmSq = ALA.MapUtils.calculateAreaKmSq(feature);
        }
        extent.geometry.coordinates = _.clone(feature.geometry.coordinates);

        extent.geometry.bbox = feature.properties.bbox;
        extent.geometry.pid = feature.properties.pid;
        extent.geometry.name = feature.properties.name;
        extent.geometry.fid = feature.properties.fid;
        extent.geometry.layerName = feature.properties.fieldname;

        return extent;
    }

    function determineExtentType(geoJsonFeature) {
        var type = null;

        if (geoJsonFeature.geometry.type === ALA.MapConstants.DRAW_TYPE.POINT_TYPE) {
            if (geoJsonFeature.properties.radius) {
                type = ALA.MapConstants.DRAW_TYPE.CIRCLE_TYPE;
            } else {
                type = ALA.MapConstants.DRAW_TYPE.POINT_TYPE;
            }
        } else if (geoJsonFeature.geometry.type === ALA.MapConstants.DRAW_TYPE.POLYGON_TYPE) {
            if (geoJsonFeature.properties.pid) {
                type = "pid";
            } else {
                type = ALA.MapConstants.DRAW_TYPE.POLYGON_TYPE;
            }
        } else if (geoJsonFeature.geometry.type == ALA.MapConstants.DRAW_TYPE.LINE_TYPE) {
            type = geoJsonFeature.geometry.type
        }

        return type;
    }

    function reloadSiteData() {
        var entityType = activityLevelData.pActivity.projectActivityId ? "projectActivity" : "project"
        return $.getJSON(listSitesUrl + '/' + (activityLevelData.pActivity.projectActivityId || activityLevelData.pActivity.projectId) + "?entityType=" + entityType).then(function (data, textStatus, jqXHR) {
            sitesObservable(data);

        });
    }

    loadingObservable.subscribe(function (value) {
        value ? map.startLoading() : map.finishLoading();
    });

    function zoomToDefaultSite(){
        var defaultZoomArea = project.projectSiteId;
        if (!siteIdObservable()){
            var defaultsite  = $.grep(activityLevelData.pActivity.sites,function(site){
                if(site.siteId == defaultZoomArea)
                    return site;
            });
            // Is zoom area a project area?
            if( (defaultsite.length == 0) && (defaultZoomArea == project.projectSiteId) && project.sites) {
                defaultsite = $.grep(project.sites,function(site){
                    if(site.siteId == defaultZoomArea)
                        return site;
                });
            }

            var geojson;
            if (defaultsite.length>0) {
                geojson = Biocollect.MapUtilities.featureToValidGeoJson(defaultsite[0].extent.geometry);
                map.clearBoundLimits();
                map.fitToBoundsOf(geojson);
                return defaultsite[0].siteId;
            }

        }
    }

    zoomToDefaultSite();

    // Redraw map since it was created on a hidden element.
    $(validationContainer).on('knockout-visible', function () {
        map && map.getMapImpl().invalidateSize();
    });

    // returning variables to help test this method
    return {
        mapOptions: mapOptions,
        hideSiteSelection: viewModel.transients.hideSiteSelection,
        showMyLocationAndLocationByAddress: viewModel.transients.showMyLocationAndLocationByAddress,
        checkMapInfo: checkMapInfo,
        centroid: centroid,
        createPublicSite: createPublicSite,
        createPrivateSite: createPrivateSite,
        viewModel: viewModel,
        zoomToDefaultSite: zoomToDefaultSite,
        shouldMarkerMove: shouldMarkerMove
    };
}

var AddSiteViewModel = function (uniqueNameUrl) {
    var self = this;
    self.uniqueNameUrl = uniqueNameUrl;

    self.inflight = null;
    self.name = ko.observable();
    self.throttledName = ko.computed(this.name).extend({throttle: 400});
    self.nameStatus = ko.observable(AddSiteViewModel.NAME_STATUS.BLANK);

    self.name.subscribe(function (name) {
        self.precheckUniqueName(name);
    });
    self.throttledName.subscribe(function (name) {
        self.checkUniqueName(name);
    });
};

AddSiteViewModel.NAME_STATUS = {
    BLANK: 'blank'
    , CHECKING: 'checking'
    , CONFLICT: 'conflict'
    , ERROR: 'error'
    , OK: 'ok'
};

AddSiteViewModel.prototype.template = "AddSiteModal";
AddSiteViewModel.prototype.add = function () {
    if (this.nameStatus() === AddSiteViewModel.NAME_STATUS.OK) {
        var newSite = {
            name: this.name()
        };
        this.modal.close(newSite);
    }
};

AddSiteViewModel.prototype.cancel = function () {
    // Close the modal without passing any result data.
    this.modal.close();
};

AddSiteViewModel.prototype.precheckUniqueName = function (name) {
    if (this.inflight) this.inflight.abort();

    this.nameStatus(name === '' ? AddSiteViewModel.NAME_STATUS.BLANK : AddSiteViewModel.NAME_STATUS.CHECKING);
};

AddSiteViewModel.prototype.checkUniqueName = function (name) {
    var self = this;

    if (name === '') return;

    self.inflight = $.getJSON(self.uniqueNameUrl + "?name=" + encodeURIComponent(name) + "&entityType=" + (activityLevelData.pActivity.projectActivityId ? "projectActivity" : "project"))
        .done(function (data, textStatus, jqXHR) {
            self.nameStatus(AddSiteViewModel.NAME_STATUS.OK);
        }).fail(function (jqXHR, textStatus, errorThrown) {
            if (errorThrown === 'abort') {
                console.log('abort');
                return;
            }

            switch (jqXHR.status) {
                case 409:
                    self.nameStatus(AddSiteViewModel.NAME_STATUS.CONFLICT);
                    break;
                default:
                    self.nameStatus(AddSiteViewModel.NAME_STATUS.ERROR);
                    bootbox.alert("An error occured checking your name.");
                    console.error("Error checking unique status", jqXHR, textStatus, errorThrown);
            }
        });
};

function validator_site_check(field, rules, i, options){
    field = field && field[0];
    var model = ko.dataFor(field);
    if( model && (typeof model.checkMapInfo == 'function')) {
        var result = model.checkMapInfo();
        if (!result.validation) {
            rules.push('required');
            return result.message;
        }
        else
            return true;
    }

    return "Site validation failed. Please let administrator know.";
}

var EnmapifyUtils = {
    /**
     * Used by enmapify to show the correct drawing controls on map based on survey configuration.
     * @param activityLevelData
     * @param readonly
     * @param allowPolygons
     * @param allowPoints
     * @param allowLine
     * @param surveySiteOption
     * @returns {{polygon: boolean, edit: boolean, marker: boolean, rectangle: boolean, circle: boolean, polyline: boolean}}
     */
    getMapOptions : function getMapOptions (activityLevelData, readonly, allowPolygons, allowPoints, allowLine, surveySiteOption) {
        var SITE_CREATE = 'sitecreate', SITE_PICK = 'sitepick', SITE_PICK_CREATE = 'sitepickcreate';
        if (activityLevelData.mobile || readonly) {
            return {
                polyline: false,
                polygon: false,
                rectangle: false,
                circle: false,
                marker:  false,
                circlemarker: false,
                edit: false
            };
        };

        switch (surveySiteOption) {
            case SITE_PICK:
                return {
                    polyline: false,
                    polygon: false,
                    rectangle: false,
                    circle: false,
                    marker:  false,
                    circlemarker: false,
                    edit: false
                };

                break;
            case SITE_CREATE:
            case SITE_PICK_CREATE:
                return {
                    polyline: !!allowLine,
                    polygon: !!allowPolygons ? { allowIntersection: false } : false,
                    rectangle:  !!allowPolygons,
                    circle:  !!allowPolygons,
                    marker:   !!allowPoints,
                    circlemarker: false,
                    edit: true
                };

                break;
        }

        return {
            polyline: false,
            polygon: false,
            rectangle: false,
            circle: false,
            marker:  false,
            circlemarker: false,
            edit: false
        };
    }
};