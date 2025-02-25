package au.org.ala.ecodata.forms

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.databind.ObjectMapper
import com.opencsv.CSVWriter
import grails.core.GrailsApplication
import org.springframework.http.HttpStatus
import java.time.Instant
import java.time.format.DateTimeFormatter
/**
 * Responsible for access to the ALA species list web services.  Currently supports
 * both the old and new API.
 */
class SpeciesListService {
    static final String SPECIES_LIST_ITEMS_PATH_V1 = '/ws/speciesListItems'
    static final String SPECIES_LIST_ITEMS_PATH_V2 = '/speciesListItems'
    static final String SPECIES_LIST_PATH_V2 = '/speciesList'
    static final String SPECIES_LIST_PATH_V1 = '/ws/speciesList'
    static final String SPECIES_V2 = '/species'
    static final String COMMON_KEYS_PATH_V1 = '/ws/listCommonKeys'
    static final String COMMON_KEYS_PATH_V2 = '/listCommonKeys'
    static final String SPECIES_LIST_ITEMS_QUERY_V1 = "/ws/queryListItemOrKVP"
    static final String SPECIES_LIST_ITEMS_QUERY_V2 = "/speciesListItems"
    static final String SPECIES_LIST_BY_GUID_PATH_V2 = "/speciesList/byGuid"
    int MAX_RETRIES = 60
    static final String LIST_VERSION_V2 = 'v2'
    static final String LIST_VERSION_V1 = 'v1'
    static final String UPLOAD_V2 = "/upload"
    public static final String INGEST_V2 = "/ingest"
    public static final String PROGRESS_V2 = "/progress"

    GrailsApplication grailsApplication
    EcpWebService ecpWebService


    static class SpeciesListItem {
        String id
        String name
        String dataResourceUid
        String scientificName
        String commonName
        List kvpValues
        String lsid
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class SpeciesListResponse {
        int listCount
        List<SpeciesList> lists

        static SpeciesListResponse fromMap(Map speciesList) {
            if (speciesList?.lists?.size() > 0) {
                if (SpeciesList.isV1(speciesList.lists[0])) {
                    fromMapV1(speciesList)
                }
                else
                    fromMapV2(speciesList)
            }
        }

        static SpeciesListResponse fromMapV1(Map speciesList) {
            speciesList.lists = speciesList?.lists?.collect {
                SpeciesList.fromMapV1(it)
            }

            ObjectMapper objectMapper = new ObjectMapper()
            objectMapper.convertValue(speciesList, SpeciesListResponse.class)
        }

        static SpeciesListResponse fromMapV2(Map speciesList) {
            speciesList.lists = speciesList?.lists?.collect {
                SpeciesList.fromMapV2(it)
            }
            ObjectMapper objectMapper = new ObjectMapper()
            objectMapper.convertValue(speciesList, SpeciesListResponse.class)
        }

        static SpeciesListResponse fromList(List speciesList) {
            SpeciesListResponse response = new SpeciesListResponse()
            response.listCount = speciesList.size()
            response.lists = speciesList.collect {
                SpeciesList.fromMap(it)
            }
            response
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class SpeciesList {
        String id
        String dataResourceUid
        String listName
        String description
        String listType
        String dateCreated
        String lastUpdated
        String lastUploaded
        String fullName
        int itemCount
        String region
        String category
        String authority
        String sdsType
        boolean isAuthoritative
        boolean isInvasive
        boolean isThreatened
        boolean isBIE
        boolean isSDS
        boolean isPrivate

        // v2 fields
        String licence
        List<String> originalFieldList
        List<String> fieldList
        List<String> facetList
        String doi

        SpeciesList () {}

        boolean isValid () {
            dataResourceUid != null && listName != null && listType != null
        }

        static boolean isV1 (Map metadata) {
            return metadata.listName != null && metadata.itemCount != null
        }

        static SpeciesList fromMap (Map speciesList) {
            if(isV1(speciesList))
                fromMapV1(speciesList)
            else
                fromMapV2(speciesList)
        }

        static SpeciesList fromMapV1(Map speciesList) {
            ObjectMapper objectMapper = new ObjectMapper()
            objectMapper.convertValue(speciesList, SpeciesList.class)
        }

        static SpeciesList fromMapV2(Map speciesList) {
            speciesList.listName = speciesList.title
            speciesList.itemCount = speciesList.rowCount
            speciesList.fullName = speciesList.ownerName
            speciesList.dateCreated = convertEpochToIsoDate(speciesList.dateCreated as Long)
            speciesList.lastUpdated = convertEpochToIsoDate(speciesList.lastUpdated as Long)
            speciesList.lastUploaded = convertEpochToIsoDate(speciesList.lastUploaded as Long)

            ObjectMapper objectMapper = new ObjectMapper()
            objectMapper.convertValue(speciesList, SpeciesList.class)
        }

        static String convertEpochToIsoDate (Long timestamp) {
            if (timestamp) {
                Instant instant = Instant.ofEpochMilli(timestamp)
                DateTimeFormatter.ISO_INSTANT.format(instant)
            }
        }
    }

    /**
     * Retrieves the metadata for the species list with the given druid.
     * @param druid
     * @return
     */
    SpeciesList getSpeciesListMetadata (String druid) {
        if (checkListAPIVersion(LIST_VERSION_V1))
            return getSpeciesListMetadataUsingV1(druid)
        else
            return getSpeciesListMetadataUsingV2(druid)
    }

    SpeciesList getSpeciesListMetadataUsingV1 (String druid) {
        Map resp = ecpWebService.getJson(grailsApplication.config.getProperty('lists.baseURL') + SPECIES_LIST_PATH_V1, [druid: druid])
        if (HttpStatus.resolve(resp.statusCode as int).is2xxSuccessful()) {
            return SpeciesList.fromMap(resp.resp as Map)
        }
    }

    SpeciesList getSpeciesListMetadataUsingV2 (String druid) {
        Map resp = ecpWebService.getJson(grailsApplication.config.getProperty('lists.baseURL') + SPECIES_LIST_PATH_V2, [druid: druid])
        if (HttpStatus.resolve(resp.statusCode as int).is2xxSuccessful()) {
            return SpeciesList.fromMap(resp.resp as Map)
        }
    }

    /**
     * Retrieves all the species list items for the given listId.
     * @param listId
     * @param query
     * @param pageSize
     * @return
     */
    List<SpeciesListItem> allSpeciesListItems (String listId, String query = "", int pageSize = 500) {
        int page = 1
        List<SpeciesListItem> items = [], result
        do {
            result = speciesListItems(listId, pageSize, page, query)
            page++
            items.addAll(result)
        } while (result?.size() == pageSize)

        items
    }

    /**
     * Invokes the ALA species list web service to retrieve the species list items for the given listId.
     * It will map the response into the format expected by the speciesModel.js
     * @param listId the id of the list to retrieve
     * @param pageSize
     * @param page
     * @return
     */
    List speciesListItems(String listId, int pageSize = 500, int page = 1, String query = "") {
        if (checkListAPIVersion(LIST_VERSION_V1))
            return speciesListItemsUsingV1(listId, pageSize, page, query)
        else
            return speciesListItemsUsingV2(listId, pageSize, page, query)
    }

    List speciesListItemsUsingV1(String listId, int pageSize, int page, String query) {
        if (!listId) {
            return null
        }

        String url = grailsApplication.config.getProperty('lists.baseURL') + SPECIES_LIST_ITEMS_PATH_V1 + '/' + listId
        Map params = [includeKvp: true, pageSize: pageSize, page: page]
        if (query) {
            params.q = query
        }

        Map resp = ecpWebService.getJson(url, params)
        List speciesList = null
        if (HttpStatus.resolve(resp.statusCode as int).is2xxSuccessful()) {
            List<Map> speciesListResp = resp.resp
            speciesList = speciesListResp.collect { Map item ->
                if (item) {
                    mapV1API(item)
                }
            }
        }
        speciesList
    }

    List speciesListItemsUsingV2(String listId, int pageSize, int page, String query) {
        if (!listId) {
            return null
        }
        String url = grailsApplication.config.getProperty('lists.baseURL') + SPECIES_LIST_ITEMS_PATH_V2 + '/' + listId
        Map params = [includeKvp: true, pageSize: pageSize, page: page]
        if (query) {
            params.q = query
        }

        Map resp = ecpWebService.getJson(url, params)
        List speciesList = null
        if (HttpStatus.resolve(resp.statusCode).is2xxSuccessful()) {
            List<Map> speciesListResp = resp.resp
            speciesList = speciesListResp.collect { Map item ->
                if (item) {
                    mapV2API(item)
                }
            }
        }
        speciesList
    }

    /**
     * Search species list name.
     * @param sort
     * @param max
     * @param offset
     * @param guid
     * @param order
     * @param searchTerm
     * @return
     */
    SpeciesListResponse searchSpeciesList(String sort = 'listName', Integer max = 100, Integer offset = 0, String guid = null, String order = "asc", String searchTerm = null) {
        if (checkListAPIVersion(LIST_VERSION_V1))
            return searchSpeciesListUsingV1(sort, max, offset, guid, order, searchTerm)
        else
            return searchSpeciesListUsingV2(sort, max, offset, guid, order, searchTerm)
    }

    SpeciesListResponse searchSpeciesListUsingV1(String sort = 'listName', Integer max = 100, Integer offset = 0, String guid = null, String order = "asc", String searchTerm = null) {
        Map resp
        String url = grailsApplication.config.getProperty("lists.baseURL") + SPECIES_LIST_PATH_V1
        Map params = [sort:sort ?:"", max:max?:"", offset:offset?:"", order:order?:"", q:searchTerm ?:""]
        if (!guid) {
            resp = ecpWebService.getJson(url, params)
            if (HttpStatus.resolve(resp.statusCode).is2xxSuccessful()) {
                return SpeciesListResponse.fromMap(resp.resp)
            }
        } else {
            // Search List by species in the list
            params["items.guid"] = "eq:${guid}"
            params["items"] = "createAlias:items"
            resp = ecpWebService.getJson(url, params)
            if (HttpStatus.resolve(resp.statusCode).is2xxSuccessful()) {
                return SpeciesListResponse.fromMap(resp.resp)
            }
        }
    }

    SpeciesListResponse searchSpeciesListUsingV2(String sort = 'listName', Integer max = 100, Integer offset = 0, String guid = null, String order = "asc", String searchTerm = null) {
        Map resp, params
        String url
        if (!guid) {
            url = grailsApplication.config.getProperty("lists.baseURL") + SPECIES_LIST_PATH_V2
            params = [sort:sort, pageSize:max, page:getPageFromOffset(max, offset), order:order, title:searchTerm ?:'']
            resp = ecpWebService.getJson(url, params)
            if (HttpStatus.resolve(resp.statusCode as int).is2xxSuccessful())
                return SpeciesListResponse.fromMap(resp.resp)
        } else {
            url = grailsApplication.config.getProperty("lists.baseURL") + SPECIES_LIST_BY_GUID_PATH_V2
            params = [guid:guid, pageSize:max, page:getPageFromOffset(max, offset)]
            resp = ecpWebService.getJson(url, params)
            if (HttpStatus.resolve(resp.statusCode as int).is2xxSuccessful())
                return SpeciesListResponse.fromList(resp.resp)
        }
    }

    /**
     * Returns the page number from the given offset and page size.
     * @param pageSize
     * @param offset
     * @return
     */
    int getPageFromOffset (Integer pageSize, Integer offset) {
        offset = offset ?: 0
        pageSize = pageSize ?: 10
        offset/pageSize + 1
    }

    /**
     * Retrieves the keys attached to the list for the given druids.
     * @param druids
     * @return
     */
    List<String> getCommonKeys (String druids) {
        List fields = null
        if(checkListAPIVersion(LIST_VERSION_V1))
            fields = getCommonKeysUsingV1(druids)
        else
            fields = getCommonKeysUsingV2(druids)

        List commonFields = grailsApplication.config.getProperty("lists.commonFields", List)
        if (commonFields) {
            fields = fields ?: []
            fields?.addAll(commonFields)
        }

        fields.sort()
        fields.unique()
    }

    List<String> getCommonKeysUsingV1 (String druids) {
        Map resp = ecpWebService.getJson(grailsApplication.config.getProperty("lists.baseURL") + COMMON_KEYS_PATH_V1, [druid: druids])
        List fields = null
        if (HttpStatus.resolve(resp.statusCode).is2xxSuccessful()) {
            fields = resp.resp as List
        }

        fields
    }

    List getCommonKeysUsingV2 (String druids) {
        Map resp = ecpWebService.getJson(grailsApplication.config.getProperty("lists.baseURL") + COMMON_KEYS_PATH_V2 + "/" + druids, [:])
        List fields = null
        if (HttpStatus.resolve(resp.statusCode as int).is2xxSuccessful()) {
            fields = resp.resp as List
        }

        fields
    }

    /**
     * Uploads a species list to the old ALA species list.
     * @param postBody
     * @param druid
     * @return
     */
    @Deprecated
    Map<String,String> uploadSpeciesListUsingV1 (Map postBody, String druid = "") {
        String url = grailsApplication.config.getProperty('lists.baseURL') + SPECIES_LIST_PATH_V1 + (druid ? "/${druid}" : "")
        Map resp = ecpWebService.doPost(url, postBody, true)
        if (HttpStatus.resolve(resp.statusCode as int).is2xxSuccessful())
            return [druid: resp.resp.druid]
    }

    /**
     * Uploads a species list to the new ALA species list.
     * @param rows
     * @param listName
     * @param description
     * @param licence
     * @param listType
     * @return
     */
    Map uploadSpeciesListUsingV2 (List rows, String listName, String description, String licence, String listType) {
        if (rows) {
            File file = createCSVFile(rows)
            if (!file)
                return null

            try {
                String url = grailsApplication.config.getProperty('lists.baseURL') + UPLOAD_V2
                Map resp = ecpWebService.postMultipartWithOkhttp3(url, [:], file, "text/csv", "specieslist.csv", "file", true, true)
                if (HttpStatus.resolve(resp.statusCode as int).is2xxSuccessful()) {
                    Map apiResp = resp.content
                    String tempFileName = apiResp.localFile
                    resp = ecpWebService.doPostWithParams(
                            grailsApplication.config.getProperty('lists.baseURL') + INGEST_V2,
                            [
                                    file: tempFileName,
                                    listType: listType,
                                    title: listName,
                                    description: description,
                                    licence: licence
                            ], true
                    )

                    if (HttpStatus.resolve(resp.statusCode as int).is2xxSuccessful()) {
                        String id = resp.resp.id
                        String drid = resp.resp.dataResourceUid

                        file.delete()
                        if (checkIngestComplete(id))
                            return [druid: drid, id: id]
                    }
                }
            }
            catch (Exception e) {
                log.error("Error uploading species list", e)
            }

            file.delete()
            return null
        }
    }

    def checkIngestComplete (String id) {
        String url = grailsApplication.config.getProperty('lists.baseURL') + INGEST_V2 + "/" + id + PROGRESS_V2
        int retry = 0 // try for 5 minutes
        while (MAX_RETRIES > retry) {
            Map result = ecpWebService.getJson2(url)
            if (HttpStatus.resolve(result.statusCode as int).is2xxSuccessful() && result.resp.completed) {
                return true
            }

            Thread.sleep(5_000)
            retry++
        }

        return false
    }

    /**
     * Creates a temporary CSV file from the provided rows of data.
     *
     * @param rows A list of lists, where each inner list represents a row of data to be written to the CSV file.
     * @return The created temporary CSV file.
     */
    File createCSVFile(List<List> rows) {
        if (rows) {
            File file = File.createTempFile("speciesList", ".csv")
            def writer = new FileWriter(file)
            CSVWriter csvWriter = new CSVWriter(writer)
            rows.each { List row ->
                String[] ar = row.toArray(new String[0])
                csvWriter.writeNext(ar)
            }

            csvWriter.close()
            file
        }
    }

    /**
     * Search species list items based on the given query on provided fields.
     * @param query
     * @param listId
     * @param fields
     * @param limit
     * @param offset
     * @return
     */
    List<SpeciesListItem> searchSpeciesListOnFields(String query, List listId = [], List fields = [], limit = 10, offset = 0) {
        List<SpeciesListItem> listContents = null
        if (checkListAPIVersion(LIST_VERSION_V1))
            return searchSpeciesListIItemsInFieldsUsingV1(listId, fields, query, limit, offset)
        else
            return searchSpeciesListIItemsInFieldsUsingV2(listId, fields, query, limit, offset)
    }

    List<SpeciesListItem> searchSpeciesListIItemsInFieldsUsingV1(List listId, List fields, String query, limit, offset) {
        Map params = [druid: listId.join(','), fields: fields.join(','), q:query, includeKVP: true, max: limit, offset: offset]
        Map result = ecpWebService.getJson(grailsApplication.config.getProperty("lists.baseURL") + SPECIES_LIST_ITEMS_QUERY_V1 , params)
        if (HttpStatus.resolve(result.statusCode as int).is2xxSuccessful()) {
            List<Map> resp = result.resp as List<Map>
            return resp.collect { Map item ->
                if (item) {
                    mapV1API(item)
                }
            }
        }
    }

    List<SpeciesListItem> searchSpeciesListIItemsInFieldsUsingV2 (List listId, List fields, String query, limit, offset) {
        String url = grailsApplication.config.getProperty('lists.baseURL') + SPECIES_LIST_ITEMS_QUERY_V2 + "/" + listId.join(',')
        fields = replaceFieldsWithV2Names(fields)
        Map params = [
                q: query,
                fields: fields.join(','),
                pageSize: limit,
                page: getPageFromOffset(limit, offset)
        ]

        Map resp = ecpWebService.getJson(url, params)
        if (HttpStatus.resolve(resp.statusCode as int).is2xxSuccessful()) {
            List<Map> speciesListResp = resp.resp
            return speciesListResp.collect { Map item ->
                if (item) {
                    mapV2API(item)
                }
            }
        }
    }

    /**
     * Transforms fields in v1 to v2 fields.
     * For example, rawScientificName to scientificName, matchedName to classification.scientificName etc.
     * @param fields
     * @return
     */
    List replaceFieldsWithV2Names (List fields) {
        if (fields) {
            grailsApplication.config.getProperty('listsFieldMappingV2', Map)?.each { k, v ->
                fields = fields.collect { it == k ? v : it }
            }
        }

        fields
    }

    boolean checkListAPIVersion (String version) {
        grailsApplication.config.getProperty('lists.apiVersion') == version
    }

    static SpeciesListItem mapV2API(Map speciesListItem) {
        String scientificName = speciesListItem.scientificName
        String commonName = speciesListItem.vernacularName
        String lsid = null

        // If the item successfully matched, use the matched classification
        if (speciesListItem.classification?.success) {
            scientificName = speciesListItem.classification.scientificName
            commonName = speciesListItem.classification.vernacularName
            lsid = speciesListItem.classification.taxonConceptID
        }

        new SpeciesListItem(
                id: speciesListItem.id,
                dataResourceUid: speciesListItem.speciesListID,
                lsid: lsid,
                name:scientificName,
                scientificName:scientificName,
                commonName:commonName,
                kvpValues: speciesListItem.properties,
        )
    }

    static SpeciesListItem mapV1API(Map speciesListItem) {
        new SpeciesListItem(
                id: speciesListItem.id,
                dataResourceUid: speciesListItem.dataResourceUid,
                name:speciesListItem.name,
                scientificName: speciesListItem.scientificName,
                commonName: speciesListItem.commonName,
                kvpValues: speciesListItem.kvpValues,
                lsid: speciesListItem.lsid

        )
    }
}
