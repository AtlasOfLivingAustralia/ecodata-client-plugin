package ecodata.client.plugin

class UrlMappings {

    static mappings = {
        "/$controller/$action?/$id?(.$format)?"{
            constraints {
                // apply constraints here
            }
        }
        "/preview" {
            controller = 'preview'
            action = [GET: 'index', POST: 'model']
        }
        "/preview/imagePreview/$id" {
            controller = 'preview'
            action = 'imagePreview'
        }
        "/" {
            controller = 'preview'
            action = [GET: 'index', POST: 'model']
        }
        "500"(view:'/error')
    }
}
