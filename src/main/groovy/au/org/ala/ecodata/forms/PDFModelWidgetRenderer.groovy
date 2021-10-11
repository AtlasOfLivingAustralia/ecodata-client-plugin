package au.org.ala.ecodata.forms

/**
 * Created by baird on 16/10/13.
 */
class PDFModelWidgetRenderer extends ViewModelWidgetRenderer {


    @Override
    void renderAutocomplete(WidgetRenderContext context) {
        context.databindAttrs.add 'text', 'name'
        context.writer << """<span data-bind="with: ${context.source}"><span${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span></span>"""
    }

}
