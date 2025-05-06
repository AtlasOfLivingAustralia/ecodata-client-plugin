package au.org.ala.ecodata.forms

import grails.core.GrailsApplication
import org.apache.http.HttpStatus

/**
 * The TermsService acts as a wrapper around the ECP web service for managing terms in ecodata
 */
class TermsService {

    static final String TERMS_QUERY_PATH = '/metadata/terms'
    static final String TERM_UPDATE_PATH = '/metadata/term'

    GrailsApplication grailsApplication
    EcpWebService webService

    List<String> getTerms(String hubId, String category) {
        Map params = [hubId: hubId, category:category]
        String url = baseUrl() + TERMS_QUERY_PATH
        Map result = webService.getJson(url, params)

        result?.resp ?: []
    }

    Map updateTerm(String hubId, Map term) {
        term.hubId = hubId
        String url = baseUrl() + TERM_UPDATE_PATH
        Map result = webService.doPost(url, term)
        result
    }

    Map addTerm(String hubId, Map tag) {
        updateTerm(hubId, tag)
    }

    Map deleteTerm(String termId) {
        String url = baseUrl() + TERM_UPDATE_PATH+'/'+termId
        int response = webService.doDelete(url)
        Map result = response == HttpStatus.SC_OK ? [success:true] : [error:"An error was encountered while deleting the term"]
        result
    }

    private String baseUrl() {
        grailsApplication.config.getProperty('ecodata.service.url')
    }

}
