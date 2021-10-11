package au.org.ala.ecodata.forms

import asset.pipeline.GenericAssetFile
import spock.lang.Specification

class TemplateFileAssetResolverSpec extends Specification {

    def templateFileAssetResolver
    File file

    def setup() {
        templateFileAssetResolver = new TemplateFileAssetResolver('templates', "./grails-app/assets/components", false, '/compile/test.js', '/template')
        file = new File("./grails-app/assets/components/compile/test.js")
        if(file.exists()) {
            file.delete()
        }
    }

    def cleanup() {
    }

    void "should generate template file"() {
        when:
        templateFileAssetResolver.generateTemplateFile(file)

        then:
        file.exists()
        templateFileAssetResolver.doesTemplateNeedCompiling(new GenericAssetFile(inputStreamSource: { file.newInputStream() }, path: '/compile/test.js')) == false

    }
}