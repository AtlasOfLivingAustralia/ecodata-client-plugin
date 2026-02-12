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
            def files = request.getFileNames()
            while(files.hasNext()) {
                def fileName = files.next()
                def file = request.getFile(fileName)
                if (file) {
                    boolean isClean = scanService.isDocumentClean(file)
                    clean &= isClean
                }
            }

            if (!clean) {
                response.status = HttpStatus.SC_UNPROCESSABLE_ENTITY
                render contentType: 'application/json', text: [success: false, message: "File upload rejected: virus detected"] as JSON, status: HttpStatus.SC_UNPROCESSABLE_ENTITY
                return false
            }
        }

        true
    }

    boolean after() { true }

    void afterView() { }
}
