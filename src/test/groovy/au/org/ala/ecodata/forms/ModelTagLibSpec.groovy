package au.org.ala.ecodata.forms

import grails.testing.web.taglib.TagLibUnitTest

//import grails.test.mixin.TestFor
import groovy.util.slurpersupport.NodeChild
import groovy.xml.MarkupBuilder
import spock.lang.Specification

//@TestFor(ModelTagLib)
class ModelTagLibSpec extends Specification implements TagLibUnitTest<ModelTagLib> {

    ModelTagLib.LayoutRenderContext ctx
    StringWriter actualOut

    StringWriter expectedOut = new StringWriter()
    MarkupBuilder mb = new MarkupBuilder(expectedOut)

    def setup() {
        ctx = new ModelTagLib.LayoutRenderContext(tagLib)
        ctx.attrs = [:]
        actualOut = new StringWriter()
        ctx.out = new PrintWriter(actualOut)
    }


    def "the view model type section renders correctly without a title"() {
        setup:
        Map model = [type:'section', items:[]]

        when:
        tagLib.section(model, ctx)

        then:
        mb.div(class:"row output-section") {
            div(class:"col-sm-12") {}
        }
        TestUtils.compareHtml(actualOut, expectedOut)
    }

    def "the view model type section supports a title attribute"() {
        setup:
        String title = 'title'
        Map model = [type:'section', title:title, items:[]]

        when:
        tagLib.section(model, ctx)

        then:
        mb.h4([:], title)
        mb.div(class:"row output-section") {
            div(class:"col-sm-12") {}
        }
        TestUtils.compareHtml(actualOut, expectedOut)
    }

    def "the view model type section supports a boxed title attribute"() {
        setup:
        String title = 'title'
        Map model = [type:'section', title:title, boxed:true, items:[]]

        when:
        tagLib.section(model, ctx)

        then:
        mb.div(class:"boxed-heading col-sm-12", "data-content":title) {
            div(class:'row') {
                div(class:"col-sm-12") {}
            }
        }
        TestUtils.compareHtml(actualOut, expectedOut)
    }

    def "the repeating section renders a div surrounded by a foreach block"() {
        setup:
        Map model = [type:'repeat', source:"test"]
        ctx.model = model
        List dataModel = [[name:"test", dataType:"list", columns:[]]]
        ctx.attrs.model = [dataModel :dataModel]

        when:
        tagLib.repeatingLayout(ctx)

        then:
        expectedOut << "<!-- ko foreach:test -->"
        mb.div(class:"repeating-section") {
        }
        expectedOut << "<!-- /ko -->"
        TestUtils.compareHtml(actualOut, expectedOut)
    }

    def "the repeating section will throw an error if the source is not a list"() {
        setup:
        Map model = [type:'repeat', source:"test"]
        ctx.model = model
        List dataModel = [[name:"test", dataType:"text", columns:[]]]
        ctx.attrs.model = [dataModel :dataModel]

        when:
        tagLib.repeatingLayout(ctx)

        then:
        thrown(Exception)
    }

    def "the repeating section accepts a user added rows configuration item"() {

        setup:
        Map model = [type:'repeat', source:"test", userAddedRows:true, removeRowText:"Delete row"]
        ctx.model = model
        List dataModel = [[name:"test", dataType:"list", columns:[]]]
        ctx.attrs.model = [dataModel :dataModel]
        ctx.attrs.edit = true

        when:
        tagLib.repeatingLayout(ctx)

        then:
        expectedOut << "<!-- ko foreach:test -->"
        mb.div(class:"repeating-section") {
            mb.div(class:"section-title") {
                button(class:"btn btn-warning pull-right", 'data-bind':"click:\$parent.${model.source}.removeRow") {
                    mkp.yield(model.removeRowText)
                }
            }
        }
        expectedOut << "<!-- /ko -->"

        println actualOut
        TestUtils.compareHtml(actualOut, expectedOut)
    }

}
