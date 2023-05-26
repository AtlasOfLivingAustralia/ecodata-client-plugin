package au.org.ala.ecodata.forms

import au.org.ala.web.UserDetails
import org.grails.web.servlet.mvc.GrailsWebRequest
import org.pac4j.core.config.Config
import org.pac4j.core.context.WebContext
import org.pac4j.core.credentials.Credentials
import org.pac4j.core.util.FindBest
import org.pac4j.jee.context.JEEContextFactory
import au.org.ala.ws.security.client.AlaOidcClient
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

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
    @Autowired(required = false)
    Config config
    @Autowired(required = false)
    AlaOidcClient alaOidcClient

    static String USER_NAME_HEADER_FIELD = "userName"
    static String AUTH_KEY_HEADER_FIELD = "authKey"
    static String AUTHORIZATION_HEADER_FIELD = "Authorization"

    private static ThreadLocal<UserDetails> _currentUser = new ThreadLocal<UserDetails>()

    String getCurrentUserDisplayName() {
        _currentUser.get()?.displayName
    }

    UserDetails getCurrentUser() {
        return _currentUser.get()
    }

    /**
     * This method gets called by a filter at the beginning of the request (if a userId parameter is on the URL)
     * It sets the user details in a thread local for extraction by the audit service.
     * @param userId
     */
    UserDetails setCurrentUser() {
        UserDetails userDetails = getCurrentUser()
        if (!userDetails) {
            userDetails = getCurrentUserSupportedMethods()

            if (userDetails) {
                _currentUser.set(userDetails)
            } else {
                log.warn("Failed to get user details! No details set on thread local.")
            }
        }

        userDetails
    }

    def clearCurrentUser() {
        if (_currentUser) {
            _currentUser.remove()
        }
    }

    /**
     * Get User details for the given user name and auth key.
     *
     * @param username username
     * @param key mobile auth key
     * @return Map
     *
     **/
    UserDetails getUserFromAuthKey(String username, String key) {
        String url = grailsApplication.config.getProperty('mobile.auth.check.url')
        Map params = [userName: username, authKey: key]
        def result = webService.doPostWithParams(url, params)

        if (result.statusCode == HttpStatus.OK.value() && result.resp?.status == 'success') {
            return authService.getUserForEmailAddress(username, true)
        } else {
            log.error("Failed to get user details for parameters: ${params.toString()}")
            log.error(result.toString())
        }
    }

    /**
     * Get user from JWT.
     * @param authorizationHeader
     * @return
     */
    UserDetails getUserFromJWT(String authorizationHeader = null) {
        if((config == null) || (alaOidcClient == null))
            return

        GrailsWebRequest grailsWebRequest = GrailsWebRequest.lookup()
        HttpServletRequest request = grailsWebRequest.getCurrentRequest()
        HttpServletResponse response = grailsWebRequest.getCurrentResponse()
        if (!authorizationHeader)
            authorizationHeader = request?.getHeader(AUTHORIZATION_HEADER_FIELD)
        if (authorizationHeader?.startsWith("Bearer")) {
            final WebContext context = FindBest.webContextFactory(null, config, JEEContextFactory.INSTANCE).newContext(request, response)
            def optCredentials = alaOidcClient.getCredentials(context, config.sessionStore)
            if (optCredentials.isPresent()) {
                Credentials credentials = optCredentials.get()
                def optUserProfile = alaOidcClient.getUserProfile(credentials, context, config.sessionStore)
                if (optUserProfile.isPresent()) {
                    def userProfile = optUserProfile.get()
                    if(userProfile.userId) {
                        return authService.getUserForUserId(userProfile.userId)
                    }
                }
            }
        }
    }

    /**
     * Get details of the current user either from CAS or lookup to user details server.
     * Authentication details are provide in header userName and authKey
     * @return Map with following key
     * ['displayName': "", 'userName': "", 'userId': ""]
     */
    UserDetails getCurrentUserSupportedMethods() {
        def user

        // First, check if CAS can get logged in user details
        def userDetails = authService.userDetails()
        user = userDetails?:null

        // Second, check if request has headers to lookup user details.
        if (!user) {
            GrailsWebRequest request = GrailsWebRequest.lookup()
            if (request) {
                String authorizationHeader = request?.getHeader(AUTHORIZATION_HEADER_FIELD)
                String username = request.getHeader(UserInfoService.USER_NAME_HEADER_FIELD)
                String key = request.getHeader(UserInfoService.AUTH_KEY_HEADER_FIELD)

                if (authorizationHeader) {
                    user = getUserFromJWT(authorizationHeader)
                } else if (grailsApplication.config.getProperty("mobile.authKeyEnabled", Boolean) && username && key) {
                    user = getUserFromAuthKey(username, key)
                }
            }
        }

        user
    }

}
