package au.org.ala.ecodata.forms

import grails.testing.services.ServiceUnitTest

//import grails.test.mixin.TestFor
import spock.lang.Specification

/**
 * Tests the ActivityFormService
 */
//@TestFor(ActivityFormService)
class ActivityFormServiceSpec extends Specification implements ServiceUnitTest<ActivityFormService> {

    EcpWebService webService = Mock(EcpWebService)
   // def grailsApplication = [config:[ecodata:[service:[url:'']]]]
    //def grailsApplicaton =
    def setup() {
        grailsApplication.config.ecodata = [service:[url:'']]
        service.ecpWebService = webService
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
        String description = "test form description"
        String heading = "test heading"
        Map activityForm = [name:name, description:description, collapsibleHeading:heading, formVersion:1, sections:[[name:'output', optional:false, collapsedByDefault:false, optionalQuestionText:null, template:[modelName:'test']]]]

        when:
        def result = service.getActivityAndOutputMetadata(name)

        then:
        1 * webService.getJson({it.endsWith(ActivityFormService.ACTIVITY_FORM_PATH+"?name=test+form")}) >> activityForm
        result.metaModel.name == activityForm.name
        result.metaModel.description == activityForm.description
        result.metaModel.collapsibleHeading == activityForm.collapsibleHeading
        result.metaModel.formVersion == activityForm.formVersion
        result.metaModel.outputs.size() == 1
        result.metaModel.outputs[0] == activityForm.sections[0].name
        result.metaModel.outputConfig.size() == 1
        result.metaModel.outputConfig[0].outputName == activityForm.sections[0].name
        result.outputModels == [output:[modelName:'test']]

    }

    void "the service will return a templated error message when a form is not found"() {
        setup:
        String name = "test form"

        when:
        def result = service.getActivityAndOutputMetadata(name)

        then:
        1 * webService.getJson({it.endsWith(ActivityFormService.ACTIVITY_FORM_PATH+"?name=test+form")}) >> [statusCode:404, error:"not found"]
        result.metaModel.name == "Not found"
        result.metaModel.outputs.size() == 1
        result.metaModel.outputs[0] == "Not found"

        result.outputModels["Not found"] != null
    }

    void "The service can interface to ecodata to search available activity forms"() {
        when:
        service.searchActivityForms([type:'Protocol'])

        then:
        1 * webService.doPost({it.endsWith(ActivityFormService.ACTIVITY_FORM_SEARCH_PATH)}, [type:'Protocol'])
    }
}
