package au.org.ala.ecodata.forms

import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import groovy.xml.MarkupBuilder
import groovy.util.logging.Slf4j

/**
 * Provides utility tags used by the plugin.
 */
@Slf4j
class HelperTagLib {
    static defaultEncodeAs = [taglib: 'none']
    static namespace = "md"

    /**
     * @attr title
     * @attr printable Is this being printed?
     * body content should contain the help text
     */
    def iconHelp = { attrs, body ->
        if (!attrs.printable) {
            MarkupBuilder mb = new MarkupBuilder(out)
            String title = message(code:attrs.titleCode, default: attrs.title)
            String helpText
            if (attrs.helpTextCode) {
                helpText = message(code:attrs.helpTextCode)
            }
            else {
                helpText = body()
            }

            Map spanAttrs
            if (attrs.useBinding) {
                spanAttrs = ['data-bind':"popover:{content:'${helpText}'}"]
            }
            else {
                spanAttrs = [class:'helphover', 'data-original-title':title, 'data-placement':'top', 'data-content':helpText, 'data-trigger':'click']
                if (attrs['dynamic-help']) {
                    spanAttrs << ['data-bind':"attr:{'data-content':"+attrs['dynamic-help']+"}"]
                }
                if (attrs.container) {
                    spanAttrs << ['data-container':attrs.container]
                }
                if (attrs.html) {
                    spanAttrs << ['data-html':'true']
                }
            }

            mb.span(spanAttrs) {
                i(class:'fa fa-question-circle') {
                    mkp.yieldUnescaped("&nbsp;")
                }
            }
        }
    }

    def toSingleWord = { attrs, body ->
        def name = attrs.name ?: body()
        out << name.replaceAll(' ','_')
    }

    def licences = { attrs ->
        def json = JsonOutput.toJson(resolveLicences())
                .replace('&', '\\u0026')
                .replace('<', '\\u003c')
                .replace('>', '\\u003e')
        out << "<script>window.ecodataLicences = ${json};"
        out << "window.dispatchEvent(new CustomEvent('ecodata:licences-loaded', {detail: window.ecodataLicences}));</script>"
    }

    private List resolveLicences() {
        String path = grailsApplication.config.getProperty('licences.file', String, null)
        if (!path) {
            path = grailsApplication.config.getProperty('images.licencesFile', String, null)
        }
        if (path) {
            try {
                def licences = new JsonSlurper().parse(new File(path))
                if (validLicences(licences)) {
                    return licences
                }
                log.warn("Ignoring invalid licences file '${path}'.")
            } catch (Exception e) {
                log.warn("Unable to read licences file '${path}', using configured licences instead.", e)
            }
        }

        def legacyLicences = grailsApplication.config.getProperty('images.licences', List, null)
        legacyLicences != null ? legacyLicences : grailsApplication.config.getProperty('licences.options', List, [])
    }

    private boolean validLicences(def licences) {
        licences instanceof List && !licences.isEmpty() &&
                licences.every { licence ->
                    licence instanceof Map &&
                            licence.value instanceof String && licence.value &&
                            licence.name instanceof String && licence.name &&
                            (!licence.containsKey('aliases') || licence.aliases instanceof List)
                } &&
                licences.count { it.default == true } == 1
    }
}
