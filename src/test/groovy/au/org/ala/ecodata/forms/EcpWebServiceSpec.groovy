package au.org.ala.ecodata.forms

import au.org.ala.ws.tokens.TokenService
import com.sun.net.httpserver.HttpServer
import grails.testing.services.ServiceUnitTest
import okhttp3.Request
import spock.lang.Specification

class EcpWebServiceSpec extends Specification implements ServiceUnitTest<EcpWebService> {

    void setupSpec() {
        grailsApplication.config.app.domain.whiteList = 'ala.org.au,localhost'
    }

    def "hub header must be added to URL connection"() {
        given:
        grailsApplication.config.grails.serverURL = 'http://xyz.com'
        service.grailsApplication = grailsApplication
        URLConnection connection = new URL("http://example.com").openConnection()

        when:
        service.addHostName(connection)

        then:
        connection.getRequestProperty(grailsApplication.config.app.http.header.hostName) == grailsApplication.config.grails.serverURL
    }

    def "hub header must be added to header map"() {
        given:
        grailsApplication.config.grails.serverURL = 'http://xyz.com'
        service.grailsApplication = grailsApplication
        Request.Builder headerBuilder = new Request.Builder().url("http://example.com")

        when:
        service.addHostName(headerBuilder)
        Request req = headerBuilder.build()

        then:
        req.header(grailsApplication.config.getProperty("app.http.header.hostName")) == grailsApplication.config.grails.serverURL
    }

    def "Host names are validated correctly"() {
        given:
        service.grailsApplication = grailsApplication

        expect:
        service.isValidDomain(host) == isValid

        where:
        host           | isValid
        'example.com'  | false
        'localhost'    | true
        'ecodata.ala.org.au'     | true
        'ecodata.ala.org' | false
        'invalid.com'  | false
        'example.org'  | false
    }

    def "getJson2 does not look up the user outside a request"() {
        given:
        service.grailsApplication = grailsApplication
        service.tokenService = Mock(TokenService)
        HttpServer server = HttpServer.create(new InetSocketAddress('localhost', 0), 0)
        server.createContext('/ws/licence') { exchange ->
            exchange.sendResponseHeaders(200, 2)
            exchange.responseBody.withStream { it.write('[]'.bytes) }
        }
        server.start()

        when:
        Map result = service.getJson2("http://localhost:${server.address.port}/ws/licence", 1000)

        then:
        result == [statusCode: 200, resp: []]

        cleanup:
        server.stop(0)
    }
}
