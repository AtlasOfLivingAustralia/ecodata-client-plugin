package pages

import geb.Page
import geb.navigator.Navigator
import grails.converters.JSON

import java.time.LocalDate
import java.time.format.DateTimeFormatter

class PreviewPage extends Page {
    static url = "preview"

    static at = {
        waitFor {js.modelReady == true}
        title.startsWith("Preview")
    }

    static content = {
        featureMapDialog { module FeatureMapDialog }
        geoMap { module GeoMap}
        multiInput(required: false) { module MultiInput }
    }

    Map getModel() {
        waitFor {js.modelReady == true}
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

    Navigator findValidationElementForModelName(String name) {
        Navigator modelField = findFieldByModelName(name)
        String id = modelField.getAttribute("id")

        Navigator validation = $("."+id+"formError")
        validation
    }

    Navigator findFeatureMapButtonByModelName(String name) {
        $("[params*="+name+"]").find("button")
    }

    Navigator findById(String name) {
        $("#"+name)
    }

    Navigator findByDataAttribute(String name) {
        $("[data-bind*="+name+"]")
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

    boolean isWarningDisplayed(String warning) {
        waitFor {
            $('.popover.warning .popover-body').getAttribute('innerText') == warning
        }
    }

    boolean noWarningDisplayed() {
        waitFor {
            $('.popover.warning').size() == 0
        }
    }

    void addTableRow(String modelName) {
        $("button[data-bind*='click:"+modelName+".addRow']").click()
    }

}
