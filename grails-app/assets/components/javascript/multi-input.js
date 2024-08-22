ko.components.register('multi-input', {
    viewModel: function(params) {
        var self = this;

        self.observableValues = ko.observableArray();
        self.addValueText = params.addValueText;

        // This method updates the values parameter with the contents of the managed array.
        function syncValues() {
            var rawValues = [];
            for (var i=0; i<self.observableValues().length; i++) {
                rawValues.push(self.observableValues()[i].val());
            }
            params.values(rawValues);
        }

        function newValue(value) {
            var observable = ko.observable(value || '');
            observable.subscribe(syncValues);
            self.observableValues.push({val:observable});
        }

        self.addValue = function() {
            newValue();
        };

        self.removeValue = function(value) {
            self.observableValues.remove(value);
        };

        if (params.values()) {
            for (var i=0; i<params.values().length; i++) {
                newValue(params.values()[i]);
            }
        }

        self.observableValues.subscribe(syncValues);
    },
    template: componentService.getTemplate('multi-input')
});