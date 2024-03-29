describe("Pre-population Spec", function () {


    it("should be able to obtain prepop data from a URL", function () {
        var context = {
            data: {
                item1: '1',
                item2: '2'
            }
        };

        var prepopConfig = {
          source: {
              url:'test',
              params: [{
                  name:"p1",
                  value:"1"
              },
                  {
                      name:"p2",
                      value:["2","3"]
                  }]
          },
          mapping: []
        };

        var config = {
            prepopUrlPrefix:'/'
        };

        var url;
        var params;
        spyOn($, 'ajax').and.callFake(function(p1,p2) {
            url = p1;
            params = p2;
            return $.Deferred().resolve(context).promise();
        });

        var dataLoader = ecodata.forms.dataLoader(context, config);
        dataLoader.getPrepopData(prepopConfig).done(function(result) {
            expect(url).toEqual(config.prepopUrlPrefix+prepopConfig.source.url);
            expect(params.data[0]).toEqual({name:"p1", value:"1"});
            expect(params.data[1]).toEqual({name:"p2", value:"2"});
            expect(params.data[2]).toEqual({name:"p2", value:"3"});
            expect(params.dataType).toEqual('json');

            expect(result).toEqual(context);
        });

    });

    it("Should be able to pre-populated from an object or array literal", function() {
        var context = {
            data: {
                item1: '1',
                item2: '2'
            }
        };

        var prepopConfig = {
            source: {
                literal: {
                    item1:"test"
                }
            },
            mapping: []
        };

        var config = {
            prepopUrlPrefix:'/'
        };

        var dataLoader = ecodata.forms.dataLoader(context, config);
        dataLoader.getPrepopData(prepopConfig).done(function(result) {
            expect(result).toEqual({item1:"test"});
        });
    });

    it("Should should support computing the pre-pop params via an expression", function() {
        var context = {
            data: {
                item1: '1',
                item2: '2'
            }
        };

        var prepopConfig = {
            source: {
                url:'test',
                params: [{
                    "type":"computed",
                    "expression":"2+2",
                    name:"p1",
                }]
            },
            mapping: []
        };

        var config = {
            prepopUrlPrefix:'/'
        };

        var url;
        var params;
        spyOn($, 'ajax').and.callFake(function(p1,p2) {
            url = p1;
            params = p2;
            return $.Deferred().resolve(context).promise();
        });

        var dataLoader = ecodata.forms.dataLoader(context, config);
        dataLoader.getPrepopData(prepopConfig).done(function(result) {
            expect(url).toEqual(config.prepopUrlPrefix+prepopConfig.source.url);
            expect(params.data[0]).toEqual({name:"p1", value:4});
            expect(params.dataType).toEqual('json');

            expect(result).toEqual(context);
        });
    });

    // This prevents making calls that will return errors
    it("Should not make a remote call if required params are undefined", function() {
        var context = {
            data: {
                item1: '1',
                item2: '2'
            }
        };

        var prepopConfig = {
            source: {
                url:'test',
                params: [{
                    "type":"computed",
                    "expression":"x",
                    name:"p1",
                    required:true
                }]
            },
            mapping: []
        };

        var config = {
            prepopUrlPrefix:'/'
        };

        var called = false;

        spyOn($, 'ajax').and.callFake(function(p1,p2) {
            called = true;
        });

        var dataLoader = ecodata.forms.dataLoader(context, config);
        dataLoader.getPrepopData(prepopConfig).done(function(result) {
        });

        expect(called).toEqual(false);
    });
});