<asset:script>
<g:set var="outputNameAsIdentifer" value="${md.toSingleWord([name: outputName])}"/>
ecodata.forms["${raw(outputNameAsIdentifer + 'ViewModel')}"] = function (output, dataModel, context, config) {
    var self = this;
    var site = context.site || {};
    self.name = output.name;
    self.outputId = output.outputId;
    self.data = {};
    self.transients = {};
    self.transients.dummy = ko.observable();


    // load dynamic models - usually objects in a list
    <md:jsModelObjects model="${model}" site="${site}" edit="${edit}" printable="${printable?:''}" output="${outputName}"/>
    ecodata.forms.OutputModel.apply(self, [output, dataModel, context, config]);

    // add declarations for dynamic data
    <md:jsViewModel model="${model}"  output="${outputName}"  edit="${edit}" printable="${printable?:''}" readonly="${readonly}" surveyName="${surveyName}"/>

    // this will be called when generating a savable model to remove transient properties
    self.removeBeforeSave = function (jsData) {
        <md:jsRemoveBeforeSave model="${model}"/>
        return self.removeTransients(jsData);
    };

    self.reloadGeodata = function() {
        console.log('Reloading geo fields')
        // load dynamic data
        <md:jsReloadGeoModel model="${model}" output="${outputName}"/>
    }
};
</asset:script>