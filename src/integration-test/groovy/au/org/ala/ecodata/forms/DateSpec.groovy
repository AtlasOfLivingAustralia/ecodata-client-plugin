package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import pages.PreviewPage

@Integration
class DateSpec extends GebReportingSpec {

    def "We can enter dates via the date or simpleDate view types"() {
        when:
        to ([name:'dateExample'], PreviewPage)

        then:
        title == "Preview Date example"
        page.model != null

        when: "We enter dates into the fields"
        enterDate("date1", "15-06-2019")
        enterDate("date2", "15-07-2019")
        enterDate("date3", "15-08-2019")
        enterDate("date4", "15-09-2019")


        then: "The model has been updated with the selected values"
        page.model.data.date1 == "2019-06-14T14:00:00Z"
        page.model.data.date2 == "2019-07-14T14:00:00Z"
        page.model.data.nested[0].date3 == "2019-08-14T14:00:00Z"
        page.model.data.nested[0].date4 == "2019-09-14T14:00:00Z"
    }

    def "Date components will display existing data in the model when the page loads"() {
        when:
        to ([name:'dateExample', data:'date-view-data'], PreviewPage)

        then:
        title == "Preview Date example"
        page.model != null

        and: "The values from the data model are displayed"
        findFieldByModelName("date1").value() == "02-07-2019"
        findFieldByModelName("date2").value() == "02-08-2019"
        findFieldByModelName("date3")*.value() == ["02-09-2019", "02-11-2019"]
        findFieldByModelName("date4")*.value() == ["02-10-2019", '']
    }

    def "Model data is displayed in view mode for date view types"() {
        when:
        to ([name:'dateExample', mode:'view', data:'date-view-data'], PreviewPage)

        then:
        title == "Preview Date example"

        and: "The values from the data model are displayed"
        $("span[data-bind*=date1").text() == "02-07-2019"
        $("span[data-bind*=date2").text() == "02-08-2019"
        $("span[data-bind*=date3")*.text() == ["02-09-2019", "02-11-2019"]
        $("span[data-bind*=date4")*.text() == ["02-10-2019", '']
    }

}
