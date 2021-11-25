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
describe("Condition trajectory component", function () {

    var vm = null;
    var mockElement = null;
    var facetFilterVM = null;
    beforeAll(function() {
        vm = {
            condition: ko.observable('Good'),
            trajectory: ko.observable('Improving')
        };

        mockElement = document.createElement('condition-trajectory');
        mockElement.setAttribute('params',"condition: condition, trajectory: trajectory" );
        ko.applyBindings(vm, mockElement);
    });


    it("should instantiate correctly", function() {
        var componentViewModel = ko.dataFor($(mockElement).find(":first-child")[0]);
        expect(componentViewModel.title()).toEqual("Condition: Good, Trajectory: Improving");
        expect(componentViewModel.trajectoryTemplate()).toEqual('template-trajectory-improving');
        expect(componentViewModel.boxPosition()).toEqual(172.5);
    });
});