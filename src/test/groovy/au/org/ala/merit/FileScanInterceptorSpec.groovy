package au.org.ala.merit

import au.org.ala.ecodata.forms.EcpWebService
import au.org.ala.ecodata.forms.PreviewController
import au.org.ala.ecodata.forms.ScanService
import grails.testing.web.interceptor.InterceptorUnitTest
import org.springframework.http.HttpStatus
import spock.lang.Specification

class FileScanInterceptorSpec extends Specification implements InterceptorUnitTest<FileScanInterceptor> {
    def scanService, webService

    def setup() {
        interceptor.scanService = scanService = new ScanService()
        scanService.ecpWebService = Mock(EcpWebService)
        webService = scanService.ecpWebService
        scanService.grailsApplication = grailsApplication
    }

    void "interceptor allows clean files to pass through"() {
        given:
        def controller = (PreviewController) mockController(PreviewController)
        def file = Mock(org.springframework.web.multipart.MultipartFile)
        file.name >> "clean"
        file.inputStream >> new ByteArrayInputStream("clean file content".bytes)
        request.addFile(file)

        when:
        withInterceptors(controller: PreviewController) {
            controller.prepopulateConstraints()
        }

        then:
        1 * webService.postMultipart(*_) >> [statusCode: HttpStatus.OK.value()]
        response.status == 200
    }

    void "interceptor blocks infected files"() {
        given:
        def controller = (PreviewController) mockController(PreviewController)
        def file = Mock(org.springframework.web.multipart.MultipartFile)
        file.name >> "infected"
        file.inputStream >> new ByteArrayInputStream("infected file content".bytes)
        request.addFile(file)

        when:
        def result = withInterceptors(controller: PreviewController) {
            controller.prepopulateConstraints()
        }

        then:
        1 * webService.postMultipart(*_) >> [statusCode: HttpStatus.UNPROCESSABLE_ENTITY.value() ]
        response.status == 422
    }

    void "interceptor should check multiple files"() {
        given:
        def controller = (PreviewController) mockController(PreviewController)
        def cleanFile = Mock(org.springframework.web.multipart.MultipartFile)
        cleanFile.name >> "clean"
        cleanFile.originalFilename >> "clean.txt"
        cleanFile.inputStream >> new ByteArrayInputStream("clean file content".bytes)
        def infectedFile = Mock(org.springframework.web.multipart.MultipartFile)
        infectedFile.name >> "infected"
        infectedFile.originalFilename >> "infected.txt"
        infectedFile.inputStream >> new ByteArrayInputStream("infected file content".bytes)
        request.getFileNames() >> ['clean.txt', 'infected.txt'].iterator()
        request.addFile(cleanFile)
        request.addFile(infectedFile)

        when:
        def result = withInterceptors(controller: PreviewController) {
            controller.prepopulateConstraints()
        }

        then:
        2 * webService.postMultipart(*_) >> [statusCode: HttpStatus.UNPROCESSABLE_ENTITY.value()]
        response.status == 422
    }

    void "interceptor should handle mixed file scan results"() {
        given:
        def controller = (PreviewController) mockController(PreviewController)
        def cleanFile = Mock(org.springframework.web.multipart.MultipartFile)
        cleanFile.name >> "clean"
        cleanFile.originalFilename >> "clean.txt"
        cleanFile.inputStream >> new ByteArrayInputStream("clean file content".bytes)
        def corruptFile = Mock(org.springframework.web.multipart.MultipartFile)
        corruptFile.name >> "corrupt"
        corruptFile.originalFilename >> "corrupt.txt"
        corruptFile.inputStream >> new ByteArrayInputStream("corrupt file content".bytes)
        request.getFileNames() >> ['clean.txt', 'corrupt.txt'].iterator()
        request.addFile(cleanFile)
        request.addFile(corruptFile)

        when:
        def result = withInterceptors(controller: PreviewController) {
            controller.prepopulateConstraints()
        }

        then:
        2 * scanService.ecpWebService.postMultipart(*_) >> [statusCode: HttpStatus.INTERNAL_SERVER_ERROR.value()]
        response.status == 500
    }
}
