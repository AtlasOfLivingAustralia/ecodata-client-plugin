package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import org.springframework.boot.test.context.SpringBootTest
import pages.PreviewPage
@Integration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class ImageTypeSpec extends GebReportingSpec {

    def "The default behaviour of the view mode of the image view type is to show metadata on hover"() {
        when:
        to ([name:'images', mode:'view'], PreviewPage)

        then:
        title == "Preview Images Example"

        when: "We hover over the photo"
        // Hover the actual popover trigger (the image container), not the surrounding <ul>
        // whose centre may fall on empty space. Move to a neutral element first so that
        // moving onto the photo always produces a mouseenter transition, which is what
        // triggers the hover popover reliably in headless browsers.
        def photo = $('[data-bind*=images2] .projectLogo').first()
        waitFor { photo.displayed }
        interact {
            moveToElement($('h3').first())
            moveToElement(photo)
        }

        then: "A popover is displayed containing the photo metadata"
        waitFor 10, {
            $('.popover').displayed
        }
        and: "the photo metadata is displayed correctly"
        $(".popover span[data-bind*=name]").text() == null
        $(".popover span[data-bind*=attribution]").text() == null
        $(".popover span[data-bind*=notes]").text() == null

    }

    def "If the metadataAlwaysVisible displayOption is set, the metadata will be displayed next to the image in view mode"() {
        when:
        to ([name:'images', mode:'view'], PreviewPage)

        then:
        title == "Preview Images Example"

        and: "The image metadata is displayed next to the image"
        $("ul[data-bind*=images1] span[data-bind*=name").text() == "Test image 1"
        $("ul[data-bind*=images1] span[data-bind*=attribution]").text() == "Test attribution 1"
        $("ul[data-bind*=images1] span[data-bind*=notes]").text() == "Test notes 1"

    }

    def "If the showRemoveButtonWithImage displayOption is set, a remove button is added below image. This can be combined with showMetadata false."() {
        when:
        to ([name:'images'], PreviewPage)

        then:
        title == "Preview Images Example"

        and: "The remove button is displayed below image"
        $("a.remove-btn-with-image").size() == 1

        and: "The metadata, attribution and notes fields configured as hidden are not displayed"
        $(".fileupload-buttonbar:nth-child(3) .image-title-input").displayed == false
        $(".fileupload-buttonbar:nth-child(3) input[data-bind='value:attribution']").size() == 0
        $(".fileupload-buttonbar:nth-child(3) input[data-bind='value:notes']").size() == 0
    }
}
