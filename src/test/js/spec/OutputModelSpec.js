describe("OutputModel Spec", function () {

    var config = {
        model:{
            'pre-populate':[{

                "source": {
                    "context-path": ""
                },
                "mapping": [{
                    "target": "notes",
                    "source-path": "some.notes"
                }]
            }]
        },

        searchBieUrl:''
    };



    beforeAll(function() {
        window.fcConfig = {};
    });
    afterAll(function() {
        delete window.fcConfig;
    });

    it("should allow the output model to be populated from supplied data", function () {
        var model = new Flora_Survey_Details_ViewModel({name:"Flora Survey Details"}, {},  {}, config);

        model.loadData({
            notes:'test'
        });

        expect(model.data.notes()).toEqual("test");


    });


    it("should allow the output model to be populated by the pre-populate configuration if no output data is supplied", function(done) {

        var context = {
            some: {
                notes:'test'
            }
        };
        var model = new Flora_Survey_Details_ViewModel({name:"Flora Survey Details"}, {}, context, config);

        model.initialise().done(function(result) {
            expect(model.data.notes()).toEqual("test");
            done();
        });


    });

    it("should use supplied output data in preference to pre-populate data", function(done) {

        var context = {
            some: {
                notes:'test'
            }
        };

        var model = new Flora_Survey_Details_ViewModel({name:"Flora Survey Details"}, {}, context, config);

        model.initialise({notes:'test 2'}).done(function(result) {

            expect(model.data.notes()).toEqual("test 2");
            done();
        });

    });


    var nestedViewModelData = {
        "name": "Nested lists",
        "data": {
            "number1": "3",
            "notes": "notes",
            "list": [
                {
                    "value1": "0.value1",
                    "nestedList": [
                        {
                            "value2": "0.0.value2"
                        },
                        {
                            "value2": "0.1.value2"
                        }
                    ]
                },
                {
                    "value1": "1.value1",
                    "nestedList": [
                        {
                            "value2": "1.0.value2"
                        },
                        {
                            "value2": "1.1.value2"
                        },
                        {
                            "value2": "1.2.value2"
                        }
                    ]
                }
            ]
        }
    };

    it("The eachValueForPath method can correctly handle properties inside nested lists", function() {
        var model = new ecodata.forms.TwiceNestedViewModel(
            {name:"TwiceNestedViewModel"}, ecodata.forms.twiceNestedViewModel, {}, {});
        model.loadData(nestedViewModelData.data);

        var values = [];
        model.eachValueForPath("list.nestedList.value2", function(val) {values.push(val) });

        expect(values).toEqual(['0.0.value2', '0.1.value2', '1.0.value2', '1.1.value2', '1.2.value2']);

        values = [];
        model.iterateOverPath(['list', 'nestedList', 'value2'], function(val) { values.push(val) }, nestedViewModelData.data);

        expect(values).toEqual(['0.0.value2', '0.1.value2', '1.0.value2', '1.1.value2', '1.2.value2']);

        values = [];
        model.eachValueForPath('list.value1', function(val) { values.push(val) });

        expect(values).toEqual(['0.value1', '1.value1']);

        values = [];
        model.eachValueForPath('notes', function(val) { values.push(val) });
        expect(values).toEqual(['notes']);
    });

});