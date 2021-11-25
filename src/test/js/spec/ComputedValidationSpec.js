describe("Computed Validation Spec", function () {

    var vm = null;
    var mockElement = null;
    var metadata = null;
    beforeEach(function() {

        metadata = {
            dataType:'number',
            name:'item1',
            validate:[
                {
                    rule:"min",
                    param: {
                        "type":"computed",
                        "expression":"item2*0.01"
                    }
                }
            ]
        };
        vm = {
            item2: ko.observable('0'),
            item1: ko.observable('0')
        };
        vm.$context = vm; // This is how the context is accessed by some bindings.

        mockElement = document.createElement('input');
    });

    it("will attach validation based on the result of evaluating the conditional_validation behaviour", function() {

        ko.bindingHandlers.computedValidation.init(mockElement, function() { return metadata.validate; }, [], vm, vm, vm);

        vm.item2('200');
        expect(mockElement.getAttribute('data-validation-engine')).toEqual('validate[min[2.00]]');

        vm.item2('0');
        expect(mockElement.getAttribute('data-validation-engine')).toEqual('validate[min[0.00]]');

    });

    it("will correctly attach more than one validation rule", function() {
        metadata.validate.push({rule:"required"});

        ko.bindingHandlers.computedValidation.init(mockElement, function() { return metadata.validate; }, [], vm, vm, vm);
        vm.item2('200');
        expect(mockElement.getAttribute('data-validation-engine')).toEqual('validate[min[2.00],required]')
    });

});