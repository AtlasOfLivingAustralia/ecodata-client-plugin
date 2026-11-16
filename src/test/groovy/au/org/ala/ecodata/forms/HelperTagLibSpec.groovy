package au.org.ala.ecodata.forms

import grails.testing.web.taglib.TagLibUnitTest
import groovy.json.JsonSlurper

//import grails.test.mixin.TestFor
import spock.lang.Specification

//@TestFor(HelperTagLib)
class HelperTagLibSpec extends Specification implements TagLibUnitTest<HelperTagLib> {

    def setup() {
        tagLib.licenceService = Mock(LicenceService)
    }

    def cleanup() {
    }

    void "the to single word tag produces a html/script safe version of an output name"() {
        expect:
        applyTemplate('<md:toSingleWord name="Output Name"/>') == 'Output_Name'
    }

    void "licences tag supplies allowed choices and the full catalogue as escaped non-executable markup"() {
        given:
        def allowed = [name: 'Attribution <script>', acronym: 'CC-BY 4.0 (Int)',
                       url: LicenceService.DEFAULT_LICENCE, imageUrl: '', version: '4.0']
        def historical = [name: 'Historical', acronym: 'CC-BY-NC 3.0 (Aus)',
                          url: 'https://creativecommons.org/licenses/by-nc/3.0/au/', imageUrl: '', version: '3.0']
        tagLib.licenceService.getLicences() >> [allowed]
        tagLib.licenceService.getAllLicences() >> [allowed, historical]
        tagLib.licenceService.getDefaultLicence() >> LicenceService.DEFAULT_LICENCE

        when:
        def output = applyTemplate('<md:licences/>')
        def element = new XmlSlurper().parseText(output)
        def options = new JsonSlurper().parseText(element.@'data-ecodata-licences'.text())
        def catalogue = new JsonSlurper().parseText(element.@'data-ecodata-licence-catalogue'.text())

        then:
        output.contains('data-ecodata-licences=')
        output.contains('CC-BY 4.0 (Int)')
        options == [allowed]
        catalogue == [allowed, historical]
        output.contains("data-ecodata-default-licence='https://creativecommons.org/licenses/by/4.0/'")
        !output.contains('<script>')
        output.contains('</div>')
    }
}
