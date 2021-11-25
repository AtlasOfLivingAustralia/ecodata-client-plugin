package au.org.ala.ecodata.forms

import geb.spock.GebReportingSpec
import pages.PreviewPage

/*
 * Copyright (C) 2019 Atlas of Living Australia
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
 * Created by Temi on 26/11/19.
 */

class MultiInputSpec extends GebReportingSpec{
    def "multi input tests"() {
        when:
        to ([name: 'multiInputModel'], PreviewPage)

        then:
        title == "Preview MultiInput View Type Example"

        when:
        waitFor{ page.multiInput.displayed }
        page.multiInput.addItem.click()

        then:
        page.multiInput.inputItem.displayed == true
        page.multiInput.inputItem.size() == 1

        when:
        page.multiInput.removeItem.click()

        then:
        page.multiInput.inputItem.displayed == false
    }
}
