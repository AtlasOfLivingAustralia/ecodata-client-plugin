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
}
