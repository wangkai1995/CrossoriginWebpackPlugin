var HtmlWebpackPlugin = require('html-webpack-plugin')
const SourceMapSource = require("webpack-sources").SourceMapSource

class CrossoriginWebpackPlugin {
    constructor(options) {
        this.options = options || {
            crossorigin: 'anonymous',
            runtimeNameReg: /^runtime/ig,
        }
    }

    apply(compiler) {
        // Hook into the html-webpack-plugin processing  4.0.0--alphaXXX 如果使用了template 会有问题,暂时
        if (HtmlWebpackPlugin && HtmlWebpackPlugin.getHooks) {
            // HtmlWebpackPlugin 4 
            HtmlWebpackPlugin.getHooks(compiler).alterAssetTags.tapAsync('CrossoriginWebpackPlugin', this._addAttributeToScripts.bind(this))
            //run time load
            compiler.hooks.compilation.tap('CrossoriginWebpackPlugin', compilation => {
                compilation.hooks.optimizeChunkAssets.tapAsync("CrossoriginWebpackPlugin", (chunks,callback)=>{
                    this._addRuntimeLoadScript(compilation,chunks,callback)
                })
            })
        } else if (compiler.hooks) {
            // HtmlWebpackPlugin 3
            compiler.hooks.compilation.tap('CrossoriginWebpackPlugin', compilation => {
                if(compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync){
                    compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync('CrossoriginWebpackPlugin', this._addAttributeToScripts.bind(this))
                }
            })
            //run time load
            compiler.hooks.compilation.tap('CrossoriginWebpackPlugin', compilation => {
                compilation.hooks.optimizeChunkAssets.tapAsync("CrossoriginWebpackPlugin", (chunks,callback)=>{
                    this._addRuntimeLoadScript(compilation,chunks,callback)
                })
            })
        } else {
            // HtmlWebpackPlugin 2
            compiler.plugin('compilation', compilation => {
                compilation.plugin(
                    'html-webpack-plugin-alter-asset-tags',
                    this._addAttributeToScripts.bind(this)
                )
            })
            //run time load
            compiler.plugin('compilation',(compilation)=>{
                compilation.plugin("optimize-chunk-assets", (chunks,callback)=>{
                    this._addRuntimeLoadScript(compilation,chunks,callback)
                })
            })
        }

    }

    _addAttributeToScripts(htmlPluginData, callback) {
        htmlPluginData.head.filter(tag => tag.tagName === 'script').forEach(script => (script.attributes.crossorigin = this.options.crossorigin))
        htmlPluginData.body.filter(tag => tag.tagName === 'script').forEach(script => (script.attributes.crossorigin = this.options.crossorigin))
        callback(null, htmlPluginData)
    }

    _addRuntimeLoadScript(compilation,chunks,callback){
        const { runtimeNameReg } = this.options
        for (const chunk of chunks) {
            //runtime
            if(runtimeNameReg.test(chunk.name)){
                var file = chunk.files[0]
                var asset = compilation.assets[file];
                if(!asset){
                    return false
                }
                var { source, map } = asset.sourceAndMap();
                var newSource = source.replace(`script.charset = 'utf-8';`,`script.charset = 'utf-8';script.crossOrigin = 'anonymous';`);
                compilation.assets[file] = new SourceMapSource(
                    newSource,
                    file,
                    map
                )
            }
        }
        callback();
    }

}




module.exports = CrossoriginWebpackPlugin



