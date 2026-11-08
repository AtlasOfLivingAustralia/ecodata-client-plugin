package au.org.ala.ecodata.forms

import grails.testing.web.taglib.TagLibUnitTest

//import grails.test.mixin.TestFor
import spock.lang.Specification

//@TestFor(HelperTagLib)
class HelperTagLibSpec extends Specification implements TagLibUnitTest<HelperTagLib> {

    def setup() {
    }

    def cleanup() {
    }

    void "the to single word tag produces a html/script safe version of an output name"() {
        expect:
        applyTemplate('<md:toSingleWord name="Output Name"/>') == 'Output_Name'
    }

    void "licences tag outputs configured options as JSON"() {
        given:
        grailsApplication.config.licences.options = [[value: 'Custom', name: 'Custom licence']]

        when:
        def output = applyTemplate('<md:licences/>')

        then:
        output.contains('data-ecodata-licences=')
        output.contains('Custom licence')
        output.contains('</div>')
    }

    void "licences tag prefers a valid external file"() {
        given:
        def originalFile = grailsApplication.config.getProperty('licences.file', String, null)
        def licencesFile = File.createTempFile('image-licences', '.json')
        licencesFile.text = '[{"value":"External","name":"External licence"}]'
        grailsApplication.config.licences.file = licencesFile.absolutePath

        when:
        def output = applyTemplate('<md:licences/>')

        then:
        output.contains('data-ecodata-licences=')
        output.contains('External licence')
        !output.contains('Creative Commons Zero 1.0')

        cleanup:
        if (originalFile) {
            grailsApplication.config.licences.file = originalFile
        } else {
            grailsApplication.config.licences.remove('file')
        }
        licencesFile.delete()
    }
}
