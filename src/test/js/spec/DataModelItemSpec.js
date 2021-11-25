describe("DataModelItem Spec", function () {


    var context = {
        parent: {}
    };

    var config = {
        outputName:'Feature_Test'
    };

    it("can produce an identifier for this item if required", function() {

        var metadata = {
            name:'item',
            dataType:'text'
        };

        var dataItem = ko.observable().extend({metadata:{metadata:metadata, context:context, config:config}});
        expect(dataItem.getName()).toBe(metadata.name);

        expect(dataItem.getId()).toBe("Feature_Test-"+metadata.name);
    });

    it("Will defer loading if the constraints are pre-populated to avoid a race condition", function(done) {
        var constraints = ['1', '2', '3'];
        var metadata = {
            name:'item',
            dataType:'text',
            constraints: {
                type:'literal',
                literal: constraints
            }
        };
        var dataItem = ko.observable().extend({metadata:{metadata:metadata, context:context, config:config}});
        dataItem.load("3");

        expect(dataItem.constraints.length).toEqual(constraints.length);
        for (var i=0; i<constraints.length; i++) {
            expect(dataItem.constraints[i]).toEqual(constraints[i]);
        }
        expect(dataItem()).toEqual("3");

        metadata.constraints = {
            type:"pre-populated",
            config: {
                source: {
                    url: '/test'
                }
            }
        };

        var url = null;
        var deferred = null;
        spyOn($, 'ajax').and.callFake(function(p1,p2) {
            url = p1;
            deferred = $.Deferred();
            return deferred;
        });

        dataItem = ko.observable().extend({metadata:{metadata:metadata, context:context, config:config}});
        dataItem.load("2");

        expect(url.endsWith(metadata.constraints.config.source.url)).toBeTruthy();
        // The load should be deferred until the constraints are populated.
        expect(dataItem()).toBeUndefined();

        // Now we fake the return of the ajax call with the constraints.
        deferred.resolve(constraints).then(function() {
            // The constraints should be populated
            expect(dataItem.constraints()).toEqual(constraints);
            // And the load should proceed.
            expect(dataItem()).toEqual("2");

            done();
        });
    });

    it("Can return the label associated with a selected value for a DataModelItem with constraints", function(done) {
        var constraints = ['1', '2', '3'];
        var metadata = {
            name:'item',
            dataType:'text',
            constraints: {
                type:'literal',
                literal: constraints
            }
        };
        var dataItem = ko.observable().extend({metadata:{metadata:metadata, context:context, config:config}});
        dataItem('2');
        expect(dataItem.constraints.label()).toEqual('2')
        expect(dataItem.constraints.label('3')).toEqual('3')
        expect(dataItem.constraints.label("does not exist")).toEqual('');

        var objectConstraints = [{text:'label 1', value:'1'}, {text:'label 2', value:'2'}, {text:'label 3', value:'3'}];
        metadata.constraints = {
            valueProperty:'value',
            textProperty: 'text',
            type:'literal',
            literal:objectConstraints
        };

        dataItem = ko.observable().extend({metadata:{metadata:metadata, context:context, config:config}});
        dataItem('2');
        expect(dataItem.constraints.label()).toEqual('label 2')
        expect(dataItem.constraints.label('3')).toEqual('label 3')
        expect(dataItem.constraints.label("does not exist")).toEqual('');

        metadata.constraints = {
            type:"pre-populated",
            config: {
                source: {
                    url: '/test'
                }
            },
            valueProperty:'value',
            textProperty: 'text'
        };
        var deferred = null;
        spyOn($, 'ajax').and.callFake(function(p1,p2) {
            deferred = $.Deferred();
            return deferred;
        });

        dataItem = ko.observable().extend({metadata:{metadata:metadata, context:context, config:config}});
        dataItem('2');

        deferred.resolve(objectConstraints).then(function() {
            expect(dataItem.constraints.label()).toEqual('label 2')
            expect(dataItem.constraints.label('3')).toEqual('label 3')
            expect(dataItem.constraints.label("does not exist")).toEqual('');

            done();
        });
    });

});