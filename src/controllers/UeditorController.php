<?php

use Illuminate\Routing\Controller;
use Ccl\Ueditor\UeditorUploader;

class UeditorController extends Controller{

	/*
	 *  默认上传方式
     *	@var string
	 */
	private $base64 = "upload";

	/**
	 *  处理请求信息
	 */
	public function getAction(){
		$action = Input::get('action');
		switch ($action){
			/* 前后端通训配置信息 */
			case 'config':
				return $this->configBackend();
			/*上传图片*/
			case 'uploadimage':
				return $this->postUploadImage();
			/*上传涂鸦*/
			case 'uploadscrawl':
				return $this->postUploadScrawl();
			/*上传视频*/
			case 'uploadvideo':
				return $this->postUploadVideo();
			/*上传文件*/
			case 'uploadfile':
				return $this->defaultUpload();
			/*列出图片*/
			case 'listimage':
				return $this->listImages();
			/*列出文件*/
			case 'listfile':
				return $this->listFiles();
			/*抓取远程文件*/
			case 'catchimage':
				return $this->catchImages();
			/*上传scratch*/
			case 'scratch':
				return $this->postUploadScratch();
			/*列出Scratch文件*/
			case 'listscratch':
				return $this->listScratchs();
		}

		return Response::json(['state'=>'你的请求没有被处理']);
	}

	/**
	 * 前后端配置文件通信
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function configBackend(){
		return Response::json(Config::get('ueditor::upload'));
	}

	/**
	 * 上传涂鸦
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function postUploadImage(){
		$config  = [
			"pathFormat" => Config::get('ueditor::upload.imagePathFormat'),
			"maxSize"    => Config::get('ueditor::upload.imageMaxSize'),
			"allowFiles" => Config::get('ueditor::upload.imageAllowFiles')
		];
		$fieldName = Config::get('ueditor::upload.imageFieldName');

		$up = new UeditorUploader($fieldName,$config,$this->base64);

		return Response::json($up->getFileInfo()); 
	}

	public function postUploadScrawl(){
		$config  = [
			"pathFormat" => Config::get('ueditor::upload.scrawlPathFormat'),
			"maxSize"    => Config::get('ueditor::upload.scrawlMaxSize'),
			"oriName"    => "scrawl.png"
		];
		$fieldName = Config::get('ueditor::upload.scrawlFieldName');

		$this->base64 = 'base64';

		$up = new UeditorUploader($fieldName,$config,$this->base64);

		return Response::json($up->getFileInfo()); 
	}

	/**
	 * 上传视频
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function postUploadVideo(){
		$config = [
			"pathFormat" => Config::get('ueditor::upload.videoPathFormat'),
			"maxSize"    => Config::get('ueditor::upload.videoMaxSize'),
			"allowFiles" => Config::get('ueditor::upload.videoAllowFiles')
		];
		$fieldName = Config::get('ueditor::upload.videoFieldName');

		$up = new UeditorUploader($fieldName,$config,$this->base64);
	}

	public function defaultUpload(){
		$config = [
			"pathFormat" => Config::get('ueditor::upload.filePathFormat'),
			"maxSize"    => Config::get('ueditor::upload.fileMaxSize'),
			"allowFiles" => Config::get('ueditor::upload.fileAllowFiles')
		];
		$fieldName = Config::get('ueditor::upload.fileFieldName');

		$up =new UeditorUploader($fieldName,$config,$this->base64);

		return Response::json($up->getFileInfo());
	}

	public function postUploadScratch(){
		$config = [
			"pathFormat" => Config::get('ueditor::upload.scratchPathFormat'),
			"maxSize"    => Config::get('ueditor::upload.scratchMaxSize'),
			"allowFiles" => Config::get('ueditor::upload.scratchAllowFiles')
		];
		$fieldName = Config::get('ueditor::upload.scratchFieldName');

		$up =new UeditorUploader($fieldName,$config,$this->base64);

		return Response::json($up->getFileInfo());
	}

	public function catchImages(){
		$config = [
			"pathFormat" => Config::get('ueditor::upload.catcherPathFormat'),
			"maxSize"    => Config::get('ueditor::upload.catcherMaxSize'),
			"allowFiles" => Config::get('ueditor::upload.catcherAllowFiles')
		];
		$fieldName = Config::get('ueditor::upload.catcherFieldName');

		/*抓取远程图片*/
		$list = [];

		if(isset($_POST[$fieldName])){
			$source = $_POST[$fieldName];
		}else{
			$source = $_GET[$fieldName];
		}

		foreach ($source as $imgUrl) {
			$item = new UeditorUploader($imgUrl,$config,"remote");
			$info = $item->getFileInfo();
			array_push($list,[
				"state"    => $info["state"],
				"url"      => $info["url"],
				"size"     => $info["size"],
				"title"    => htmlspecialchars($info['title']),
				"original" => htmlspecialchars($info['original']),
				"source"   => htmlspecialchars($info['source'])

			]);
		}

		return Resposnse::json([
			'state' => count($list) ? 'SUCCESS' : 'ERROR',
			'list'  => $list
		]);
	}

	public function listFiles(){
		$allowFiles = Config::get('ueditor::upload.fileManagerAllowFiles');
		$listSize   = Config::get('ueditor::upload.fileManagerListSize');
		$path       = Config::get('ueditor::upload.fileManagerListPath');
		
		return $this->processList($allowFiles,$listSize,$path);
	}

	public function listImages(){
		$allowFiles = Config::get('ueditor::upload.imageManagerAllowFiles');
		$listSize   = Config::get('ueditor::upload.imageManagerListSize');
		$path       = Config::get('ueditor::upload.imageManagerListPath');

		return $this->processList($allowFiles,$listSize,$path);
	}

	public function listScratchs(){
		$allowFiles = Config::get('ueditor::upload.scratchManagerAllowFiles');
		$listSize   = Config::get('ueditor::upload.scratchManagerListSize');
		$path       = Config::get('ueditor::upload.scratchManagerListPath');

		return $this->processList($allowFiles,$listSize,$path);
	}

	private function processList($allowFiles,$listSize,$path){
		$allowFiles = substr(str_replace('.','|',join('',$allowFiles)),1);

		/* 获取参数 */
		$size   = isset($_GET['size']) ? htmlspecialchars($_GET['size']) : $listSize;
		$start  = isset($_GET['start']) ? htmlspecialchars($_GET['start']) : 0;
		$end    = intval($start) + intval($size);

		/*获取文件列表*/
		$path = $_SERVER['DOCUMENT_ROOT'].(substr($path,0,1) == '/' ? '' : '/').$path;
		$files = $this->getfiles($path,$allowFiles);
		if(!count($files)){
			return json_encode([
				'state' => 'no match file',
				'list'  => array(),
				'start' => $start,
				'total' => count($files)
			]);
		}

		/*获取指定范围的列表*/
		$len = count($files);
		for($i = min($end,$len)-1,$list = []; $i < $end && $i >=0 && $i >= $start; $i--){
			$list[] = $files[$i];
		}

		return json_encode([
			'state' => "SUCCESS",
			'list'  => $list,
			'start' => $start,
			'total' => $len
		]);

	}

	private function getfiles($path,$allowFiles,&$files = array()){
		if(!is_dir($path))
			return null;
		if(substr($path,strlen($path)-1) != '/')
			$path .= '/';
		$handle = opendir($path);
		while(false !== ($file = readdir($handle))){
			if($file != '.' && $file != '..'){
				$path2 = $path.$file;
				if(is_dir($path2)){
					$this->getfiles($path2,$allowFiles,$files);
				}else{
					if(preg_match("/".$allowFiles."/i",$file)){
						$files[] = [
							'url'   => substr($path2, strlen($_SERVER['DOCUMENT_ROOT'])),
							'mtime' => filemtime($path2)
						];
					}
				}
			}
		}

		return $files;
	}

	public function config(){
		$config  = '(function(){
			window.UEDITOR_CONFIG =';
		$config .= json_encode(Config::get('ueditor::editor'));
		$config .= ';';

		$config .= <<<js
function getUEBasePath(docUrl, confUrl) {
	return getBasePath(docUrl || self.document.URL || self.location.href, confUrl || getConfigFilePath());
}
function getConfigFilePath() {
	var configPath = document.getElementsByTagName('script');
	return configPath[ configPath.length - 1 ].src;
}
function getBasePath(docUrl, confUrl) {
	var basePath = confUrl;
	if (/^(\/|\\\\)/.test(confUrl)) {
		basePath = /^.+?\w(\/|\\\\)/.exec(docUrl)[0] + confUrl.replace(/^(\/|\\\\)/, '');
	} else if (!/^[a-z]+:/i.test(confUrl)) {
		docUrl = docUrl.split("#")[0].split("?")[0].replace(/[^\\\/]+$/, '');
		basePath = docUrl + "" + confUrl;
	}
	return optimizationPath(basePath);
}

function optimizationPath(path) {
	var protocol = /^[a-z]+:\/\//.exec(path)[ 0 ],
		tmp = null,
		res = [];
	path = path.replace(protocol, "").split("?")[0].split("#")[0];
	path = path.replace(/\\\/g, '/').split(/\//);
	path[ path.length - 1 ] = "";
	while (path.length) {
		if (( tmp = path.shift() ) === "..") {
			res.pop();
		} else if (tmp !== ".") {
			res.push(tmp);
		}
	}

	return protocol + res.join("/");

}

window.UE = {
	getUEBasePath: getUEBasePath
};
js;
		$config .= '})();';
		return Response::make($config, 200, ['Content-Type' => 'text/javascript']);
	}
}