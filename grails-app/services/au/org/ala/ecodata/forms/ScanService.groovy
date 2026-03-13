package au.org.ala.ecodata.forms

import org.springframework.http.HttpStatus
import org.springframework.web.multipart.MultipartFile

class ScanService {
    EcpWebService ecpWebService
    def grailsApplication

    int isDocumentClean(MultipartFile file) {
        if (file == null) {
            return HttpStatus.OK.value()
        }

        if (grailsApplication.config.getProperty('scanFile.enabled', Boolean, true)) {
            String baseUrl = grailsApplication.config.getProperty('ecodata.service.url', String, '')
            if (baseUrl.endsWith('/')) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - 1)
            }

            baseUrl = baseUrl.replaceAll("/ws", '/reporting/ws')
            def result = ecpWebService.postMultipart("${baseUrl}/document/scanDocument", [:], file, "fileToScan", true)
            return result.statusCode
        }

        return HttpStatus.OK.value()
    }
}
