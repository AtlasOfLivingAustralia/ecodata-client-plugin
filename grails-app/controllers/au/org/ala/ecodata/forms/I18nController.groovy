package au.org.ala.ecodata.forms

import grails.converters.JSON
import au.org.ala.ecodata.utils.ResponseCacheHeaderUtils

/**
 * Exposes the i18n messages to client side code (see i18n.js).
 */
class I18nController {

    static allowedMethods = [messages: 'GET']

    I18nService i18nService

    /** Returns all messages for the request locale as a JSON object of message code to message. */
    def messages() {
        ResponseCacheHeaderUtils.applyCacheHeaders(response, ResponseCacheHeaderUtils.ONE_DAY_IN_SECONDS)
        render i18nService.getMessages(request.locale) as JSON
    }
}
