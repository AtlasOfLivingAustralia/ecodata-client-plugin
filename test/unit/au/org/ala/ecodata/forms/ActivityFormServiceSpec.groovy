package au.org.ala.ecodata.forms

import grails.test.mixin.TestFor
import spock.lang.Specification

/**
 * Tests the ActivityFormService
 */
@TestFor(ActivityFormService)
class ActivityFormServiceSpec extends Specification {

    WebService webService = Mock(WebService)
    def grailsApplication = [config:[ecodata:[service:[url:'']]]]
    def setup() {
        service.webService = webService
        service.grailsApplication = grailsApplication
    }

    def cleanup() {
    }

    void "the service can fetch activity forms from ecodata"() {
        setup:
        String name = "test form"
        Integer version = 1

        when:
        service.findActivityForm(name, version)

        then:
        1 * webService.getJson({it.endsWith(ActivityFormService.ACTIVITY_FORM_PATH+"?name=test+form&formVersion=1")})

        when:
        service.findActivityForm(name)

        then:
        1 * webService.getJson({it.endsWith(ActivityFormService.ACTIVITY_FORM_PATH+"?name=test+form")})
    }

    void "the service will produce a backwards compatible response after retrieving a form"() {
        setup:
        String name = "test form"
        Map activityForm = [name:name, formVersion:1, sections:[[name:'output', optional:false, collapsedByDefault:false, optionalQuestionText:null, template:[modelName:'test']]]]

        when:
        def result = service.getActivityAndOutputMetadata(name)

        then:
        1 * webService.getJson({it.endsWith(ActivityFormService.ACTIVITY_FORM_PATH+"?name=test+form")}) >> activityForm
        result.metaModel.name == activityForm.name
        result.metaModel.formVersion == activityForm.formVersion
        result.metaModel.outputs.size() == 1
        result.metaModel.outputs[0] == activityForm.sections[0].name
        result.metaModel.outputConfig.size() == 1
        result.metaModel.outputConfig[0].outputName == activityForm.sections[0].name
        result.outputModels == [output:[modelName:'test']]

    }
}
