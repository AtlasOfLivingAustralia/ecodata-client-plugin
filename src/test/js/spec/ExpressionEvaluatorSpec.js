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

});