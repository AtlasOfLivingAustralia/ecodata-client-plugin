
ecodata.forms.simpleFeatureViewModelMetadata = [
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

];

/**
 * View Model as would be rendered by the ModelJSTagLib from the above metadata.
 */
ecodata.forms.SimpleFeatureViewModel = function (output, dataModel, context, config) {

    var self = this;
    ecodata.forms.OutputModel.apply(self, [output, dataModel, context, config]);

    self.data.feature = ko.observable().extend({feature:context}).extend({metadata:{metadata:self.dataModel['feature'], context:self.$context, config:config}});
    self.data.areaHa = ko.computed(function () {
        return ecodata.forms.expressionEvaluator.evaluate('$geom.areaHa(feature)', self.data, 2);
    });

    self.data.lengthKm = ko.computed(function () {
        return ecodata.forms.expressionEvaluator.evaluate('$geom.lengthKm(feature)', self.data, 2);
    });

    self.loadData = function(data) {
        self.data['feature'].loadData(ecodata.forms.orDefault(data['feature'], undefined));
    };

    self.removeBeforeSave = function(jsData) {
        return jsData;
    }
};