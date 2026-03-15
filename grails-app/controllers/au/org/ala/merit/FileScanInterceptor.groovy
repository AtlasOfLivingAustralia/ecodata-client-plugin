package au.org.ala.merit

import au.org.ala.ecodata.forms.ScanService
import grails.converters.JSON
import org.apache.http.HttpStatus

class FileScanInterceptor {
    ScanService scanService
    int order = LOWEST_PRECEDENCE - 15 // Run after AclInterceptor. BioCollect AclInterceptor has order 3.

    FileScanInterceptor() {
        matchAll()
    }

    boolean before() {
        if (request.respondsTo('getFile')) {
            boolean clean = true
            List statusCodes = []
            def files = request.getFileNames()
            while(files.hasNext()) {
                def fileName = files.next()
                def file = request.getFile(fileName)
                if (file) {
                    statusCodes << scanService.getDocumentScanStatus(file)
                }
            }

            if (statusCodes.any { it == HttpStatus.SC_UNPROCESSABLE_ENTITY }) {
                response.status = HttpStatus.SC_UNPROCESSABLE_ENTITY
                render contentType: 'application/json', text: [success: false, message: "File upload rejected: virus detected"] as JSON, status: HttpStatus.SC_UNPROCESSABLE_ENTITY
                return false
            }
            else if (statusCodes.every { it == HttpStatus.SC_OK }) {
                return true
            }
            else {
                response.status = HttpStatus.SC_INTERNAL_SERVER_ERROR
                render contentType: 'application/json', text: [success: false, message: "File upload failed during scanning"] as JSON, status: HttpStatus.SC_INTERNAL_SERVER_ERROR
                return false
            }
        }

        true
    }

    boolean after() { true }

    void afterView() { }
}
