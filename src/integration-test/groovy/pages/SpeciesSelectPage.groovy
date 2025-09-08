package pages

import geb.Page
import geb.navigator.Navigator

class SpeciesSelectPage extends Page {
    static url = "preview"
    static at = {
        waitFor {js.modelReady == true}
        title == "Preview Species example"
    }

    static content = {
        viewSpeciesField(required: false) {  }
        speciesSelectField(required: false) { $("select[data-bind*='speciesSelect']") }
    }

    Navigator getSelectedSpecies() {
        $("span[data-bind*='text:name']")
    }

    Navigator getSelectedSpeciesOnSelect2() {
        $("span.select2-selection__rendered")
    }

    Navigator getSelect2() {
        $("span.select2")
    }


}
