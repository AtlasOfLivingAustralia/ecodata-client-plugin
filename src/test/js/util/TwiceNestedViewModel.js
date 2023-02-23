
ecodata.forms.twiceNestedViewModel = [
    {
      "dataType":"number",
      "name":"number1",
    },
    {
        "dataType":"text",
        "name":"notes",
    },
    {
        "dataType":"list",
        "name":"list",
        "columns":[
            {
                "name":"value1",
                "dataType":"text"
            },
            {
                "name":"nestedList",
                "dataType":"list",
                "columns":[
                    {
                        "name":"value2",
                        "dataType":"text"
                    },
                    {
                        "name":"value3",
                        "dataType":"text",
                        "constraints":[
                            "c1", "c2", "c3", "c4"
                        ]
                    }
                ]
            },
        ]
    }
];



/**
 * View Model as would be rendered by the ModelJSTagLib from the above metadata.
 */
ecodata.forms.TwiceNestedViewModel = function (output, dataModel, context, config) {

    var self = this;
    ecodata.forms.OutputModel.apply(self, [output, dataModel, context, config]);

    var listRow = function (data, dataModel, context, config) {
        var self = this;
        ecodata.forms.NestedModel.apply(self, [data, dataModel, context, config]);
        context = _.extend(context, {parent: self});
        self.value1 = ko.observable();

        var nestedListRow = function(data, dataModel, context, config) {
            var self = this;
            ecodata.forms.NestedModel.apply(self, [data, dataModel, context, config]);
            context = _.extend(context, {parent: self});
            self.value2 = ko.observable();
            self.value3 = ko.observable().extend({
                metadata: {
                    metadata: self.dataModel['value3'],
                    context: self.$context,
                    config: config
                }});

            self.loadData = function(data) {
                self.value2(data.value2);
                self.value3(data.value3);
            }

            self.loadData(data || {});
        }

        var context = _.extend({}, context, {
            parent: self,
            listName: 'nestedList'
        });
        self.nestedList = ko.observableArray().extend({
            list: {
                metadata: self.dataModel,
                constructorFunction: nestedListRow,
                context: context,
                userAddedRows: true,
                config: config
            }
        });
        self.nestedList.loadDefaults = function() {
            self.nestedList.addRow();
        };

        self.loadData = function(data) {
            data = data || {};
            self.loadnestedList(data.nestedList);
            self['value1'](ecodata.forms.orDefault(data['value1'], undefined));
        };

        self.loadData(data);

    };

    var context = _.extend({}, context, {parent:self, listName:'list'});
    self.data.list = ko.observableArray().extend({
        list: {
            metadata:self.dataModel,
            constructorFunction:listRow,
            context:context,
            userAddedRows:true,
            config:config
    }});
    self.data.list.loadDefaults = function() {
        self.data.list.addRow();
    };
    self.data.number1 = ko.observable().extend({numeric:2});
    self.data.notes = ko.observable();
    self.loadData = function(data) {
        data = data || {};
        self.loadlist(data.list);
        self.data.number1(data.number1);
        self.data.notes(data.notes);
    };

    self.removeBeforeSave = function(jsData) {
        return jsData;
    }
};