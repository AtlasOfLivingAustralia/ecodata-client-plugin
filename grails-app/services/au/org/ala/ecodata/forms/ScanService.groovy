package au.org.ala.ecodata.forms


import org.springframework.web.multipart.MultipartFile

class ScanService {
    EcpWebService webService
    def grailsApplication

    boolean isDocumentClean(MultipartFile file) {
        if (file == null) {
            return true
        }

        if (grailsApplication.config.getProperty('scanFile.enabled', Boolean, true)) {
            String baseUrl = grailsApplication.config.getProperty('ecodata.service.url', String, '')
            if (baseUrl.endsWith('/')) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - 1)
            }

            baseUrl = baseUrl.replaceAll("/ws", '/reporting/ws')
            def result = webService.postMultipart("${baseUrl}/document/scanDocument", [:], file, "fileToScan", true)
            return result.statusCode == org.springframework.http.HttpStatus.OK.value()
        }

        return true
    }
}
