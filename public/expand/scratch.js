
UE.registerUI('dialog',function(editor,uiName){
    var dialog = new UE.ui.Dialog({
        iframeUrl:UEDITOR_CONFIG.UEDITOR_HOME_URL+'expand/scratchDialogPage.html',
        editor:editor,
        name:uiName,
        title:'插入Scratch',
        cssRules:"width:600px;height:390px;",
        buttons:[
            {
                className:'edui-okbutton',
                label:'确定',
                onclick:function(){
                    dialog.close(true);
                }
            },
            {
                className:'edui-cancelbutton',
                label:'取消',
                onclick:function(){
                    dialog.close(false);
                }
            }
        ]
    });

     //创建一个button
    var btn = new UE.ui.Button({
        //按钮的名字
        name:"dialog"+uiName,
        //提示
        title:'Scratch',
        //需要添加的额外样式，指定icon图标，这里默认使用一个重复的icon
        cssRules :'background-position: -748px 162px;',
        //点击时执行的命令
        onclick:function () {
            //这里可以不用执行命令,做你自己的操作也可
           dialog.render();
           dialog.open();
        }
    });

    editor.addListener('selectionchange', function () {
        var state = editor.queryCommandState(uiName);
        if (state == -1) {
            btn.setDisabled(true);
            btn.setChecked(false);
        } else {
            btn.setDisabled(false);
            btn.setChecked(state);
        }
    });

    return btn;
});


 