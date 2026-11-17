package au.org.ala.ecodata.forms

import groovy.json.JsonOutput
import groovy.xml.MarkupBuilder
import groovy.util.logging.Slf4j

/**
 * Provides utility tags used by the plugin.
 */
@Slf4j
class HelperTagLib {
    static defaultEncodeAs = [taglib: 'none']
    static namespace = "md"
    LicenceService licenceService

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
        MarkupBuilder mb = new MarkupBuilder(out)
        mb.div(hidden: 'hidden', 'data-ecodata-licences': JsonOutput.toJson(licenceService.licences),
                'data-ecodata-licence-catalogue': JsonOutput.toJson(licenceService.allLicences),
                'data-ecodata-default-licence': licenceService.defaultLicence) {
            mkp.yield(' ')
        }
    }
}
