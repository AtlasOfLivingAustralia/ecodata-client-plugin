package au.org.ala.ecodata.forms

import geb.module.Select
import geb.navigator.Navigator
import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import org.springframework.boot.test.context.SpringBootTest
import pages.SpeciesSelectPage

@Integration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class SpeciesSelectSpec extends GebReportingSpec {

    def "view page should show selected species"() {
        when:
        to([name: 'speciesSelect', data:'speciesSelect', mode: 'view'], SpeciesSelectPage)

        then:
        title == "Preview Species example"

        when:
        Navigator species = page.getSelectedSpecies()

        then:
        species.getAt(0).text() == "Cracticus tibicen (Australian Magpie)"
    }

    def "edit page should show selected species and allow changes"() {
        Navigator species
        when:
        to([name: 'speciesSelect', data:'speciesSelect'], SpeciesSelectPage)

        then:
        title == "Preview Species example"

        when:
        species = page.getSelectedSpeciesOnSelect2()

        then:
        species.getAt(0).getAttribute('innerHTML') == "<span class=\"scientific-name\">Cracticus tibicen</span> <span class=\"common-name\">(Australian Magpie)</span>"

        when: "change the selected species"
        def select = page.getSelect2().click()
        waitFor { $("input.select2-search__field").displayed }
        $("input.select2-search__field").value("rufus")
        waitFor { $("li.select2-results__option").size() == 2 }
        $("li.select2-results__option", 0).click()
        species = page.getSelectedSpeciesOnSelect2()

        then:
        species.getAt(0).getAttribute('innerHTML') == "<span class=\"scientific-name\">Osphranter rufus</span> <span class=\"common-name\">(Kangaroo)</span>"
    }
}
