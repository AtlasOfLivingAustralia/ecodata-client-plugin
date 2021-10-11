package pages

import geb.Module

/*
 * Copyright (C) 2020 Atlas of Living Australia
 * All Rights Reserved.
 *
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 * 
 * Created by Temi on 20/4/20.
 */

class GeoMap extends Module {
    static content = {
    }

    def drawPolygon() {

        def polygonDraw = $('.leaflet-draw-draw-polygon')
        Thread.sleep(1000)
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
        waitFor 10, {$('.leaflet-draw-actions').getAt(0).displayed}

        moveAndClick(100, 100, 1)
        moveAndClick(200, -200, 2)
        moveAndClick(0, 100, 3)
        moveAndClick(50, 0, 4)

        interact {
            moveByOffset(-250, 100)
        }
        interact {
            doubleClick()
        }

        waitFor 10, { $("#locationCentroidLatitude").getAt(0).displayed }
    }

    def moveAndClick(int xOffset, int yOffset, int expectedCount) {
        // This call to cursorPosition seems to mostly just have the effect of a delay which is enough to make
        // everything work.  Probably needs to be improved.
        cursorPosition()
        interact { moveByOffset(xOffset, yOffset) }
        waitFor {
            interact { click() }

            markerCount() == expectedCount
        }
    }

    def cursorPosition() {
        println $('.leaflet-map-pane .leaflet-mouse-marker').css("transform")
    }

    def markerCount() {
        $('.leaflet-map-pane .leaflet-marker-icon.leaflet-editing-icon').size()
    }

    def drawLine() {

        def lineDraw = $('.leaflet-draw-draw-polyline')
        waitFor { lineDraw.displayed }

        // Wakeup the map (leaflet_sleep will be preventing interaction otherwise
        interact {
            moveToElement($('.leaflet-map-pane'))
        }

        interact {
            moveToElement(lineDraw)
        }

        lineDraw.click()

        waitFor{$('.leaflet-draw-actions').getAt(0).displayed}

        interact {
            moveByOffset(100, 100)
            click()

            moveByOffset(30, -30)
            click()

            moveByOffset(0, 30)
            click()

            moveByOffset(-30, 0)
            click()
            click()
        }

//        waitFor { $("#locationCentroidLatitude").getAt(0).displayed }
    }

    def drawMarker() {

        def markerDraw = $('.leaflet-draw-draw-marker')
        waitFor { markerDraw.displayed }

        // Wakeup the map (leaflet_sleep will be preventing interaction otherwise
        interact {
            moveToElement($('.leaflet-map-pane'))
        }

        interact {
            moveToElement(markerDraw)
        }

        markerDraw.click()

        waitFor{$('.leaflet-draw-actions').getAt(0).displayed}

        interact {
            moveByOffset(100, 100)
            click()
        }

//        waitFor { $("#locationLatitude").getAt(0).displayed }
    }

    def addCoordinatesManually() {

        def addBtn = $('.manual-point-add-btn')
        addBtn.click()

        waitFor{$('.manual-point-lng-input').getAt(0).displayed}
        $('.manual-point-lng-input').value(128)
        $('.manual-point-lat-input').value(-31)

        $('.manual-point-save-btn').click()
        waitFor{$('#locationLatitude').getAt(0).displayed}
    }

    def selectExistingSite() {

    }

    def ok() {

    }

    def cancel() {

    }
}
