package au.org.ala.ecodata.forms

/**
 * Created by baird on 16/10/13.
 */
class ViewModelWidgetRenderer implements ModelWidgetRenderer {

    @Override
    void renderLiteral(WidgetRenderContext context) {
        if (!context.model.mode || context.model.mode != 'edit') { // Allow form instructions to be only viewable in edit mode
            context.writer << "<span ${context.attributes.toString()}>${context.model.source}</span>"
        }

    }

    @Override
    void renderText(WidgetRenderContext context) {
        context.databindAttrs.add 'text', context.source
        context.writer << "<span ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>"
    }

    @Override
    void renderTime(WidgetRenderContext context) {
        context.databindAttrs.add 'text', context.source
        context.writer << "<span ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>"
    }

    @Override
    void renderReadonlyText(WidgetRenderContext context) {
        context.databindAttrs.add 'text', context.source
        context.writer << "<span ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>"
    }

    @Override
    void renderNumber(WidgetRenderContext context) {
        context.databindAttrs.add 'text', context.source

        context.writer << "<span ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>"
        String units = context.unitsToRender()
        if (units) {
            context.writer << " <span>${units}</span>"
        }
    }

    @Override
    void renderBoolean(WidgetRenderContext context) {
        context.databindAttrs.add 'visible', context.source
        context.writer << "<i data-bind='${context.databindAttrs.toString()}' class='fa fa-check'></i>"
    }

    @Override
    void renderTextArea(WidgetRenderContext context) {
        context.databindAttrs.add 'text', context.source
        context.attributes.addClass('model-text-value')
        context.writer << "<span ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>"
    }

    @Override
    void renderSimpleDate(WidgetRenderContext context) {
        renderDate(context)
    }

    @Override
    void renderSelectOne(WidgetRenderContext context) {
        context.databindAttrs.add 'text', context.source + ".constraints.label(${context.source}())"
        context.writer << "<span ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>"
    }

    @Override
    void renderSelect2(WidgetRenderContext context) {
        context.databindAttrs.add 'text', context.source + ".constraints.label(${context.source}())"
        context.writer << "<span ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>"
    }

    /**
     * The binding looks for the toReadOnlyString function because there exist some misconfigurations that
     * use a "text" data model item with a selectMany/select2Many view.  This is a workaround to prevent exceptions.
     */
    private static String selectManyBindingString(WidgetRenderContext context) {
        '_.isFunction(('+context.source+' || []).toReadOnlyString) ? '+ context.source+'.toReadOnlyString() : ('+context.source+'() || []).join(", ")'
    }

    @Override
    void renderSelectMany(WidgetRenderContext context) {
        context.databindAttrs.add 'text',selectManyBindingString(context)
        context.writer << "<span ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>"
    }

    @Override
    void renderSelect2Many(WidgetRenderContext context) {
        context.databindAttrs.add 'text', selectManyBindingString(context)
        context.writer << "<span ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>"
    }

    @Override
    void renderSelectManyCombo(WidgetRenderContext context) {
        def tagsBlock = "<div id='tagsBlock' data-bind='foreach: ${context.source}'>" +
                "<span class='tag label label-default' comboList='${context.source}'>" +
                '<input type="hidden" data-bind="value: $data" name="tags" class="tags group">' +
                '<span data-bind="text: $data"></span>' +
                '</span></div>'
        context.writer << tagsBlock
    }

    @Override
    void renderWordCloud(WidgetRenderContext context) {
        def tagsBlock = "<div id='tagsBlock' data-bind='foreach: ${context.source}'>" +
                "<span class='tag label label-default' comboList='${context.source}'>" +
                '<input type="hidden" data-bind="value: $data" name="tags" class="tags group">' +
                '<span data-bind="text: $data"></span>' +
                '</span></div>'
        context.writer << tagsBlock
    }

    @Override
    void renderAudio(WidgetRenderContext context) {
        context.writer << context.g.render(template: '/output/audioDataTypeViewModelTemplate', plugin: 'ecodata-client-plugin',
                model: [databindAttrs:context.databindAttrs.toString(), name: context.source, index: "''", hideFile: false])
    }

    @Override
    void renderImage(WidgetRenderContext context) {
        if (context.getDisplayOption('metadataAlwaysVisible')) {
            context.writer << context.g.render(template: '/output/imageDataTypeViewModelWithMetadataTemplate', plugin: 'ecodata-client-plugin',
                    model: [name: context.source, index: "''"])
        }
        else {
            context.writer << context.g.render(template: '/output/imageDataTypeViewModelTemplate', plugin: 'ecodata-client-plugin',
                    model: [name: context.source, index: "''"])
        }
    }

    @Override
    void renderImageDialog(WidgetRenderContext context) {
        context.databindAttrs.add 'imageUpload', "{target:${context.source}, config:{}}"
        context.writer << context.g.render(template: '/output/imageDataTypeViewModelTemplate', plugin: 'ecodata-client-plugin',
                model: [databindAttrs:context.databindAttrs.toString(), name: context.source])
    }

    @Override
    void renderEmbeddedImage(WidgetRenderContext context) {
        context.databindAttrs.add "attr",  "{src: ${context.source}['thumbnail_url']}"
        context.writer << "<img data-bind=\"${context.databindAttrs.toString()}\"></img>"
    }

    @Override
    void renderEmbeddedImages(WidgetRenderContext context) {
        context.writer << "<ul class=\"imageList\" data-bind=\"foreach: ${context.source}\">"
        context.databindAttrs.add "attr",  "{src: thumbnail_url}"
        context.writer << "<li><a data-bind=\"attr:{href:url}\"><img data-bind=\"${context.databindAttrs.toString()}\"></img></a></li>"
        context.writer << "</ul>"
    }

    @Override
    void renderAutocomplete(WidgetRenderContext context) {
        renderReadOnlySpecies(context)
    }

    @Override
    void renderSpeciesSelect(WidgetRenderContext context) {
        renderReadOnlySpecies(context)
    }

    @Override
    void renderFusedAutocomplete(WidgetRenderContext context) {
        context.databindAttrs.add 'text', 'name'
        context.writer << """<span data-bind="with: ${context.source}"><span${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>
            <a  target="_blank" data-bind="visible: guid, attr: {href: transients.bioProfileUrl}"><i class="fa fas fa-info-circle"></i></i></a>
            </span>"""
    }

    @Override
    void renderPhotoPoint(WidgetRenderContext context) {
        context.writer << """
        <div><b><span data-bind="text:name"/></b></div>
        <div>Lat:<span data-bind="text:lat"/></div>
        <div>Lon:<span data-bind="text:lon"/></div>
        <div>Bearing:<span data-bind="text:bearing"/></div>
        """
    }

    @Override
    void renderLink(WidgetRenderContext context) {
        context.writer << "<a href=\"" + context.g.createLink(context.specialProperties(context.model.properties)) + "\">${context.model.source}</a>"
    }

    @Override
    void renderDate(WidgetRenderContext context) {
        context.writer << "<span data-bind=\"text:${context.source}.formattedDate\"></span>"
    }

    @Override
    void renderDocument(WidgetRenderContext context) {
        context.writer << """<div data-bind="if:(${context.source}())">"""
        context.writer << """    <div data-bind="template:{name:'documentViewTemplate', data:${context.source}}"></div>"""
        context.writer << """</div>"""
    }

    private void renderReadOnlySpecies(WidgetRenderContext context) {
        context.databindAttrs.add 'with', context.source
        context.writer << """<span data-bind='${context.databindAttrs.toString()}'><span${context.attributes.toString()} data-bind='text:name'></span>
            <a href="#" data-bind="popover: {title: name, content: transients.speciesInformation}, event: { 'shown.bs.popover': fetchSpeciesImage}"><i class="fa fas fa-info-circle"></i></i></a>
            </span>"""
    }

    @Override
    void renderCurrency(WidgetRenderContext context) {
        context.databindAttrs.add 'text', context.source
        context.writer << """\$<span data-bind='${context.databindAttrs.toString()}'></span>.00"""
    }

    @Override
    void renderMultiInput(WidgetRenderContext context) {
        context.databindAttrs.add 'text', '('+context.source+'() || []).join(", ")'
        context.writer << "<span ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>"
    }

    @Override
    void renderButtonGroup(WidgetRenderContext context) {

    }

    @Override
    void renderGeoMap(WidgetRenderContext context) {
        context.model.readonly = true
        context.writer << context.g.render(template: '/output/dataEntryMap', plugin: 'ecodata-client-plugin', model: context.model)
    }

    @Override
    void renderSpeciesSearchWithImagePreview(WidgetRenderContext context) {
        def newAttrs = new Databindings()
        newAttrs.add "text", "name"
        context.writer << context.g.render(template: '/output/speciesSearchWithImagePreviewTemplate', plugin: 'ecodata-client-plugin', model:[source: context.source, databindAttrs: newAttrs.toString(), validationAttrs:context.validationAttr, attrs: context.attributes.toString(), readonly: true])
    }

    @Override
    void renderFeature(WidgetRenderContext context) {
        context.writer << """<feature${context.attributes.toString()} params="feature:${context.source}, config:\$config.getConfig('feature', ${context.source})"></feature>"""
    }
}
