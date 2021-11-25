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
            expect(params.data.p1).toEqual("1");
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
});