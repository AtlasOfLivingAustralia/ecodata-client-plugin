package au.org.ala.ecodata.forms

import grails.core.GrailsApplication
import org.grails.config.PropertySourcesConfig
import org.grails.config.yaml.YamlPropertySourceLoader
import org.grails.testing.GrailsUnitTest
import org.springframework.core.io.ByteArrayResource
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification

import java.net.UnknownHostException

class LicenceServiceSpec extends Specification implements GrailsUnitTest {
    LicenceService service
    EcpWebService webService = Mock()
    Map attribution = [name: 'Attribution', acronym: 'CC-BY 4.0 (Int)',
                       url: LicenceService.DEFAULT_LICENCE, imageUrl: '', version: '4.0']
    Map historical = [name: 'Attribution-Noncommercial (Australia)', acronym: 'CC-BY-NC 3.0 (Aus)',
                      url: 'https://creativecommons.org/licenses/by-nc/3.0/au/', imageUrl: '', version: '3.0']
    Set defaultUrls = [
        'https://creativecommons.org/publicdomain/zero/1.0/',
        'https://creativecommons.org/licenses/by/4.0/',
        'https://creativecommons.org/licenses/by-sa/4.0/',
        'https://creativecommons.org/licenses/by-nd/4.0/',
        'https://creativecommons.org/licenses/by-nc/4.0/',
        'https://creativecommons.org/licenses/by-nc-sa/4.0/',
        'https://creativecommons.org/licenses/by-nc-nd/4.0/'
    ] as Set

    def setup() {
        service = new LicenceService(grailsApplication: grailsApplication,
                ecpWebService: webService, cacheService: new CacheService())
        service.cacheService.clear()
        grailsApplication.config.licences.allowlist = null
        grailsApplication.config.licences.default = null
        grailsApplication.config.collectory.service.url = null
        grailsApplication.config.licences.fallback = pluginConfig.getProperty('licences.fallback', List)
    }

    private static PropertySourcesConfig getPluginConfig() {
        new PropertySourcesConfig(new YamlPropertySourceLoader().load('plugin', new ClassPathResource('plugin.yml')).first())
    }

    def cleanup() {
        service.cacheService.clear()
    }

    void "uses fallback licences if Collectory lookup throws"() {
        when:
        List licences = service.licences

        then:
        1 * webService.getJson2(_, 5000) >> { throw new UnknownHostException('DNS lookup failed') }
        licences*.url as Set == defaultUrls
    }

    void "allows all seven current licences while retaining historical API metadata"() {
        given:
        grailsApplication.config.collectory.service.url = 'https://collections.test.ala.org.au'
        Map duplicate = attribution + [url: 'http://creativecommons.org/licenses/by/4.0', version: '4.x']

        when:
        def first = service.licences
        def second = service.licences

        then:
        1 * webService.getJson2('https://collections.test.ala.org.au/ws/licence', 5000) >>
                [statusCode: 200, resp: [attribution, duplicate, historical]]
        first*.url as Set == defaultUrls
        first.find { it.url == attribution.url } == attribution
        !first.contains(historical)
        service.allLicences.contains(historical)
        service.allLicences.count { it.acronym == attribution.acronym } == 1
        second == first
    }

    void "derives endpoint from Collectory configuration or uses production by default"() {
        given:
        grailsApplication.config.collectory.service.url = baseUrl

        when:
        service.licences

        then:
        1 * webService.getJson2(endpoint, 5000) >>
                [statusCode: 200, resp: [attribution]]

        where:
        baseUrl                                    | endpoint
        null                                       | 'https://collections.ala.org.au/ws/licence'
        'https://collections.test.ala.org.au/'      | 'https://collections.test.ala.org.au/ws/licence'
    }

    void "uses all seven current CC licences when the API fails or returns invalid data"() {
        when:
        List licences = service.licences

        then:
        1 * webService.getJson2(_, 5000) >> response
        licences.find { it.url == LicenceService.DEFAULT_LICENCE }.acronym == 'CC-BY 4.0 (Int)'
        licences*.url as Set == defaultUrls
        licences*.url.unique().size() == licences.size()
        licences.every {
            it.name && it.acronym && it.url.startsWith('https://creativecommons.org/') &&
                    (it.version == '4.0' || (it.acronym == 'CC0' && it.version == '1.0')) &&
                    it.containsKey('imageUrl')
        }
        service.licences == licences

        where:
        response << [
            [error: 'timeout'],
            [statusCode: 503],
            [statusCode: 200, resp: []],
            [statusCode: 200, resp: [[name: 'old shape', value: 'old']]],
            [statusCode: 200, resp: [[name: 'Unsafe', acronym: 'Unsafe', url: 'javascript:alert(1)', version: '1']]]
        ]
    }

    void "an override replaces the allowlist without losing historical metadata or caching the filter"() {
        given:
        grailsApplication.config.licences.allowlist = ['http://creativecommons.org/licenses/by-nc/3.0/au']

        when:
        List first = service.licences
        grailsApplication.config.licences.allowlist = [LicenceService.DEFAULT_LICENCE]
        List second = service.licences

        then:
        1 * webService.getJson2(_, 5000) >> [statusCode: 200, resp: [historical, attribution]]
        first == [historical]
        second == [attribution]
        service.allLicences.contains(historical)
    }

    void "an empty allowlist permits no new choices"() {
        given:
        grailsApplication.config.licences.allowlist = []

        when:
        def licences = service.licences

        then:
        1 * webService.getJson2(_, 5000) >> [statusCode: 200, resp: [historical, attribution]]
        licences == []
        service.allLicences.contains(historical)
    }

    void "loads an allowlist from YAML configuration"() {
        given:
        def propertySource = new YamlPropertySourceLoader().load('test', new ByteArrayResource(yaml.bytes)).first()
        def config = new PropertySourcesConfig(propertySource)
        service.grailsApplication = Stub(GrailsApplication) {
            getConfig() >> config
        }
        webService.getJson2(_, 5000) >> [statusCode: 200, resp: [historical, attribution]]

        expect:
        service.licences*.url as Set == expected

        where:
        yaml                                                                                   | expected
        'licences:\n  allowlist:\n    - HTTPS://CreativeCommons.org/licenses/by-nc/3.0/au' | ['https://creativecommons.org/licenses/by-nc/3.0/au/'] as Set
        'licences:\n  allowlist: []'                                                           | [] as Set
    }

    void "rejects invalid allowlist entries"() {
        given:
        grailsApplication.config.licences.allowlist = entries

        when:
        service.licences

        then:
        thrown(IllegalArgumentException)
        0 * webService._

        where:
        entries << [['javascript:alert(1)'], [42]]
    }

    void "uses CC BY 4.0 only for an absent configured default and preserves unrecognised values"() {
        given:
        grailsApplication.config.licences.default = configured
        webService.getJson2(_, 5000) >> [statusCode: 200, resp: [attribution]]

        expect:
        service.defaultLicence == expected

        where:
        configured                     | expected
        null                           | LicenceService.DEFAULT_LICENCE
        LicenceService.DEFAULT_LICENCE | LicenceService.DEFAULT_LICENCE
        'CC-BY 4.0 (Int)'               | 'CC-BY 4.0 (Int)'
        'not configured'               | 'not configured'
        'https://example.org/licence'  | 'https://example.org/licence'
        ''                             | ''
    }

    void "retains a configured default outside the allowlist"() {
        given:
        grailsApplication.config.licences.allowlist = [historical.url]
        grailsApplication.config.licences.default = LicenceService.DEFAULT_LICENCE
        webService.getJson2(_, 5000) >> [statusCode: 200, resp: [historical, attribution]]

        expect:
        service.defaultLicence == LicenceService.DEFAULT_LICENCE
        service.licences == [historical]
    }

    void "plugin.yml configures CC BY 4.0 as the default licence"() {
        expect:
        pluginConfig.getProperty('licences.default', String) == LicenceService.DEFAULT_LICENCE
    }

    void "configured fallback licences replace the plugin defaults"() {
        given:
        grailsApplication.config.licences.fallback = [historical]

        when:
        List all = service.allLicences

        then:
        1 * webService.getJson2(_, 5000) >> [error: 'timeout']
        all == [historical]
        service.licences == [historical]
    }

    void "rejects invalid fallback licences"() {
        given:
        grailsApplication.config.licences.fallback = [[name: 'Unsafe', acronym: 'Unsafe', url: 'javascript:alert(1)', version: '1']]

        when:
        service.allLicences

        then:
        thrown(IllegalArgumentException)
        0 * webService._
    }
}
