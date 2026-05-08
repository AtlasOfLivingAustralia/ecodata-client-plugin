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
            moveByOffset(100, 100)
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

    def selectExistingSite() {

    }

    def ok() {

    }

    def cancel() {

    }
}
