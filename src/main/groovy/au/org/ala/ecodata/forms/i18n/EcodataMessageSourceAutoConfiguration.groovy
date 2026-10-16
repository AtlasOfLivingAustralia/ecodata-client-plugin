package au.org.ala.ecodata.forms.i18n

import groovy.transform.CompileStatic
import org.springframework.boot.autoconfigure.AutoConfiguration
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
import org.springframework.boot.autoconfigure.condition.SearchStrategy
import org.springframework.boot.autoconfigure.context.MessageSourceAutoConfiguration
import org.springframework.boot.context.properties.bind.Bindable
import org.springframework.boot.context.properties.bind.Binder
import org.springframework.context.annotation.Bean
import org.springframework.context.support.AbstractApplicationContext
import org.springframework.context.support.ReloadableResourceBundleMessageSource
import org.springframework.core.env.Environment

import java.time.Duration

/**
 * Grails 8 no longer provides its own messageSource, and the ResourceBundleMessageSource supplied by
 * Spring Boot can't return all messages for a locale (needed to support client side i18n via the I18nController).
 * This registers a ReloadableResourceBundleMessageSource in its place, configured from the spring.messages.*
 * properties (including the application and plugin bundle basenames, which are populated by Grails).
 *
 * An application can still declare its own messageSource bean, in which case this one backs off.
 */
@CompileStatic
@AutoConfiguration(before = MessageSourceAutoConfiguration)
class EcodataMessageSourceAutoConfiguration {

    @Bean(name = AbstractApplicationContext.MESSAGE_SOURCE_BEAN_NAME)
    @ConditionalOnMissingBean(name = AbstractApplicationContext.MESSAGE_SOURCE_BEAN_NAME, search = SearchStrategy.CURRENT)
    ReloadableResourceBundleMessageSource messageSource(Environment env) {
        Binder binder = Binder.get(env)
        List<String> basenames = binder.bind('spring.messages.basename', Bindable.listOf(String)).orElse(['messages'])
        Duration cacheDuration = binder.bind('spring.messages.cache-duration', Duration).orElse(null)

        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource()
        // Unlike ResourceBundleMessageSource, basenames here are resource locations rather than class path names.
        messageSource.setBasenames(basenames.collect { String basename ->
            basename.contains(':') ? basename : 'classpath:' + basename
        } as String[])
        messageSource.setDefaultEncoding(env.getProperty('spring.messages.encoding', 'UTF-8'))
        messageSource.setFallbackToSystemLocale(env.getProperty('spring.messages.fallback-to-system-locale', Boolean, false))
        messageSource.setUseCodeAsDefaultMessage(env.getProperty('spring.messages.use-code-as-default-message', Boolean, false))
        messageSource.setAlwaysUseMessageFormat(env.getProperty('spring.messages.always-use-message-format', Boolean, false))
        if (cacheDuration != null) {
            messageSource.setCacheMillis(cacheDuration.toMillis())
        }
        messageSource
    }
}
