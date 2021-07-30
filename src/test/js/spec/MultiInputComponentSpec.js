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
describe("Multi input component", function () {

    var vm = null;
    var mockElement = null;
    var facetFilterVM = null;
    beforeAll(function() {
        vm = {
            links: ko.observableArray(['a', 'b'])
        };

        mockElement = document.createElement('multi-input');
        mockElement.setAttribute('params',"values: links" );
        ko.applyBindings(vm, mockElement);
    });


    it("should instantiate correctly", function() {
        var componentViewModel = ko.dataFor($(mockElement).find(":first-child")[0]);
        expect(componentViewModel.observableValues().length).toEqual(vm.links().length);
        expect(componentViewModel.observableValues()[0].val()).toEqual(vm.links()[0]);
        expect(componentViewModel.observableValues()[1].val()).toEqual(vm.links()[1]);
    });

    it("should add and remove value", function() {
        var componentViewModel = ko.dataFor($(mockElement).find(":first-child")[0]);
        componentViewModel.addValue();
        componentViewModel.observableValues()[2].val('c');
        expect(componentViewModel.observableValues().length).toEqual(3);
        expect(vm.links().length).toEqual(3);
        expect(vm.links()[2]).toEqual('c');
        componentViewModel.removeValue(componentViewModel.observableValues()[0]);
        expect(componentViewModel.observableValues().length).toEqual(2);
        expect(vm.links().length).toEqual(2);
        expect(vm.links()[0]).toEqual('b');
    });

});