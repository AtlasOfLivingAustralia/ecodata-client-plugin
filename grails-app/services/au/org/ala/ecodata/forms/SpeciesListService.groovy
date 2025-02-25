package au.org.ala.ecodata.forms


import grails.core.GrailsApplication
import org.springframework.http.HttpStatus

/**
 * Responsible for access to the ALA species list web services.  Currently supports
 * both the old and new API.
 */
class SpeciesListService {
    static final String SPECIES_LIST_ITEMS_PATH = '/speciesListItems'

    GrailsApplication grailsApplication
    EcpWebService ecpWebService

    static class SpeciesListItem {
        String name
        String scientificName
        String commonName
        List kvpValues
        String lsid
    }

    /**
     * Invokes the ALA species list web service to retrieve the species list items for the given listId.
     * It will map the response into the format expected by the speciesModel.js
     * @param listId the id of the list to retrieve
     * @param pageSize
     * @param page
     * @return
     */
    List speciesListItems(String listId, int pageSize = 500, int page = 1) {
        if (!listId) {
            return null
        }
        String url = grailsApplication.config.getProperty('lists.baseURL') + SPECIES_LIST_ITEMS_PATH + '/'+listId
        Map params = [includeKVP:true, pageSize:pageSize, page:page]
        Map resp = ecpWebService.getJson(url, params)

        List speciesList = null
        if (HttpStatus.resolve(resp.statusCode).is2xxSuccessful()) {
            List<Map> speciesListResp = resp.resp
            speciesList = speciesListResp.collect { Map item ->
                if (item) {
                    item.classification ? mapV2API(item) : mapV1API(item)
                }
            }
        }
        speciesList
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
                lsid: lsid,
                name:scientificName,
                scientificName:scientificName,
                commonName:commonName,
                kvpValues: speciesListItem.properties,
        )
    }

    static SpeciesListItem mapV1API(Map speciesListItem) {
        new SpeciesListItem(
                name:speciesListItem.name,
                scientificName: speciesListItem.scientificName,
                commonName: speciesListItem.commonName,
                kvpValues: speciesListItem.kvpValues,
                lsid: speciesListItem.lsid

        )
    }
}
