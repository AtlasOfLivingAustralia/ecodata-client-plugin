describe("lookup table spec", function () {
    it("Can accept a literal lookup table", function() {

        var config = {
            source:{
                literal:{
                    'test1':'value1',
                    'test2':'value2'
                },
            }
        };
        var context = {};
        var lookupTable = new ecodata.forms.LookupTable(context, config);

        // This is done to wait for the prepop to resolve.
        return new Promise(function(resolve) {
            setTimeout(function() {
                expect(lookupTable.lookupValue('test1')).toEqual('value1');
                expect(lookupTable.lookupValue('test2')).toEqual('value2');
                resolve();
            });
        });
    });

    it("can update the lookup table based on some other criteria", function() {

        var config = {
            source: {
                url:'test',
                params: [{
                    name:"p1",
                    value:"1"
                }]
            },
            prepopUrlPrefix:'/'
        };

        var resp = {
            'test1':'value1',
            'test2':'value2'
        };

        var url;
        var params;
        spyOn($, 'ajax').and.callFake(function(p1,p2) {
            url = p1;
            params = p2;
            return $.Deferred().resolve(resp).promise();
        });

        var context = {};
        var lookupTable = new ecodata.forms.LookupTable(context, config);


        // This is done to wait for the prepop to resolve.
        return new Promise(function(resolve) {
            lookupTable.initialization.done(function() {
                expect(lookupTable.lookupValue('test1')).toEqual('value1');
                expect(lookupTable.lookupValue('test2')).toEqual('value2');
                expect(url).toEqual(config.prepopUrlPrefix+config.source.url);
                resolve();
            });
        });

    });
});