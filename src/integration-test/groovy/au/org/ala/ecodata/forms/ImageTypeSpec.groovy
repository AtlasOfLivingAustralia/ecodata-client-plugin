package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.ApplicationContext
import pages.PreviewPage
@Integration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class ImageTypeSpec extends GebReportingSpec {
    @Autowired
    ApplicationContext applicationContext

    def "image dialogs show licence selection unless explicitly disabled"() {
        given:
        def renderer = applicationContext.getBean('groovyPageRenderer')

        expect:
        renderer.render(template: '/output/imageDataTypeEditModelTemplate', model: [name: 'images']).contains('id="licence"')
        !renderer.render(template: '/output/imageDataTypeEditModelTemplate', model: [name: 'images', showImgLicence: false]).contains('id="licence"')
    }

    def "The default behaviour of the view mode of the image view type is to show metadata on hover"() {
        when:
        to ([name:'images', mode:'view'], PreviewPage)

        then:
        title == "Preview Images Example"

        when: "We hover over the photo"
        interact {
            moveToElement($('h3').first())
            moveToElement($('[data-bind*=images2]'))
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
        $("ul[data-bind*=images1] span[data-bind*=name]").text() == "Test image 1"
        $("ul[data-bind*=images1] span[data-bind*=attribution]").text() == "Test attribution 1"
        $("ul[data-bind*=images1] span[data-bind*=notes]").text() == "Test notes 1"

    }

    def "If the showRemoveButtonWithImage displayOption is set, a remove button is added below image. This can be combined with showMetadata false."() {
        when:
        to ([name:'images'], PreviewPage)

        then:
        title == "Preview Images Example"

        and: "The remove button is displayed below image"
        waitFor 30, { $("a.remove-btn-with-image").displayed }
        $("a.remove-btn-with-image").size() == 1

        and: "The metadata, attribution and notes fields configured as hidden are not displayed"
        $(".fileupload-buttonbar select#licence").size() == 2
        $(".fileupload-buttonbar:nth-child(3) .image-title-input").displayed == false
        $(".fileupload-buttonbar:nth-child(3) select#licence").size() == 0
        $(".fileupload-buttonbar:nth-child(3) input[data-bind='value:attribution']").size() == 0
        $(".fileupload-buttonbar:nth-child(3) input[data-bind='value:notes']").size() == 0

        when: "A licence is selected"
        $(".fileupload-buttonbar select#licence").first().value('CC BY 4.0')

        then: "Short labels and the selected licence link are displayed"
        $(".fileupload-buttonbar select#licence").first().find('option', value: 'CC BY 4.0').text() == 'CC BY 4.0'
        waitFor {
            $(".selected-licence-link").first().displayed
        }
        $(".selected-licence-link").first().text() == 'CC BY 4.0'
        $(".selected-licence-link").first().getAttribute('href') == 'https://creativecommons.org/licenses/by/4.0/'
    }
}
