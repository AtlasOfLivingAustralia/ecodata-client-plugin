package au.org.ala.ecodata.forms.i18n

import org.springframework.boot.autoconfigure.ImportAutoConfiguration
import org.springframework.boot.autoconfigure.context.MessageSourceAutoConfiguration
import org.springframework.context.MessageSource
import org.springframework.context.annotation.AnnotationConfigApplicationContext
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.support.ReloadableResourceBundleMessageSource
import org.springframework.context.support.StaticMessageSource
import org.springframework.core.env.MapPropertySource
import spock.lang.Specification

class EcodataMessageSourceAutoConfigurationSpec extends Specification {

    @Configuration
    @ImportAutoConfiguration([MessageSourceAutoConfiguration, EcodataMessageSourceAutoConfiguration])
    static class AutoConfig {}

    @Configuration
    static class UserMessageSourceConfig {
        @Bean
        MessageSource messageSource() {
            new StaticMessageSource()
        }
    }

    AnnotationConfigApplicationContext context

    def cleanup() {
        context?.close()
    }

    void "A ReloadableResourceBundleMessageSource configured from spring.messages is used in place of the Spring Boot message source"() {
        when:
        context = createContext(['spring.messages.basename': 'i18n-test/test,i18n-test/other', 'spring.messages.cache-duration': '5s'], AutoConfig)
        ReloadableResourceBundleMessageSource messageSource = context.getBean('messageSource', MessageSource)

        then:
        context.getBeansOfType(MessageSource).size() == 1
        messageSource.basenameSet as List == ['classpath:i18n-test/test', 'classpath:i18n-test/other']
        messageSource.cacheMillis == 5000
        messageSource.getMessage('greeting', null, Locale.FRENCH) == 'Bonjour'
        messageSource.getMessage('other', null, Locale.FRENCH) == 'Other'
    }

    void "The message source backs off if the application declares its own"() {
        when:
        context = createContext(['spring.messages.basename': 'i18n-test/test'], UserMessageSourceConfig, AutoConfig)

        then:
        context.getBean('messageSource') instanceof StaticMessageSource
    }

    private static AnnotationConfigApplicationContext createContext(Map<String, Object> properties, Class... configClasses) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()
        context.environment.propertySources.addFirst(new MapPropertySource('test', properties))
        context.register(configClasses)
        context.refresh()
        context
    }
}
