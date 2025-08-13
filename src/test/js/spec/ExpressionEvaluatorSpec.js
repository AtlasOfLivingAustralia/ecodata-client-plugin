describe("ecodata.forms.expressionEvaluator Spec", function () {


    it("Can evaluate simple expressions", function() {
        var result = ecodata.forms.expressionEvaluator.evaluate("x+y", {x:1, y:2}, 1);
        expect(result).toBeCloseTo(3);
    });

    it("Can evaluate expressions against a parent context", function() {
        var parent = {x:3};
        var context = {y:2, $parent:parent};

        var result = ecodata.forms.expressionEvaluator.evaluate("x+y", context, 1);
        expect(result).toBeCloseTo(5.0);
    });

    it("Can evaluate polygon area", function() {
        var result = ecodata.forms.expressionEvaluator.evaluate("$geom.areaHa(geojson)");
        var result = ecodata.forms.expressionEvaluator.evaluate("$geom.lengthKm(geojson)");

    });

    it ("Can evaluate polygon length", function() {
        var data = {list:['1', '2', '3']};
        expect(ecodata.forms.expressionEvaluator.evaluateBoolean("'1' in list", data)).toBeTruthy();
        expect(ecodata.forms.expressionEvaluator.evaluateBoolean("'d' in list", data)).toBeFalsy();

    });

    it ("Supports returning a property from an object in an array where the object is selected based on an expression", function() {
        var data = {match:2, list:[
                {prop1:1, prop2: 5},
                {prop1:2, prop2: 4},
                {prop1:3, prop2: 3},
                {prop1:4, prop2: 2},
                {prop1:5, prop2: 1}

                ]};
        expect(ecodata.forms.expressionEvaluator.evaluateString("findProperty(list, \"prop1\", match, \"prop2\")", data)).toEqual('4');

    })

});