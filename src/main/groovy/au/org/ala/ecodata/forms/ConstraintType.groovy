package au.org.ala.ecodata.forms

/**
 * Supported constraints that can be applied to data model items.
 */

enum ConstraintType {
    VISIBLE("visible", true, true),
    IF("if", true, true),
    VISIBLE_EXPRESSION("visibleexpression", true, true),
    IF_EXPRESSION("ifexpression", true, true),
    ENABLE("enable", true, false),
    ENABLE_AND_CLEAR("enableAndClear", true, false),
    DISABLE("disable", true, false),
    CONDITIONAL_VALIDATION("conditionalValidation", false, false)

    /** The knockout data binding that implements this constraint */
    String binding
    /** True if this constraint should be evaluated as a boolean */
    boolean isBoolean
    /** True if this constraint applies to a container field (or label and input field) (otherwise it will just be applied to input fields) */
    boolean appliesToContainer

    private ConstraintType(String binding, boolean isBoolean, boolean appliesToContainer) {
        this.binding = binding
        this.isBoolean = isBoolean
        this.appliesToContainer = appliesToContainer
    }
}
