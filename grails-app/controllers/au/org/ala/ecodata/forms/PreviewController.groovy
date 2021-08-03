package au.org.ala.ecodata.forms

import grails.converters.JSON
import grails.util.Environment
import org.apache.commons.io.FilenameUtils
import org.grails.io.support.PathMatchingResourcePatternResolver
import org.grails.io.support.Resource

class PreviewController {

    private static String EXAMPLE_MODEL = 'example.json'
    private static String EXAMPLE_MODELS_PATH = '/example_models/'
    private static String EXAMPLE_DATA_PATH = '/example_data/'
    int siteCounter = 1

    def index() {

        String modelName = params.name ?: EXAMPLE_MODEL
        Map model = getExample(modelName)
        String dataFileName = params.data ?: modelName
        Map data = getData(dataFileName)
        render ([model:[model:model, data:data, title:model.modelName, examples:allExamples()], view:'index'])

    }

    def model() {
        Map model = request.JSON

        if (!model) {
            respond status:400
        }

        render ([model:[model:model, title:model.modelName], view:'index'])
    }

    def imagePreview(String id) {
        String ext = FilenameUtils.getExtension(id)

        InputStream imageIn = getClass().getResourceAsStream(EXAMPLE_DATA_PATH+id)
        if (imageIn) {
            response.contentType = 'image/'+ext
            response.outputStream << imageIn
            response.outputStream.flush()
        }
        else {
            response.status = 404
        }
    }


    private List allExamples(){
        List examples = []
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver()
        Resource[] resources = resolver.getResources(EXAMPLE_MODELS_PATH+"*.json")

        for (Resource resource : resources) {
            Map model = getExample(resource.filename)

            examples << [name:resource.filename, title:model.title ?: model.modelName]
        }

        examples
    }


    private Map getExample(String name) {
        loadFile(EXAMPLE_MODELS_PATH, name)
    }

    private getData(String name) {
        loadFile(EXAMPLE_DATA_PATH, name)
    }

    private Map loadFile(String path, String name) {
        if (!name.endsWith('.json')) {
            name += '.json'
        }

        String relativePath = path + name

        InputStream fileIn = null
        // Allow easy reloading in development environments.
        if (Environment.current == Environment.DEVELOPMENT) {
            File file = new File("./grails-app/conf"+relativePath)
            if (file.exists()) {
                fileIn = new FileInputStream(file)
            }
        }
        else {
            fileIn = getClass().getResourceAsStream(relativePath)
        }
        Map result = [:]
        if (fileIn != null) {
            result = JSON.parse(fileIn, 'UTF-8')
        }
        result

    }

    /**
     * Echos the request parameters back to the client.
     */
    def prepopulate() {
        respond params
    }

    /**
     * Stub function for testing geoMap dataType.
     */
    def getBookmarkLocations () {
        render text: '[]', contentType: 'application/json'
    }

    /**
     * Stub function for testing geoMap dataType.
     */
    def saveBookmarkLocation () {
        render text: '{}', contentType: 'application/json'
    }

    /**
     * Stub function for testing geoMap dataType.
     */
    def getSite () {
        render text: '{}', contentType: 'application/json'
    }

    /**
     * Stub function for testing geoMap dataType.
     */
    def updateSite() {
        siteCounter ++
        render text: "{\"id\": \"${siteCounter}\"}", contentType: 'application/json'
    }

    /**
     * Stub function for testing geoMap dataType.
     */
    def listSites() {
        // copy changes to site object to index.gsp
        def sites = [[
            'siteId': 'abc',
            'projects': ['projectA'],
            'name': 'Test site'
        ]]
        render sites as JSON, contentType: 'application/json'
    }

    /**
     * Stub function for testing geoMap dataType.
     */
    def spatialGeoserver() {
        render text: '', contentType: 'text/plain'
    }

    /**
     * Stub function for testing geoMap dataType.
     */
    def proxyFeature() {
        render text: '', contentType: 'text/plain'
    }

    /**
     * Stub function for testing geoMap dataType.
     */
    def uniqueName() {
        render text: '', contentType: 'text/plain'
    }

    /**
     * Stub function for testing geoMap dataType.
     */
    def checkPoint() {
        render text: '{ "isPointInsideProjectArea": true, "address": null }', contentType: 'application/json'
    }
}
