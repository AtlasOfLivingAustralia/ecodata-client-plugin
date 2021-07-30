describe("Conditional Validation Spec", function () {

    var vm = null;
    var mockElement = null;
    var metadata = null;
    beforeEach(function() {

        metadata = {
            dataType:'number',
            name:'item1',
            validate:'required',
            behaviour:[
                {
                    "condition": "item2 != '0'",
                    "type": "conditional_validation",
                    "value": {
                        "validate":"required,integer,min[1]",
                        "message":"The number of plants surviving can only be 0 if the survival rate is also zero"
                    }
                }
            ]
        };
        vm = {
            item2: ko.observable('0')
        };
        vm.item1 = ko.observable().extend({metadata:{metadata:metadata, context:{$parent:vm}, config:{}}});
        mockElement = document.createElement('input');
    });

    it("will attach validation based on the result of evaluating the conditional_validation behaviour", function() {

        ko.bindingHandlers.conditionalValidation.init(mockElement, function() { return vm.item1; });

        vm.item2('2');
        expect(mockElement.getAttribute('data-validation-engine')).toEqual('validate['+metadata.behaviour[0].value.validate+']');
        expect(mockElement.getAttribute('data-errormessage')).toBe(metadata.behaviour[0].value.message);

        vm.item2('0');
        expect(mockElement.getAttribute('data-validation-engine')).toEqual('validate['+metadata.validate+']');
        expect(mockElement.getAttribute('data-errormessage')).toBe(null);

    });

});