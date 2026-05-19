describe("knockout dates spec", function () {
    it("can restrict the number of decimal places in a number", function() {
        var observable = ko.observable().extend({numericString:2});

        var inputOutput = [
            {input:"2", output:"2"}, {input:"2.1", output:"2.1"}, {input:"2.21", output:"2.21"},
            {input:"2.123", output:"2.12"}, {input:"2.126", output:"2.13"}
        ];

       for (var i=0; i<inputOutput.length; i++) {
           observable(inputOutput[i].input);
           expect(observable()).toEqual(inputOutput[i].output);
       }

       observable = ko.observable().extend({numericString:0});
       inputOutput = [{input:"2", output:"2"}, {input:"2.1", output:"2"}, {input:"2.22", output:"2"}];

        for (var i=0; i<inputOutput.length; i++) {
            observable(inputOutput[i].input);
            expect(observable()).toEqual(inputOutput[i].output);
        }
    });

    it("defaults empty numeric values to zero", () => {
        var observable = ko.observable("2").extend({numericString:2});

        observable("");

        expect(observable()).toEqual("0");
    });

    it("can store empty numeric values as null when configured", () => {
        var observable = ko.observable("2").extend({numericString:{decimalPlaces:2, allowEmpty:true}});

        observable("");

        expect(observable()).toBeNull();
    });
});
