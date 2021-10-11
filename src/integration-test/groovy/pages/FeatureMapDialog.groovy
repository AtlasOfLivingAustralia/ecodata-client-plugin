package pages

import geb.Module

class FeatureMapDialog extends Module {
    static content = {
        map { module FeatureMap }
        ok {
            $("button.btn-primary")
        }
        cancel {
            $("button", "data-dismiss":"modal")
        }
    }
}
