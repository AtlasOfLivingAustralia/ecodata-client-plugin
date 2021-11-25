package pages

import geb.Module

class MultiInput extends Module {
    static content = {
        addItem(required: true) { $("multi-input i.fa-plus.fa") }
        inputItem(required: false) { $("multi-input input") }
        removeItem(required: false) { $("multi-input span.add-on") }
    }
}