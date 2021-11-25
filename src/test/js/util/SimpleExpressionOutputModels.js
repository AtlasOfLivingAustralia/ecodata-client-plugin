ecodata.forms.SimpleExpressionViewModel = function (output, dataModel, context, config) {

    var self = this;
    ecodata.forms.OutputModel.apply(self, [output, dataModel, context, config]);

    self.data.totalArea = ko.observable().extend({numericString:2});
    self.data.percentApplied = ko.observable().extend({numericString:2});
    self.data.affectedArea = ko.computed(function () {
        return ecodata.forms.expressionEvaluator.evaluate('totalArea*percentApplied/100', self.data, 2);
    });

    self.loadData = function(data) {
        self.data['totalArea'](ecodata.forms.orDefault(data['totalArea'], undefined));
        self.data['percentApplied'](ecodata.forms.orDefault(data['percentApplied'], undefined));
    };
};


nestedExpressionDataModel = [
    {
        "name":"nested",
        "dataType":"list",
        "columns":[
            {
                "name": "totalArea",
                "dataType": "number"
            },
            {
                "name": "percentApplied",
                "dataType": "number"
            },
            {
                "name": "affectedArea",
                "dataType": "number",
                "computed": {
                    "expression":"totalArea*percentApplied/100",
                    "source":[
                        "totalArea",
                        "percentApplied"
                    ]
                }
            }

        ]
    }
];

ecodata.forms.NestedExpressionViewModel = function (output, dataModel, context, config) {

    var self = this;
    ecodata.forms.OutputModel.apply(self, [output, dataModel, context, config]);

    var NestedExpressionViewModelRow = function (data, dataModel, context, config) {
        var self = this;
        ecodata.forms.NestedModel.apply(self, [data, dataModel, context, config]);

        self.totalArea = ko.observable().extend({numericString:2});
        self.percentApplied = ko.observable().extend({numericString:2});
        self.affectedArea = ko.computed(function () {
            return ecodata.forms.expressionEvaluator.evaluate('totalArea*percentApplied/100', self, 2);
        });
        self.loadData = function(data) {
            self['totalArea'](ecodata.forms.orDefault(data['totalArea'], undefined));
            self['percentApplied'](ecodata.forms.orDefault(data['percentApplied'], undefined));
        };
        self.loadData(data || {});
    };

    var nestedContext = _.extend({}, context, {parent:self, listName:'nested'});
    self.data.nested = ko.observableArray().extend({list:{metadata:self.dataModel, constructorFunction:NestedExpressionViewModelRow, context:nestedContext, userAddedRows:true, config:config}});

    self.loadData = function(data) {
        self.loadnested(data.nested);
    };
};