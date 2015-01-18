(function(){
	var scratch = {},
		uploadScratchList = [],
		isModifyUploadScratch = false,
		uploadFile;

	window.onload = function(){
		//$focus($G(""));
		initTabs();
		initUpload();
		initScratch();
	};

	//初始化tab
	function initTabs(){
		var $tabs = $('#tabHeads').children();
		var bodyIds = [];
		$tabs.each(function(index,element){
			bodyIds.push(element.getAttribute('data-content-id'));
		});

		$tabs.each(function(index,element){
			var bodyId = element.getAttribute('data-content-id');
			$(element).on('click',function(){
				for(var i = 0 ; i < bodyIds.length; i++){
					$('#'+bodyIds[i]).removeClass('focus');
				}
				$tabs.removeClass('focus');
				
				$(this).addClass('focus');
				$('#'+bodyId).addClass('focus');
                //
                if($('#list').hasClass('focus')){
                   listScratch =  new ListScratch('fileList');
                }			
			});
		});
	}
    /*在线Scratch*/
    function ListScratch(target){
        this.container = document.getElementById(target);
        this.init();
    }

    ListScratch.prototype = {
        init: function () {
            this.initContainer();
            this.initEvents();
            this.initData();
        },
        /* 初始化容器 */
        initContainer: function () {
            this.container.innerHTML = '';
            this.list = document.createElement('ul');
            this.clearFloat = document.createElement('li');

            domUtils.addClass(this.list, 'list');
            domUtils.addClass(this.clearFloat, 'clearFloat');

            this.list.appendChild(this.clearFloat);
            this.container.appendChild(this.list);
        },
        /* 初始化滚动事件,滚动到地步自动拉取数据 */
        initEvents: function () {
            var _this = this;

            /* 滚动拉取图片 */
            domUtils.on($G('fileList'), 'scroll', function(e){
                var panel = this;
                if (panel.scrollHeight - (panel.offsetHeight + panel.scrollTop) < 10) {
                    _this.getFileData();
                }
            });
            /* 选中图片 */
            domUtils.on(this.list, 'click', function (e) {
                var target = e.target || e.srcElement,
                    li = target.parentNode;

                if (li.tagName.toLowerCase() == 'li') {
                    if (domUtils.hasClass(li, 'selected')) {
                        domUtils.removeClasses(li, 'selected');
                    } else {
                        domUtils.addClass(li, 'selected');
                    }
                }
            });
        },
        /* 初始化第一次的数据 */
        initData: function () {

            /* 拉取数据需要使用的值 */
            this.state = 0;
            this.listSize = editor.getOpt('scratchManagerListSize');
            this.listIndex = 0;
            this.listEnd = false;

            /* 第一次拉取数据 */
            this.getFileData();
        },
        /* 向后台拉取图片列表数据 */
        getFileData: function () {
            var _this = this;

            if(!_this.listEnd && !this.isLoadingData) {
                this.isLoadingData = true;
                ajax.request(editor.getActionUrl(editor.getOpt('scratchManagerActionName')), {
                    timeout: 100000,
                    data: utils.extend({
                            start: this.listIndex,
                            size: this.listSize
                        }, editor.queryCommandValue('serverparam')),
                    method: 'get',
                    onsuccess: function (r) {
                        try {
                            var json = eval('(' + r.responseText + ')');
                            if (json.state == 'SUCCESS') {
                                _this.pushData(json.list);
                                _this.listIndex = parseInt(json.start) + parseInt(json.list.length);
                                if(_this.listIndex >= json.total) {
                                    _this.listEnd = true;
                                }
                                _this.isLoadingData = false;
                            }
                        } catch (e) {
                            if(r.responseText.indexOf('ue_separate_ue') != -1) {
                                var list = r.responseText.split(r.responseText);
                                _this.pushData(list);
                                _this.listIndex = parseInt(list.length);
                                _this.listEnd = true;
                                _this.isLoadingData = false;
                            }
                        }
                    },
                    onerror: function () {
                        _this.isLoadingData = false;
                    }
                });
            }
        },
        /* 添加图片到列表界面上 */
        pushData: function (list) {
            var i, item, img, filetype, preview, icon, _this = this,
                urlPrefix = editor.getOpt('scratchManagerUrlPrefix');
            for (i = 0; i < list.length; i++) {
                if(list[i] && list[i].url) {
                    item = document.createElement('li');
                    icon = document.createElement('span');
                    filetype = list[i].url.substr(list[i].url.lastIndexOf('.') + 1);

                    if ( "png|jpg|jpeg|gif|bmp".indexOf(filetype) != -1 ) {
                        preview = document.createElement('img');
                        domUtils.on(preview, 'load', (function(image){
                            return function(){
                                _this.scale(image, image.parentNode.offsetWidth, image.parentNode.offsetHeight);
                            };
                        })(preview));
                        preview.width = 113;
                        preview.setAttribute('src', urlPrefix + list[i].url + (list[i].url.indexOf('?') == -1 ? '?noCache=':'&noCache=') + (+new Date()).toString(36) );
                    } else {
                        var ic = document.createElement('i'),
                            textSpan = document.createElement('span');
                        textSpan.innerHTML = list[i].url.substr(list[i].url.lastIndexOf('/') + 1);
                        preview = document.createElement('div');
                        preview.appendChild(ic);
                        preview.appendChild(textSpan);
                        domUtils.addClass(preview, 'file-wrapper');
                        domUtils.addClass(textSpan, 'file-title');
                        domUtils.addClass(ic, 'file-type-' + filetype);
                        domUtils.addClass(ic, 'file-preview');
                    }
                    domUtils.addClass(icon, 'icon');
                    item.setAttribute('data-url', urlPrefix + list[i].url);
                    if (list[i].original) {
                        item.setAttribute('data-title', list[i].original);
                    }

                    item.appendChild(preview);
                    item.appendChild(icon);
                    this.list.insertBefore(item, this.clearFloat);
                }
            }
        },
        /* 改变图片大小 */
        scale: function (img, w, h, type) {
            var ow = img.width,
                oh = img.height;

            if (type == 'justify') {
                if (ow >= oh) {
                    img.width = w;
                    img.height = h * oh / ow;
                    img.style.marginLeft = '-' + parseInt((img.width - w) / 2) + 'px';
                } else {
                    img.width = w * ow / oh;
                    img.height = h;
                    img.style.marginTop = '-' + parseInt((img.height - h) / 2) + 'px';
                }
            } else {
                if (ow >= oh) {
                    img.width = w * ow / oh;
                    img.height = h;
                    img.style.marginLeft = '-' + parseInt((img.width - w) / 2) + 'px';
                } else {
                    img.width = w;
                    img.height = h * oh / ow;
                    img.style.marginTop = '-' + parseInt((img.height - h) / 2) + 'px';
                }
            }
        },
        getInsertList: function () {
            var i, lis = this.list.children, list = [];
            for (i = 0; i < lis.length; i++) {
                if (domUtils.hasClass(lis[i], 'selected')) {
                    var url = lis[i].getAttribute('data-url');
                    var title = lis[i].getAttribute('data-title') || url.substr(url.lastIndexOf('/') + 1);
                    list.push({
                        title: title,
                        url: url
                    });
                }
            }
            return list;
        }
    };


	function initScratch(){
        createAlignButton( ["upload_alignment"] );
		addOkListener();
	}

	function addOkListener(){
		dialog.onok = function(){
			var currentTab = $('#tabHeads').find('.focus').attr('tabSrc');
			switch(currentTab){
				case "upload":
					return insertUpload();
					break;
                case "list":
                    return insertList();
                    break;
			}
		};
		dialog.oncancel = function(){
			var uploadDir = editor.getOpt('scratchUrlPrefix');
		}
	}



    /**
     * 找到id下具有focus类的节点并返回该节点下的某个属性
     * @param id
     * @param returnProperty
     */
    function findFocus( id, returnProperty ) {
        var tabs = $G( id ).children,
                property;
        for ( var i = 0, ci; ci = tabs[i++]; ) {
            if ( ci.className=="focus" ) {
                property = ci.getAttribute( returnProperty );
                break;
            }
        }
        return property;
    }

    /**
  * 创建图片浮动选择按钮
  * @param ids
  */
    function createAlignButton( ids ) {
         for ( var i = 0, ci; ci = ids[i++]; ) {
             var floatContainer = document.getElementById(ci),
                     nameMaps = {"none":lang['default'], "left":lang.floatLeft, "right":lang.floatRight, "center":lang.block};
             for ( var j in nameMaps ) {
                 var div = document.createElement( "div" );
                 div.setAttribute( "name", j );
                 if ( j == "none" ) div.className="focus";
                 div.style.cssText = "background:url(images/" + j + "_focus.jpg);";
                 div.setAttribute( "title", nameMaps[j] );
                 floatContainer.appendChild( div );
             }
             switchSelect( ci );
         }
     }
         /**
     * 依据传入的align值更新按钮信息
     * @param align
     */
    function updateAlignButton( align ) {
        var aligns = $G( "videoFloat" ).children;
        for ( var i = 0, ci; ci = aligns[i++]; ) {
            if ( ci.getAttribute( "name" ) == align ) {
                if ( ci.className !="focus" ) {
                    ci.className = "focus";
                }
            } else {
                if ( ci.className =="focus" ) {
                    ci.className = "";
                }
            }
        }
    }
    /**
     * 选择切换
     * @param selectParentId
     */
    function switchSelect( selectParentId ) {
        var selects = $G( selectParentId ).children;
        for ( var i = 0, ci; ci = selects[i++]; ) {
            domUtils.on( ci, "click", function () {
                for ( var j = 0, cj; cj = selects[j++]; ) {
                    cj.className = "";
                    cj.removeAttribute && cj.removeAttribute( "class" );
                }
                this.className = "focus";
            } )
        }
    }

	//插入上传的Scratch
	function insertUpload(){
		var count = uploadFile.getQueueCount();
        var uploadDir = editor.getOpt('videoUrlPrefix'),
            width = $('#upload_width').value || 600,
            height = $('#upload_height').value || 450,
            align = findFocus("upload_alignment","name") || 'none';
		if(count){
			$('.info', '#queueList').html('<span style="color:red;">' + '还有2个未上传文件'.replace(/[\d]/, count) + '</span>');
        	return false;
		}else{
			for(var key in uploadScratchList){
				var file = uploadScratchList[key];
                    file.width = width;
                    file.height = height;
                    file.align = align;
				editor.execCommand('insertscratch',file);
			}

		}
	}

    /*插入在线Scratch*/
    function insertList(){
        var list = listScratch.getInsertList();
        editor.execCommand('insertscratch',list);
    }

	var lang = {
        'floatLeft':"左浮动",
        'floatRight':"右浮动",
        '"default"':"默认",
        'block':"独占一行",

		'uploadSelectFile':'点击选择Scratch',
        'uploadAddFile':'继续添加',
        'uploadStart':'开始上传',
        'uploadPause':'暂停上传',
        'uploadContinue':'继续上传',
        'uploadRetry':'重试上传',
        'uploadDelete':'删除',
        'uploadTurnLeft':'向左旋转',
        'uploadTurnRight':'向右旋转',
        'uploadPreview':'预览中',
        'uploadNoPreview':'不能预览',
        'updateStatusReady': '选中_个Scratch，共_KB。',
        'updateStatusConfirm': '已成功上传_个文件，_个文件上传失败',
        'updateStatusFinish': '共_个（_KB），_个上传成功',
        'updateStatusError': '，_个上传失败。',
        'errorNotSupport': 'WebUploader 不支持您的浏览器！如果你使用的是IE浏览器，请尝试升级 flash 播放器。',
        'errorLoadConfig': '后端配置项没有正常加载，上传插件不能正常使用！',
        'errorExceedSize':'文件大小超出',
        'errorFileType':'文件格式不允许',
        'errorInterrupt':'文件传输中断',
        'errorUploadRetry':'上传失败，请重试',
        'errorHttp':'http请求错误',
        'errorServerUpload':'服务器返回出错',
        'remoteLockError':"宽高不正确,不能所定比例",
        'numError':"请输入正确的长度或者宽度值！例如：123，400",
        'imageUrlError':"不允许的Scratch格式或者Scratch域！",
        'imageLoadError':"Scratch加载失败！请检查链接地址或网络状态！",
        'searchRemind':"请输入搜索关键词",
        'searchLoading':"Scratch加载中，请稍后……",
        'searchRetry':" :( ，抱歉，没有找到Scratch！请重试一次！"
	}

	/*初始化上传标签*/
	function initUpload(){
		uploadFile = new UploadFile('queueList');
	}

    /* 上传附件 */
    function UploadFile(target) {
        this.$wrap = target.constructor == String ? $('#' + target) : $(target);
        this.init();
    }
    UploadFile.prototype = {
        init: function () {
            this.fileList = [];
            this.initContainer();
            this.initUploader();
        },
        initContainer: function () {
            this.$queue = this.$wrap.find('.filelist');
        },
        /* 初始化容器 */
        initUploader: function () {
            var _this = this,
                $ = jQuery,    // just in case. Make sure it's not an other libaray.
                $wrap = _this.$wrap,
            // Scratch容器
                $queue = $wrap.find('.filelist'),
            // 状态栏，包括进度和控制按钮
                $statusBar = $wrap.find('.statusBar'),
            // 文件总体选择信息。
                $info = $statusBar.find('.info'),
            // 上传按钮
                $upload = $wrap.find('.uploadBtn'),
            // 上传按钮
                $filePickerBtn = $wrap.find('.filePickerBtn'),
            // 上传按钮
                $filePickerBlock = $wrap.find('.filePickerBlock'),
            // 没选择文件之前的内容。
                $placeHolder = $wrap.find('.placeholder'),
            // 总体进度条
                $progress = $statusBar.find('.progress').hide(),
            // 添加的文件数量
                fileCount = 0,
            // 添加的文件总大小
                fileSize = 0,
            // 优化retina, 在retina下这个值是2
                ratio = window.devicePixelRatio || 1,
            // 缩略图大小
                thumbnailWidth = 113 * ratio,
                thumbnailHeight = 113 * ratio,
            // 可能有pedding, ready, uploading, confirm, done.
                state = '',
            // 所有文件的进度信息，key为file id
                percentages = {},
                supportTransition = (function () {
                    var s = document.createElement('p').style,
                        r = 'transition' in s ||
                            'WebkitTransition' in s ||
                            'MozTransition' in s ||
                            'msTransition' in s ||
                            'OTransition' in s;
                    s = null;
                    return r;
                })(),
            // WebUploader实例
                uploader,
                actionUrl = editor.getActionUrl(editor.getOpt('scratchActionName')),
                fileMaxSize = editor.getOpt('scratchMaxSize'),
                acceptExtensions = (editor.getOpt('scratchAllowFiles') || []).join('').replace(/\./g, ',').replace(/^[,]/, '');;

            if (!WebUploader.Uploader.support()) {
                $('#filePickerReady').after($('<div>').html(lang.errorNotSupport)).hide();
                return;
            } else if (!editor.getOpt('scratchActionName')) {
                $('#filePickerReady').after($('<div>').html(lang.errorLoadConfig)).hide();
                return;
            }

            uploader = _this.uploader = WebUploader.create({
                pick: {
                    id: '#filePickerReady',
                    label: lang.uploadSelectFile
                },
                swf: '../third-party/webuploader/Uploader.swf',
                server: actionUrl,
                fileVal: editor.getOpt('scratchFieldName'),
                duplicate: true,
                fileSingleSizeLimit: fileMaxSize,
                compress: false
            });
            uploader.addButton({
                id: '#filePickerBlock'
            });
            uploader.addButton({
                id: '#filePickerBtn',
                label: lang.uploadAddFile
            });

            setState('pedding');

            // 当有文件添加进来时执行，负责view的创建
            function addFile(file) {
                var $li = $('<li id="' + file.id + '">' +
                        '<p class="title">' + file.name + '</p>' +
                        '<p class="imgWrap"></p>' +
                        '<p class="progress"><span></span></p>' +
                        '</li>'),

                    $btns = $('<div class="file-panel">' +
                        '<span class="cancel">' + lang.uploadDelete + '</span>' +
                        '<span class="rotateRight">' + lang.uploadTurnRight + '</span>' +
                        '<span class="rotateLeft">' + lang.uploadTurnLeft + '</span></div>').appendTo($li),
                    $prgress = $li.find('p.progress span'),
                    $wrap = $li.find('p.imgWrap'),
                    $info = $('<p class="error"></p>').hide().appendTo($li),

                    showError = function (code) {
                        switch (code) {
                            case 'exceed_size':
                                text = lang.errorExceedSize;
                                break;
                            case 'interrupt':
                                text = lang.errorInterrupt;
                                break;
                            case 'http':
                                text = lang.errorHttp;
                                break;
                            case 'not_allow_type':
                                text = lang.errorFileType;
                                break;
                            default:
                                text = lang.errorUploadRetry;
                                break;
                        }
                        $info.text(text).show();
                    };

                if (file.getStatus() === 'invalid') {
                    showError(file.statusText);
                } else {
                    $wrap.text(lang.uploadPreview);
                    if ('|png|jpg|jpeg|bmp|gif|'.indexOf('|'+file.ext.toLowerCase()+'|') == -1) {
                        $wrap.empty().addClass('notimage').append('<i class="file-preview file-type-' + file.ext.toLowerCase() + '"></i>' +
                            '<span class="file-title">' + file.name + '</span>');
                    } else {
                        if (browser.ie && browser.version <= 7) {
                            $wrap.text(lang.uploadNoPreview);
                        } else {
                            uploader.makeThumb(file, function (error, src) {
                                if (error || !src || (/^data:/.test(src) && browser.ie && browser.version <= 7)) {
                                    $wrap.text(lang.uploadNoPreview);
                                } else {
                                    var $img = $('<img src="' + src + '">');
                                    $wrap.empty().append($img);
                                    $img.on('error', function () {
                                        $wrap.text(lang.uploadNoPreview);
                                    });
                                }
                            }, thumbnailWidth, thumbnailHeight);
                        }
                    }
                    percentages[ file.id ] = [ file.size, 0 ];
                    file.rotation = 0;

                    /* 检查文件格式 */
                    if (!file.ext || acceptExtensions.indexOf(file.ext.toLowerCase()) == -1) {
                        showError('not_allow_type');
                        uploader.removeFile(file);
                    }
                }

                file.on('statuschange', function (cur, prev) {
                    if (prev === 'progress') {
                        $prgress.hide().width(0);
                    } else if (prev === 'queued') {
                        $li.off('mouseenter mouseleave');
                        $btns.remove();
                    }
                    // 成功
                    if (cur === 'error' || cur === 'invalid') {
                        showError(file.statusText);
                        percentages[ file.id ][ 1 ] = 1;
                    } else if (cur === 'interrupt') {
                        showError('interrupt');
                    } else if (cur === 'queued') {
                        percentages[ file.id ][ 1 ] = 0;
                    } else if (cur === 'progress') {
                        $info.hide();
                        $prgress.css('display', 'block');
                    } else if (cur === 'complete') {
                    }

                    $li.removeClass('state-' + prev).addClass('state-' + cur);
                });

                $li.on('mouseenter', function () {
                    $btns.stop().animate({height: 30});
                });
                $li.on('mouseleave', function () {
                    $btns.stop().animate({height: 0});
                });

                $btns.on('click', 'span', function () {
                    var index = $(this).index(),
                        deg;

                    switch (index) {
                        case 0:
                            uploader.removeFile(file);
                            return;
                        case 1:
                            file.rotation += 90;
                            break;
                        case 2:
                            file.rotation -= 90;
                            break;
                    }

                    if (supportTransition) {
                        deg = 'rotate(' + file.rotation + 'deg)';
                        $wrap.css({
                            '-webkit-transform': deg,
                            '-mos-transform': deg,
                            '-o-transform': deg,
                            'transform': deg
                        });
                    } else {
                        $wrap.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (~~((file.rotation / 90) % 4 + 4) % 4) + ')');
                    }

                });

                $li.insertBefore($filePickerBlock);
            }

            // 负责view的销毁
            function removeFile(file) {
                var $li = $('#' + file.id);
                delete percentages[ file.id ];
                updateTotalProgress();
                $li.off().find('.file-panel').off().end().remove();
            }

            function updateTotalProgress() {
                var loaded = 0,
                    total = 0,
                    spans = $progress.children(),
                    percent;

                $.each(percentages, function (k, v) {
                    total += v[ 0 ];
                    loaded += v[ 0 ] * v[ 1 ];
                });

                percent = total ? loaded / total : 0;

                spans.eq(0).text(Math.round(percent * 100) + '%');
                spans.eq(1).css('width', Math.round(percent * 100) + '%');
                updateStatus();
            }

            function setState(val, files) {

                if (val != state) {

                    var stats = uploader.getStats();

                    $upload.removeClass('state-' + state);
                    $upload.addClass('state-' + val);

                    switch (val) {

                        /* 未选择文件 */
                        case 'pedding':
                            $queue.addClass('element-invisible');
                            $statusBar.addClass('element-invisible');
                            $placeHolder.removeClass('element-invisible');
                            $progress.hide(); $info.hide();
                            uploader.refresh();
                            break;

                        /* 可以开始上传 */
                        case 'ready':
                            $placeHolder.addClass('element-invisible');
                            $queue.removeClass('element-invisible');
                            $statusBar.removeClass('element-invisible');
                            $progress.hide(); $info.show();
                            $upload.text(lang.uploadStart);
                            uploader.refresh();
                            break;

                        /* 上传中 */
                        case 'uploading':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadPause);
                            break;

                        /* 暂停上传 */
                        case 'paused':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadContinue);
                            break;

                        case 'confirm':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadStart);

                            stats = uploader.getStats();
                            if (stats.successNum && !stats.uploadFailNum) {
                                setState('finish');
                                return;
                            }
                            break;

                        case 'finish':
                            $progress.hide(); $info.show();
                            if (stats.uploadFailNum) {
                                $upload.text(lang.uploadRetry);
                            } else {
                                $upload.text(lang.uploadStart);
                            }
                            break;
                    }

                    state = val;
                    updateStatus();

                }

                if (!_this.getQueueCount()) {
                    $upload.addClass('disabled')
                } else {
                    $upload.removeClass('disabled')
                }

            }

            function updateStatus() {
                var text = '', stats;

                if (state === 'ready') {
                    text = lang.updateStatusReady.replace('_', fileCount).replace('_KB', WebUploader.formatSize(fileSize));
                } else if (state === 'confirm') {
                    stats = uploader.getStats();
                    if (stats.uploadFailNum) {
                        text = lang.updateStatusConfirm.replace('_', stats.successNum).replace('_', stats.successNum);
                    }
                } else {
                    stats = uploader.getStats();
                    text = lang.updateStatusFinish.replace('_', fileCount).
                        replace('_KB', WebUploader.formatSize(fileSize)).
                        replace('_', stats.successNum);

                    if (stats.uploadFailNum) {
                        text += lang.updateStatusError.replace('_', stats.uploadFailNum);
                    }
                }

                $info.html(text);
            }

            uploader.on('fileQueued', function (file) {
                fileCount++;
                fileSize += file.size;

                if (fileCount === 1) {
                    $placeHolder.addClass('element-invisible');
                    $statusBar.show();
                }

                addFile(file);
            });

            uploader.on('fileDequeued', function (file) {
                fileCount--;
                fileSize -= file.size;

                removeFile(file);
                updateTotalProgress();
            });

            uploader.on('filesQueued', function (file) {
                if (!uploader.isInProgress() && (state == 'pedding' || state == 'finish' || state == 'confirm' || state == 'ready')) {
                    setState('ready');
                }
                updateTotalProgress();
            });

            uploader.on('all', function (type, files) {
                switch (type) {
                    case 'uploadFinished':
                        setState('confirm', files);
                        break;
                    case 'startUpload':
                        /* 添加额外的GET参数 */
                        var params = utils.serializeParam(editor.queryCommandValue('serverparam')) || '',
                            url = utils.formatUrl(actionUrl + (actionUrl.indexOf('?') == -1 ? '?':'&') + 'encode=utf-8&' + params);
                        uploader.option('server', url);
                        setState('uploading', files);
                        break;
                    case 'stopUpload':
                        setState('paused', files);
                        break;
                }
            });

            uploader.on('uploadBeforeSend', function (file, data, header) {
                //这里可以通过data对象添加POST参数
                header['X_Requested_With'] = 'XMLHttpRequest';
            });

            uploader.on('uploadProgress', function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress span');

                $percent.css('width', percentage * 100 + '%');
                percentages[ file.id ][ 1 ] = percentage;
                updateTotalProgress();
            });

            uploader.on('uploadSuccess', function (file, ret) {
                var $file = $('#' + file.id);
                try {
                    var responseText = (ret._raw || ret),
                        json = utils.str2json(responseText);
                    if (json.state == 'SUCCESS') {
                        uploadScratchList.push({
                            'url': json.url,
                            'type': json.type,
                            'original':json.original,
                            'title':json.title
                        });
                        $file.append('<span class="success"></span>');
                    } else {
                        $file.find('.error').text(json.state).show();
                    }
                } catch (e) {
                    $file.find('.error').text(lang.errorServerUpload).show();
                }
            });

            uploader.on('uploadError', function (file, code) {
            });
            uploader.on('error', function (code, file) {
                if (code == 'Q_TYPE_DENIED' || code == 'F_EXCEED_SIZE') {
                    addFile(file);
                }
            });
            uploader.on('uploadComplete', function (file, ret) {
            });

            $upload.on('click', function () {
                if ($(this).hasClass('disabled')) {
                    return false;
                }

                if (state === 'ready') {
                    uploader.upload();
                } else if (state === 'paused') {
                    uploader.upload();
                } else if (state === 'uploading') {
                    uploader.stop();
                }
            });

            $upload.addClass('state-' + state);
            updateTotalProgress();
        },
        getQueueCount: function () {
            var file, i, status, readyFile = 0, files = this.uploader.getFiles();
            for (i = 0; file = files[i++]; ) {
                status = file.getStatus();
                if (status == 'queued' || status == 'uploading' || status == 'progress') readyFile++;
            }
            return readyFile;
        },
        refresh: function(){
            this.uploader.refresh();
        }
    };

})();