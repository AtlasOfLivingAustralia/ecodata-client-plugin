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
            String baseUrl = grailsApplication.config.getProperty('ecodata.baseUrl')
            if (!baseUrl) {
                // biocollect compatibility
                baseUrl = grailsApplication.config.getProperty('ecodata.baseURL') + "/reporting/ws/"
            }
            else {
                // for merit we need to adjust the base url to point to the reporting server
                baseUrl = grailsApplication.config.getProperty('ecodata.baseUrl').replaceAll("/ws/", '/reporting/ws/')
            }

            def result = webService.postMultipart("${baseUrl}document/scanDocument", [:], file, "fileToScan", true)
            return result.statusCode == org.springframework.http.HttpStatus.OK.value()
        }

        return true
    }
}
