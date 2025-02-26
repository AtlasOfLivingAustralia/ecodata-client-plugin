package au.org.ala.ecodata.forms

import grails.testing.services.ServiceUnitTest
import org.springframework.http.HttpStatus
import spock.lang.Specification

class SpeciesListServiceSpec extends Specification implements ServiceUnitTest<SpeciesListService> {

    EcpWebService webService = Mock(EcpWebService)

    def setup() {
        service.grailsApplication = grailsApplication
        service.ecpWebService = webService
    }

    def "test speciesListItems with valid listId and v1 API response"() {
        given:
        String listId = "testListId"
        String url = "/speciesListItems/" + listId
        Map params = [includeKVP: true, pageSize: 500, page: 1]
        Map response = [statusCode: HttpStatus.OK.value(), resp: [[name: "Test Species", scientificName: "Testus species", commonName: "Test Species", kvpValues: [], lsid: "testLsid"]]]

        when:
        List result = service.speciesListItems(listId)

        then:
        1 * webService.getJson({it.endsWith(url)}, params) >> response

        result.size() == 1
        result[0].name == "Test Species"
        result[0].scientificName == "Testus species"
        result[0].commonName == "Test Species"
        result[0].lsid == "testLsid"
    }

    def "test speciesListItems with invalid listId"() {
        given:
        String listId = null

        when:
        List result = service.speciesListItems(listId)

        then:
        result == null
    }

    def "test speciesListItems with v2 API response"() {
        given:
        String listId = "testListId"
        String url = "/speciesListItems/" + listId
        Map params = [includeKVP: true, pageSize: 500, page: 1]
        Map response = [
                statusCode: HttpStatus.OK.value(),
                resp: [[
                               scientificName: "Testus species",
                               vernacularName: "Test Species",
                               classification: [
                                       success: true,
                                       scientificName: "Testus species",
                                       vernacularName: "Test Species",
                                       taxonConceptID: "testLsid"
                               ],
                               properties: []
                       ]]
        ]

        when:
        List result = service.speciesListItems(listId)

        then:
        1 * webService.getJson({it.endsWith(url)}, params) >> response

        result.size() == 1
        result[0].name == "Testus species"
        result[0].scientificName == "Testus species"
        result[0].commonName == "Test Species"
        result[0].lsid == "testLsid"
    }
}