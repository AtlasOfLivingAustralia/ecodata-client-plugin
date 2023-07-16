/**
 * Bindings used by the forms library that are also useful in other instances.
 */
(function() {

    /**
     * Attaches a bootstrap popover to the bound element.  The details for the popover should be supplied as the
     * value of this binding.
     * e.g.  <a href="#" data-bind="popover: {title:"Popover title", content:"Popover content"}>My link with popover</a>
     *
     * The content and title must be supplied, other popover options have defaults.
     *
     */
    ko.bindingHandlers.popover = {

        init: function (element, valueAccessor) {
            ko.bindingHandlers.popover.initPopover(element, valueAccessor);
        },
        update: function (element, valueAccessor) {

            var $element = $(element);
            $element.popover('dispose');
            var options = ko.bindingHandlers.popover.initPopover(element, valueAccessor);
            if (options.autoShow) {
                if ($element.data('firstPopover') === false) {
                    $element.popover('show');
                    $('body').on('click', function (e) {

                        if (e.target != element && $element.find(e.target).length == 0) {
                            $element.popover('dispose');
                        }
                    });
                }
                $element.data('firstPopover', false);
            }

        },

        defaultOptions: {
            placement: "right",
            animation: true,
            html: true,
            trigger: "hover",
            delay: {
                show: 250
            }
        },

        initPopover: function (element, valueAccessor) {
            var options = ko.utils.unwrapObservable(valueAccessor());

            var combinedOptions = ko.utils.extend({}, ko.bindingHandlers.popover.defaultOptions);
            var content = ko.utils.unwrapObservable(options.content);
            ko.utils.extend(combinedOptions, options);
            combinedOptions.description = content;

            $(element).popover(combinedOptions);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).popover("dispose");
            });
            return options;
        }
    };

    // Binding to exclude the contained html from the current binding context.
    // Used when you want to bind a section of html to a different viewModel.
    ko.bindingHandlers.stopBinding = {
        init: function() {
            return { controlsDescendantBindings: true };
        }
    };
    ko.virtualElements.allowedBindings.stopBinding = true;

    /**
     * Creates a flag that indicates whether the model has been modified.
     *
     * Compares the model to its initial state each time an observable changes. Uses the model's
     * modelAsJSON method if it is defined else uses ko.toJSON.
     *
     * @param root the model to watch
     * @param isInitiallyDirty
     * @returns an object (function) with the methods 'isDirty' and 'reset'
     */
    ko.dirtyFlag = function (root, isInitiallyDirty, rateLimit) {
        var result = function () {
        };
        var _isInitiallyDirty = ko.observable(isInitiallyDirty || false);
        // this allows for models that do not have a modelAsJSON method
        var getRepresentation = function () {
            return (typeof root.modelAsJSON === 'function') ? root.modelAsJSON() : ko.toJSON(root);
        };
        var _initialState = ko.observable(getRepresentation());

        result.isDirty = ko.pureComputed(function () {
            var dirty = _isInitiallyDirty() || _initialState() !== getRepresentation();
            return dirty;
        });
        if (rateLimit) {
            result.isDirty = result.isDirty.extend({rateLimit: 500});
        }

        result.reset = function () {
            _initialState(getRepresentation());
            _isInitiallyDirty(false);
        };

        result.setDirty = function() {
            _isInitiallyDirty(true);
        };

        return result;
    };

    /**
     * A simple dirty flag that will detect the first change to a model, then afterwards always return true (meaning
     * dirty).  This is to prevent the full model being re-serialized to JSON on every change, which can cause
     * performance issues for large models.
     * From: http://www.knockmeout.net/2011/05/creating-smart-dirty-flag-in-knockoutjs.html
     * @param root the model.
     * @returns true if the model has changed since this function was added.
     */
    ko.simpleDirtyFlag = function (root) {
        var _initialized = ko.observable(false);

        // this allows for models that do not have a modelAsJSON method
        var getRepresentation = function () {
            return (typeof root.modelAsJSON === 'function') ? root.modelAsJSON() : ko.toJSON(root);
        };

        var result = function () {
        };

        //one-time dirty flag that gives up its dependencies on first change
        result.isDirty = ko.computed(function () {
            if (!_initialized()) {

                //just for subscriptions
                getRepresentation();

                //next time return true and avoid ko.toJS
                _initialized(true);

                //on initialization this flag is not dirty
                return false;
            }

            //on subsequent changes, flag is now dirty
            return true;
        });
        result.reset = function () {
            _initialized(false);

            return result;
        };

        return result;
    };

    /**
     * Restricts the number of decimal places in a number entered into a text field.
     * @param target the observable storing the number
     * @param precision the number of decimal places allowed.
     * @returns {Computed<any>}
     */
    ko.extenders.numericString = function(target, precision) {
        //create a writable computed observable to intercept writes to our observable
        var result = ko.computed({
            read: target,  //always return the original observables value
            write: function(newValue) {
                var val = newValue;
                if (typeof val === 'string') {
                    val = newValue.replace(/,|\$/g, '');
                }
                var current = target(),
                    roundingMultiplier = Math.pow(10, precision),
                    newValueAsNum = isNaN(val) ? 0 : parseFloat(+val),
                    valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

                //only write if it changed
                if (valueToWrite.toString() !== current || isNaN(val)) {
                    target(isNaN(val) ? newValue : valueToWrite.toString());
                }
                else {
                    if (newValue !== current) {
                        target.notifySubscribers(valueToWrite.toString());
                    }
                }
            }
        }).extend({ notify: 'always' });

        //initialize with current value to make sure it is rounded appropriately
        result(target());

        //return the new computed observable
        return result;
    };
})();