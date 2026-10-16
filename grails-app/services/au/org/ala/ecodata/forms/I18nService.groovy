package au.org.ala.ecodata.forms

import groovy.util.logging.Slf4j
import org.springframework.context.MessageSource
import org.springframework.context.support.ReloadableResourceBundleMessageSource
import org.springframework.context.support.ResourceBundleMessageSource

/**
 * Provides access to all of the i18n messages for a locale, for use by client side code (see i18n.js).
 */
@Slf4j
class I18nService {

    static transactional = false

    MessageSource messageSource

    /**
     * Returns every message available for the supplied locale, merged from all configured bundles and
     * including messages inherited from less specific locales (e.g. messages_en_AU falls back to messages).
     */
    Map<String, String> getMessages(Locale locale) {
        Properties properties
        if (messageSource instanceof ReloadableResourceBundleMessageSource) {
            // getMergedProperties is protected, hence the dynamic call.
            properties = messageSource.getMergedProperties(locale)?.properties
        }
        else if (messageSource instanceof ResourceBundleMessageSource) {
            properties = mergeResourceBundles((ResourceBundleMessageSource)messageSource, locale)
        }
        else {
            log.warn("Unable to list messages from a MessageSource of type ${messageSource?.getClass()?.name}")
        }
        (properties ?: [:]) as Map<String, String>
    }

    private static Properties mergeResourceBundles(ResourceBundleMessageSource messageSource, Locale locale) {
        Properties merged = new Properties()
        // Reversed so that bundles listed earlier take precedence, matching message resolution.
        messageSource.basenameSet.toList().reverse().each { String basename ->
            ResourceBundle bundle = messageSource.getResourceBundle(basename, locale)
            bundle?.keySet()?.each { String key -> merged.setProperty(key, bundle.getString(key)) }
        }
        merged
    }
}
