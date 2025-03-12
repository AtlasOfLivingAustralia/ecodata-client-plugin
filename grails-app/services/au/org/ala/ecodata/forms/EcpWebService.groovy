/*
 * Copyright (C) 2013 Atlas of Living Australia
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
 */

package au.org.ala.ecodata.forms

import au.org.ala.ws.tokens.TokenService
import com.fasterxml.jackson.databind.ObjectMapper
import grails.converters.JSON
import grails.core.GrailsApplication
import grails.web.http.HttpHeaders
import groovy.json.JsonSlurper
import groovy.util.logging.Slf4j
import okhttp3.*
import okio.BufferedSink
import org.apache.http.HttpStatus
import org.grails.web.converters.exceptions.ConverterException
import org.springframework.http.MediaType
import org.springframework.web.multipart.MultipartFile

import javax.annotation.PostConstruct
import javax.servlet.http.Cookie
import javax.servlet.http.HttpServletResponse
import java.util.concurrent.TimeUnit
/**
 * Helper class for invoking ecodata (and other Atlas) web services.
 */
@Slf4j
class EcpWebService {

    /** Use legacy ALA authorization header */
    static String AUTHORIZATION_HEADER_TYPE_API_KEY = 'apiKey'

    /** Use a bearer token obtained from the user login */
    static String AUTHORIZATION_HEADER_TYPE_USER_BEARER_TOKEN = 'userToken'

    /** Use the MERIT bearer token.  Do not use with non ALA systems */
    static String AUTHORIZATION_HEADER_TYPE_SYSTEM_BEARER_TOKEN = 'systemToken'

    /** A bearer token issued by an external system.  E.g. the BDR */
    static String AUTHORIZATION_HEADER_TYPE_EXTERNAL_TOKEN = 'externalToken'

    static String AUTHORIZATION_HEADER_TYPE_NONE = 'none'
    OkHttpClient client
    List WHITE_LISTED_DOMAINS = []

    TokenService tokenService
    @PostConstruct
    void init() {
        String whiteListed = grailsApplication.config.getProperty('app.domain.whiteList', "")
        WHITE_LISTED_DOMAINS = Arrays.asList(whiteListed.split(','))
        client = new OkHttpClient.Builder()
                .connectTimeout(connectTimeout(), TimeUnit.MILLISECONDS)
                .readTimeout(defaultTimeout(), TimeUnit.MILLISECONDS)
                .writeTimeout(defaultTimeout(), TimeUnit.MILLISECONDS)
                .build()
    }

    // Used to avoid a circular dependency during initialisation
    def getUserService() {
        return grailsApplication.mainContext.userService
    }

    GrailsApplication grailsApplication

    def get(String url, boolean includeUserId) {
        def conn = null
        try {
            conn = configureConnection(url, includeUserId)
            return responseText(conn)
        } catch (SocketTimeoutException e) {
            def error = [error: "Timed out calling web service. URL= ${url}."]
            log.error error.error
            return error
        } catch (SocketException se) {
            def resp = [error: "Socket connection closed. ${se.getMessage()} URL= ${url}."]
            log.warn resp.error
        } catch (Exception e) {
            def error = [error: "Failed calling web service. ${e.getClass()} ${e.getMessage()} URL= ${url}.",
                         statusCode: conn?.responseCode?:"",
                         detail: conn?.errorStream?.text]
            log.error error.error
            return error
        }
    }

    Map getString(String url, boolean includeAuth) {
        URLConnection conn = null
        Map resp = [:]
        try {
            conn = includeAuth ? configureConnection(url, true) : createAndConfigureConnection(url)
            resp.resp = responseText(conn)
            resp.statusCode = conn.responseCode
        } catch (SocketTimeoutException e) {
            resp.error = "Timed out calling web service. URL= ${url}."
            resp.statusCode = HttpStatus.CONNECTION_TIMED_OUT
            log.warn resp.error
        } catch (SocketException se) {
            resp.error = "Socket connection closed. ${se.getMessage()} URL= ${url}."
            log.warn resp.error
        } catch (Exception e) {
            resp = [error: "Failed calling web service. ${e.getClass()} ${e.getMessage()} URL= ${url}.",
                    statusCode: conn?.responseCode?:"",
                    detail: conn?.errorStream?.text]
            log.warn resp.error
        }
        resp
    }

    private int defaultTimeout() {
        grailsApplication.config.getProperty('webservice.readTimeout', Integer, 20000)
    }

    private int connectTimeout() {
        grailsApplication.config.getProperty('webservice.connectTimeout', Integer, 2000)
    }

    private URLConnection configureConnection(String url, boolean includeUserId, Integer timeout = null, boolean useToken = false) {
        useToken = useToken || useJWT()
        String authHeaderType = useToken ? AUTHORIZATION_HEADER_TYPE_SYSTEM_BEARER_TOKEN : AUTHORIZATION_HEADER_TYPE_API_KEY
        configureConnection(url, authHeaderType, timeout)
    }



    private URLConnection configureConnection(String url, String authorizationHeaderType, Integer timeout = null, String externalToken = null) {
        URLConnection conn = createAndConfigureConnection(url, timeout)
        boolean addUserId = false
        if(canAddSecret(url)) {
            if (authorizationHeaderType == AUTHORIZATION_HEADER_TYPE_USER_BEARER_TOKEN) {
                conn.setRequestProperty(HttpHeaders.AUTHORIZATION, getToken(true))
            } else if (authorizationHeaderType == AUTHORIZATION_HEADER_TYPE_SYSTEM_BEARER_TOKEN) {
                conn.setRequestProperty(HttpHeaders.AUTHORIZATION, getToken(false))
                addUserId = true
            }

            if (addUserId) {
                def user = getUserService().getUser()
                if (user) {
                    conn.setRequestProperty(grailsApplication.config.getProperty('app.http.header.userId'), user.userId)
                }
            }
        }
        else if (authorizationHeaderType == AUTHORIZATION_HEADER_TYPE_EXTERNAL_TOKEN) {
            if (!externalToken.startsWith("Bearer ")) {
                externalToken = "Bearer " + externalToken
            }
            conn.setRequestProperty(HttpHeaders.AUTHORIZATION, externalToken)
        }
        conn
    }

    private String getToken(boolean requireUser = false) {
        tokenService.getAuthToken(requireUser)?.toAuthorizationHeader()
    }

    private URLConnection createAndConfigureConnection(String url, Integer timeout = null) {
        URLConnection conn = new URL(url).openConnection()

        def readTimeout = timeout?:defaultTimeout()
        conn.setConnectTimeout(connectTimeout())
        conn.setReadTimeout(readTimeout)

        conn
    }

    def proxyGetRequest(HttpServletResponse response, String url, boolean includeUserId = true, boolean includeApiKey = false, Integer timeout = null) {
        String authHeaderType = includeApiKey ? AUTHORIZATION_HEADER_TYPE_SYSTEM_BEARER_TOKEN : AUTHORIZATION_HEADER_TYPE_NONE

        proxyGetRequest(response, url, authHeaderType, timeout)
    }

    def proxyGetRequest(HttpServletResponse response, String url, Map params, String authHeaderType, Integer timeout = null, String externalToken = null, Map extraHeaders = null) {
        url = url + buildUrlParamsFromMap(params)
        proxyGetRequest(response, url, authHeaderType, timeout, externalToken, extraHeaders)
    }

    /**
     * Proxies a request URL but doesn't assume the response is text based. (Used for proxying requests to
     * ecodata for excel-based reports)
     */
    def proxyGetRequest(HttpServletResponse response, String url, String authHeaderType, Integer timeout = null, String externalToken = null, Map extraHeaders = null) {

        def readTimeout = timeout?:defaultTimeout()
        HttpURLConnection conn = configureConnection(url, authHeaderType, readTimeout, externalToken)

        def headers = [HttpHeaders.CONTENT_DISPOSITION, HttpHeaders.CACHE_CONTROL, HttpHeaders.EXPIRES, HttpHeaders.LAST_MODIFIED, HttpHeaders.ETAG]
        def resp = [status:conn.responseCode]

        response.status = conn.responseCode
        response.setContentType(conn.getContentType())
        response.setContentLength(conn.getContentLength())
        if (conn.responseCode == 200) {
            response.setContentLength(conn.getContentLength())
            headers.each { header ->
                String headerValue = conn.getHeaderField(header)
                if (headerValue) {
                    response.setHeader(header, headerValue)
                }

            }
            extraHeaders?.each { header ->
                response.setHeader(header.key, header.value)
            }
            response.status = conn.responseCode

            response.outputStream << conn.inputStream
        }
        else {
            response.outputStream << conn.errorStream
        }
        return resp
    }

    /**
     * Proxies a request URL with post data but doesn't assume the response is text based. (Used for proxying requests to
     * ecodata for excel-based reports)
     */
    def proxyPostRequest(HttpServletResponse response, String url, Map postBody, boolean includeUserId = true, boolean includeApiKey = true, Integer timeout = null, boolean requireUserToken = false) {

        def charEncoding = 'utf-8'

        HttpURLConnection conn = configureConnection(url, includeUserId)

        def readTimeout = timeout?:defaultTimeout()
        conn.setConnectTimeout(connectTimeout())
        conn.setRequestProperty("Content-Type", "application/json;charset=${charEncoding}");
        conn.setRequestMethod("POST")
        conn.setReadTimeout(readTimeout)
        conn.setDoOutput ( true );

        if (canAddSecret(url)) {
            if (useJWT()) {
                addTokenHeader(conn, requireUserToken)
            }
            else if (includeApiKey) {
                conn.setRequestProperty("Authorization", grailsApplication.config.getProperty('api_key'))
            }
        }

        OutputStreamWriter wr = new OutputStreamWriter(conn.getOutputStream(), charEncoding)
        wr.write((postBody as JSON).toString())
        wr.flush()
        wr.close()

        def headers = [HttpHeaders.CONTENT_DISPOSITION]
        response.setContentType(conn.getContentType())
        response.setContentLength(conn.getContentLength())

        headers.each { header ->
            response.setHeader(header, conn.getHeaderField(header))
        }
        response.status = conn.responseCode

        // to make jqueryFiledownload plugin happy
        def cookie = new Cookie("filedownload","true")
        cookie.setPath("/")
        response.addCookie(cookie)

        response.outputStream << conn.inputStream
    }

    def get(String url) {
        return get(url, true)
    }

    def getJson(String url, Integer timeout = null) {
        def conn = null
        try {
            conn = configureConnection(url, true, timeout)
            def json = responseText(conn)
            return JSON.parse(json)
        } catch (ConverterException e) {
            def error = ['error': "Failed to parse json. ${e.getClass()} ${e.getMessage()} URL= ${url.encodeAsURL()}."]
            log.error error.error
            return error
        } catch (SocketTimeoutException e) {
            def error = [error: "Timed out getting json. URL= ${url.encodeAsURL()}."]
            return error
        } catch (ConnectException ce) {
            log.info "Exception class = ${ce.getClass().name} - ${ce.getMessage()}"
            def error = [error: "ecodata service not available. URL= ${url.encodeAsURL()}."]
            return error
        } catch (SocketException se) {
            def resp = [error: "Socket connection closed. ${se.getMessage()} URL= ${url}."]
            log.warn resp.error
        } catch (Exception e) {
            log.info "Exception class = ${e.getClass().name} - ${e.getMessage()}"
            def responseCode = conn?.responseCode?:""
            def error = [error: "Status $responseCode returned from ${url.encodeAsURL()}. Error: ${e.getMessage()}",
                         statusCode: responseCode,
                         detail: conn?.errorStream?.text.encodeAsHTML()]
            log.error error.error
            return error
        }
    }

    /**
     * This method is a replacement for getJson but is consistent in it's return type.
     * It will now always return a Map with a statusCode key and either a resp or error key depending on whether the
     * call succeeded.
     * getJson would just return the resp, which could be problematic if the resp was an array as the method would
     * either return an array if it succeeded or a Map if it did not.
     * It also uses the groovy JsonSlurper as it is more performant for large JSON files.  This may be problematic
     * if the returned data is being augmented and send to the client using 'as JSON'.
     *
     * @param url the URL to call.
     * @param timeout optional timeout on the call.
     * @return Map containing the status code (statusCode), optionally a response (resp) or an error (error).
     */
    Map getJson2(String url, Integer timeout = null) {
        HttpURLConnection conn = null
        Map result = null
        try {
            conn = configureConnection(url, true, timeout)

            String responseCharset = getCharset(conn)
            JsonSlurper parser = new JsonSlurper()
            def resp = parser.parse(conn.inputStream, responseCharset)
            result = [statusCode:conn.responseCode, resp:resp]

        } catch (ConverterException e) {
            def error = ['error': "Failed to parse json. ${e.getClass()} ${e.getMessage()} URL= ${url}."]
            log.error error.error
            result = [statusCode:conn?.responseCode, error:error]
        } catch (SocketTimeoutException e) {
            String error = "Timed out getting json. URL= ${url}."
            result = [statusCode:conn?.responseCode, error:error]
        } catch (SocketException se) {
            String error = "Socket connection closed. ${se.getMessage()} URL= ${url}."
            result = [statusCode:conn?.responseCode, error:error]
        } catch (ConnectException ce) {
            log.info "Exception class = ${ce.getClass().name} - ${ce.getMessage()}"
            String error = "ecodata service not available. URL= ${url}."
            result = [statusCode:conn?.responseCode, error:error]
        } catch (Exception e) {
            log.info "Exception class = ${e.getClass().name} - ${e.getMessage()}"
            def responseCode = conn?.responseCode?:""
            def error = [error: "Failed to get json from web service. ${e.getClass()} ${e.getMessage()} URL= ${url}.",
                         statusCode: conn?.responseCode?:"",
                         detail: conn?.errorStream?.text]
            log.error error.error
            result = error
        }
        result
    }

    Map getJson(String url, Map params, Integer timeout = null) {
        url = url + buildUrlParamsFromMap(params)

        getJson2(url, timeout)
    }

    private static String buildUrlParamsFromMap(Map map, String encoding = 'UTF-8') {
        if (!map) return ''
        def params = '?'
        map.eachWithIndex { k,v,i ->
            def vL = [v].flatten().findAll { it != null } // String[] and String both converted to List
            params += (i?'&':'') + k + '=' + vL.collect { URLEncoder.encode(String.valueOf(it), encoding) }.join("&${k}=")
        }
        params
    }


    String getCharset(urlConnection) {
        String charset = 'UTF-8' // default
        def contentType = urlConnection.getContentType()
        if (contentType) {
            MediaType mediaType = MediaType.parseMediaType(contentType)
            charset = (mediaType.charset)?mediaType.charset.toString():'UTF-8'
        }
        charset
    }

    /**
     * Reads the response from a URLConnection taking into account the character encoding.
     * @param urlConnection the URLConnection to read the response from.
     * @return the contents of the response, as a String.
     */
    def responseText(urlConnection) {
        return urlConnection.content.getText(getCharset(urlConnection))
    }

    def doPostWithParams(String url, Map params, boolean userToken = false) {
        def conn = null
        def charEncoding = 'utf-8'
        try {
            String query = ""
            boolean first = true
            for (String name:params.keySet()) {
                query+=first?"?":"&"
                first = false
                query+=name.encodeAsURL()+"="+params.get(name).encodeAsURL()
            }
            conn = new URL(url+query).openConnection()
            conn.setRequestMethod("POST")
            conn.setDoOutput(true)
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
            if(canAddSecret(url)) {
                if (useJWT())
                    addTokenHeader(conn, userToken)
                else
                    conn.setRequestProperty("Authorization", grailsApplication.config.getProperty('api_key'))
            }

            def user = getUserService().getUser()
            if (user) {
                conn.setRequestProperty(grailsApplication.config.getProperty('app.http.header.userId'), user.userId) // used by ecodata
                conn.setRequestProperty("Cookie", "ALA-Auth="+java.net.URLEncoder.encode(user.userName, charEncoding)) // used by specieslist
            }
            OutputStreamWriter wr = new OutputStreamWriter(conn.getOutputStream(), charEncoding)

            wr.flush()
            def resp = conn.inputStream.text
            wr.close()
            return [resp: JSON.parse(resp?:"{}"), statusCode: conn.responseCode] // fail over to empty json object if empty response string otherwise JSON.parse fails
        } catch (SocketTimeoutException e) {
            def error = [error: "Timed out calling web service. URL= ${url}.", statusCode: conn.responseCode]
            log.error(error as String, e)
            return error
        } catch (SocketException se) {
            def error = [error: "Socket connection closed. ${se.getMessage()} URL= ${url}.", statusCode: conn.responseCode]
            log.error(error as String, se)
            return error
        } catch (Exception e) {
            def responseCode = conn?.responseCode?:""
            def error = [error: "Status $responseCode returned from ${url}. Error: ${e.getMessage()}",
                         statusCode: responseCode,
                         detail: conn?.errorStream?.text]
            log.error(error as String, e)
            return error
        }
    }

    def doPost(String url, Map postBody, boolean useToken = false, boolean userToken = false) {
        useToken = useToken || useJWT()
        def conn = null
        def charEncoding = 'utf-8'
        try {
            conn = new URL(url).openConnection()
            conn.setDoOutput(true)
            conn.setRequestProperty("Content-Type", "application/json;charset=${charEncoding}");
            if (canAddSecret(url)) {
                if (useToken) {
                    addTokenHeader(conn, userToken)
                } else {
                    conn.setRequestProperty("Authorization", grailsApplication.config.getProperty('api_key'));
                }
            }
            def user = getUserService().getUser()
            if (user) {
                conn.setRequestProperty(grailsApplication.config.getProperty('app.http.header.userId'), user.userId) // used by ecodata
                conn.setRequestProperty("Cookie", "ALA-Auth="+java.net.URLEncoder.encode(user.userName, charEncoding)) // used by specieslist
            }


            OutputStreamWriter wr = new OutputStreamWriter(conn.getOutputStream(), charEncoding)
            wr.write((postBody as JSON).toString())
            wr.flush()
            def resp = conn.inputStream.text
            wr.close()
            return [resp: JSON.parse(resp?:"{}"), statusCode: conn.responseCode] // fail over to empty json object if empty response string otherwise JSON.parse fails
        } catch (SocketTimeoutException e) {
            def error = [error: "Timed out calling web service. URL= ${url}."]
            log.error(error as String, e)
            return error
        } catch (SocketException se) {
            def error = [error: "Socket connection closed. ${se.getMessage()} URL= ${url}."]
            log.error(error as String, se)
            return error
        } catch (Exception e) {
            def error = [error: "Failed calling web service. ${e.getMessage()} URL= ${url}.",
                         statusCode: conn?.responseCode?:"",
                         detail: conn?.errorStream?.text]
            log.error(error as String, e)
            return error
        }
    }

    def doDelete(String url, boolean useToken = false) {
        useToken = useToken || useJWT()
        if (!useToken) {
            url += (url.indexOf('?') == -1 ? '?' : '&') + "api_key=${grailsApplication.config.getProperty('api_key')}"
        }

        def conn = null
        try {
            conn = new URL(url).openConnection()
            conn.setRequestMethod("DELETE")
            if (canAddSecret(url)) {
                if (useToken) {
                    addTokenHeader(conn)
                } else {
                    conn.setRequestProperty("Authorization", grailsApplication.config.getProperty('api_key'))
                }
            }
            def user = getUserService().getUser()
            if (user) {
                conn.setRequestProperty(grailsApplication.config.getProperty('app.http.header.userId'), user.userId)
            }

            return conn.getResponseCode()
        } catch(Exception e){
            println e.message
            return 500
        } finally {
            if (conn != null){
                conn?.disconnect()
            }
        }
    }

    /**
     * Uses OkHttp3 to perform a POST request with multipart form data if file provided.
     * @param contentType
     * @param inputStream
     * @return
     */
    static RequestBody createRequestBody(final okhttp3.MediaType contentType, final InputStream inputStream) {
        return new RequestBody() {
            @Override
            okhttp3.MediaType contentType() {
                return contentType
            }

            @Override
            void writeTo(BufferedSink sink) throws IOException {
                try {
                    byte[] buffer = new byte[8192]; // 8KB buffer
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        sink.write(buffer, 0, bytesRead);
                    }
                }
                catch (Exception e) {
                    log.error("Error writing to sink: ${e.message}")
                }
                finally {
                    inputStream.close()
                }
            }
        }
    }

    /**
     * Uses OkHttp3 to perform a POST request with multipart form data if file provided.
     * @param url
     * @param params
     * @param fileBody
     * @param contentType
     * @param originalFilename
     * @param fileParamName
     * @param useToken
     * @param userToken
     * @return
     */
    Map postMultipart(String url, Map params, RequestBody fileBody,
                             String contentType, String originalFilename,
                             String fileParamName = 'files',
                             boolean useToken = false,
                             boolean userToken = false) {
        useToken = useToken || useJWT()
        Map result = [:]
        MultipartBody.Builder multipartBodyBuilder = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)

        // Add file part
        if (fileBody) {
            multipartBodyBuilder.addFormDataPart(fileParamName, originalFilename ?: fileParamName, fileBody)
        }

        // Add form fields
        params.each { key, value ->
            if (value) multipartBodyBuilder.addFormDataPart(key, value.toString())
        }

        // Build request
        Request.Builder requestBuilder = new Request.Builder()
                .url(url)
                .post(multipartBodyBuilder.build())


        // Add Authorization headers
        if (canAddSecret(url)) {
            if (useToken) {
                if (useJWT()) {
                    requestBuilder.addHeader("Authorization", getToken(userToken))
                } else {
                    requestBuilder.addHeader("apiKey", grailsApplication.config.getProperty('api_key'))
                }
            } else {
                requestBuilder.addHeader("Authorization", grailsApplication.config.getProperty('api_key'))
            }

            def user = userService.getUser()
            String userId = user.userId
            String userIdHeader = grailsApplication.config.getProperty('app.http.header.userId')
            if (user) {
                requestBuilder.addHeader(userIdHeader, userId)
            } else {
                log.warn("No user associated with request: ${url}")
            }
        }

        // Execute request
        try (Response response = client.newCall(requestBuilder.build()).execute()) {

            ResponseBody responseBody = response.body()
            okhttp3.MediaType respContentType = responseBody.contentType()
            String mediaType = respContentType.toString()?.toLowerCase()
            def responseData
            if (isTextBased(mediaType)) {
                responseData = responseBody.string()
                if (mediaType.contains('json')) {
                    ObjectMapper objectMapper = new ObjectMapper()
                    responseData = objectMapper.readValue(responseData, Object)
                }
            } else {
                responseData = responseBody.byteStream()
            }

            result.statusCode = result.status = response.code()
            result.details = result.resp = result.content = responseData
        } catch (Exception e) {
            result.statusCode = result.status = 500
            result.error = "Error POSTing to ${url}"
            result.details = e.message
        }

        return result
    }

    private static boolean isTextBased(String contentType) {
        if (!contentType) {
            log.error("Missing content type")
            return false
        }
        String contentTypeLower = contentType.toLowerCase()
        return contentTypeLower.contains('json') ||
                contentTypeLower.contains('text') ||
                contentTypeLower.contains('xml') ||
                contentTypeLower.contains('graphql')
    }

    /**
     * Forwards a HTTP multipart/form-data request to ecodata.
     * @param url the URL to forward to.
     * @param params the (string typed) HTTP parameters to be attached.
     * @param file the Multipart file object to forward.
     * @return [status:<request status>, content:<The response content from the server, assumed to be JSON>
     */
    Map postMultipart(String url, Map params, MultipartFile file, String fileParam = 'files', boolean useToken = false, boolean userToken = false) {
        try (InputStream inputStream = file.inputStream) {
            postMultipart(url, params, inputStream, file.contentType, file.originalFilename, fileParam, useToken, userToken)
        }
    }

    Map postMultipart(String url, Map params, InputStream inputStream, String contentType, String originalFilename, String fileParamName = 'files', boolean useToken = false, boolean userToken = false) {
        RequestBody fileBody = createRequestBody(okhttp3.MediaType.parse(contentType), inputStream)
        postMultipart(url, params, fileBody, contentType, originalFilename, fileParamName, useToken, userToken)
    }

    Map postMultipart(String url, Map params, File file, String contentType, String originalFilename, String fileParamName = 'files', boolean useToken = false, boolean userToken = false) {
        RequestBody fileBody = RequestBody.create(file, okhttp3.MediaType.parse(contentType))
        postMultipart(url, params, fileBody, contentType, originalFilename, fileParamName, useToken, userToken)
    }


    private void addTokenHeader(conn, boolean requireUser = false) {
        if (useJWT()) {
            conn.setRequestProperty("Authorization", getToken(requireUser))
        }
        else {
            conn.setRequestProperty("apiKey", grailsApplication.config.getProperty('api_key'));
        }
    }

    /**
     * Check if url is in the configured domain
     * @param url
     * @return
     */
    boolean canAddSecret(String url) {
        try {
            URL urlObj = new URL(url)
            String host = urlObj.getHost()
            return WHITE_LISTED_DOMAINS.find { host.endsWith(it) } != null
        } catch (Exception e) {
            log.error("Error parsing URL: ${url}")
        }

        return false
    }

    boolean useJWT() {
        grailsApplication.config.getProperty('ala.supports_jwt', Boolean.class, true)
    }
}
