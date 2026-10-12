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

    def "the link view type builds the link from the properties entry of the view model"() {
        setup:
        ctx = ctxBuilder().model([source:'Project home', type:'link', properties:[controller:'project', action:'index']]).build()
        ctx.g = Mock(NamespacedTagDispatcher)

        when:
        viewModelWidgetRenderer.renderLink(ctx)

        then:
        1 * ctx.g.methodMissing("createLink", {it[0] == ctx.specialProperties([controller:'project', action:'index'])}) >> '/project/index'
        ctx.writer.toString() == '<a href="/project/index">Project home</a>'
    }

    def "the link edit type builds the link from the properties entry of the view model"() {
        setup:
        EditModelWidgetRenderer editModelWidgetRenderer = new EditModelWidgetRenderer()
        ctx = ctxBuilder().model([source:'Project home', type:'link', properties:[controller:'project', action:'index']]).build()
        ctx.g = Mock(NamespacedTagDispatcher)

        when:
        editModelWidgetRenderer.renderLink(ctx)

        then:
        1 * ctx.g.methodMissing("createLink", {it[0] == ctx.specialProperties([controller:'project', action:'index'])}) >> '/project/index'
        ctx.writer.toString() == '<a href="/project/index">Project home</a>'
    }

    WidgetRenderContextBuilder ctxBuilder() {
        new WidgetRenderContextBuilder()
    }
}
