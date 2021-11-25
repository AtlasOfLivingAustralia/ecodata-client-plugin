describe("Expression Spec", function () {

    it ("should be able to evaluate expressions in the context of a top level output model", function() {

        var data = {
            totalArea:100,
            percentApplied:40
        };

        var model = new ecodata.forms.SimpleExpressionViewModel({}, {}, {}, {});
        model.loadData(data);

        expect(Number(model.data.affectedArea())).toEqual(40);
    });


    it ("should be able to evaluate expressions in the context of a nested model (e.g table)", function() {

        var data = {
            nested:[
                {
                    totalArea:100,
                    percentApplied:40
                }
            ]
        };

        var model = new ecodata.forms.NestedExpressionViewModel({}, nestedExpressionDataModel, {}, {});
        model.loadData(data);

        expect(Number(model.data.nested()[0].affectedArea())).toEqual(40);
    });

    it("should support array based functions", function() {

        var data = {list:[
            {x:1, y:2}, {x:2, y:2}, {x:3, y:2}, {x:4, y:2}, {x:5, y:2}
        ]};

        var result = ecodata.forms.expressionEvaluator.evaluate("sum(list, 'x')", data);

        expect(result).toEqual("15.00");

        var result = ecodata.forms.expressionEvaluator.evaluate("count(list, 'x')", data);
        expect(result).toEqual(data.list.length+".00");

        var result = ecodata.forms.expressionEvaluator.evaluateBoolean("any(list, 'x > 4')", data);
        expect(result).toBeTruthy();

        var result = ecodata.forms.expressionEvaluator.evaluateBoolean("any(list, 'x > 5')", data);
        expect(result).toBeFalsy();

        var result = ecodata.forms.expressionEvaluator.evaluateBoolean("any(list, 'x < 1')", data);
        expect(result).toBeFalsy();

        var result = ecodata.forms.expressionEvaluator.evaluateBoolean("all(list, 'x > 4')", data);
        expect(result).toBeFalsy();

        var result = ecodata.forms.expressionEvaluator.evaluateBoolean("all(list, 'x >= 1')", data);
        expect(result).toBeTruthy();

        var result = ecodata.forms.expressionEvaluator.evaluateBoolean("none(list, 'x < 1')", data);
        expect(result).toBeTruthy();

        var result = ecodata.forms.expressionEvaluator.evaluateBoolean("none(list, 'x == 4')", data);
        expect(result).toBeFalsy();
    });

    it("should be able to manage type conversion of data items", function() {

        var data = {
            item1:"2200",
            item2:"2100"
        };
        var result = ecodata.forms.expressionEvaluator.evaluate("item1*item2", data);
        expect(result).toEqual("4620000.00");

        result = ecodata.forms.expressionEvaluator.evaluateBoolean("item1 > item2", data);
        expect(result).toBeTruthy();

        // This is the fallback for browsers that don't support Number.toFixed
        expect(ecodata.forms.utils.neat_number(2000.23, 2)).toEqual("2,000.23");
    });

    it("should be able to check if two numbers are within a certain percentage of each other", function() {
        var data = {
            value1:"1",
            value2:"2"
        };
        var expression = "within(value1, value2, 0.1)";
        var result = ecodata.forms.expressionEvaluator.evaluateBoolean(expression, data);

        expect(result).toBeFalsy();

        data.value1 = "2";
        result = ecodata.forms.expressionEvaluator.evaluateBoolean(expression, data);
        expect(result).toBeTruthy();

        data.value1 = "2.2";
        result = ecodata.forms.expressionEvaluator.evaluateBoolean(expression, data);
        expect(result).toBeTruthy();

        data.value1 = "2.2.1";
        result = ecodata.forms.expressionEvaluator.evaluateBoolean(expression, data);
        expect(result).toBeFalsy();

    });

    it("Should be able to sum the values of a field of an object in a list", function() {

        // We are using strings here as we store data as strings to avoid issues
        // floating point representation issues.
        var data  = {
            list:[
                {val:'1'},{val:'2'},{val:'3'},{val:'4'},{val:'5'},{val:'6'}
            ]
        };
        var result = ecodata.forms.expressionEvaluator.evaluate("sum(list, 'val')", data, 0);
        expect(result).toEqual(''+(1+2+3+4+5+6));

        data.list[0].val='e';
        result = ecodata.forms.expressionEvaluator.evaluate("sum(list, 'val')", data, 0);
        expect(result).toBeNaN();

    });

});