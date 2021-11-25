package au.org.ala.ecodata.forms


import org.grails.web.servlet.mvc.GrailsWebRequest
import org.springframework.http.HttpStatus

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
 * Created by Temi on 4/6/20.
 */

class UserInfoService {
    def authService
    def webService, grailsApplication

    static String USER_NAME_HEADER_FIELD = "userName"
    static String AUTH_KEY_HEADER_FIELD = "authKey"

    /*
     * Get User details for the given user name and auth key.
     *
     * @param username username
     * @param key mobile auth key
     * @return userdetails
     *
     **/

    def Map getUserFromAuthKey(String username, String key) {
        String url = grailsApplication.config.mobile.auth.check.url
        Map params = [userName: username, authKey: key]
        def result = webService.doPostWithParams(url, params)

        if (result.statusCode == HttpStatus.OK.value() && result.resp?.status == 'success') {
            params = [userName: username]
            url = grailsApplication.config.userDetails.url + "userDetails/getUserDetails"
            result = webService.doPostWithParams(url, params)
            if (result.statusCode == HttpStatus.OK.value() && result.resp) {
                return ['displayName': "${result.resp.firstName} ${result.resp.lastName}", 'userName': result.resp.userName, 'userId': result.resp.userId]
            }
        } else {
            log.error ("Failed to get user details for parameters: ${params.toString()}")
            log.error (result.toString())
        }

        return null
    }

    /**
     * Get details of the current user either from CAS or lookup to user details server.
     * Authentication details are provide in header userName and authKey
     * @return Map with following key
     * ['displayName': "", 'userName': "", 'userId': ""]
     */
    def getCurrentUser() {
        def user

        // First, check if CAS can get logged in user details
        def userDetails = authService.userDetails()
        if (userDetails) {
            user = ['displayName': "${userDetails.firstName} ${userDetails.lastName}", 'userName': userDetails.userName, 'userId': userDetails.userId]
        }

        // Second, check if request has headers to lookup user details.
        if (!user) {
            GrailsWebRequest request = GrailsWebRequest.lookup()
            if (request) {
                String username = request.getHeader(UserInfoService.USER_NAME_HEADER_FIELD)
                String key = request.getHeader(UserInfoService.AUTH_KEY_HEADER_FIELD)
                if (username && key) {
                    user = getUserFromAuthKey(username, key)
                }
            }
        }

        user
    }

}
