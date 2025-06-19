package au.org.ala.ecodata.forms

import grails.testing.services.ServiceUnitTest
import okhttp3.Request
import spock.lang.Specification

class EcpWebServiceSpec extends Specification implements ServiceUnitTest<EcpWebService> {
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
}
