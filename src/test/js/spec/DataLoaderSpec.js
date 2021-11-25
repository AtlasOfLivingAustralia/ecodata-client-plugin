describe("DataLoader Spec", function () {

    it ("should be able to merge prepop data", function() {
        var context = {
            some: {
                notes:'test',
                soilSampleCollected:true
            }
        };

        var data = {
            some: {
                notes:'test 2'
            }
        };

        var dataLoader = ecodata.forms.dataLoader({}, {});
        var result = dataLoader.merge(data, context);

        expect(result.some.notes).toEqual('test 2');
        expect(result.some.soilSampleCollected).toEqual(true);
    });

    it ("should be able to merge arrays", function() {
        var context = {
            notes:'test',
            surveyResultsFlora:[{
                health:'good',
                plotId:'1'
            },
                {
                    health:"fair",
                    plotId:'2'
                }]
        };

        var data = {
            some: {
                notes:'test 2'
            }
        };

        var dataLoader = ecodata.forms.dataLoader({}, {});

        var result = dataLoader.merge(data, context);

        expect(result.some.notes).toEqual('test 2');
        expect(result.surveyResultsFlora).toEqual(context.surveyResultsFlora);
    });

    it ("will merge arrays using the array index as the key by default", function() {
        var context = {
            notes:'test',
            surveyResultsFlora:[{
                health:'good',
                plotId:'1'
            }, {
                health:"fair",
                plotId:'2'
            }]
        };

        var data = {
            notes:'test 2',
            surveyResultsFlora:[{
                health:'fair'
            }]
        };

        var dataLoader = ecodata.forms.dataLoader({}, {});

        var result = dataLoader.merge(data, context);

        expect(result.notes).toEqual('test 2');
        expect(result.surveyResultsFlora).toEqual([{health:'fair', plotId:'1'}]);
    });

    it("can merge arrays based on extra configuration information if supplied", function() {

        // This behaviour is used when a form is prepopulated from a list of configuration,
        // for example outcomes or targets from the MERI plan.  If the user has already begun to
        // edit the form and the data from the MERI plan changes, we should attempt to match the
        // existing data with the new information if possible.
        var prepopdata = {
            value:'test',
            array:[
                {
                    target:'target 1',
                    targetMeasure: 10,
                    achieved: 20
                },
                {
                    target:"target 2",
                    targetMeasure: 20,
                    achieved: 5
                },
                {
                    target:"target 3",
                    targetMeasure: 30,
                    achieved: 10
                }
            ]
        };

        var data = {
            value:'test 2',
            array:[
                {
                    target:'target 1',
                    targetMeasure: 11,
                    achieved: 30,
                    comment:'comment for target 1'
                },
                {
                    target:"target 2",
                    targetMeasure: 25,
                    achieved: 3,
                    comment: 'comment for target 2'
                },
                {
                    target:"target 3",
                    targetMeasure: 30,
                    achieved: 10,
                    comment: 'comment for target 3'
                },
                {
                    target:"target 4",
                    targetMeasure: 40,
                    achieved: 10,
                    comment: 'comment for target 4'
                }]
        };

        var rules = {
            array:{
                keys:["target"],
                addUnmatchedNewRows : true,
                deleteUnmatchedExistingRows : true,

                targetMeasure:{
                    replaceExisting:true
                },
                achieved:{
                    replaceExisting:true
                }
            }
        };

        var dataLoader = ecodata.forms.dataLoader({}, {});

        var result = dataLoader.merge(data, prepopdata, {}, rules);

        expect(result.value).toEqual('test 2');
        expect(result.array.length).toEqual(3);

        expect(result.array[0].target).toEqual('target 1');
        expect(result.array[0].targetMeasure).toEqual(10);
        expect(result.array[0].achieved).toEqual(20);
        expect(result.array[0].comment).toEqual('comment for target 1');

        expect(result.array[1].target).toEqual('target 2');
        expect(result.array[1].targetMeasure).toEqual(20);
        expect(result.array[1].achieved).toEqual(5);
        expect(result.array[1].comment).toEqual('comment for target 2');

        expect(result.array[2].target).toEqual('target 3');
        expect(result.array[2].targetMeasure).toEqual(30);
        expect(result.array[2].achieved).toEqual(10);
        expect(result.array[2].comment).toEqual('comment for target 3');


        rules.array.deleteUnmatchedExistingRows = false;
        result = dataLoader.merge(data, prepopdata, {}, rules);

        expect(result.value).toEqual('test 2');
        expect(result.array.length).toEqual(4);

        expect(result.array[0].target).toEqual('target 1');
        expect(result.array[0].targetMeasure).toEqual(10);
        expect(result.array[0].achieved).toEqual(20);
        expect(result.array[0].comment).toEqual('comment for target 1');

        expect(result.array[1].target).toEqual('target 2');
        expect(result.array[1].targetMeasure).toEqual(20);
        expect(result.array[1].achieved).toEqual(5);
        expect(result.array[1].comment).toEqual('comment for target 2');

        expect(result.array[2].target).toEqual('target 3');
        expect(result.array[2].targetMeasure).toEqual(30);
        expect(result.array[2].achieved).toEqual(10);
        expect(result.array[2].comment).toEqual('comment for target 3');

        expect(result.array[3].target).toEqual('target 4');
        expect(result.array[3].targetMeasure).toEqual(40);
        expect(result.array[3].achieved).toEqual(10);
        expect(result.array[3].comment).toEqual('comment for target 4');

    });

    it("can merge arrays based on extra configuration information if supplied", function() {

        // This behaviour is used when a form is prepopulated from a list of configuration,
        // for example outcomes or targets from the MERI plan.  If the user has already begun to
        // edit the form and the data from the MERI plan changes, we should attempt to match the
        // existing data with the new information if possible.
        var prepopdata = {
            value:'test',
            array:[
                {
                    target:'target 1',
                    targetMeasure: 10,
                    achieved: 20
                },
                {
                    target:"target 2",
                    targetMeasure: 20,
                    achieved: 5
                },
                {
                    target:"target 3",
                    targetMeasure: 30,
                    achieved: 10
                },
                {
                    target:"target 4",
                    targetMeasure: 41,
                    achieved: 11
                }
            ]
        };

        var data = {
            value:'test 2',
            array:[
                {
                    target:"target 2",
                    targetMeasure: 25,
                    achieved: 3,
                    comment: 'comment for target 2'
                },
                {
                    target:"target 4",
                    targetMeasure: 40,
                    achieved: 10,
                    comment: 'comment for target 4'
                }]
        };

        var rules = {
            array:{
                keys:["target"],
                addUnmatchedNewRows : true,
                deleteUnmatchedExistingRows : true,

                targetMeasure:{
                    replaceExisting:true
                },
                achieved:{
                    replaceExisting:true
                },
                sort:true
            }
        };

        var dataLoader = ecodata.forms.dataLoader({}, {});

        var result = dataLoader.merge(data, prepopdata, {}, rules);

        expect(result.value).toEqual('test 2');
        expect(result.array.length).toEqual(4);

        expect(result.array[0].target).toEqual('target 1');
        expect(result.array[0].targetMeasure).toEqual(10);
        expect(result.array[0].achieved).toEqual(20);
        expect(result.array[0].comment).toBeUndefined();

        expect(result.array[1].target).toEqual('target 2');
        expect(result.array[1].targetMeasure).toEqual(20);
        expect(result.array[1].achieved).toEqual(5);
        expect(result.array[1].comment).toEqual('comment for target 2');

        expect(result.array[2].target).toEqual('target 3');
        expect(result.array[2].targetMeasure).toEqual(30);
        expect(result.array[2].achieved).toEqual(10);
        expect(result.array[2].comment).toBeUndefined();

        expect(result.array[3].target).toEqual('target 4');
        expect(result.array[3].targetMeasure).toEqual(41);
        expect(result.array[3].achieved).toEqual(11);
        expect(result.array[3].comment).toEqual('comment for target 4');
    });


});