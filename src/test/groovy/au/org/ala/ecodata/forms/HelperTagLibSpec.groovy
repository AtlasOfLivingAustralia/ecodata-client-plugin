package au.org.ala.ecodata.forms

import grails.testing.web.taglib.TagLibUnitTest
import spock.lang.Specification

class HelperTagLibSpec extends Specification implements TagLibUnitTest<HelperTagLib> {

    def setup() {
    }

    def cleanup() {
    }

    void "the to single word tag produces a html/script safe version of an output name"() {
        expect:
        applyTemplate('<md:toSingleWord name="Output Name"/>') == 'Output_Name'
    }

    void "licences tag supplies packaged defaults without host configuration"() {
        given:
        def originalFile = grailsApplication.config.getProperty('licences.file', String, null)
        grailsApplication.config.licences.file = null

        when:
        def output = applyTemplate('<md:licences/>')

        then:
        output.contains('data-ecodata-licences=')
        output.contains('Creative Commons Zero 1.0')
        output.contains('Creative Commons Attribution 4.0 International')
        output.contains('Creative Commons Attribution-Noncommercial-Share Alike 4.0 International')
        output.contains('</div>')

        cleanup:
        grailsApplication.config.licences.file = originalFile
    }

    void "licences tag uses packaged defaults for an unusable file"() {
        given:
        def originalFile = grailsApplication.config.getProperty('licences.file', String, null)
        def licencesFile = File.createTempFile('licences', '.json')
        if (contents == null) {
            licencesFile.delete()
        } else {
            licencesFile.text = contents
        }
        grailsApplication.config.licences.file = licencesFile.absolutePath

        when:
        def output = applyTemplate('<md:licences/>')

        then:
        output.contains('Creative Commons Zero 1.0')
        output.contains('Creative Commons Attribution 4.0 International')

        cleanup:
        grailsApplication.config.licences.file = originalFile
        licencesFile.delete()

        where:
        contents << [null, 'not JSON', '[]', '[{"value":"Invalid"}]']
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
