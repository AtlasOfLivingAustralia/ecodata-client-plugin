package au.org.ala.ecodata.forms

//import org.codehaus.groovy.grails.plugins.codecs.JavaScriptCodec

import org.grails.encoder.impl.JavaScriptCodec
import java.text.DateFormat
import java.text.SimpleDateFormat

class ModelService {
    static DateFormat ISO8601 = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ")

    def grailsApplication, webService, cacheService, userInfoService

    def activitiesModel() {
        return cacheService.get('activity-model',{
            webService.getJson(grailsApplication.config.getProperty('ecodata.service.url') +
                '/metadata/activitiesModel')
        })
    }

    def getDataModelFromOutputName(outputName) {
        def activityName = getActivityModelName(outputName)
        return activityName ? getDataModel(activityName) : null
    }

    def getDataModel(template) {
        return cacheService.get(template + '-model',{
            webService.getJson(grailsApplication.config.getProperty('ecodata.service.url') +
                    "/metadata/dataModel/${template}")
        })
    }

    def getActivityModelName(outputName) {
        return activitiesModel().outputs.find({it.name == outputName})?.template
    }

    private isNumber(Number value) {
        return true
    }

    private isNumber(String value) {
        return value?.isNumber()
    }

    def evaluateDefaultDataForDataModel(Map dataModel) {
        def value = dataModel.defaultValue
        switch (dataModel.dataType) {
            case 'text':
                if (dataModel.constraints && value && isNumber(value)) {
                    int index = value as Integer
                    if (index < dataModel.constraints.size()) {
                        value = JavaScriptCodec.ENCODER.encode(dataModel.constraints[index])
                        value = "'${value}'"
                    }
                } else if(dataModel.name == 'recordedBy' && !value) {
                    value = "'${userInfoService.getCurrentUserDisplayName()}'"
                }
                else if (value) {
                    value = JavaScriptCodec.ENCODER.encode(value)
                    value = "'${value}'"
                }
                break
            case 'date':
                String now = ISO8601.clone().format(new Date())
                while (value?.contains('${now}')) {
                    value = value.replace('${now}', "'${now}'")
                }
                break
            default:
                break
        }

        return value
    }
}
