package au.org.ala.ecodata.forms

import grails.testing.services.ServiceUnitTest
import org.springframework.http.HttpStatus
import spock.lang.Specification

class SpeciesListServiceSpec extends Specification implements ServiceUnitTest<SpeciesListService> {

    EcpWebService webService = Mock(EcpWebService)

    def setup() {
        service.grailsApplication = grailsApplication
        grailsApplication.config.lists.apiVersion =  "V2"
        grailsApplication.config.lists.baseURL = "https://lists-api.example.org"
        grailsApplication.config.listsFieldMappingV2 = [
                matchedName: "classification.scientificName",
                commonName: "classification.vernacularName",
                rawScientificName: "scientificName"
        ]

        service.ecpWebService = webService
    }

    def "test speciesListItems with valid listId and v1 API response"() {
        given:
        String listId = "testListId"
        String url = "/speciesListItems/" + listId
        Map params = [pageSize: 500, page: 1]
        Map response = [statusCode: HttpStatus.OK.value(), resp: [[scientificName: "Testus species", vernacularName: "Test Species", kvpValues: [], classification: [taxonConceptID: "testLsid", success: true, scientificName: "Testus species", vernacularName: "Test Species"], properties: []]]]

        when:
        List result = service.speciesListItems(listId)

        then:
        1 * webService.getJson({it.endsWith(url)}, params) >> response

        result.size() == 1
        result[0].name == "Testus species"
        result[0].scientificName == "Testus species"
        result[0].commonName == "Test Species"
        result[0].lsid == "testLsid"
        result[0].kvpValues == []
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
        Map params = [pageSize: 500, page: 1]
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

    void "should call list tool with empty search term" () {
        String searchTerm = null
        String url = "https://lists-api.example.org/speciesList"
        Map params = [sort: 'listName', pageSize: 10, page: 1, order: 'asc', title: '']

        when:
        service.searchSpeciesList('listName', 10, 0, null, 'asc', searchTerm)

        then:
        1 * service.ecpWebService.getJson(url, params) >> [statusCode: HttpStatus.OK.value(), resp: [:]]
    }

    void "should call list tool with passed search term"() {
        String searchTerm = 'abc'
        String url = "https://lists-api.example.org/speciesList"
        Map params = [sort: 'listName', pageSize: 10, page: 1, order: 'asc', title: 'abc']

        when:
        service.searchSpeciesList('listName', 10, 0, null, 'asc', searchTerm)

        then:
        1 * service.ecpWebService.getJson(url, params) >> [statusCode: HttpStatus.OK.value(), resp: [:]]
    }


    def "getSpeciesListMetadataUsingV1 handles HTTP #statusCode correctly"() {
        given:
        def druid = "dr123"
        def mockResponse = [statusCode: statusCode, resp: resp]

        when:
        def result = service.getSpeciesListMetadataUsingV1(druid)

        then:
        1 * webService.getJson("https://lists-api.example.org/ws/speciesList", [druid: druid]) >> mockResponse

        and:
        if (expectedResult) {
            result.listName == resp.listName
            result.itemCount == resp.itemCount
        } else {
            result == null
        }


        where:
        statusCode | resp                               | expectedResult
        200        | [listName: "listName", itemCount: 30]  | SpeciesListService.SpeciesList.fromMap(listName: "listName", itemCount: 30)
        201        | [listName: "listName", itemCount: 30]  | SpeciesListService.SpeciesList.fromMap(listName: "listName", itemCount: 30)
        400        | [error: "Bad request"]             | null
        404        | [error: "Not found"]               | null
        500        | [error: "Server error"]            | null
    }

    def "getSpeciesListMetadataUsingV2 handles HTTP #statusCode correctly"() {
        given:
        def druid = "dr456"
        def mockResponse = [statusCode: statusCode, resp: resp]

        when:
        def result = service.getSpeciesListMetadataUsingV2(druid)

        then:
        1 * webService.getJson("https://lists-api.example.org/speciesList", [druid: druid]) >> mockResponse


        and:
        if (expectedResult) {
            result.listName == resp.title
            result.itemCount == resp.rowCount
        } else {
            result == null
        }


        where:
        statusCode | resp                               | expectedResult
        200        | [title: "dr456", rowCount: 10]  | SpeciesListService.SpeciesList.fromMap(title: "dr456", rowCount: 10)
        201        | [title: "dr456", rowCount: 10]  | SpeciesListService.SpeciesList.fromMap(title: "dr456", rowCount: 10)
        400        | [error: "Bad request"]             | null
        404        | [error: "Not found"]               | null
        500        | [error: "Server error"]            | null
    }

    def "speciesListItemsUsingV1 should handle HTTP status #statusCode correctly"() {
        given:
        def listId = "dr123"
        def mockResponse = [statusCode: statusCode, resp: responseData]
        def params = [includeKVP: true, pageSize: 10, page: 1, q: "test"]

        when:
        def result = service.speciesListItemsUsingV1(listId, params.pageSize, params.page, params.q)

        then:
        1 * webService.getJson({it.endsWith("/ws/speciesListItems/${listId}")}, params) >> mockResponse

        and:
        if (expectedResult) {
            result[0].id == expectedResult.id
            result[0].name == expectedResult.name
        } else {
            result == null
        }

        where:
        statusCode | responseData                                          | expectedResult
        200        | [[id: "item1", name: "Species 1"]]                   | [[id: "item1", name: "Species 1"]]
        201        | [[id: "item2", name: "Species 2"]]                   | [[id: "item2", name: "Species 2"]]
        204        | []                                                    | []
        400        | [error: "Bad request"]                                | null
        404        | [error: "Not found"]                                  | null
        500        | [error: "Server error"]                               | null
    }

    def "getCommonKeysUsingV1 should handle HTTP status #statusCode correctly"() {
        given:
        def druids = "dr123,dr456"
        def mockResponse = [statusCode: statusCode, resp: responseData]

        when:
        def result = service.getCommonKeysUsingV1(druids)

        then:
        1 * webService.getJson({it.endsWith(service.COMMON_KEYS_PATH_V1)}, [druid: druids]) >> mockResponse

        and:
        result == expectedResult

        where:
        statusCode | responseData                         | expectedResult
        200        | ["name", "scientificName"]          | ["name", "scientificName"]
        201        | ["guid", "rank"]                    | ["guid", "rank"]
        204        | []                                   | []
        400        | [error: "Bad request"]               | null
        404        | [error: "Not found"]                 | null
        500        | [error: "Server error"]              | null
    }

    def "getCommonKeysUsingV2 should handle HTTP status #statusCode correctly"() {
        given:
        def druids = "dr123,dr456"
        def mockResponse = [statusCode: statusCode, resp: responseData]

        when:
        def result = service.getCommonKeysUsingV2(druids)

        then:
        1 * webService.getJson({it.endsWith(service.COMMON_KEYS_PATH_V2+ "/" + druids) }, [:]) >> mockResponse

        and:
        result == expectedResult

        where:
        statusCode | responseData                         | expectedResult
        200        | ["name", "scientificName"]          | ["name", "scientificName"]
        201        | ["guid", "rank"]                    | ["guid", "rank"]
        204        | []                                   | []
        400        | [error: "Bad request"]               | null
        404        | [error: "Not found"]                 | null
        500        | [error: "Server error"]              | null
    }

    def "getCommonKeys should merge and sort fields from API and config"() {
        given:
        def druids = "dr123,dr456"
        def apiResponse = ["name", "scientificName", "guid", "matchedName"]
        def mockResponse = [statusCode: 200, resp: apiResponse]
        def configCommonFields = ["class", "family", "order", "guid"]
        grailsApplication.config.lists.commonFields = configCommonFields

        when:
        def result = service.getCommonKeys(druids)

        then:
        1 * webService.getJson(_, _) >> mockResponse

        and:
        result.containsAll(["name", "scientificName", "guid", "class", "family", "order", "matchedName"])  // All fields should be present
        result.size() == 7  // Duplicates should be eliminated
        result == ["class", "family", "guid", "matchedName", "name", "order", "scientificName"]  // Should be sorted
    }

    def "should handle various HTTP status codes correctly"() {
        given:
        def postBody = [listName: "Test List", listItems: "Species 1,Species 2", listType: "SPECIES_CHARACTERS", description: "Test List Description"]

        and: "the web service returns a response with the specified status code"
        1 * webService.doPost("https://lists-api.example.org/ws/speciesList", postBody, true) >> [
                statusCode: statusCode,
                resp: [druid: "dr123"]
        ]

        when:
        def result = service.uploadSpeciesListUsingV1(postBody)

        then:
        result == expectedResult

        where:
        statusCode | expectedResult
        200        | [druid: "dr123"]
        201        | [druid: "dr123"]
        204        | [druid: "dr123"]
        400        | null
        404        | null
        500        | null
    }

    def "createCSVFile should create valid CSV file from rows"() {
        given:
        def rows = [
                ["scientific_name", "common_name", "kingdom"],
                ["Acacia dealbata", "Silver Wattle", "Plantae"],
                ["Eucalyptus globulus", "Tasmanian Blue Gum", "Plantae"]
        ]

        when:
        def file = service.createCSVFile(rows)

        then:
        file != null
        file.exists()
        file.name.startsWith("speciesList")
        file.name.endsWith(".csv")

        and: "file contains correct data"
        file.text.contains("\"scientific_name\",\"common_name\",\"kingdom\"")
        file.text.contains("\"Acacia dealbata\",\"Silver Wattle\",\"Plantae\"")
        file.text.contains("\"Eucalyptus globulus\",\"Tasmanian Blue Gum\",\"Plantae\"")

        cleanup:
        file?.delete()
    }

    def "checkIngestComplete should retry until ingest is complete"() {
        given:
        service.MAX_RETRIES = 60
        def ingestionId = "12456"

        when:
        def result = service.checkIngestComplete(ingestionId)

        then:
        result == true
        3 * webService.getJson2({it.endsWith("ingest/${ingestionId}/progress")}) >>> [
                [statusCode: 200, resp: [completed: false]],
                [statusCode: 200, resp: [completed: false]],
                [statusCode:200, resp: [completed: true]]
        ]
    }

    def "checkIngestComplete should return false after max retries"() {
        given:
        service.MAX_RETRIES = 2
        def ingestionId = "123789"
        def mockResponse = [statusCode: 200, resp: [completed: false]]

        when:
        def result = service.checkIngestComplete(ingestionId)

        then:
        result == false
        service.MAX_RETRIES * webService.getJson2({it.endsWith("ingest/${ingestionId}/progress")}) >> mockResponse
    }


    def "uploadSpeciesListUsingV2 should handle exceptions"() {
        given:
        def rows = [
                ["scientific_name", "common_name", "kingdom"],
                ["Acacia dealbata", "Silver Wattle", "Plantae"]
        ]

        and: "mock exception during upload"
        webService.postMultipart(*_) >> { throw new IOException("Network error") }

        when:
        def result = service.uploadSpeciesListUsingV2(rows, "Test List", "Test Description", "CC-BY", "TEST_LIST")

        then:
        result == null
    }

    def "uploadSpeciesListUsingV2 should handle ingest completion failure"() {
        given:
        service.MAX_RETRIES = 2
        def rows = [
                ["scientific_name", "common_name", "kingdom"],
                ["Acacia dealbata", "Silver Wattle", "Plantae"]
        ]
        def tempFileName = "temp-12345.csv"
        def ingestionId = "ing-12345"
        def dataResourceId = "dr-12345"

        and: "mock successful upload and ingest but failed completion"
        webService.postMultipart(*_) >> [
                statusCode: 200,
                content: [localFile: tempFileName]
        ]

        webService.doPostWithParams(_, _, _) >> [
                statusCode: 200,
                resp: [id: ingestionId, dataResourceUid: dataResourceId]
        ]

        webService.getJson2({it.endsWith("ingest/${ingestionId}/progress")}) >> [statusCode: 200, resp: [completed: false]]

        when:
        def result = service.uploadSpeciesListUsingV2(rows, "Test List", "Test Description", "CC-BY", "TEST_LIST")

        then:
        result == null
    }

    def "uploadSpeciesListUsingV2 should successfully upload species list"() {
        given:
        def rows = [
                ["scientific_name", "common_name", "kingdom"],
                ["Acacia dealbata", "Silver Wattle", "Plantae"]
        ]
        def listName = "Test Species List"
        def description = "Test Description"
        def licence = "CC-BY"
        def listType = "TEST_LIST"
        def tempFileName = "temp-12345.csv"
        def ingestionId = "ing-12345"
        def dataResourceId = "dr-12345"

        and: "mock upload responses"
        webService.postMultipart(
                {it.endsWith(service.UPLOAD_V2)},
                [:],
                _,
                "text/csv",
                "specieslist.csv",
                "file",
                true,
                true
        ) >> [
                statusCode: 200,
                content: [localFile: tempFileName]
        ]

        webService.doPostWithParams(
                {it.endsWith(service.INGEST_V2)},
                [
                        file: tempFileName,
                        listType: listType,
                        title: listName,
                        description: description,
                        licence: licence
                ],
                true
        ) >> [
                statusCode: 200,
                resp: [id: ingestionId, dataResourceUid: dataResourceId]
        ]
        webService.getJson2({it.endsWith("ingest/${ingestionId}/progress")}) >>> [
                [statusCode: 200, resp: [completed: false]],
                [statusCode: 200, resp: [completed: false]],
                [statusCode:200, resp: [completed: true]]
        ]

        when:
        def result = service.uploadSpeciesListUsingV2(rows, listName, description, licence, listType)

        then:
        result != null
        result.druid == dataResourceId
        result.id == ingestionId
    }

    def "searchSpeciesListIItemsInFieldsUsingV1 should return list of species when API call is successful"() {
        given:
        def query = "Eucalyptus"
        def listIds = ["dr1234", "dr5678"]
        def fields = ["scientificName", "commonName"]
        def limit = 10
        def offset = 0
        def apiParams = [
                druid: "dr1234,dr5678",
                fields: "scientificName,commonName",
                q: "Eucalyptus",
                includeKVP: true,
                max: limit,
                offset: offset
        ]

        and: "mock API response"
        def apiResponse = [
                statusCode: 200,
                resp: [
                        [
                                id: 123,
                                scientificName: "Eucalyptus globulus",
                                commonName: "Tasmanian Blue Gum",
                                kvpValues: [[kingdom: "Plantae"]]
                        ],
                        [
                                id: 124,
                                scientificName: "Eucalyptus camaldulensis",
                                commonName: "River Red Gum",
                                kvpValues: [[kingdom: "Plantae"]]
                        ]
                ]
        ]

        webService.getJson({it.endsWith("/ws/queryListItemOrKVP")}, apiParams) >> apiResponse

        when:
        def result = service.searchSpeciesListIItemsInFieldsUsingV1(listIds, fields, query, limit, offset)

        then:
        result.size() == 2
        result[0].scientificName == "Eucalyptus globulus"
        result[1].scientificName == "Eucalyptus camaldulensis"
    }


    def "searchSpeciesListIItemsInFieldsUsingV1 should return null when API call fails"() {
        given:
        def query = "Eucalyptus"
        def listIds = ["dr1234", "dr5678"]
        def fields = ["scientificName", "commonName"]
        def limit = 10
        def offset = 0
        def apiUrl = "http://lists-service.org/api/ws/speciesListItems"
        def apiParams = [
                druid: "dr1234,dr5678",
                fields: "scientificName,commonName",
                q: "Eucalyptus",
                includeKVP: true,
                max: limit,
                offset: offset
        ]

        and: "mock API failure response"
        def apiResponse = [
                statusCode: 404,
                resp: [error: "Not Found"]
        ]

        webService.getJson({it.endsWith("/ws/queryListItemOrKVP")}, apiParams) >> apiResponse

        when:
        def result = service.searchSpeciesListIItemsInFieldsUsingV1(listIds, fields, query, limit, offset)

        then:
        result == null
    }

    def "searchSpeciesListIItemsInFieldsUsingV2 should return list of species when API call is successful"() {
        given:
        def query = "Eucalyptus"
        def listIds = ["dr1234", "dr5678"]
        def fields = ["scientificName", "commonName"]
        def mappedFields = ["scientificName", "commonName"]
        def limit = 10
        def offset = 0
        def apiParams = [
                q: "Eucalyptus",
                fields: "scientificName,commonName",
                pageSize: limit,
                page: 1
        ]

        and: "mock helper methods"
        service.metaClass.replaceFieldsWithV2Names = { List flds -> return mappedFields }
        def apiResponse = [
                statusCode: 200,
                resp: [
                        [
                                id: 123,
                                scientificName: "Eucalyptus globilus",
                                vernacularName: "Tasmanian Blue Gum",
                                classification: [
                                        success: true,
                                        scientificName: "Eucalyptus globulus",
                                        vernacularName: "Tasmanian Blue Gum",
                                        taxonConceptID: "testLsid1",
                                ],
                                properties: [[kingdom: "Plantae"]]
                        ],
                        [
                                id: 124,
                                scientificName: "Eucalyptus cameldulensis",
                                vernacularName: "River Red Gum",
                                classification: [
                                        success: true,
                                        scientificName: "Eucalyptus camaldulensis",
                                        vernacularName: "River Red Gum",
                                        taxonConceptID: "testLsid2",
                                ],
                                properties: [[kingdom: "Plantae"]]
                        ]
                ]
        ]


        webService.getJson({it.endsWith('speciesListItems/dr1234,dr5678')}, apiParams) >> apiResponse

        when:
        def result = service.searchSpeciesListIItemsInFieldsUsingV2(listIds, fields, query, limit, offset)

        then:
        result.size() == 2
        result[0].scientificName == "Eucalyptus globulus"
        result[0].commonName == "Tasmanian Blue Gum"
        result[0].lsid == "testLsid1"
        result[0].kvpValues == [[kingdom: "Plantae"]]
        result[1].scientificName == "Eucalyptus camaldulensis"
        result[1].commonName == "River Red Gum"
        result[1].kvpValues == [[kingdom: "Plantae"]]
        result[1].lsid == "testLsid2"
    }

    def "replaceFieldsWithV2Names should replace field names using configuration mapping"() {
        given:
        def fields = ["matchedName", "oldFieldName", "anotherOldField"]

        when:
        def result = service.replaceFieldsWithV2Names(fields)

        then:
        result.size() == 3
        result[0] == "classification.scientificName" //mapped
        result[1] == "oldFieldName"   // unchanged
        result[2] == "anotherOldField" // unchanged
    }

    def "replaceFieldsWithV2Names should return original fields when no mapping exists"() {
        given:
        def fields = ["scientificName", "kingdom"]

        when:
        def result = service.replaceFieldsWithV2Names(fields)

        then:
        result.size() == 2
        result == fields // unchanged
    }

    def "replaceFieldsWithV2Names should handle null or empty input"() {

        expect:
        service.replaceFieldsWithV2Names([]) == []
        service.replaceFieldsWithV2Names(null) == null
    }

}