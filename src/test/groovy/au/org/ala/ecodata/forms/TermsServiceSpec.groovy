package au.org.ala.ecodata.forms

import grails.testing.services.ServiceUnitTest
import org.apache.http.HttpStatus
import spock.lang.Specification

class TermsServiceSpec extends Specification implements ServiceUnitTest<TermsService>{

    private String hubId = 'hub1'
    private String category = 'category1'

    EcpWebService webService = Mock(EcpWebService)

    def setup() {
        service.grailsApplication = grailsApplication
        service.webService = webService
    }

    def cleanup() {
    }


    def "getTerms should return tags from the web service"() {
        setup:
        List savedTags = [[tag:'tag1', description: 'description 1'], [tag:'tag2', description: 'description 2']]

        when:
        def tags = service.getTerms(hubId, category)

        then:
        1 * webService.getJson({ it.endsWith('metadata/terms') }, [hubId:hubId, category:category]) >> [resp:savedTags]
        tags == savedTags
    }

    def "updateTags should delegate to the EcpWebService"() {
        setup:
        Map tag = [termId:'term1', term: 'term 1', description: 'description 1', category: category, hubId: hubId]

        when:
        service.updateTerm(hubId, tag)

        then:
        1 * webService.doPost({it.endsWith('/metadata/term')}, tag) >> [resp:[success:true]]
    }

    def "addProjectTag should delegate to the EcpWebService"() {
        setup:
        Map tag = [tag: 'tag1', description: 'description 1', category: category, hubId: hubId]

        when:
        def result = service.addTerm(hubId, tag)

        then:
        1 * webService.doPost({it.endsWith('/metadata/term')}, tag) >> [resp:[success:true]]
        result == [resp:[success:true]]

    }

    def "deleteProjectTag should delegate to the EcpWebService"() {
        setup:
        String termId = 't1'

        when:
        def result = service.deleteTerm(termId)

        then:
        1 * webService.doDelete({it.endsWith('/metadata/term/'+termId)}) >> HttpStatus.SC_OK
        result == [success:true]

    }

}
