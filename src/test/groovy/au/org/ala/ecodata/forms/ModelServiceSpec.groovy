package au.org.ala.ecodata.forms

import grails.testing.services.ServiceUnitTest

//import grails.test.mixin.TestFor
import spock.lang.Specification

//@TestFor(ModelService)
class ModelServiceSpec extends Specification implements ServiceUnitTest<ModelService> {

    def "The default value for a data model item without a defaultValue attribute is null"() {
        setup:
        Map dataModelItem = [name:'textField', dataType:'text']

        when:
        def result = service.evaluateDefaultDataForDataModel(dataModelItem)

        then:
        result == null

        when:
        dataModelItem.constraints = ["c1", "c2"]
        result = service.evaluateDefaultDataForDataModel(dataModelItem)

        then:
        result == null

    }


    def "Default values for items with a dataType of text will be quoted"() {
        setup:
        String defaultValue = "default value"
        Map dataModelItem = [name:'textField', dataType:'text', defaultValue:defaultValue]

        when:
        def result = service.evaluateDefaultDataForDataModel(dataModelItem)

        then:
        result == "'${defaultValue}'"
    }

    def "Default values can be specified as an index into the constraints if supplied"() {
        setup:
        Map dataModelItem = [name:'textField', dataType:'text', defaultValue:"1", constraints:["c1", "c2", "c3", "c4"], defaultValue:"2"]

        when:
        def result = service.evaluateDefaultDataForDataModel(dataModelItem)

        then:
        result == "'c3'"

        when:
        dataModelItem.defaultValue = 1
        result = service.evaluateDefaultDataForDataModel(dataModelItem)

        then:
        result ==  "'c2'"

    }

    def "Default values should be javascript safe"() {
        setup:
        Map dataModelItem = [name:'textField', dataType:'text', defaultValue:"'valueWithQuotes\""]

        when:
        def result = service.evaluateDefaultDataForDataModel(dataModelItem)

        then:
        result == "'\\u0027valueWithQuotes\\u0022'"

    }

}
