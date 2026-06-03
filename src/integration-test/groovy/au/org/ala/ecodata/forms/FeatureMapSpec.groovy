package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import org.springframework.boot.test.context.SpringBootTest
import pages.PreviewPage

@Integration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class FeatureMapSpec extends GebReportingSpec {



    def "feature map smoke test"() {
        when:
        to ([name:'featureModel'], PreviewPage)

        then:
        title == "Preview Feature Test"

        when:
        def button = page.findFeatureMapButtonByModelName("feature").first()
        button.click()
        Thread.sleep(1000)
        waitFor 10, { page.featureMapDialog.map.displayed }

        then:
        Thread.sleep(1000)
        waitFor 10, { page.featureMapDialog.displayed == true }

        when:
        page.featureMapDialog.map.drawPolygon()

        then:
        Thread.sleep(1000)
        page.featureMapDialog.map.numberOfInteractiveElementsOnMap() > 0

        // Delete created polygon
        when:
        int numberOfElementsBeforeDelete = page.featureMapDialog.map.numberOfInteractiveElementsOnMap()
        page.featureMapDialog.map.deletePolygon()
        Thread.sleep(5000)

        then:
        page.featureMapDialog.map.numberOfInteractiveElementsOnMap() < numberOfElementsBeforeDelete

    }
}
