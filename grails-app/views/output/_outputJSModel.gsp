<asset:script>
    <g:set var="outputNameAsIdentifer" value="${md.toSingleWord([name: outputName+(formVersion?:'')])}"/>

    ecodata.forms["${outputNameAsIdentifer + 'ViewModel'}"] = function (output, dataModel, context, config) {

        var self = this;

        // load dynamic models - usually objects in a list
        <md:jsModelObjects model="${model}" site="${site}" edit="${edit}" printable="${printable?:''}"/>
        ecodata.forms.OutputModel.apply(self, [output, dataModel, context, config]);

        // add declarations for dynamic data
        <md:jsViewModel model="${model}"  output="${outputName}"  edit="${edit}" printable="${printable?:''}" readonly="${!edit}" surveyName="${surveyName}"/>

        // this will be called when generating a savable model to remove transient properties
        self.removeBeforeSave = function (jsData) {

            <md:jsRemoveBeforeSave model="${model}"/>
            return self.removeTransients(jsData);
        };
    };
</asset:script>
