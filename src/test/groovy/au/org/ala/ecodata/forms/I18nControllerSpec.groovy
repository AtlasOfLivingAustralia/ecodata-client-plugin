package au.org.ala.ecodata.forms

import grails.testing.web.controllers.ControllerUnitTest
import spock.lang.Specification

class I18nControllerSpec extends Specification implements ControllerUnitTest<I18nController> {

    I18nService i18nService = Mock(I18nService)

    def setup() {
        controller.i18nService = i18nService
    }

    void "The messages for the request locale are returned as JSON"() {
        setup:
        request.addPreferredLocale(Locale.FRENCH)

        when:
        request.method = 'GET'
        controller.messages()

        then:
        1 * i18nService.getMessages(Locale.FRENCH) >> [greeting: 'Bonjour']
        response.json == [greeting: 'Bonjour']
    }
}
