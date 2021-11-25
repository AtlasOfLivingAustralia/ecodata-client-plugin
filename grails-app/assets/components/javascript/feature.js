/*
 * Copyright (C) 2019 Atlas of Living Australia
 * All Rights Reserved.
 *
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 * 
 * Created by Temi on 25/11/19.
 */

//= require_tree turf
//= require_self
ko.components.register('feature', {

    viewModel: function (params) {

        var self = this;
        var model = params.feature;

        if (!model) {
            throw "The model attribute is required for this component";
        }
        self.model = model;

        self.enabled = true;
        if (_.isFunction(model.enableConstraint)) {
            self.enabled = model.enableConstraint;
        }


        self.readonly = params.config.readonly;

        self.ok = function (map) {

            var geoJson = map.getGeoJSON();

            _.each(geoJson.features || [], function (feature) {
                delete feature.layer;
            });

            model(geoJson);
        };

        self.showMap = function() {

            var options = {
                okCallback:self.ok
            };

            var map = ecodata.forms.maps.showMapInModal(options);
            if (self.model()) {
                map.setGeoJSON(self.model(), {zoomToObject:false});
            }
        };

        /** Let the model know it's been deleted so it can deregister from the managed site */
        self.dispose = function() {
            if (_.isFunction(model.onDispose)) {
                model.onDispose();
            }
        };


    },
    template: componentService.getTemplate('feature')
});