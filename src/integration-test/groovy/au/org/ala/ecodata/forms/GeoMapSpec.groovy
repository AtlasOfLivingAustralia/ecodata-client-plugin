package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import grails.testing.mixin.integration.Integration
import pages.PreviewPage

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
 * Created by Temi on 19/4/20.
 */

@Integration
class GeoMapSpec extends GebReportingSpec {
    def "GeoMap smoke test" () {
        when:
        to ([name:'geoMapModel'], PreviewPage)

        then:
        title == "Preview GeoMap test"

        when:
        waitFor { page.geoMap.displayed }

        then:
        page.geoMap.displayed == true
        page.findById("siteLocation").size() == 1
        page.findById("siteLocation").find("option").size() == 2;

        when:
        page.geoMap.drawPolygon()

        then:
        page.findById("locationLatitude").displayed == false
        page.findById("locationLongitude").displayed == false
        page.findById("locationCentroidLatitude").displayed == true
        page.findById("locationCentroidLongitude").displayed == true

        when:
        page.geoMap.drawLine()

        then:
        page.findById("locationLatitude").displayed == false
        page.findById("locationLongitude").displayed == false
        page.findById("locationCentroidLatitude").displayed == true
        page.findById("locationCentroidLongitude").displayed == true

        when:
        page.geoMap.drawMarker()

        then:
        Thread.sleep(8000)
        waitFor 10, {
            page.findById("locationLatitude").displayed == true
            page.findById("locationLongitude").displayed == true
            page.findById("locationCentroidLatitude").displayed == false
            page.findById("locationCentroidLongitude").displayed == false
        }
        when:
        page.geoMap.addCoordinatesManually()

        then:
        page.findById("locationLatitude").displayed == true
        page.findById("locationLongitude").displayed == true
        page.findById("locationLatitude").value() == "-31"
        page.findById("locationLongitude").value() == "128"
    }
}
