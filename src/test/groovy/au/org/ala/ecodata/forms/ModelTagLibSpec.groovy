package au.org.ala.ecodata.forms

import grails.testing.web.taglib.TagLibUnitTest

//import grails.test.mixin.TestFor
import groovy.util.slurpersupport.NodeChild
import groovy.xml.MarkupBuilder
import spock.lang.Specification

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

    def "The presence of a scores attribute should result in the score data binding being applied to the element"() {

        setup:
        Map model = [type:'number', source:"myNumber"]
        ctx.model = model
        ctx.span = 3
        List dataModel = [[name:"myNumber", dataType:"number", scores:[[label:"My score"]]]]
        ctx.attrs.model = [dataModel :dataModel]

        when:
        tagLib.layoutDataItem(ctx.out, ctx.attrs, model, ctx)
        println(actualOut)

        then:
        TestUtils.compareHtml(actualOut, """<div class="col-sm-3"><span data-bind='score:myNumber.get("scores"),text:myNumber'></span></div>""")

    }

    def "The allowRowDelete method supports nested tables"() {
        setup:
        Map attrs = [model:[dataModel:[
                [dataType:'list', name:"test", columns:[], allowRowDelete:true],
                [dataType:'list', name:"test2", columns:[], allowRowDelete:"true"],
                [dataType:'list', name:"test3", columns:[], allowRowDelete:"false"],
                [dataType:'list', name:"test4", columns:[], allowRowDelete:false],

                [dataType:'list', name:"test5", columns:[
                        [dataType:'list', name:"test6", allowRowDelete: false]
                ]]
        ]]]

        expect:
        ModelTagLib.getAllowRowDelete(attrs, "test", null) == true
        ModelTagLib.getAllowRowDelete(attrs, "test2", null) == true
        ModelTagLib.getAllowRowDelete(attrs, "test3", null) == false
        ModelTagLib.getAllowRowDelete(attrs, "test4", null) == false
        ModelTagLib.getAllowRowDelete(attrs, "test5", null) == true // default is true
        ModelTagLib.getAllowRowDelete(attrs, "test6", null) == false
    }

}
