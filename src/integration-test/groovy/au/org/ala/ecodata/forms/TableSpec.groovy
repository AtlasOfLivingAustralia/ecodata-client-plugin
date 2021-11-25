package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import pages.PreviewPage

@Integration
class TableSpec extends GebReportingSpec {

    def "Tables can be displayed correctly in edit mode"() {
        when:
        to ([name:'viewTableExample', data:'viewTableExample'], PreviewPage)

        then:
        title == "Preview Table View Type Example"
        page.model != null

        and: "The first table is correct"
        $('.adminActions thead th').size() == 6
        $('.adminActions tbody td').size() == 6
        $('.adminActions tbody td')[0].find('select').value() == "Data analysis"
        $('.adminActions tbody td')[1].find('input').value() == "2"
        $('.adminActions tbody td')[2].find('input').value() == "3"
        $('.adminActions tbody td')[3].find('input').value() == "6"
        $('.adminActions tbody td')[4].find('textarea').value() == "These as the activity notes"
        $('.adminActions tfoot tr').size() == 3 // The table data upload details is a hidden row
        $('.adminActions tfoot tr')[0].find('td').size() == 5 // one cell colspan 2
        $('.adminActions tfoot tr')[2].displayed == false

        and: "The second table is correct - note the second table is not bound to a list"
        $('table')[1].find('thead th')*.text() == ["Value 1", "Value 2",  "Value 3"]
        $('table')[1].find('tbody td').size() == 3
        $('table')[1].find('tfoot tr').size() == 0
        $('table')[1].find('tbody td input')*.value() == ["value1", "value2", "value3"]

        when: "We add a row to the first table"
        $('.adminActions button[data-bind*=addRow]').click()

        then: "the new row is added"
        waitFor {$('.adminActions tbody tr').size() == 2}

        and: "The first row remains unchanged"
        $('.adminActions tbody tr')[0].find('td')[0].find('select').value() == "Data analysis"
        $('.adminActions tbody tr')[0].find('td')[1].find('input').value() == "2"
        $('.adminActions tbody tr')[0].find('td')[2].find('input').value() == "3"
        $('.adminActions tbody tr')[0].find('td')[3].find('input').value() == "6"
        $('.adminActions tbody tr')[0].find('td')[4].find('textarea').value() == "These as the activity notes"

        and: "The new row has default values"
        $('.adminActions tbody tr')[1].find('td')[0].find('select').value() == ""
        $('.adminActions tbody tr')[1].find('td')[1].find('input').value() == "0"
        $('.adminActions tbody tr')[1].find('td')[2].find('input').value() == "0"
        $('.adminActions tbody tr')[1].find('td')[3].find('input').value() == "0"
        $('.adminActions tbody tr')[1].find('td')[4].find('textarea').value() == ""

    }

    def "Tables can be displayed correctly in view mode"() {
        when:
        to ([name:'viewTableExample', data:'viewTableExample', mode:'view'], PreviewPage)

        then:
        title == "Preview Table View Type Example"
        page.model != null

        and: "The first table is correct"
        $('.adminActions thead th').size() == 5
        $('.adminActions tbody td').size() == 5
        $('.adminActions tbody td')*.text() == ["Data analysis", "2", "3", "6", "These as the activity notes"]
        $('.adminActions tfoot tr').size() == 2

        and: "The second table is correct"
        $('table')[1].find('thead th')*.text() == ["Value 1", "Value 2",  "Value 3"]
        $('table')[1].find('tbody td')*.text() == ["value1", "value2", "value3"]
    }
}
