package au.org.ala.ecodata.forms

import org.grails.taglib.NamespacedTagDispatcher
import org.grails.web.json.JSONObject
//import org.grails.web.taglib.NamespacedTagDispatcher

public interface ModelWidgetRenderer {

    void renderLiteral(WidgetRenderContext context)
    void renderText(WidgetRenderContext context)
    void renderReadonlyText(WidgetRenderContext context)
    void renderNumber(WidgetRenderContext context)
    void renderBoolean(WidgetRenderContext context)
    void renderTextArea(WidgetRenderContext context)
    void renderSimpleDate(WidgetRenderContext context)
    void renderSelectOne(WidgetRenderContext context)
    void renderSelectMany(WidgetRenderContext context)
    void renderSelectManyCombo(WidgetRenderContext context)
    void renderWordCloud(WidgetRenderContext context)
    void renderAudio(WidgetRenderContext context)
    void renderImage(WidgetRenderContext context)
    void renderImageDialog(WidgetRenderContext context)
    void renderEmbeddedImage(WidgetRenderContext context)
    void renderEmbeddedImages(WidgetRenderContext context)
    void renderAutocomplete(WidgetRenderContext context)
    void renderSpeciesSearchWithImagePreview(WidgetRenderContext context)
    void renderFusedAutocomplete(WidgetRenderContext context)
    void renderPhotoPoint(WidgetRenderContext context)
    void renderLink(WidgetRenderContext context)
    void renderDate(WidgetRenderContext context)
    void renderTime(WidgetRenderContext context)
    void renderDocument(WidgetRenderContext context)
    void renderSpeciesSelect(WidgetRenderContext context)
    void renderSelect2(WidgetRenderContext context)
    void renderSelect2Many(WidgetRenderContext context)
    void renderCurrency(WidgetRenderContext context)
    void renderMultiInput(WidgetRenderContext context)
    void renderButtonGroup(WidgetRenderContext context)
    void renderGeoMap(WidgetRenderContext context)
    void renderFeature(WidgetRenderContext context)
}


class WidgetRenderContext {

    /** jquery-validation-engine string to limit the maximum length of a string */
    private static final String MAX_SIZE_VALIDATION = "maxSize"

    private ValidationHelper validationHelper
    private List validationRules = null
    JSONObject model
    Map dataModel
    boolean editMode
    String context
    String validationAttr
    Databindings databindAttrs
    AttributeMap attributes
    AttributeMap labelAttributes
    StringWriter writer
    def tagAttrs

    NamespacedTagDispatcher g

    List deferredTemplates = []

    WidgetRenderContext(Map viewModel, Map dataModel, String context, Databindings databindAttrs, AttributeMap attributes, AttributeMap labelAttributes, NamespacedTagDispatcher g, tagAttrs, boolean editMode, StringWriter writer = null) {

        validationHelper = new ValidationHelper()
        this.model = viewModel
        this.dataModel = dataModel
        this.editMode = editMode
        this.context = context
        this.validationAttr = ''
        this.databindAttrs = databindAttrs ?: new Databindings()
        this.attributes = attributes ?: new AttributeMap()
        this.labelAttributes = labelAttributes ?: new AttributeMap()
        this.g = g
        this.tagAttrs = tagAttrs

        if (!writer) {
            writer = new StringWriter()
        }
        this.writer = writer

        validationHelper.addValidationAttributes(this)
    }

    String getSource() {
        return (context ? context + '.' : '') + model.source
    }

    String getInputWidth() {
        return getInputSize(model.width)
    }

    String getInputSize(width) {
        if (!width) { return 'form-control form-control-sm input-small' }
        if (width && width[-1] == '%') {
            width = width - '%'
        }
        switch (width.toInteger()) {
            case 0..10: return 'form-control form-control-sm input-mini'
            case 11..20: return 'form-control form-control-sm input-small'
            case 21..30: return 'form-control form-control-sm input-medium'
            case 31..40: return 'form-control form-control-sm input-large'
            case 41..100: return 'form-control form-control-sm input-xlarge'
            default: return 'form-control form-control-sm input-small'
        }
    }

    String specialProperties(properties) {
        return properties.collectEntries { entry ->
            switch (entry.getValue()) {
                case "#siteId":
                    entry.setValue(tagAttrs?.site?.siteId)
                    break
            }
            return entry
        }
    }

    void addDeferredTemplate(name) {
        deferredTemplates.add(name)
    }

    /**
     * Returns a Map of the form [rule: <rule>, param:<value>]
     * If no rule with name ruleName is defined, null is returned.
     */
    Map getValidationRule(String ruleName) {
        if (!validationRules) {
            validationRules = validationHelper.getValidationCriteria(dataModel, model, editMode)
        }
        validationRules.find{it.rule == ruleName}
    }

    /**
     * If the view model is configured to render units, this method will return the units property of the data model.
     */
    String unitsToRender() {
        String units = null
        if (getDisplayOption('displayUnits')) {
            units = dataModel.units
        }
        units
    }

    /** Convenience method to formalise the use of the "displayOptions" view model attribute */
    def getDisplayOption(String name) {
        model.displayOptions ? model.displayOptions[name] : null
    }

}
