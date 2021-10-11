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

});