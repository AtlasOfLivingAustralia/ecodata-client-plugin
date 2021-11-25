package au.org.ala.ecodata.forms

/**
 * Handles rendering of computed model or view items.
 */
class ComputedValueRenderer {

    private final static INDENT = "    "

    private final static operators = ['sum':'+', 'times':'*', 'divide':'/','difference':'-']

    private final static int DEFAULT_DECIMAL_PLACES = 2

    private void renderJSExpression(Map model, String dependantContext, out) {
        Map computed = model.computed

        String expression = computed.expression
        int decimalPlaces = getNumberOfDecimalPlaces(model, computed)

        out << "return ecodata.forms.expressionEvaluator.evaluate('${expression}', ${dependantContext}, ${decimalPlaces});\n";
    }

    private int getNumberOfDecimalPlaces(Map model, Map computed) {
        // Check first if the computed section defines the rounding, fall back to the model definition
        Integer decimalPlaces = computed.rounding
        if (decimalPlaces == null) {
            decimalPlaces = model.decimalPlaces
        }
        if (decimalPlaces == null) {
            decimalPlaces = DEFAULT_DECIMAL_PLACES
        }
        decimalPlaces
    }

    def expressionAsString(String expression) {
        "\"${expression.replaceAll("\"", "\\\\\"")}\""
    }

    def computedObservable(model, propertyContext, dependantContext, out) {
        out << INDENT*5 << "${propertyContext}.${model.name} = ko.computed(function () {\n"

        if (model.computed.expression) {
            renderJSExpression(model, "self", out)
        }
        else {
            // must be at least one dependant
            def numbers = []
            def checkNumberness = []
            model.computed.dependents.each {
                def ref = it
                def path = dependantContext
                if (ref.startsWith('$')) {
                    ref = ref[1..-1]
                    path = "self.data"
                }
                numbers << "Number(${path}.${ref}())"
                checkNumberness << "isNaN(Number(${path}.${ref}()))"
            }
            out << INDENT * 6 << "if (" + checkNumberness.join(' || ') + ") { return 0; }\n"
            if (model.computed.operation == 'divide') {
                // can't divide by zero
                out << INDENT * 6 << "if (${numbers[-1]} === 0) { return 0; }\n"
            }
            def expression = numbers.join(" ${operators[model.computed.operation]} ")
            if (model.computed.rounding) {
                expression = "neat_number(${expression},${model.computed.rounding})"
            }
            out << INDENT * 6 << "return " + expression + ";\n"
        }
        out << INDENT * 5 << "});\n"

    }

    def computedViewModel(out, attrs, model, propertyContext, dependantContext) {
        computedViewModel(out, attrs, model, propertyContext, dependantContext, null)
    }
    def computedViewModel(out, attrs, model, propertyContext, dependantContext, parentModel) {
        out << "\n" << INDENT*3 << "${propertyContext}.${model.name} = ko.computed(function () {\n"
        if (model.computed.dependents == "all") {
            out <<
                    """                var total = 0, value;
                \$.each(${dependantContext}.${parentModel.source}(), function(i, obj) {
                    value = obj[name]();
                    if (isNaN(value)) {
                        total = total + (value ? 1 : 0)
                    } else {
                        total = total + Number(value);
                    }
                });
                return total;
"""
        }
        else if (model.computed.operation == 'percent') {
            if (model.computed.dependents?.size() > 1) {
                def dividend = model.computed.dependents[0]
                def divisor = model.computed.dependents[1]
                def rounding = model.computed.rounding ?: 2
                if (divisor == "#rowCount") {
                    divisor = "${dependantContext}.${parentModel.source}().length"
                }
                out <<
                        """                percent = self.${dividend}() * 100 / ${divisor};
                return neat_number(percent, ${rounding});
"""
            }
        }
        else if (model.computed.operation == 'difference') {
            out << INDENT*4 << "return ${dependantContext}.${model.computed.dependents[0]}() - ${dependantContext}.${model.computed.dependents[1]}();\n"
        }
        else if (model.computed.operation == "lookup") {
            computedByNumberRangeLookupFunction out, attrs, model, "self.${model.computed.dependents[0]}"
        }
        else if (model.computed.operation == 'count') {
            out << INDENT*4 << "return ${dependantContext}.${model.computed.dependents.source}().length;\n"
        }
        else if (model.computed.expression) {
            renderJSExpression(model, dependantContext, out)
        }
        else if (model.computed.dependents.fromList) {
            out << INDENT*4 << "var total = 0;\n"
            if (model.computed.operation == 'average') {
                out << INDENT*4 << "var count = 0;\n"
            }
            out << INDENT*4 << "for(var i = 0; i < ${dependantContext}.${model.computed.dependents.fromList}().length; i++) {\n"
            out << INDENT*5 << "var value = ${dependantContext}.${model.computed.dependents.fromList}()[i].${model.computed.dependents.source}();\n"
            if (model.computed.operation != 'average') {
                out << INDENT*6 << "if (!isNaN(parseFloat(value))) {\n"
                out << INDENT*8 << "total = total ${operators[model.computed.operation]} Number(value); \n"
                out << INDENT*6<< "}\n"
                out << INDENT*4<< "}\n"
                out << INDENT*4 << "return total;\n"
            }
            else {
                out << INDENT*6 << "if (!isNaN(parseFloat(value))) {\n"
                out << INDENT*8 << "total = total + Number(value);\n"
                out << INDENT*8 << "count++;\n"
                out << INDENT*6 << "}\n"
                out << INDENT*4 << "}\n"
                out << INDENT*4 << "return count > 0 ? total/count : 0;\n"
            }
        }
        else if (model.computed.dependents.fromMatrix) {
            out << INDENT*4 << "var total = 0;\n"
            if (model.computed.operation == 'average') {
                out << INDENT*4 << "var count = 0;\n"
            }
            out << INDENT*4 << "var grid = ${dependantContext}.${model.computed.dependents.fromMatrix};\n"
            // iterate columns and get value from model.computed.dependents.row
            out << INDENT*4 << "\$.each(grid, function (i,obj) {\n"
            if (model.computed.operation != 'average') {
                out << INDENT*5 << "total = total ${operators[model.computed.operation]} Number(obj.${model.computed.dependents.row}());\n"
                out << INDENT*4 << "});\n"
                out << INDENT*4 << "return total;\n"
            }
            else {
                out << INDENT*6 << "var value = obj.${model.computed.dependents.row}();\n"
                out << INDENT*6 << "if (!isNaN(parseFloat(value))) {\n"
                out << INDENT*8 << "total = total + Number(value);\n"
                out << INDENT*8 << "count++;\n"
                out << INDENT*6 << "}\n"
                out << INDENT*4 << "});\n"
                out << INDENT*4 << "return count > 0 ? total/count : 0;\n"
            }
        }

        else if (model.computed.dependents.from) {
            out << """
                var total = 0, dummyDependency = self.transients.dummy();
                \$.each(${dependantContext}.${model.computed.dependents.from}(), function (i, obj) {
                    total += obj.${model.computed.dependents.source}();
                });
                return total;
"""
        }
        else if (model.computed.operation == 'sum') {
            out << "var total = 0;"
            if (model.computed.dependents.source.size() == 1) {
                out << "total += Number(${dependantContext}.${model.computed.dependents.source[0]}());\n"
            } else {
                for(int i=0; i < model.computed.dependents.source.size(); i++) {
                    out << "total += Number(${dependantContext}.${model.computed.dependents.source[i]}());\n"
                }
            }
            out << INDENT*4 << "return total;"
        }

        out << INDENT*3 << "});\n"
    }

    def computedByNumberRangeLookupFunction(out, attrs, model, source) {
        def lookupMap = findInDataModel(attrs, model.computed.lookupMap)
        out <<
                """                var x = Number(${source}());
                if (isNaN(x)) { return '' }
"""
        lookupMap.map.each {
            if (it.inputMin == it.inputMax) {
                out << INDENT*4 << "if (x === ${it.inputMin}) { return ${it.output} }\n"
            } else {
                out << INDENT*4 << "if (x > ${it.inputMin} && x <= ${it.inputMax}) { return ${it.output} }\n"
            }
        }
    }

    def findInDataModel(attrs, name) {
        def dataModel = attrs.model.dataModel
        // todo: just search top level for now
        dataModel.find {it.name == name}
    }


}
