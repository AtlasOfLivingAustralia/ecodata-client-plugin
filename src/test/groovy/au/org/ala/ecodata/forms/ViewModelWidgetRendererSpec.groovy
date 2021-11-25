package au.org.ala.ecodata.forms

import spock.lang.Specification
import org.grails.taglib.NamespacedTagDispatcher
import grails.testing.web.GrailsWebUnitTest

class ViewModelWidgetRendererSpec extends Specification implements GrailsWebUnitTest {

    ViewModelWidgetRenderer viewModelWidgetRenderer
    WidgetRenderContext ctx

    def setup() {
        viewModelWidgetRenderer = new ViewModelWidgetRenderer()
    }

    def "the readonlyText method renders text in a span"() {
        setup:
        ctx = ctxBuilder().model([source:'myText', type:'readonlyText']).build()

        when:
        viewModelWidgetRenderer.renderReadonlyText(ctx)

        then:
        TestUtils.compareHtml(ctx.writer, """<span data-bind="text:${ctx.model.source}"></span>""")

    }

    def "the image view type accepts a parameter to chose the view template"() {
        setup:
        ctx = ctxBuilder().model([source:'myImage', type:'image', displayOptions:[metadataAlwaysVisible:true]]).build()
        ctx.g = Mock(NamespacedTagDispatcher)

        when:
        viewModelWidgetRenderer.renderImage(ctx)

        then:
        1 * ctx.g.methodMissing("render", {it[0].template == '/output/imageDataTypeViewModelWithMetadataTemplate' && it[0].model.name == 'myImage'})

        when:
        ctx.model.displayOptions = null
        viewModelWidgetRenderer.renderImage(ctx)

        then:
        1 * ctx.g.methodMissing("render", {it[0].template == '/output/imageDataTypeViewModelTemplate' && it[0].model.name == 'myImage'})
    }

    WidgetRenderContextBuilder ctxBuilder() {
        new WidgetRenderContextBuilder()
    }
}
