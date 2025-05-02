package au.org.ala.ecodata.forms

import au.org.ala.web.UserDetails
import org.grails.web.servlet.mvc.GrailsWebRequest
import org.pac4j.core.adapter.FrameworkAdapter
import org.pac4j.core.config.Config
import org.pac4j.core.context.CallContext
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.pac4j.core.credentials.TokenCredentials
import org.pac4j.http.client.direct.DirectBearerAuthClient
import org.pac4j.jee.context.JEEFrameworkParameters
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
    def ecpWebService, grailsApplication
    @Autowired(required = false)
    Config config
    @Autowired(required = false)
    DirectBearerAuthClient alaOidcClient


    static String USER_NAME_HEADER_FIELD = "userName"
    static String AUTH_KEY_HEADER_FIELD = "authKey"
    static String AUTHORIZATION_HEADER_FIELD = "Authorization"

    private static ThreadLocal<UserDetails> _currentUser = new ThreadLocal<UserDetails>()

    String getCurrentUserDisplayName() {
        getCurrentUser()?.displayName
    }

    UserDetails getCurrentUser() {
        _currentUser.get()
    }

    /**
     * This method gets called by a filter at the beginning of the request (if a userId parameter is on the URL)
     * It sets the user details in a thread local for extraction by the audit service.
     * @param userId
     */
    UserDetails setCurrentUser() {
        clearCurrentUser()
        UserDetails userDetails = getCurrentUserFromSupportedMethods()

        if (userDetails) {
            _currentUser.set(userDetails)
        } else {
            log.warn("Failed to get user details! No details set on thread local.")
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
        def result = ecpWebService.doPostWithParams(url, params)

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
        try {
            GrailsWebRequest grailsWebRequest = GrailsWebRequest.lookup()
            HttpServletRequest request = grailsWebRequest.getCurrentRequest()
            HttpServletResponse response = grailsWebRequest.getCurrentResponse()
            if (!authorizationHeader)
                authorizationHeader = request?.getHeader(AUTHORIZATION_HEADER_FIELD)
            if (authorizationHeader?.startsWith("Bearer")) {
                def params = new JEEFrameworkParameters(request, response)

                FrameworkAdapter.INSTANCE.applyDefaultSettingsIfUndefined(config)
                final WebContext context = config.getWebContextFactory().newContext(params)
                final SessionStore sessionStore = config.getSessionStoreFactory().newSessionStore(params)
                final callContext = new CallContext(context, sessionStore, config.profileManagerFactory)

                def credentials = alaOidcClient.getCredentials(callContext).orElse(null)
                credentials = alaOidcClient.validateCredentials(callContext, credentials).orElse(null)
                if (credentials && credentials instanceof TokenCredentials) {
                    def userProfile = credentials.userProfile

                    String userId = userProfile?.getAttribute(grailsApplication.config.getProperty('userProfile.userIdAttribute'))
//                    String userId = userProfile?.getAttribute("username")
                    if (userId) {
                        return authService.getUserForUserId(userId)
                    }
                }

            }
        } catch (Throwable e) {
            log.error("Failed to get user details from JWT", e)
            return
        }
    }

    /**
     * Get details of the current user either from CAS or lookup to user details server.
     * Authentication details are provide in header userName and authKey
     * @return UserDetails
     */
    UserDetails getCurrentUserFromSupportedMethods() {
        def user

        // First, check if CAS can get logged in user details
        def userDetails = authService.userDetails()
        user = userDetails?:null

        // Second, check if request has headers to lookup user details.
        if (!user) {
            try {
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
            } catch (Throwable e) {
                log.error("Failed to get user details from JWT or API key", e)
            }
        }

        user
    }

}
