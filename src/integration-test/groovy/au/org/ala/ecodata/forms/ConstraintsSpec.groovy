package au.org.ala.ecodata.forms

import geb.module.Checkbox
import geb.module.Select
import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import pages.PreviewPage

@Integration
class ConstraintsSpec extends GebReportingSpec {

    def "Constraints can be specified such that each constraint may be selected only once on a form"() {
        when:
        to ([name:'constraintsExample', data:'none'], PreviewPage)

        then:
        title == "Preview Constraints example"
        page.model != null

        when: "We first enter the page, the select configured as one value per form has all constraints available"
        def selectValue2 = page.findFieldByModelName("value2").module(Select)

        then:
        selectValue2.find("option")*.value() == ['', 'c1', 'c2', 'c3', 'c4']

        when: "We select a value from a value1 select"
        selectValue2.selected = 'c2'
        page.addTableRow("nestedList")
        def value2List = page.findFieldByModelName("value2")

        then: "that value should be unavailable for other instances of value1"
        value2List[1].find("option")*.value() == ['', 'c1', 'c3', 'c4']

    }

    def "Constraints can be specified such that they take their values from selections of other fields "() {
        when:
        to ([name:'constraintsExample', data:'none'], PreviewPage)

        then:
        title == "Preview Constraints example"
        page.model != null

        when: "We first enter the page, the checkboxes configured to obtain options from value2 will have only the default"
        def checkboxValue3 = $("[name=value3-0]").module(Checkbox)

        then:
        checkboxValue3.attr('value') == "Default value"
        !checkboxValue3.checked

        when: "We select something from value2"
        def selectValue2 = page.findFieldByModelName("value2").module(Select)
        selectValue2.selected = 'c3'

        then: "That value becomes available for selection in our field"
        def checkboxValue3Number2 = $("[name='value3-0']")
        checkboxValue3Number2*.attr('value') == ['Default value', 'c3']

    }
}
