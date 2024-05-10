describe('MetaModel', function() {
    var metaModel;
    var metaModelInstance;

    beforeEach(function() {
        // Create a sample metaModel for testing
        metaModel = {
            outputModels: {
                output1: {
                    dataModel: [
                        { name: 'data1', dataType: 'type1' },
                        { name: 'data2', dataType: 'type2' },
                        { name: 'data5',
                            dataType: 'type5',
                            columns: [
                                { name: 'data6', dataType: 'type6' },
                                { name: 'data7', dataType: 'type7' }
                            ]
                        },
                    ],
                },
                output2: {
                    dataModel: [
                        { name: 'data3', dataType: 'type1' },
                        { name: 'data4', dataType: 'type2' },
                    ],
                },
            },
        };

        // Create an instance of MetaModel
        metaModelInstance = new MetaModel(metaModel);
    });

    it('should return data for a specific type', function() {
        var activity = {
            outputs: [
                { name: 'output1', data: {data1: 'value1', data2: "value2", data5: [{data6: "value6", data7: "value7"}, {data6: "value61", data7: "value71"}, {data6: "value62", data7: "value72"}]} },
                { name: 'output2', data: {data3: 'value3', data4: "value4"} }
            ],
        };

        var result = metaModelInstance.getDataForType('type1', activity);

        expect(result).toEqual(['value1', 'value3']);

        var result = metaModelInstance.getDataForType('type6', activity);

        expect(result).toEqual(['value6', 'value61', 'value62']);

    });

    it('should return names for a specific type', function() {
        var result = metaModelInstance.getNamesForDataType('type1');

        expect(result).toEqual({
            output1: { data1: true },
            output2: { data3: true },
        });

        result = metaModelInstance.getNamesForDataType('type6');

        expect(result).toEqual({
            output1: { data5: {data6: true} },
            output2: {}
        });

    });

    it('should update data for specific sources', function() {
        var activity = {
            outputs: [
                { name: 'output1', data: {data1: 'value1', data2: "value2", data5: [{data6: "value6", data7: "value7"}, {data6: "value61", data7: "value71"}, {data6: "value62", data7: "value72"}]} },
                { name: 'output2', data: {data3: 'value3', data4: "value4"} }
            ],
        };

        var dataToUpdate = 'new value';

        metaModelInstance.updateDataForSources({
            output1: { data5: {data6: true} }
        }, activity, dataToUpdate);

        expect(activity.outputs[0].data.data5[0].data6).toEqual('new value');
        expect(activity.outputs[0].data.data5[1].data6).toEqual('new value');
        expect(activity.outputs[0].data.data5[2].data6).toEqual('new value');
    });
});
