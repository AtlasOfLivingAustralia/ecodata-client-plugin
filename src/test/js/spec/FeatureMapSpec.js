describe("Feature Map Spec", function () {

    beforeAll(function () {
        window.ALA = {
            Map : function () {
                var self = this;
                self.getMapImpl = function() {
                    return {
                        eachLayer: function(){},
                        on:function(){}
                    };
                }
                self.drawnItems = {
                    on : function() {return{}}
                }
            }
        };

        window.L = {
            Google: function(){}
        }
    });
    it("can initialise with a mock map", function() {
        var map = ecodata.forms.maps.featureMap({displayScale:false});
    });

    it("should add name to the editableSites", function (){
        var options = {displayScale:false}
        var map = ecodata.forms.maps.featureMap(options);

        var details = {properties: {name: "Test"}}
        var editSites = ko.observable(details);

        map.editableSites = editSites()

        expect(details.properties.name).toEqual(map.editableSites.properties.name)
    });
});

