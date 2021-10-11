package au.org.ala.ecodata.forms

import spock.lang.Specification

class WidgetRenderContextSpec extends Specification {

    def "the WidgetRenderContext can return parsed validation rules as required"() {

        setup:
        Map viewModel = [type:'textarea', source:'test']
        String validationString = "required,maxSize[300]"
        WidgetRenderContext widgetRenderContext = new WidgetRenderContextBuilder().model(viewModel).validationString(validationString).build()


        when:
        Map result = widgetRenderContext.getValidationRule(ValidationHelper.MAX_SIZE)

        then:
        result.rule == ValidationHelper.MAX_SIZE
        result.param == "300"

        when:
        result = widgetRenderContext.getValidationRule("required")

        then:
        result.rule == "required"

    }

}
