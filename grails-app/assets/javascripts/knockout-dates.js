(function() {
    
    /* Custom binding for Bootstrap datepicker */
    // This binds an element and a model observable to the bootstrap datepicker.
    // The element can be an input or container such as span, div, td.
    // The datepicker is 2-way bound to the model. An input element will be updated automatically,
    //  other elements may need an explicit text binding to the formatted model date (see
    //  clickToPickDate for an example of a simple element).
    ko.bindingHandlers.datepicker = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            // set current date into the element
            var $element = $(element),
                initialDate = ko.utils.unwrapObservable(valueAccessor()),
                initialDateStr = convertToSimpleDate(initialDate);
            if ($element.is('input')) {
                $element.val(initialDateStr);
            } else {
                $element.data('date', initialDateStr);
            }

            var defaults = {format: 'dd-mm-yyyy', autoclose: true, enableOnReadonly: false};
            var options = _.defaults(allBindingsAccessor().datepickerOptions || {}, defaults);

            $element.click(function() {
                if ($element.prop('disabled') && $element.prop('readonly')) {
                    e.preventDefault();
                }
            });

            //initialize datepicker with some optional options
            $element.datepicker(options);

            // if the parent container holds any element with the class 'open-datepicker'
            // then add a hook to do so
            $element.parent().find('.open-datepicker').click(function () {
                if (!$element.prop('disabled') && !$element.prop('readonly')) {
                    $element.datepicker('show');
                }
            });

            var changeHandler = function (event) {
                var value = valueAccessor();
                if (ko.isObservable(value)) {
                    value(event.date);
                }
            };

            //when a user changes the date via the datepicker, update the view model
            ko.utils.registerEventHandler(element, "changeDate", changeHandler);
            ko.utils.registerEventHandler(element, "hide", changeHandler);

            //when a user changes the date via the input, update the view model
            ko.utils.registerEventHandler(element, "change", function () {
                var value = valueAccessor();
                if (ko.isObservable(value)) {
                    value(stringToDate(element.value));
                    $(element).trigger('blur');  // This is to trigger revalidation of the date field to remove existing validation errors.
                }
            });
        },
        update: function (element, valueAccessor) {
            var widget = $(element).data("datepicker");
            //when the view model is updated, update the widget
            if (widget) {
                var date = ko.utils.unwrapObservable(valueAccessor());
                widget.date = date;
                if (!isNaN(widget.date)) {
                    widget.setDate(widget.date);
                }
                else {
                    widget.setDate(null);
                }
            }
        }
    };

// This extends an observable that holds a UTC ISODate. It creates properties that hold:
//  a JS Date object - useful with datepicker; and
//  a simple formatted date of the form dd-mm-yyyy useful for display.
// The formatted date will include hh:MM if the includeTime argument is true
ko.extenders.simpleDate = function (target, options) {
    var includeTime = false;
    var isReadOnly = false;
    if (_.isObject(options)) {
        includeTime = options.includeTime || false;
        isReadOnly = options.readOnly || false;
    }
    else {
        includeTime = options || false;
    }

        target.date = ko.computed({
            read: function () {
                return Date.fromISO(target());
            },

            write: function (newValue) {
            if (isReadOnly) {
                return;
            }
                if (newValue) {
                    var current = target(),
                        valueToWrite = convertToIsoDate(newValue);

                    if (valueToWrite !== current) {
                        target(valueToWrite);
                    }
                } else {
                    // date has been cleared
                    target("");
                }
            }
        });
        target.formattedDate = ko.computed({
            read: function () {
                return convertToSimpleDate(target(), includeTime);
            },

            write: function (newValue) {
            if (isReadOnly) {
                return;
            }
                if (newValue) {
                    var current = target(),
                        valueToWrite = convertToIsoDate(newValue);

                    if (valueToWrite !== current) {
                        target(valueToWrite);
                    }
                }
            }
        });
        target.date(target());
        target.formattedDate(target());

        return target;
    };
}());