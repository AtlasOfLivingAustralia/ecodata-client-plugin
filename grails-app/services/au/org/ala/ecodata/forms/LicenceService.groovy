package au.org.ala.ecodata.forms

import grails.core.GrailsApplication
import groovy.util.logging.Slf4j

import javax.annotation.PostConstruct

@Slf4j
class LicenceService {
    static final String DEFAULT_LICENCE = 'https://creativecommons.org/licenses/by/4.0/'
    private static final List<Map> DEFAULT_LICENCES = [
        [name: 'Creative Commons Zero', acronym: 'CC0',
         url: 'https://creativecommons.org/publicdomain/zero/1.0/', imageUrl: '', version: '1.0'],
        [name: 'Creative Commons Attribution (International)', acronym: 'CC-BY 4.0 (Int)',
         url: DEFAULT_LICENCE, imageUrl: '', version: '4.0'],
        [name: 'Creative Commons Attribution-Share Alike (International)', acronym: 'CC-BY-SA 4.0 (Int)',
         url: 'https://creativecommons.org/licenses/by-sa/4.0/', imageUrl: '', version: '4.0'],
        [name: 'Creative Commons Attribution-NoDerivatives (International)', acronym: 'CC-BY-ND 4.0 (Int)',
         url: 'https://creativecommons.org/licenses/by-nd/4.0/', imageUrl: '', version: '4.0'],
        [name: 'Creative Commons Attribution-Noncommercial (International)', acronym: 'CC-BY-NC 4.0 (Int)',
         url: 'https://creativecommons.org/licenses/by-nc/4.0/', imageUrl: '', version: '4.0'],
        [name: 'Creative Commons Attribution-Noncommercial-Share Alike (International)', acronym: 'CC-BY-NC-SA 4.0 (Int)',
         url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/', imageUrl: '', version: '4.0'],
        [name: 'Creative Commons Attribution-Noncommercial-NoDerivatives (International)', acronym: 'CC-BY-NC-ND 4.0 (Int)',
         url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/', imageUrl: '', version: '4.0']
    ]

    GrailsApplication grailsApplication
    EcpWebService ecpWebService
    def cacheService

    @PostConstruct
    void init() {
        getLicences()
    }

    List getLicences() {
        List allowlist = grailsApplication.config.getProperty('licences.allowlist', List)
        if (allowlist == null) {
            allowlist = DEFAULT_LICENCES*.url
        }
        if (!allowlist.every { it instanceof String && httpUrl(it) }) {
            throw new IllegalArgumentException('licences.allowlist must contain HTTP(S) licence URLs')
        }
        Set allowedUrls = allowlist.collect { normaliseUrl(it) } as Set
        List licences = getAllLicences().findAll { allowedUrls.contains(normaliseUrl(it.url)) }
        Set missing = allowedUrls - (licences.collect { normaliseUrl(it.url) } as Set)
        if (missing) {
            log.warn("Allowed licences not found in the catalogue: ${missing}")
        }
        licences
    }

    List getAllLicences() {
        String baseUrl = grailsApplication.config.getProperty('collectory.service.url', String, 'https://collections.ala.org.au')
        String url = baseUrl.replaceAll('/+$', '') + '/ws/licence'
        cacheService.get("licences:${url}", {
            Map result = ecpWebService.getJson2(url, 5000)
            if (!result?.error && result?.statusCode == 200 && validLicences(result.resp)) {
                return uniqueLicences(result.resp + DEFAULT_LICENCES)
            }
            log.warn("Unable to load valid licences from '${url}' (status ${result?.statusCode}): ${result?.error ?: 'invalid catalogue'}. Using built-in defaults.")
            return DEFAULT_LICENCES
        })
    }

    String getDefaultLicence() {
        String selected = grailsApplication.config.getProperty('licences.default', String, DEFAULT_LICENCE)
        if (!getLicences().any { normaliseUrl(it.url) == normaliseUrl(selected) || it.acronym == selected }) {
            log.warn("Configured default licence '${selected}' is not in the allowed licence list. Retaining the configured value.")
        }
        selected
    }

    private static boolean validLicences(def licences) {
        licences instanceof List && !licences.isEmpty() && licences.every { licence ->
            licence instanceof Map && licence.name instanceof String && licence.name.trim() &&
                    licence.acronym instanceof String && licence.acronym.trim() &&
                    licence.url instanceof String && httpUrl(licence.url) &&
                    licence.version instanceof String &&
                    (!licence.imageUrl || licence.imageUrl instanceof String)
        }
    }

    private static boolean httpUrl(String value) {
        try {
            URI uri = new URI(value)
            uri.scheme?.toLowerCase() in ['http', 'https'] && uri.host
        } catch (URISyntaxException ignored) {
            false
        }
    }

    private static List uniqueLicences(List licences) {
        licences.unique(false) { normaliseUrl(it.url) }
    }

    private static String normaliseUrl(String value) {
        String normalised = value.replaceFirst('(?i)^https?://', 'https://')
        try {
            URI uri = new URI(normalised)
            if (uri.host) {
                String authority = uri.rawAuthority
                int hostIndex = authority.lastIndexOf(uri.host)
                int authorityStart = normalised.indexOf('://') + 3
                String normalisedAuthority = authority.substring(0, hostIndex) +
                        uri.host.toLowerCase(Locale.ROOT) + authority.substring(hostIndex + uri.host.length())
                normalised = normalised.substring(0, authorityStart) + normalisedAuthority +
                        normalised.substring(authorityStart + authority.length())
            }
        } catch (URISyntaxException ignored) {
            // Non-URL configured defaults are preserved as-is.
        }
        normalised.replaceAll('/+$', '')
    }
}
