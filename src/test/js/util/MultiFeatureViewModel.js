
ecodata.forms.multiFeatureViewModelMetadata = [
    {
        dataType:"list",
        name:"features",
        columns:[
            {
                name:'feature',
                dataType:'feature'
            },
            {
                name:'areaHa',
                dataType:'number',
                computed:{
                    expression:'feature.areaHa'
                }
            },
            {
                name:'lengthKm',
                dataType:'number',
                computed:{
                    expression:'feature.lengthKm'
                }
            }
        ]
    }

];

/**
 * View Model as would be rendered by the ModelJSTagLib from the above metadata.
 */
ecodata.forms.MultiFeatureViewModel = function (output, dataModel, context, config) {

    var self = this;
    ecodata.forms.OutputModel.apply(self, [output, dataModel, context, config]);

    var featuresRow = function (data, dataModel, context, config) {
        var self = this;
        ecodata.forms.NestedModel.apply(self, [data, dataModel, context, config]);
        context = _.extend(context, {parent: self});
        self.feature = ko.observable().extend({
            metadata: {
                metadata: self.dataModel['feature'],
                context: self.$context,
                config: config
            }
        }).extend({feature: context});

        self.test = ko.observable('test');
        self.loadData = function(data) {
            data = data || {};
            self['feature'].loadData(ecodata.forms.orDefault(data['feature'], undefined));
        };

        self.loadData(data);

    };

    var context = _.extend({}, context, {parent:self, listName:'features'});
    self.features = ko.observableArray().extend({list:{metadata:self.dataModel, constructorFunction:featuresRow, context:context, userAddedRows:true, config:config}});
    self.features.loadDefaults = function() {
        self.features.addRow();
    };
    self.loadData = function(data) {
        data = data || {};
        self.loadfeatures(data.features);
    };

    self.removeBeforeSave = function(jsData) {
        return jsData;
    }
};