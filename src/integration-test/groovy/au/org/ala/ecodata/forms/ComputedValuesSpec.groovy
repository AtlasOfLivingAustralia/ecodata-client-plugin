package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import pages.PreviewPage
@Integration
class ComputedValuesSpec extends GebReportingSpec {

    def "computed values are evaluated correctly"() {
        when:
        to ([name:'computedValueExample'], PreviewPage)

        then:
        title == "Preview Computed value example"

        and:
        page.findFieldByModelName("item2").getAt(0).value() == "2.00"
        page.findFieldByModelName("item4").getAt(0).value() == "0.00"

        when:
        page.findFieldByModelName("item1").getAt(0).value("10")
        page.commitEdits()

        then:
        page.findFieldByModelName("item2").getAt(0).value() == "12.00"
        page.findFieldByModelName("item4").getAt(0).value() == "0.00"

        when:
        page.findFieldByModelName("item3").getAt(0).value("3")
        page.commitEdits()

        then:
        page.findFieldByModelName("item4").getAt(0).value() == "36.00"

    }

    def "conditional validation can be applied to computed values"() {
        when:
        to ([name:'computedValueWithConditionalValidation'], PreviewPage)

        then:
        title == "Preview Computed value with conditional validation example"

        and:
        page.findFieldByModelName("item2").getAt(0).value() == "2.00"
        page.findFieldByModelName("item4").getAt(0).value() == "0.00"

        when:
        page.findFieldByModelName("item1").getAt(0).value("4")
        page.commitEdits()

        then:
        page.findFieldByModelName("item2").getAt(0).value() == "6.00"

        and: "the validation should have triggered"
        waitFor{ page.findValidationElementForModelName("item2").displayed }
        page.findValidationElementForModelName("item2").children('.formErrorContent').text() == "test message"

        when:
        page.findFieldByModelName("item1").getAt(0).value("0")
        page.commitEdits()

        then:
        page.findFieldByModelName("item2").getAt(0).value() == "2.00"

        and: "the validation should have cleared"
        waitFor{!$('.formErrorContent').displayed}

    }



}
