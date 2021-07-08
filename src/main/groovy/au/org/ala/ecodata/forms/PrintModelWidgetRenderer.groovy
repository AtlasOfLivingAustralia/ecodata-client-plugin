package au.org.ala.ecodata.forms

/**
 * Created by baird on 18/10/13.
 */
class PrintModelWidgetRenderer implements ModelWidgetRenderer {

    @Override
    void renderLiteral(WidgetRenderContext context) {
        context.writer << "<span ${context.attributes.toString()}>${context.model.source}</span>"
    }

    @Override
    void renderText(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderReadonlyText(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderTime(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderNumber(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderBoolean(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderTextArea(WidgetRenderContext context) {
        context.writer << "<span class=\"col-sm-12 printed-form-field textarea\"></span>"
//        context.databindAttrs.add 'value', context.source
//        context.writer << "<textarea ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></textarea>"
    }

    @Override
    void renderSimpleDate(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderSelectOne(WidgetRenderContext context) {
        renderCheckboxes(context)
    }

    @Override
    void renderSelectMany(WidgetRenderContext context) {
        renderCheckboxes(context)
    }

    @Override
    void renderSelectManyCombo(WidgetRenderContext context) {
        renderCheckboxes(context)
    }

    @Override
    void renderAudio(WidgetRenderContext context) {
        context.writer << context.g.render(template: '/output/audioDataTypeViewModelTemplate', plugin: 'ecodata-client-plugin',
                model: [databindAttrs:context.databindAttrs.toString(), name: context.source, index: "''", hideFile: true])
    }

    @Override
    void renderImage(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderImageDialog(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderEmbeddedImage(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderEmbeddedImages(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderAutocomplete(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderFusedAutocomplete(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderPhotoPoint(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderLink(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderDate(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderDocument(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderButtonGroup(WidgetRenderContext context) {

    }

    @Override
    void renderSpeciesSelect(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderSelect2(WidgetRenderContext context) {
        defaultRender(context)
    }

    private void defaultRender(WidgetRenderContext context) {


        context.writer << "<span class=\"span12 printed-form-field\"></span>"
    }

    private void renderCheckboxes(WidgetRenderContext context) {
        context.labelAttributes.addClass 'checkbox-list-label '
        def constraints = context.source + '.constraints'
        context.writer << """
            <ul class="checkbox-list" data-bind="foreach: ${constraints}">
                <li>
                    <span class="printed-checkbox">&nbsp;</span>&nbsp;<span data-bind="text:\$data"></span>
                </li>
            </ul>
        """
    }

    @Override
    void renderCurrency(WidgetRenderContext context) {
       defaultRender(context)
    }

    @Override
    void renderSelect2Many(WidgetRenderContext context) {
        renderCheckboxes(context)
    }

    @Override
    void renderMultiInput(WidgetRenderContext context) {
        renderTextArea(context)
    }

    @Override
    void renderWordCloud(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderSpeciesSearchWithImagePreview(WidgetRenderContext context) {
        defaultRender(context)
    }

    @Override
    void renderGeoMap(WidgetRenderContext context) {
        context.model.readonly = true
        context.writer << context.g.render(template: '/output/dataEntryMap', plugin: 'ecodata-client-plugin', model: context.model)
    }

    @Override
    void renderFeature(WidgetRenderContext context) {
        defaultRender(context)
    }
}
