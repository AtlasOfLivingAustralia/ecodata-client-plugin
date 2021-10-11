package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import pages.PreviewPage

@Integration
class Select2Spec extends GebReportingSpec {

    def "We can enter data into select2 dropdowns"() {
        when:
        to ([name:'select2Example', data:'none'], PreviewPage)

        then:
        title == "Preview Select2 example"
        page.model != null

        and: "configured placeholders are displayed"
        def item1 = page.findFieldByModelName("item1")
        item1.next().find(".select2-selection__placeholder").text() == "Please select..."
        def item2 = page.findFieldByModelName("item2")
        item2.next().find(".select2-selection__placeholder").text() == "Custom placeholder"
        def item3 = page.findFieldByModelName("item3")
        item3.next().find("input.select2-search__field").attr("placeholder") == "Custom placeholder"
        def item4 = page.findFieldByModelName("item4")
        item4.next().find(".select2-selection__placeholder").text() == "Please select..."
        def item5 = page.findFieldByModelName("item5")
        item5.next().find(".select2-selection__placeholder").text() == "Custom placeholder"
        def item6 = page.findFieldByModelName("item6")
        item6.next().find("input.select2-search__field").attr("placeholder") == "Select all that apply..."

        when: "We enter data into the fields"
        page.findFieldByModelName("item1").value("value 1")
        page.findFieldByModelName("item2").value("value 2")
        page.findFieldByModelName("item3").value(["value 1", "value 3"])
        page.findFieldByModelName("item4").value("this is a much longer value")
        page.findFieldByModelName("item5").value("value 2")
        page.findFieldByModelName("item6").value(["value 2", "value 3"])


        then: "The model has been updated with the selected values"
        page.model.data.item1 == "value 1"
        page.model.data.item2 == "value 2"
        page.model.data.item3 == ["value 1", "value 3"]
        page.model.data.nested[0].item4 == "this is a much longer value"
        page.model.data.nested[0].item5 == "value 2"
        page.model.data.nested[0].item6 == ["value 2", "value 3"]
    }

    def "Select2 components will display existing data in the model when the page loads"() {
        when:
        to ([name:'select2Example', data:'select2Example'], PreviewPage)

        then:
        title == "Preview Select2 example"
        page.model != null

        and: "The values from the data model are displayed"

        page.findFieldByModelName("item1").next().find("span.select2-selection__rendered").text().contains("value 1")
        page.findFieldByModelName("item2").next().find("span.select2-selection__rendered").text().contains("value 2")
        page.findFieldByModelName("item3").next().find("li.select2-selection__choice")*.attr("title") == ["value 1", "value 3"]
        page.findFieldByModelName("item4").next().find("span.select2-selection__rendered")*.attr("title") == ["this is a much longer value", "value 3"]
        page.findFieldByModelName("item5").next().find("span.select2-selection__rendered")*.attr("title") == ["Value 2", "Value 1"]
        page.findFieldByModelName("item6").next().find("li.select2-selection__choice")*.attr("title") == ["value 3", "value 1", "value 2", "value 3", "tag"]


        then: "The model hasn't been changed"
        page.model.data.item1 == "value 1"
        page.model.data.item2 == "value 2"
        page.model.data.item3 == ["value 1", "value 3"]
        page.model.data.nested[0].item4 == "this is a much longer value"
        page.model.data.nested[0].item5 == "value 2"
        page.model.data.nested[0].item6 == ["value 3"]
        page.model.data.nested[1].item4 == "value 3"
        page.model.data.nested[1].item5 == "value 1"
        page.model.data.nested[1].item6 == ["value 1", "value 2", "value 3", "tag"]

    }

    def "Model data is displayed in view mode for select2 view types"() {
        when:
        to ([name:'select2Example', mode:'view', data:'select2Example'], PreviewPage)

        then:
        title == "Preview Select2 example"

        and: "The values from the data model are displayed"
        $("span[data-bind*=item1").text() == "value 1"
        $("span[data-bind*=item2").text() == "value 2"
        $("span[data-bind*=item3").text() == "value 1, value 3"
        $("span[data-bind*=item4")*.text() == ["this is a much longer value", "value 3"]
        $("span[data-bind*=item5")*.text() == ["Value 2", "Value 1"]
        $("span[data-bind*=item6")*.text() ==  ["value 3", "value 1, value 2, value 3, tag"]

    }
}
