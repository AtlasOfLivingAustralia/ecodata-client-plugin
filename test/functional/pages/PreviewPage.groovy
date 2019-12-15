package pages

import geb.Page
import geb.navigator.Navigator
import grails.converters.JSON

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

class PreviewPage extends Page {
    static url = "preview"

    static at = {
        waitFor{js.modelReady == true}
        title.startsWith("Preview")
    }

    static content = {
        featureMapDialog { module FeatureMapDialog }
        multiInput(required: false) { module MultiInput }
    }

    Map getModel() {
        waitFor{js.modelReady == true}
        String json = js.exec("return model.modelAsJSON();")

        JSON.parse(json)
    }

    Navigator findFieldByModelName(String name) {
        Navigator fields = $("input[data-bind*="+name+"]")
        if (fields.size() == 0) {
            fields = $("select[data-bind*="+name+"]")
        }
        if (fields.size() == 0) {
            fields = $("[data-bind*="+name+"]")
        }
        fields

    }

    Navigator findFeatureMapButtonByModelName(String name) {
        $("[params*="+name+"]").find("button")
    }

    void commitEdits() {
        // Tab out of current edit so the model updates.
        $("h3").first().click()
    }

    def enterDate(String name, String dateString) {
        Navigator nav = findFieldByModelName(name)
        nav.value(dateString)

        LocalDate dateTime = LocalDate.parse(dateString, DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        long millis = dateTime.toEpochDay() * 24 * 60 * 60 * 1000
        def selector = $('td.day[data-date*="'+millis+'"]')
        waitFor {
            selector.displayed
        }

        interact {
            moveToElement(selector)
            // 2 clicks are necessary as the input element has focus due to the way we entered data into
            // the input field to trigger the popup.
            click()
            click()
        }
    }

}
