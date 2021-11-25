package ecodata.client.plugin

import asset.pipeline.AssetPipelineConfigHolder
import au.org.ala.ecodata.forms.TemplateFileAssetResolver
import grails.plugins.GrailsPlugin
import grails.plugins.GrailsPluginManager
import grails.util.BuildSettings
import grails.util.Environment

class BootStrap {
    GrailsPluginManager pluginManager

    def init = { servletContext ->
        if (Environment.isDevelopmentMode()) {
            String pluginDir = '.'
            GrailsPlugin plugin = pluginManager.getGrailsPlugin('ecodata-client-plugin')
            if(!plugin.isBasePlugin()) {
                pluginDir = "${BuildSettings.BASE_DIR?.absolutePath}/../ecodata-client-plugin"
            }

            def templateFileAssetResolver = new TemplateFileAssetResolver('templates', "${pluginDir}/grails-app/assets/components", false, '/compile/ecodata-templates.js', '/template')
            AssetPipelineConfigHolder.resolvers.add(0, templateFileAssetResolver)
        }
    }
    def destroy = {
    }
}
