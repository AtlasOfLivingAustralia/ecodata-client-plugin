package au.org.ala.ecodata.forms

import grails.converters.JSON
/**
 * Generates web page content for metadata-driven dynamic data entry and display.
 */
class ModelTagLib {

    static namespace = "md"

    private final static INDENT = "    "
    private final static String QUOTE = "\"";
    private final static String SPACE = " ";
    private final static String EQUALS = "=";
    private final static String DEFERRED_TEMPLATES_KEY = "deferredTemplates"
    private final static String NUMBER_OF_TABLE_COLUMNS = "numberOfTableColumns"

    private final static int LAYOUT_COLUMNS = 12 // Bootstrap scaffolding uses a 12 column layout.

    private ValidationHelper validationHelper = new ValidationHelper()

    private ComputedValueRenderer computedValueRenderer = new ComputedValueRenderer()

    /** Context for view layout (rows, columns etc). */
    class LayoutRenderContext {
        String parentView
        String dataContext
        int span
        def out
        Map model
        Map attrs

        boolean editMode() {
            return attrs.edit
        }
        String getProperty() {
            if (dataContext) {
                return dataContext+'.'+model.source
            }
            return model.source
        }

        LayoutRenderContext createChildContext(Map data) {
            LayoutRenderContext child = new LayoutRenderContext(
                    out:out,
                    parentView:parentView,
                    dataContext:dataContext,
                    span:span,
                    model:model,
                    attrs:attrs
            )
            if (data.parentView != null) {
                child.parentView = data.parentView
            }
            if (data.dataContext != null) {
                child.dataContext = data.dataContext
            }
            if (data.span) {
                child.span = data.span
            }

            child
        }
    }

    /*---------------------------------------------------*/
    /*------------ HTML for dynamic content -------------*/
    /*---------------------------------------------------*/

    /**
     * Main tag to insert html
     * @attrs model the data and view models
     * @attrs edit if true the html will support the editing of values
     */
    def modelView = { attrs ->

        LayoutRenderContext ctx = new LayoutRenderContext(out:out, parentView:'', dataContext: 'data', span:LAYOUT_COLUMNS, attrs:attrs)

        ctx.out << """<div class="model-form" data-bind="withContext:{\$context:\$context, \$config:\$config}">"""
        viewModelItems(attrs.model?.viewModel, ctx)
        ctx.out << """</div>"""

        renderDeferredTemplates out
    }

    def viewModelItems(List items, LayoutRenderContext ctx) {

        def out = ctx.out
        def attrs = ctx.attrs
        items?.eachWithIndex { mod, index ->
            ctx.model = mod
            beforeItem(ctx)
            switch (mod.type) {
                case 'table':
                    table ctx
                    break
                case 'grid':
                    grid out, attrs, mod
                    break
                case 'section':
                    section mod, ctx
                    break
                case 'row':
                    row out, attrs, mod, ctx
                    break
                case 'template':
                    out << g.render(template:mod.source, plugin:'ecodata-client-plugin')
                    break
                case 'repeat':
                    repeatingLayout ctx
                    break
                case 'col':
                    column out, attrs, mod, ctx
                    break
                default:
                    layoutDataItem(out, attrs, mod, ctx)
                    break
            }
            afterItem(ctx)
        }
    }

    def repeatingLayout(LayoutRenderContext ctx) {

        Map model = ctx.model
        Map dataModel = getAttribute(ctx.attrs.model.dataModel, model.source)
        String sourceType = dataModel?.dataType
        if (sourceType != "list") {
            throw new Exception("Only model elements with a list data type can be the source for a repeating layout")
        }

        LayoutRenderContext childContext = ctx.createChildContext(parentView:'', dataContext: '', span:ctx.span)

        ctx.out << """<!-- ko foreach:${ctx.property} -->\n"""
        ctx.out << """<div class="repeating-section">\n"""
        if (model.collapsable || model.title || model.userAddedRows && ctx.editMode()) {
            ctx.out << """<div class="section-title">\n"""

            if (model.collapsable && ctx.editMode()) {
                ctx.out << "<button data-bind=\"toggleVisibility:'#${model.source}-content-'+\$index\"></button>"

            }
            if (model.title) {
                ctx.out << "<span>${model.title}</span>"
            }
            if (model.userAddedRows && ctx.editMode()) {
                ctx.out << """<button class="btn btn-warning pull-right" data-bind="click:\$parent.${ctx.property}.removeRow">${model.removeRowText ?: "Remove Section"}</button>\n"""
            }
            ctx.out << "<hr/>"
            ctx.out << "</div>\n"
        }

        ctx.out << """<div data-bind=\"attr:{id:'${model.source}-content-'+\$index},expandOnValidate:true\" class="section-content">\n"""
        viewModelItems(model.items, childContext)
        ctx.out << "</div>\n"
        ctx.out << "</div>\n"
        ctx.out << "<!-- /ko -->\n"

        if (model.userAddedRows && ctx.editMode()) {
            ctx.out << """<button type="button" class="btn btn-success btn-small add-section" data-bind="click:${ctx.property}.addRow"><i class="fa fa-plus"></i> ${model.addRowText ?: 'Add'}</button>\n"""
        }
    }

    private void beforeItem(LayoutRenderContext ctx) {
        Map model = ctx.model
        if (model.behaviour) {
            renderTagBehaviourOpen(model, ctx)
        }
    }

    private  void afterItem(LayoutRenderContext ctx) {
        Map model = ctx.model
        if (model.behaviour) {
            renderTagBehaviourClose(model, ctx)
        }
    }

    private void renderTagBehaviourOpen(Map model, LayoutRenderContext ctx) {
        model.behaviour.each {
            ConstraintType type = ConstraintType.valueOf(it.type.toUpperCase())
            if (type.appliesToContainer) {
                // Renders a virtual node to enclose contents.  Supports "visible" / "if" bindings to hide / show
                // whole sections.
                String escapedExpression = computedValueRenderer.expressionAsString(it.condition)
                ctx.out << "<!-- ko ${type.binding}:'${it.condition}' -->"
            }
        }
    }

    private void renderTagBehaviourClose(Map model, LayoutRenderContext ctx) {
        model.behaviour.each {
            ConstraintType type = ConstraintType.valueOf(it.type.toUpperCase())
            if (type.appliesToContainer) {
                ctx.out << "<!-- /ko -->"
            }
        }
    }

    /**
     * Generates an element for display, depending on viewContext. Currently
     * @parma attrs the attributes passed to the tag library.  Used to access site id.
     * @param model of the data element
     * @param context the dot notation path to the data
     * @param editable if the html element is an input
     * @param elementAttributes any additional html attributes to output as a AttributeMap
     * @param databindAttrs additional clauses to add to the data binding
     * @return the markup
     */
    def dataTag(attrs, model, context, editable, elementAttributes, databindAttrs, labelAttributes) {
        ModelWidgetRenderer renderer

        boolean toEdit = editable && !model.noEdit
        if (attrs.printable) {
            if (attrs.printable == 'pdf') {
                renderer = new PDFModelWidgetRenderer()
            }
            else {
                renderer = new PrintModelWidgetRenderer()
            }
        } else {
            if (toEdit) {
                renderer = new EditModelWidgetRenderer()
            } else {
                renderer = new ViewModelWidgetRenderer()
            }
        }

        Map dataModel = getAttribute(attrs.model.dataModel, model.source)
        def renderContext = new WidgetRenderContext(model, dataModel, context, databindAttrs, elementAttributes, labelAttributes, g, attrs, Boolean.valueOf(editable))

        renderContext.databindAttrs
        // The data model item we are rendering the view for.
        Map source = getAttribute(attrs.model.dataModel, model.source)

        // The Knockout binding to apply around the label and input field, if required.
        String labelBindingValue = null
        String labelBindingType = null
        if (source?.behaviour) {
            source.behaviour.each { constraint ->
                ConstraintType type = ConstraintType.valueOf(constraint.type.toUpperCase())
                String bindingValue = type.isBoolean ? "${renderContext.source}.${constraint.type}Constraint" : renderContext.source

                //String bindingValue = type.isBoolean ? computedValueRenderer.expressionAsString(constraint.condition) : renderContext.source
                if (!type.appliesToContainer) {
                    renderContext.databindAttrs.add type.binding, bindingValue
                }
                else {
                    // Visibility bindings have to be applied not on the input field but around the label and
                    // input field
                    labelBindingType = type.binding
                    labelBindingValue = bindingValue
                }
            }
        }

        if (source?.warning) {
            renderContext.databindAttrs.add 'warning', renderContext.source
        }

        if (model.visibility) {
            renderContext.databindAttrs.add "visible", evalDependency(model.visibility)
        }
        if (model.enabled) {
            renderContext.databindAttrs.add "enable", evalDependency(model.enabled)
        }
        // Computed values should be readonly.
        if (model.readonly || model.computed || dataModel?.computed) {
            renderContext.attributes.add "readonly", "readonly"
            if (source && validationHelper.isValidatable(source, model, toEdit)) {
                renderContext.databindAttrs.add("validateOnChange", renderContext.source)
            }
        }

        if (model.placeholder) {
            renderContext.attributes.add("placeholder", model.placeholder)
        }

        switch (model.type) {
            case 'literal':
                renderer.renderLiteral(renderContext)
                break
            case 'text':
                renderer.renderText(renderContext)
                break;
            case 'readonlyText':
                renderer.renderReadonlyText(renderContext)
                break;
            case 'number':
                renderer.renderNumber(renderContext)
                break
            case 'boolean':
                renderer.renderBoolean(renderContext)
                break
            case 'textarea':
                renderer.renderTextArea(renderContext)
                break
            case 'simpleDate':
                renderer.renderSimpleDate(renderContext)
                break
            case 'selectOne':
                renderer.renderSelectOne(renderContext)
                break;
            case 'selectMany':
                renderer.renderSelectMany(renderContext)
                break
            case 'selectManyCombo':
                renderer.renderSelectManyCombo(renderContext)
                break
            case 'wordCloud':
                renderer.renderWordCloud(renderContext)
                break
            case 'audio':
                renderer.renderAudio(renderContext)
                break
            case 'image':
                renderer.renderImage(renderContext)
                break
            case 'imageDialog':
                renderer.renderImageDialog(renderContext)
                break
            case 'embeddedImage':
                renderer.renderEmbeddedImage(renderContext)
                break
            case 'embeddedImages':
                renderer.renderEmbeddedImages(renderContext)
                break
            case 'autocomplete':
                renderer.renderAutocomplete(renderContext)
                break
            case 'speciesSearchWithImagePreview':
                renderer.renderSpeciesSearchWithImagePreview(renderContext)
                break
            case 'fusedAutoComplete':
                renderer.renderFusedAutocomplete(renderContext)
                break
            case 'photopoint':
                renderer.renderPhotoPoint(renderContext)
                break
            case 'link':
                renderer.renderLink(renderContext)
                break
            case 'date':
                renderer.renderDate(renderContext)
                break
            case 'time':
                renderer.renderTime(renderContext)
                break
            case 'document':
                renderer.renderDocument(renderContext)
                break
            case 'speciesSelect':
                renderer.renderSpeciesSelect(renderContext)
                break
            case 'select2':
                renderer.renderSelect2(renderContext)
                break
            case 'select2Many':
                renderer.renderSelect2Many(renderContext)
                break
            case 'currency':
                renderer.renderCurrency(renderContext)
                break
            case 'multiInput':
                renderer.renderMultiInput(renderContext)
                break
            case 'buttonGroup':
                renderer.renderButtonGroup(renderContext)
                break
            case 'geoMap':
                renderer.renderGeoMap(renderContext)
                break
            case 'feature':
                renderer.renderFeature(renderContext)
                break
            default:
                log.warn("Unhandled widget type: ${model.type}")
                break
        }

        def result = renderContext.writer.toString()

        // make sure to remember any deferred templates
        renderContext.deferredTemplates?.each {
            addDeferredTemplate(it)
        }

        result = renderWithLabel(model, labelAttributes, attrs, editable, result)

        if (labelBindingType) {
            result = """
                <div data-bind="$labelBindingType:$labelBindingValue">${result}</div>
            """
        }
        return result
    }

    private String renderWithLabel(Map model, AttributeMap labelAttributes, attrs, editable, String dataTag) {

        String result = dataTag
        if (model.preLabel) {
            labelAttributes.addClass 'preLabel'

            if (isRequired(attrs, model, editable)) {
                labelAttributes.addClass 'required'
            }

            String labelPlainText = labelContent(model.preLabel)
            result = "<span ${labelAttributes.toString()}><label>${labelText(attrs, model, labelPlainText)}</label></span>" + dataTag
        }

        if (model.postLabel) {
            labelAttributes.addClass 'postLabel'
            String postLabel = labelContent(model.postLabel)
            result = dataTag + "<span ${labelAttributes.toString()}>${postLabel}</span>"
        }


        result
    }


    private String labelContent(Map labelModel) {
        String expression = labelModel.computed
        "<span data-bind=\"expression:'${expression}'\"></span>"
    }

    private String labelContent(String labelModel) {
        labelModel
    }


    /**
     * Generates the contents of a label, including help text if it is available in the model.
     * The attribute "helpText" on the view model is used first, if that does not exist, the dataModel "description"
     * attribute is used a fallback.  If that doesn't exist either, no help is added to the label.
     * @param attrs the taglib attributes, includes the full model.
     * @param model the current viewModel item being processed.
     * @param label text to use for the label.  Will also be used as a title for the help test.
     * @return a generated html string to use to render the label.
     */
    def labelText(attrs, model, label) {

        if (attrs.printable) {
            return label
        }

        def helpText = model.helpText

        if (!helpText) {

            if (model.source) {
                // Get the description from the data model and use that as the help text.
                def attr = getAttribute(attrs.model.dataModel, model.source)
                if (!attr) {
                    println "Attribute ${model.source} not found"
                }
                helpText = attr?.description
            }
        }
        if (helpText) {
            helpText = " "+md.iconHelp([useBinding:true], helpText.encodeAsJavaScript())
        }

        return "${label}${helpText?:''}"

    }

    def evalDependency(dependency) {
        if (dependency.source) {
            if (dependency.values) {
                return "jQuery.inArray(${dependency.source}(), ${dependency.values as JSON}) >= 0"
            }
            else if (dependency.value) {
                return "${dependency.source}() === ${dependency.value}"
            }
            return "${dependency.source}()"
        }
    }

    // convenience method for the above
    def dataTag(attrs, model, context, editable, at) {
        dataTag(attrs, model, context, editable, at, null, new AttributeMap())
    }

    // convenience method for the above
    def dataTag(attrs, model, context, editable) {
        dataTag(attrs, model, context, editable, null, null, new AttributeMap())
    }

    // -------- validation declarations --------------------
    def isRequired(attrs, model, edit) {
        def dataModel = getAttribute(attrs.model.dataModel, model.source)
        return validationHelper.isRequired(dataModel, model, edit)
    }

    // form section
    def section(model, LayoutRenderContext ctx) {

        def out = ctx.out

        if (model.title && !model.boxed) {
            out << "<h4>${model.title}</h4>"
            out << "<div class=\"row-fluid output-section\">\n"
        } else if (model.title && model.boxed) {
            out << "<div class=\"boxed-heading\" data-content='${model.title}'>\n"
            out << "<div class=\"row-fluid\">\n"
        }
        else {
            out << "<div class=\"row-fluid output-section\">\n"
        }

        out << "<div class=\"span12\">\n"

        viewModelItems(model.items, ctx)

        out << "</div>\n"

        if (model.title && !model.boxed) {
            out << "</div>"
        } else if (model.title && model.boxed) {
            out << "</div>"
            out << "</div>"
        }
        else {
            out << "</div>"
        }
    }

    // row model
    def row(out, attrs, model, ctx) {

        def span = (ctx.span / model.items.size())

        LayoutRenderContext childCtx = ctx.createChildContext(parentView: 'row', dataContext: ctx.dataContext, span: span)

        def extraClassAttrs = model.class ?: model.css ?: ""
        def databindAttrs = model.visibility ? "data-bind=\"visible:${model.visibility}\"" : ""

        out << "<div class=\"row-fluid space-after ${extraClassAttrs}\" ${databindAttrs}>\n"
        if (model.align == 'right') {
            out << "<div class=\"pull-right\">\n"
        }
        viewModelItems(model.items, childCtx)
        if (model.align == 'right') {
            out << "</div>\n"
        }
        out << "</div>\n"
    }

    def column(out, attrs, model, LayoutRenderContext ctx) {

        LayoutRenderContext childCtx = ctx.createChildContext(parentView: 'col', dataContext: ctx.dataContext, span: LAYOUT_COLUMNS)

        // Use even spacing for columns unless the column model specifies a span.
        String css = "span${ctx.span}"
        if (model.css) {
            if (!model.css.contains("span")) {
                css += "${css} ${model.css}"
            }
            else {
                css = model.css
            }
        }
        out << "<div class=\"${css}\">\n"
        viewModelItems(model.items, childCtx)
        out << "</div>"
    }

    def layoutDataItem(out, attrs, model, LayoutRenderContext layoutContext) {

        AttributeMap at = new AttributeMap()
        at.addClass(model.css)

        // Wrap data elements in rows to reset the bootstrap indentation on subsequent spans to save the
        // model definition from needing to do so.
        def labelAttributes = new AttributeMap()
        def elementAttributes = new AttributeMap()

        switch (layoutContext.parentView) {
            case 'col':
                out << "<div class=\"row-fluid\">"
                labelAttributes.addSpan 'span4'
                if (model.type != "number") {
                    elementAttributes.addSpan 'span8'
                }
                break
            case 'table':
                if (model.type == 'boolean') {
                    out << "<label class=\"table-checkbox-label\">"
                }
                break
            default:
                at.addSpan("span${layoutContext.span}")
                out << "<div${at.toString()}>"
        }

        out << INDENT << dataTag(attrs, model, layoutContext.dataContext, attrs.edit, elementAttributes, null, labelAttributes)

        switch (layoutContext.parentView) {
            case 'table':
                if (model.type == 'boolean') {
                    out << "</label>"
                }
                break
            case 'col':
            default:
                out << "</div>"
                break
        }
    }

    def grid(out, attrs, model) {
        out << "<div class=\"row-fluid\">\n"
        out << INDENT*3 << "<table class=\"table table-bordered ${model.source?:''}\">\n"
        gridHeader out, attrs, model
        if (attrs.edit) {
            gridBodyEdit out, attrs, model
        } else {
            gridBodyView out, attrs, model
        }
        footer out, attrs, model
        out << INDENT*3 << "</table>\n"
        out << INDENT*2 << "</div>\n"
    }

    def gridHeader(out, attrs, model) {
        out << INDENT*4 << "<thead><tr>"
        model.columns.each { col ->
            out << "<th>"
            out << col.title
            if (col.pleaseSpecify) {
                def ref = col.pleaseSpecify.source
                // $ means top-level of data
                if (ref.startsWith('$')) { ref = 'data.' + ref[1..-1] }
                if (attrs.edit) {
                    out << " (<span data-bind='clickToEdit:${ref}' data-input-class='input-mini' data-prompt='specify'></span>)"
                } else {
                    out << " (<span data-bind='text:${ref}'></span>)"
                }
            }
            out << "</th>"
        }
        out << '\n' << INDENT*4 << "</tr></thead>\n"
    }

    def gridBodyEdit(out, attrs, model) {
        out << INDENT*4 << "<tbody>\n"
        model.rows.eachWithIndex { row, rowIndex ->

            // >>> output the row heading cell
            AttributeMap at = new AttributeMap()
            at.addClass('shaded')  // shade the row heading
            if (row.strong) { at.addClass('strong') } // bold the heading if so specified
            // row and td tags
            out << INDENT*5 << "<tr>" << "<td${at.toString()}>"
            out << row.title
            if (row.pleaseSpecify) { //handles any requirement to allow the user to specify the row heading
                def ref = row.pleaseSpecify.source
                // $ means top-level of data
                if (ref.startsWith('$')) { ref = 'data.' + ref[1..-1] }
                out << " (<span data-bind='clickToEdit:${ref}' data-input-class='input-small' data-prompt='specify'></span>)"
            }
            // close td
            out << "</td>" << "\n"

            // find out if the cells in this row are computed
            def isComputed = getComputed(attrs, row.source, model.source)
            // >>> output each cell in the row
            model.columns[1..-1].eachWithIndex { col, colIndex ->
                out << INDENT*5 << "<td>"
                if (isComputed) {
                    out << "<span data-bind='text:data.${model.source}.get(${rowIndex},${colIndex})'></span>"
                } else {
                    out << "<span data-bind='ticks:data.${model.source}.get(${rowIndex},${colIndex})'></span>"
                    //out << "<input class='input-mini' data-bind='value:data.${model.source}.get(${rowIndex},${colIndex})'/>"
                }
                out << "</td>" << "\n"
            }

            out << INDENT*5 << "</tr>\n"
        }
        out << INDENT*4 << "</tr></tbody>\n"
    }

    def gridBodyView(out, attrs, model) {
        out << INDENT*4 << "<tbody>\n"
        model.rows.eachWithIndex { row, rowIndex ->

            // >>> output the row heading cell
            AttributeMap at = new AttributeMap()
            at.addClass('shaded')
            if (row.strong) { at.addClass('strong')}
            // row and td tags
            out << INDENT*5 << "<tr>" << "<td${at.toString()}>"
            out << row.title
            if (row.pleaseSpecify) { //handles any requirement to allow the user to specify the row heading
                def ref = row.pleaseSpecify.source
                // $ means top-level of data
                if (ref.startsWith('$')) { ref = 'data.' + ref[1..-1] }
                out << " (<span data-bind='text:${ref}'></span>)"
            }
            // close td
            out << "</td>" << "\n"

            // >>> output each cell in the row
            model.columns[1..-1].eachWithIndex { col, colIndex ->
                out << INDENT*5 << "<td>" <<
                    "<span data-bind='text:data.${model.source}.get(${rowIndex},${colIndex})'></span>" <<
                    "</td>" << "\n"
            }

            out << INDENT*5 << "</tr>\n"
        }
        out << INDENT*4 << "</tr></tbody>\n"
    }

    def table(LayoutRenderContext ctx) {

        Map attrs = ctx.attrs
        def out = ctx.out
        Map model = ctx.model

        def isprintblankform = attrs.printable && attrs.printable != 'pdf'

        def extraClassAttrs = model.class ?: ""
        def tableClass = isprintblankform ? "printed-form-table" : ""
        def validation = model.editableRows && model.source ? "data-bind=\"independentlyValidated:data.${model.source}\"":""
        out << "<div class=\"row-fluid ${extraClassAttrs}\">\n"
        if (model.title) {
            out << model.title
        }
        out << INDENT*3 << "<table class=\"table table-bordered ${model.source?:''} ${tableClass}\" ${validation}>\n"
        tableHeader ctx
        if (isprintblankform) {
            tableBodyPrint ctx
        } else {
            tableBodyEdit ctx
            footer ctx
        }

        out << INDENT*3 << "</table>\n"
        out << INDENT*2 << "</div>\n"
    }

    def tableHeader(LayoutRenderContext ctx) {

        Map attrs = ctx.attrs
        def out = ctx.out
        Map table = ctx.model

        out << INDENT*4 << "<thead><tr>"
        table.columns.eachWithIndex { col, i ->
            boolean required = isRequired(attrs, col, attrs.edit)
            String css = (required ? 'required' : "") + (col.css ?: "")
            out << "<th class=\"${css}\">" + labelText(attrs, col, col.title) + "</th>"
        }
        if (table.source && attrs.edit && !attrs.printable && (table.editableRows || getAllowRowDelete(attrs, table.source, null))) {
            out << "<th></th>"
        }
        out << '\n' << INDENT*4 << "</tr></thead>\n"
    }

    def tableBodyPrint (LayoutRenderContext ctx) {

        def out = ctx.out
        Map table = ctx.model

        def numRows = table.printRows ?: 10

        out << INDENT * 4 << "<tbody>\n"
        for (int rowIndex = 0; rowIndex < numRows; ++rowIndex) {
            out << INDENT * 5 << "<tr>"
            table.columns.eachWithIndex { col, i ->
                out << INDENT * 6 << "<td></td>\n"
            }

            out << INDENT * 5 << "</tr>"
        }
        out << INDENT * 4 << "</tbody>\n"
    }

    def tableBodyEdit (LayoutRenderContext ctx) {
        def out = ctx.out
        Map attrs = ctx.attrs
        Map table = ctx.model
        // body elements for main rows
        if (attrs.edit) {

            String dataBind
            if (table.source) {
                def templateName = table.editableRows ? "${table.source}templateToUse" : "'${table.source}viewTmpl'"
                dataBind = "template:{name:${templateName}, foreach: ${ctx.property}}"
            }
            else {
                def count = getUnnamedTableCount(true)
                def templateName = table.editableRows ? "${count}templateToUse" : "'${count}viewTmpl'"
                dataBind = "template:{name:${templateName}"
                if (ctx.dataContext) {
                    dataBind += ", data:${ctx.dataContext}"
                }
                dataBind += "}"
            }

            out << INDENT*4 << "<tbody data-bind=\"${dataBind}\"></tbody>\n"
            if (table.editableRows) {
                // write the view template
                tableViewTemplate(ctx, false)
                // write the edit template
                tableEditTemplate(ctx)
            } else {
                // write the view template
                tableViewTemplate(ctx, attrs.edit)
            }
        } else {
            String dataBind = ""
            String childDataContext = ctx.dataContext
            // Tables don't have to be bound to a list dataType, they can also be used for formatting related values
            if (table.source) {
                dataBind = "data-bind=\"foreach: ${ctx.property}\""
                childDataContext = ''
            }
            out << INDENT*4 << "<tbody ${dataBind}><tr>\n"

            LayoutRenderContext tableCtx = ctx.createChildContext([dataContext: childDataContext, parentView: 'table'])
            table.columns.eachWithIndex { col, i ->

                out << INDENT*5 << "<td>"
                viewModelItems([col], tableCtx)
                out << "</td>" << "\n"
            }
            out << INDENT*4 << "</tr></tbody>\n"
        }

        // body elements for additional rows (usually summary rows)
        if (table.rows) {
            out << INDENT*4 << "<tbody>\n"
            table.rows.each { tot ->
                def at = new AttributeMap()
                if (tot.showPercentSymbol) { at.addClass('percent') }
                out << INDENT*4 << "<tr>\n"
                table.columns.eachWithIndex { col, i ->
                    if (i == 0) {
                        out << INDENT*4 << "<td>${tot.title}</td>\n"
                    } else {
                        // assume they are all computed for now
                        out << INDENT*5 << "<td>" <<
                          "<span${at.toString()} data-bind='text:data.frequencyTotals().${col.source}.${tot.source}'></span>" <<
                          "</td>" << "\n"
                    }
                }
                if (attrs.edit) {
                    out << INDENT*5 << "<td></td>\n"
                }
                out << INDENT*4 << "</tr>\n"
            }
            out << INDENT*4 << "</tbody>\n"
        }
    }

    def tableViewTemplate(LayoutRenderContext ctx, edit) {

        def out = ctx.out
        Map attrs = ctx.attrs
        Map model = ctx.model

        def templateName = model.source ? "${model.source}viewTmpl" : "${getUnnamedTableCount(false)}viewTmpl"
        def allowRowDelete = getAllowRowDelete(attrs, model.source, null)
        out << INDENT*4 << "<script id=\"${templateName}\" type=\"text/html\"><tr>\n"
        LayoutRenderContext tableCtx = ctx.createChildContext([dataContext: '', parentView: 'table'])
        model.columns.eachWithIndex { col, i ->
            out << INDENT*5 << "<td>"
            viewModelItems([col], tableCtx)
            out << "</td>" << "\n"
        }
        if (model.editableRows) {
                out << INDENT*5 << "<td>\n"
                out << INDENT*6 << "<button class='btn btn-mini' data-bind='click:\$root.edit${model.source}Row, enable:!\$root.${model.source}Editing()' title='edit'><i class='icon-edit'></i> Edit</button>\n"
                if (allowRowDelete) {
                    out << INDENT*6 << "<button class='btn btn-mini' data-bind='click:${ctx.property}.removeRow, enable:!\$root.${model.source}Editing()' title='remove'><i class='icon-trash'></i> Remove</button>\n"
                }
                out << INDENT*5 << "</td>\n"
        } else {
            if (edit && model.source && allowRowDelete) {
                out << INDENT*5 << "<td><i data-bind='click:\$parent.${ctx.property}.removeRow' class='icon-remove'></i></td>\n"
            }
        }
        out << INDENT*4 << "</tr></script>\n"
    }

    def tableEditTemplate(LayoutRenderContext ctx) {
        def out = ctx.out
        Map attrs = ctx.attrs
        Map model = ctx.model

        def templateName = model.source ? "${model.source}viewTmpl" : "${getUnnamedTableCount(false)}viewTmpl"
        out << INDENT*4 << "<script id=\"${templateName}\" type=\"text/html\"><tr>\n"
        model.columns.eachWithIndex { col, i ->
            def edit = !col['readOnly'];
            // mechanism for additional data binding clauses
            def bindAttrs = new Databindings()
            if (i == 0) {bindAttrs.add 'hasFocus', 'isSelected'}
            // inject type from data model
            col.type = col.type ?: getType(attrs, col.source, model.source)
            // inject computed from data model
            col.computed = col.computed ?: getComputed(attrs, col.source, model.source)
            String data = dataTag(attrs, col, '', edit, null, bindAttrs, null)
            out << INDENT*5 << "<td>"
            if (col.type == 'boolean') {
                out << "<label style=\"table-checkbox-label\">" << data << "</label>"
            }
            else {
                out << data
            }
            out << data << "</td>" << "\n"
        }
        out << INDENT*5 << "<td>\n"
        out << INDENT*6 << "<a class='btn btn-success btn-mini' data-bind='click:\$root.accept${model.source}' href='#' title='save'>Update</a>\n"
        out << INDENT*6 << "<a class='btn btn-mini' data-bind='click:\$root.cancel${model.source}' href='#' title='cancel'>Cancel</a>\n"
        out << INDENT*5 << "</td>\n"
        out << INDENT*4 << "</tr></script>\n"
    }

    /**
     * Common footer output for both tables and grids.
     */
    def footer(LayoutRenderContext ctx) {

        def out = ctx.out
        Map attrs = ctx.attrs
        Map model = ctx.model

        def colCount = 0
        def containsSpecies = model.columns.find{it.type == 'autocomplete'}
        out << INDENT*4 << "<tfoot>\n"
        def allowRowDelete = getAllowRowDelete(attrs, model.source, null)
        model.footer?.rows.each { row ->
            colCount = 0
            out << INDENT*4 << "<tr>\n"
            LayoutRenderContext footerCtx = ctx.createChildContext([:])
            row.columns.eachWithIndex { col, i ->
                colCount += (col.colspan ? col.colspan.toInteger() : 1)
                def colspan = col.colspan ? " colspan='${col.colspan}'" : ''
                out << INDENT*5 << "<td${colspan}>"
                viewModelItems([col], footerCtx)
                out << INDENT*5 << "</td>" << "\n"
            }
            if (model.type == 'table' && attrs.edit && allowRowDelete) {
                out << INDENT*5 << "<td></td>\n"  // to balance the extra column for actions
                colCount++
            }
            out << INDENT*4 << "</tr>\n"
        }
        colCount = (model.columns?.size()?:0) + 1
        if (attrs.edit) {
            out << g.render(template:"/output/editModeTableFooterActions", plugin:'ecodata-client-plugin', model:[addRowText:model.addRowText, uploadText:model.uploadDataText, colCount:colCount, name:model.source, property:ctx.property, containsSpecies:containsSpecies, disableTableUpload:attrs.disableTableUpload || model.disableTableUpload])
        }
        else if (!model.edit && !attrs.printable) {
            boolean disableTableDownload = model.disableTableDownload == null ? (attrs.disableTableUpload || model.disableTableUpload) : model.disableTableDownload
            out << g.render(template:"/output/viewModeTableFooterActions", plugin:'ecodata-client-plugin', model:[colCount:colCount, name:model.source, property:ctx.property, disableTableDownload:disableTableDownload])
        }
        out << INDENT*4 << "</tfoot>\n"

    }

    def addDeferredTemplate(name) {
        def templates = pageScope.getVariable(DEFERRED_TEMPLATES_KEY);
        if (!templates) {
            templates = []
            pageScope.setVariable(DEFERRED_TEMPLATES_KEY, templates);
        }
        templates.add(name)
    }

    def renderDeferredTemplates(out) {

        // some templates need to be rendered after the rest of the view code as it was causing problems when they were
        // embedded inside table view/edit templates. (as happened if an image type was included in a table row).
        def templates = pageScope.getVariable(DEFERRED_TEMPLATES_KEY)
        templates?.each {
            out << g.render(template: it, plugin:'ecodata-client-plugin')
        }
        pageScope.setVariable(DEFERRED_TEMPLATES_KEY, null)
    }

    /*------------ methods to look up attributes in the data model -------------*/

    static String getType(attrs, name, context) {
        getAttribute(attrs, name, context, 'dataType')
    }

    static String getComputed(attrs, name, context) {
        getAttribute(attrs, name, context, 'computed')
    }

    static boolean getAllowRowDelete(attrs, name, context) {
        def ard = getAttribute(attrs, name, context, 'allowRowDelete') ?: 'true'
        return ard.toBoolean()
    }


    static String getAttribute(attrs, name, context, attribute) {
        def dataModel = attrs.model.dataModel
        def level = dataModel.find {it.name == context}
        level = level ?: dataModel
        def target
        if (level.dataType in ['list','matrix', 'photoPoints']) {
            target = level.columns.find {it.name == name}
            if (!target) {
                target = level.rows.find {it.name == name}
            }
        }
        else {
            target = dataModel.find {it.name == name}
        }
        return target ? target[attribute] : null
    }

    def getAttribute(model, name) {
        return model.findResult( {

            if (it.name == name) {
                return it
            }
            else if (it?.dataType == 'list') {
                return getAttribute(it.columns, name)
            }
            else {
                return null
            }

        })
    }

    /**
     * Uses a page scoped variable to track the number of unnamed tables on the page so each can have a unquie
     * rendering template.
     * @param increment true if the value should be incremented (the pre-incremented value will be returned)
     * @return
     */
    private int getUnnamedTableCount(boolean increment = false) {
        def name = 'unnamedTableCount'
        def count = pageScope.getVariable(name) ?: 0

        if (increment) {
            count++
        }
        pageScope.setVariable(name, count)

        return count
    }

}

