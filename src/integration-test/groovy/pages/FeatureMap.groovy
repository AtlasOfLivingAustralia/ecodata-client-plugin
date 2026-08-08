package pages

import geb.Module

class FeatureMap extends Module {
    static content = {
    }

    def drawPolygon() {

        def polygonDraw = $("[title='Draw Polygons']")
        waitFor { polygonDraw.displayed }

        // Wakeup the map (leaflet_sleep will be preventing interaction otherwise
        interact {
            moveToElement($('.leaflet-map-pane'))
        }

        interact {
            moveToElement(polygonDraw)
        }

        polygonDraw.click()
        Thread.sleep(1000)
        waitFor 10, {$('[title="Draw Polygons"] .action-finish').getAt(0).displayed}

        interact {
            moveByOffset(200, 200)
        }

        interact {
            click()
            moveByOffset(20, 20)
            click()
            moveByOffset(-20, 20)
            click()

            moveByOffset(-20, -20)
            click()

            moveByOffset(20, -20)
            click()
            moveByOffset(20, 20)
            doubleClick()

        }
    }

    def deletePolygon() {
        def deleteButton = $("[title='Remove Layers']")
        waitFor { deleteButton.displayed }

        // Wakeup the map (leaflet_sleep will be preventing interaction otherwise
        interact {
            moveToElement($('.leaflet-map-pane'))
        }

        interact {
            moveToElement(deleteButton)
        }

        deleteButton.click()
        Thread.sleep(1000)
        waitFor 10, {$('[title="Remove Layers"] .action-finishMode').getAt(0).displayed}

        // how to get above drawn polygon?
        interact {
            def polygon = $('.leaflet-interactive')
            moveToElement(polygon.getAt(0))
        }

        interact {
            click()
        }

    }

    def numberOfInteractiveElementsOnMap() {
        def sitesNameEditorButton = $("#map-modal .leaflet-interactive")
        return sitesNameEditorButton.size()
    }

    def selectExistingSite() {

    }

    def ok() {

    }

    def cancel() {

    }
}
