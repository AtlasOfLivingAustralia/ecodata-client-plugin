package au.org.ala.ecodata.forms

import geb.module.Select
import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import pages.PreviewPage

@Integration
class SelectOneSpec extends GebReportingSpec {

    def "We can enter data in selectOne widgets"() {
        when:
        to([name: 'viewSelectOneExample', data:'none'], PreviewPage)

        then:
        title == "Preview SelectOne View Type Example"

        when:
        def select1 = page.findFieldByModelName("textFieldWithConstraints").module(Select)
        select1.selected = "value2"

        def select2 = page.findFieldByModelName("textFieldWithLabelValueConstraints").module(Select)
        select2.selected = "value3"

        then:
        select2.selectedText == "Value 3"

        and: "The model has been updated with the selected values"
        page.model.data.textFieldWithConstraints == "value2"
        page.model.data.textFieldWithLabelValueConstraints == "value3"
    }

    def "Model data is displayed in view mode for select2 view types"() {
        when:
        to ([name:'viewSelectOneExample', mode:'view', data:'viewSelectOneExample'], PreviewPage)

        then:
        title == "Preview SelectOne View Type Example"

        and: "The values from the data model are displayed"
        def span = $("span[data-bind*=textFieldWithConstraints]")
        span[1].text() == "value1" // First  match is a popover

        def span2 = $("span[data-bind*=textFieldWithLabelValueConstraints]")
        span2.text() == "Value 2" // First  match is a popover

        page.findFieldByModelName("item3")*.text() == ["this is a much longer value", "value 3", "value 1"]
    }
}
