package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import pages.PreviewPage


@Integration
class TestSpec extends GebReportingSpec {

    def grailsApplication

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
        waitFor {
            page.findFieldByModelName("item1").getAt(0).value() == "1"
            page.findFieldByModelName("item2").getAt(0).value() == "2"

        }

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

    def "default values can be specified as an expression"() {
        when:
        to ([name:'defaultValueExpression'], PreviewPage)

        then:
        title == "Preview Default value expression example"

        and: "the default value for item 2 has been evaluated at 2 * item1"
        page.findFieldByModelName("item2").getAt(0).value() == "2.00"
        and: "the default value for item 4 has been evaluated at item2 * item3"
        page.findFieldByModelName("item4").getAt(0).value() == "4.0000"

        when: "item 1 is changed"
        page.findFieldByModelName("item1").getAt(0).value("3")
        page.commitEdits()

        then: "the default values for item2 and item4 are updated"
        page.findFieldByModelName("item2").getAt(0).value() == "6.00"
        page.findFieldByModelName("item4").getAt(0).value() == "12.0000"


        when: "The value for item2 is manually overwritten"
        page.findFieldByModelName("item2").getAt(0).value("1")
        page.findFieldByModelName("item1").getAt(0).value("4")
        page.commitEdits()

        then: "it won't update after item1 changes"
        page.findFieldByModelName("item2").getAt(0).value() == "1"

        when: "The value for item4 is manually overwritten"
        page.findFieldByModelName("item4").getAt(0).value("1")
        page.findFieldByModelName("item3").getAt(0).value("4")
        page.commitEdits()

        then: "it won't update after item3 changes"
        page.findFieldByModelName("item4").getAt(0).value() == "1"
    }


    def "validation can be computed in various ways"() {
        when:
        to ([name:'validationExample'], PreviewPage)

        then:
        title == "Preview Validation example"

        and: "Item 1 has the default validation expression"
        page.findFieldByModelName("item1").getAttribute("data-validation-engine") == "validate[min[0]]"

        and: "Item 2 has a validation expression computed from item1"
        page.findFieldByModelName("item2").getAttribute("data-validation-engine") == "validate[max[0.00]]"

        when:
        page.findFieldByModelName("item1").getAt(0).value("1")
        page.commitEdits()

        then:
        page.findFieldByModelName("item2").getAttribute("data-validation-engine") == "validate[max[3.00]]"

        when:
        page.findFieldByModelName("item2").getAt(0).value("1")
        page.commitEdits()

        then:
        page.findFieldByModelName("item1").getAttribute("data-validation-engine") == "validate[required,custom[integer],min[1]]"

    }

    def "table columns support nested layouts"() {
        when:
        to ([name:'stackedTableColumnExample'], PreviewPage)

        then:
        title == "Preview Stacked table columns example"

        when:
        page.findFieldByModelName("value1").value("test 1")
        page.findFieldByModelName("value2").value("test 2")
        page.commitEdits()

        then:
        page.model.data.exampleList[0].value1 == "test 1"
        page.model.data.exampleList[0].value2 == "test 2"

    }

    def "we can render model items as read only text in a span using the readonlyText view type"() {
        when:
        to ([name:'viewReadonlyTextExample'], PreviewPage)

        then:
        title == "Preview Readonly View Type Example"

        and:
        page.findFieldByModelName("notes").text() == "Default Value"
    }
}
