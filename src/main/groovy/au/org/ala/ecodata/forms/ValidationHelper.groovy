package au.org.ala.ecodata.forms

import java.util.regex.Matcher
import java.util.regex.Pattern

/**
 * Helper class for taking model data validation attributes and producing html attributes for form validation.
 * Validation is currently implemented by the jquery-validation-engine.
 */
class ValidationHelper {

    public static final String MAX_SIZE = "maxSize"


    private static List CUSTOM_RULES = ['number', 'integer', 'url', 'date', 'phone']

    /** jquery-validation-engine allows parameters to be passed to validation rules in the form maxLength[100] */
    private static Pattern RULE_PATTERN = Pattern.compile(/(.*)\[(.*)\]/)

    /** Returns true if the element rendered from the supplied model has the potential to be validated */
    boolean isValidatable(Map dataModel, Map viewModel, Boolean edit) {
        boolean validatable = false
        if (edit) {
            def attr = findValidationAttribute(dataModel, viewModel, edit)
            validatable = attr || dataModel.behaviour?.find{it.type?.toUpperCase() == ConstraintType.CONDITIONAL_VALIDATION.name()}
        }
        validatable
    }

    List getValidationCriteria(Map dataModel, Map viewModel, Boolean edit) {

        def validationAttribute = findValidationAttribute(dataModel, viewModel, edit)
        List criteria = []
        if (validationAttribute) {
            criteria = processValidationAttribute(validationAttribute)
        }

        criteria = criteria.collect { Map parsedRule ->
            String rule = parsedRule.rule
            // Wrap these rules in "custom[]" to keep jquery-validation-engine happy and avoid having to
            // specify "custom" in the json.
            if (rule in CUSTOM_RULES) {
                rule = "custom[${rule}]"
            }
            [rule:rule, param:parsedRule.param]
        }
        // Add implied numeric validation to numeric data types
        if (dataModel?.dataType == 'number') {
            if (!criteria.find{it.rule == 'custom[number]'} && !criteria.find{it.rule == 'custom[integer]'}) {
                criteria << [rule:'custom[number]']
            }
            if (!criteria.find{it.rule == 'min'}) {
                criteria << [rule:'min', param:'0']
            }
        }

        return criteria
    }

    private List processValidationAttribute(String validationCriteria) {
        validationCriteria.tokenize(',').collect{parseRule(it?.trim())}
    }

    private List processValidationAttribute(List validationCriteria) {
        validationCriteria
    }

    private def findValidationAttribute(Map dataModel, Map viewModel, Boolean editMode) {
        if (!editMode) { return []}  // we don't want to apply validation to read only views

        def validationCriteria = viewModel.validate

        if (!validationCriteria) {
            // Try the data model.
            validationCriteria = dataModel?.validate
        } // no criteria
        validationCriteria
    }

    boolean isRequired(dataModel, model, edit) {
        def criteria = getValidationCriteria(dataModel, model, Boolean.valueOf(edit))
        return criteria.find{it.rule == "required"} != null
    }

    String validationAttribute(dataModel, model, edit) {
        def criteria = getValidationCriteria(dataModel, model, Boolean.valueOf(edit))
        if (criteria.isEmpty()) {
            return ""
        }

        def values = []
        criteria.each {
            switch (it.rule) {
                case 'required':
                    if (model.type == 'selectMany') {
                        values << 'minCheckbox[1]'
                    }
                    else {
                        values << it.rule
                    }
                    break
                default:
                    String ruleString = it.rule
                    if (it.param) {
                        ruleString += "[${it.param}]"
                    }
                    values << ruleString
            }
        }
        return " data-validation-engine='validate[${values.join(',')}]'"
    }

    void addValidationAttributes(WidgetRenderContext context) {
        def validationAttribute = findValidationAttribute(context.dataModel, context.model, context.editMode)
        if (validationAttribute) {
            addValidationAttribute(validationAttribute, context)
        }
    }

    private void addValidationAttribute(String validationRules, WidgetRenderContext context) {
        context.validationAttr = validationAttribute(context.dataModel, context.model, context.editMode)
    }

    private void addValidationAttribute(List validationRules, WidgetRenderContext context) {
        context.databindAttrs.add("computedValidation", "${context.source}.get(\"validate\")")
    }

    /**
     * Returns a Map of the form [rule: <rule>, value:<value>] where
     * the rule is expected to be in the form rule[value]
     */
    private Map<String, String> parseRule(String rule) {

        Map result = null
        Matcher m = RULE_PATTERN.matcher(rule)
        if (m.matches()) {
            result = [rule: m.group(1), param: m.group(2)]
        }
        else {
            result = [rule: rule, param: null]
        }
        result
    }


}
