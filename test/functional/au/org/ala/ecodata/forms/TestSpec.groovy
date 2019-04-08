package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import pages.PreviewPage

class TestSpec extends GebReportingSpec {

    def "test this!"() {
        when:
        to PreviewPage

        then:
        title == "Preview Test Output"
        page.model != null

        when:
        page.findFieldByModelName("textField").value("value1")
        page.commitEdits()


        then:
        page.findFieldByModelName("textField").getAt(0).value() == "value1"
        page.findFieldByModelName("textField").getAt(1).value() == "value1"

        page.model.data.textField == "value1"
    }


    def "number fields should allow decimals by default"() {
        when:
        to PreviewPage

        then:
        title == "Preview Test Output"
        page.model != null

        when:
        page.findFieldByModelName("numberField").value("1.03")


        then:
        page.findFieldByModelName("numberField").getAt(0).value() == "1.03"
        page.commitEdits()

        page.model.data.numberField == "1.03"

        and: "The HTML5 validation psuedo class has not been applied"
        // Note the :invalid selector won't work with the HTMLUnit driver.
        $(":invalid").size() == 0
    }

    def "prepopulation can be configured as a URL"() {
        when:
        to ([name:'prepopFromURLExample'], PreviewPage)

        then:
        title == "Preview Prepop from URL example"

        and: "the prepopulation has populated the fields on the page"
        page.findFieldByModelName("item1").getAt(0).value() == "1"
        page.findFieldByModelName("item2").getAt(0).value() == "2"

    }

    def "feature map smoke test"() {
        when:
        to ([name:'featureModel'], PreviewPage)

        then:
        title == "Preview Feature Test"

        when:
        page.findFeatureMapButtonByModelName("feature").first().click()

        then:
        page.featureMapDialog.displayed == true

    }

    def "default values smoke test"() {
        when:
        to ([name:'defaultValues'], PreviewPage)

        then:
        title == "Preview Default values"

        and:
        page.findFieldByModelName("textField").getAt(0).value() == "Text Field"
        page.findFieldByModelName("textFieldWithConstraints").getAt(0).value() == "value2"
        page.findFieldByModelName("numberField").getAt(0).value() == "10"
    }

    def "computed values are evaluated correctly"() {
        when:
        to ([name:'computedValueExample'], PreviewPage)

        then:
        title == "Preview Computed value example"

        and:
        page.findFieldByModelName("item2").getAt(0).text() == "2.00"
        page.findFieldByModelName("item4").getAt(0).value() == "0.00"

        when:
        page.findFieldByModelName("item1").getAt(0).value("10")
        page.commitEdits()

        then:
        page.findFieldByModelName("item2").getAt(0).text() == "12.00"
        page.findFieldByModelName("item4").getAt(0).value() == "0.00"

        when:
        page.findFieldByModelName("item3").getAt(0).value("3")
        page.commitEdits()

        then:
        page.findFieldByModelName("item4").getAt(0).value() == "36.00"

    }

}
