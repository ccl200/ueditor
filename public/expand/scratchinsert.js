/**
 * scratch插件， 为UEditor提供Scratch插入支持
 * @file
 * @since 1.2.6.1
 */

UE.plugins['scratch'] = function (){
    var utils = UE.utils;
    var domUtils = UE.dom.domUtils;
    var me =this;

    /**
     * 创建插入scratch字符窜
     * @param url scatch地址
     * @param width scratch宽度
     * @param height scratch高度
     * @param align scratch对齐
     * @param type  类型
     * @param toEmbed 是否以flash代替显示
     * @param addParagraph  是否需要添加P 标签
     */
    function creatInsertScrach(url,width,height,id,align,classname,type){
        var str;
        switch(type){
            case "image":
                str = '<img ' + (id ? 'id="' + id+'"' : '') + ' width="'+ width +'" height="' + height + '" _url="'+url+'" class="' + classname.replace(/\bscrach-js\b/, '') + '"'  +
                    ' src="' + me.options.UEDITOR_HOME_URL+'themes/default/images/spacer.gif" style="background:url('+me.options.UEDITOR_HOME_URL+'themes/default/images/scratchlogo.png) no-repeat center center; border:1px solid gray;'+(align ? 'float:' + align + ';': '')+'" />';
                break;
            case "embed":
                var swf = UEDITOR_CONFIG.UEDITOR_HOME_URL+'expand/scratch.swf';
                var movie = {
                    project: url,
                    CuPlayerWidth:width,
                    CuPlayerHeight:height,
                    CuPlayerAutoPlay:true,
                    CuPlayerAutoRepeat:false,
                    CuPlayerShowControl:true,
                    CuPlayerAutoHideControl:false
                };
                var params = {
                    allowfullscreen: true,
                    quality:'high',
                    wmode:'transparent'
                };    
                id = Math.random();   
                var str = "<span class='"+classname+"' id='"+id+"' width='"+width+"' height='"+height+"' src='"+url+"' "+(align ? "style='float:"+align+"'" : "")+"><script type='text/javascript' src='"+UEDITOR_CONFIG.UEDITOR_HOME_URL+"expand/SWFobject.js' ></script>"
                        + "<script type='text/javascript'>"
                        + "var movie = "+JSON.stringify(movie)                       
                        + "; var params = "+JSON.stringify(params)
                        + "; swfobject.embedSWF('"+swf+"','"+id+"','"+width+"','"+height+"','9.0.0','expressInstall.swf', movie, params);</script></span>";
                break;
        }
        return str;
    }

    function switchImgAndScratch(root,img2scratch){
        utils.each(root.getNodesByTagName(img2scratch ? 'img' : 'span'),function(node){
            var className = node.getAttr('class');
            if(className && className.indexOf('edui-faked-scrach') != -1){
                var html = creatInsertScrach( img2scratch ? node.getAttr('_url') : node.getAttr('src'),node.getAttr('width'),node.getAttr('height'),null,node.getStyle('float') || '',className,img2scratch ? 'embed':'image');
                node.parentNode.replaceChild(UE.uNode.createElement(html),node);
            }
            if(className && className.indexOf('edui-upload-scrach') != -1){
                var html = creatInsertScrach( img2scratch ? node.getAttr('_url') : node.getAttr('src'),node.getAttr('width'),node.getAttr('height'),null,node.getStyle('float') || '',className,img2scratch ? 'embed':'image');
                node.parentNode.replaceChild(UE.uNode.createElement(html),node);
            }
        })
    }

    me.addOutputRule(function(root){
        switchImgAndScratch(root,true)
    });
    me.addInputRule(function(root){
        switchImgAndScratch(root)
    });

    me.commands["insertscratch"] = {
        execCommand: function (cmd, scratchObjs, type){
            scratchObjs = utils.isArray(scratchObjs)?scratchObjs:[scratchObjs];
            var html = [],id = 'tmpScratch', cl;
            for(var i=0,vi,len = scratchObjs.length;i<len;i++){
                vi = scratchObjs[i];
                cl = (type == 'upload' ? 'edui-upload-scrach scrach-js vjs-default-skin':'edui-faked-scrach');
                html.push(creatInsertScrach( vi.url, vi.width || 600,  vi.height || 450, id + i, null, cl, 'image'));
            }
            me.execCommand("inserthtml",html.join(""),true);
            var rng = this.selection.getRange();
            for(var i= 0,len=scratchObjs.length;i<len;i++){
                var img = this.document.getElementById('tmpScratch'+i);
                domUtils.removeAttributes(img,'id');
                rng.selectNode(img).select();
                me.execCommand('imagefloat',scratchObjs[i].align)
            }
        },
        queryCommandState : function(){
            var img = me.selection.getRange().getClosedNode(),
                flag = img && (img.className == "edui-faked-scrach" || img.className.indexOf("edui-upload-scrach")!=-1);
            return flag ? 1 : 0;
        }
    };
};