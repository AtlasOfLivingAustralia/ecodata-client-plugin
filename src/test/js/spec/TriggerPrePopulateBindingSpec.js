describe("triggerPrePopulate binding handler Spec", function () {

    var mockElement;
    beforeEach(function () {
        jasmine.clock().install();

        mockElement = document.createElement('input');
        document.body.appendChild(mockElement);

    });

    afterEach(function () {
        jasmine.clock().uninstall();
        document.body.removeChild(mockElement);
    });

    it("should add the score class and a tooltip to the element", function () {
        var metadata = {
            name:'item',
            dataType:'number',
            behaviour: [
                {
                    type:"pre_populate",
                    config: {
                        source: {
                            "context-path":"test"
                        },
                        target: {
                            name:"item2"
                        }

                    }
                }
            ]
        };
        var context = {
            test: {
                val1:"1",
                item3: "3"
            }
        };
        var config = {};
        var dataItem = ko.observable().extend({metadata:{metadata:metadata, context:context, config:config}});


        var model = {
            item:dataItem,
            item2: {
                load:function(data) {
                   this.item3(data.item3);
                },
                item3:ko.observable()
            }
        }
        $(mockElement).attr('data-bind', 'triggerPrePopulate:item');
        ko.applyBindings(model, mockElement);

        dataItem(3); // trigger a change to the observable
        jasmine.clock().tick(10);

        expect(model.item2.item3()).toEqual("3");

    });
});