package ecodata.client.plugin

import grails.plugins.Plugin

class EcodataClientPluginGrailsPlugin extends Plugin {
    // Version is owned by build.gradle / the published artifact coordinates.
    // the version or versions of Grails the plugin is designed for
    def grailsVersion = "7.1.1 > *"
    // resources that are excluded from plugin packaging
    def pluginExcludes = [
        "grails-app/views/error.gsp"
    ]

    def title = "Ecodata Client Plugin"
    def author = "ALA"
    def authorEmail = ""
    def description = '''\
Grails plugin that generates data entry forms from a metadata definition.
'''

    def documentation = "https://github.com/AtlasOfLivingAustralia/ecodata-client-plugin"

    def doWithSpring = {
    }

    def doWithDynamicMethods = { ctx ->
    }

    def doWithApplicationContext = { ctx ->
    }

    def onChange = { event ->
    }

    def onConfigChange = { event ->
    }

    def onShutdown = { event ->
    }
}
