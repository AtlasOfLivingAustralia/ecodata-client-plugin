package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import pages.PreviewPage

@Integration
class TableFooterSpec extends GebReportingSpec {

    def "Table footers can be displayed"() {
        when:
        to ([name:'tableFooterExample', data:'table-data'], PreviewPage)

        then:
        title == "Preview Table footer example"
        page.model != null

        and: "The total in the table footer has the correct value"
        page.findFieldByModelName("totalValue3").text() == "3.00"

        and: "The number of columns in the table and footer match"
        $('.exampleList thead th').size() == 3
        $('.exampleList tbody tr')[0].find('td').size() == 3
        $('.exampleList tbody tr')[1].find('td').size() == 3
        $('.exampleList tfoot tr').size() == 3 // The table data upload details is a hidden row
        $('.exampleList tfoot tr')[0].find('td').size() == 3
        $('.exampleList tfoot tr')[2].displayed == false

        $('.exampleList2 thead th').size() == 2
        $('.exampleList2 tbody td').size() == 2
        $('.exampleList2 tfoot tr').size() == 2
        $('.exampleList2 tfoot tr')[0].find('td').size() == 2
        $('.exampleList2 tfoot tr')[1].displayed == false

    }

    def "Table footers can be displayed in view mode"() {
        when:
        to ([name:'tableFooterExample', mode:'view', data:'table-data'], PreviewPage)

        then:
        title == "Preview Table footer example"

        and: "The total in the table footer has the correct value"
        page.findFieldByModelName("totalValue3").text() == "3.00"

        and: "The footer has the correct number of rows and cells based on the model options"
        $('.exampleList thead th').size() == 2
        $('.exampleList tbody tr')[0].find('td').size() == 2
        $('.exampleList tbody tr')[1].find('td').size() == 2
        $('.exampleList tfoot tr').size() == 2 // 2nd row allows table data download
        $('.exampleList tfoot tr')[0].find('td').size() == 2
        $('.exampleList tfoot tr a[data-bind*=downloadTableData]').displayed

        $('.exampleList2 thead th').size() == 2
        $('.exampleList2 tbody td').size() == 0 // No data supplied for this table, so no body rows.
        $('.exampleList2 tfoot tr').size() == 1
        $('.exampleList2 tfoot tr')[0].find('td').size() == 2

    }
}
