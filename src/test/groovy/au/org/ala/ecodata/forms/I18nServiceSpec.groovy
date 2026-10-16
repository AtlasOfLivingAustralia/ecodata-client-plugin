package au.org.ala.ecodata.forms

import grails.testing.services.ServiceUnitTest
import org.springframework.context.support.ReloadableResourceBundleMessageSource
import org.springframework.context.support.ResourceBundleMessageSource
import org.springframework.context.support.StaticMessageSource
import spock.lang.Specification

class I18nServiceSpec extends Specification implements ServiceUnitTest<I18nService> {

    void "All messages for a locale are returned from a ReloadableResourceBundleMessageSource, falling back to less specific locales"() {
        setup:
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource()
        messageSource.setBasenames('classpath:i18n-test/test', 'classpath:i18n-test/other')
        messageSource.setFallbackToSystemLocale(false)
        service.messageSource = messageSource

        expect:
        service.getMessages(Locale.FRENCH) == [greeting: 'Bonjour', farewell: 'Goodbye', other: 'Other']
        service.getMessages(Locale.ENGLISH) == [greeting: 'Hello', farewell: 'Goodbye', other: 'Other']
    }

    void "All messages for a locale are returned from a ResourceBundleMessageSource, falling back to less specific locales"() {
        setup:
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource()
        messageSource.setBasenames('i18n-test/test', 'i18n-test/other')
        messageSource.setFallbackToSystemLocale(false)
        service.messageSource = messageSource

        expect:
        service.getMessages(Locale.FRENCH) == [greeting: 'Bonjour', farewell: 'Goodbye', other: 'Other']
        service.getMessages(Locale.ENGLISH) == [greeting: 'Hello', farewell: 'Goodbye', other: 'Other']
    }

    void "An empty map is returned if the MessageSource doesn't support listing messages"() {
        setup:
        service.messageSource = new StaticMessageSource()

        expect:
        service.getMessages(Locale.ENGLISH) == [:]
    }
}
