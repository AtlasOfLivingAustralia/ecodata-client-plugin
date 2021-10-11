package au.org.ala.ecodata.forms

import spock.lang.Specification


class ValidationHelperSpec extends Specification {

    ValidationHelper validationHelper = new ValidationHelper()
    WidgetRenderContextBuilder ctxBuilder = new WidgetRenderContextBuilder()

    private Map model(String validationString) {

        [
            viewModel:[source:"test"],
            dataModel:[name:"test", validate: validationString]
        ]

    }

    def "the presence of the value required in the validation attribute marks the model a required field"(String validationString, boolean required) {
        when:
        Map model = model(validationString)

        then:
        validationHelper.isRequired(model.dataModel, model.viewModel, true) == required

        where:
        validationString            | required
        "required"                  | true
        "required,max[100]"         | true
        "min[0],required,max[100]"  | true
        "min[0],required"           | true
        ""                          | false
        "min[0]"                    | false
    }

    def "validation strings with parameters can be parsed"(String validationRule, String rule, String value) {

        when:
        Map parsedRule = validationHelper.parseRule(validationRule)

        then:
        parsedRule.rule == rule
        parsedRule.param == value

        where:
        validationRule   | rule       | value
        "maxSize[100]"   | "maxSize"  | "100"
        "required"       | "required" | null
        "custom[number]" | "custom"   | "number"

    }


    def "a map of all validation rules can be returned from the validation string"() {

        setup:
        Map model = model("min[0],required,max[100]")

        when:
        List rules = validationHelper.getValidationCriteria(model.dataModel, model.viewModel, true)

        then:
        rules.size() == 3
        rules.find{it.rule == "required"} != null
        rules.find{it.rule == 'min' && it.param == '0'} != null
        rules.find{it.rule == 'max' && it.param == '100'} != null

    }

    def "the validation helper will apply an html attribute when the validation is a string"() {
        setup:
        String validate = "min[1]"
        WidgetRenderContext ctx = ctxBuilder.model([source:"item1", type:"number"]).validationString(validate).build()

        when:
        validationHelper.addValidationAttributes(ctx)

        then:
        ctx.validationAttr == ' data-validation-engine=\'validate['+validate+']\''
        ctx.databindAttrs.map.size() == 0
    }

    def "the validation helper will apply a knockout binding when the validation is an array"() {
        setup:
        List validationConfig = [
                [
                        rule:"min",
                        params: [
                                "type":"computed",
                                "expresssion":"item2*3"
                        ]
                ]
        ]

        when: "The context calls validationHelper.addValidationAttributes at the end of it's constructor"
        WidgetRenderContext ctx = ctxBuilder.model([source:"item1", type:"number"]).validationConfig(validationConfig).build()

        then:
        ctx.validationAttr == ''
        ctx.databindAttrs.map.size() == 1
        ctx.databindAttrs.map.get("computedValidation") == "item1.get(\"validate\")"
    }

    def "The validation helper can determine whether a field needs validation"() {
        setup:
        Map dataModel = [name:"test", dataType:"number"]
        Map viewModel = [source:"test", "type":"number"]

        expect:
        validationHelper.isValidatable(dataModel, viewModel, true) == false

        when:
        dataModel.validate = ["required"]

        then:
        validationHelper.isValidatable(dataModel, viewModel, true) == true
        validationHelper.isValidatable(dataModel, viewModel, false) == false

        when:
        dataModel.validate = null
        dataModel.behaviour = [
                [type:"conditional_validation"]
        ]

        then:
        validationHelper.isValidatable(dataModel, viewModel, true) == true
        validationHelper.isValidatable(dataModel, viewModel, false) == false

    }

}
