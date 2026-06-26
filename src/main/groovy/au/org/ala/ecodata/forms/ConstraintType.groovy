package au.org.ala.ecodata.forms

/**
 * Supported constraints that can be applied to data model items.
 */

enum ConstraintType {
    VISIBLE("visible", true, true, false),
    IF("if", true, true, false),
    VISIBLE_EXPRESSION("visibleexpression", true, true, true),
    IF_EXPRESSION("ifexpression", true, true, true),
    ENABLE("enable", true, false, false),
    ENABLE_AND_CLEAR("enableAndClear", true, false, false),
    DISABLE("disable", true, false, false),
    CONDITIONAL_VALIDATION("conditionalValidation", false, false, false),
    PRE_POPULATE("triggerPrePopulate", false, true, false)

    /** The knockout data binding that implements this constraint */
    String binding
    /** True if this constraint should be evaluated as a boolean */
    boolean isBoolean
    /** True if this constraint applies to a container field (or label and input field) (otherwise it will just be applied to input fields) */
    boolean appliesToContainer
    /** True if this constraint should be implemented using a virtual element in Knockout */
    boolean usesVirtualElement

    private ConstraintType(String binding, boolean isBoolean, boolean appliesToContainer, boolean usesVirtualElement) {
        this.binding = binding
        this.isBoolean = isBoolean
        this.appliesToContainer = appliesToContainer
        this.usesVirtualElement = usesVirtualElement
    }
}
