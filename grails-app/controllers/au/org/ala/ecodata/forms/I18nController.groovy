package au.org.ala.ecodata.forms

import grails.converters.JSON

/**
 * Exposes the i18n messages to client side code (see i18n.js).
 */
class I18nController {

    static allowedMethods = [messages: 'GET']

    I18nService i18nService

    /** Returns all messages for the request locale as a JSON object of message code to message. */
    def messages() {
        render i18nService.getMessages(request.locale) as JSON
    }
}
