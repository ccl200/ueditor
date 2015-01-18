<?php namespace Ccl\Ueditor;

class UEDITOR{

	private static function makeConfig2String($config){
		$string = '';
		if(is_array($config)){
			if($config === []){
				$string = "id = 'myEditor'";
			}
			foreach($config as $k => $v){
				$string.=" {$k} = '{$v}'";
			}
		}else{
			$string="id = '{$config}'";
		}
		return $string;
	}

	public static function content($content = '', $config = []){
		$attr = self::makeConfig2String($config);
		echo "<script type='text/plain' {$attr} >{$content}</script>";
	}

	public static function css(){
		echo '<link href="'.asset('packages/ccl/ueditor/themes/default/css/ueditor.css').'" type="text/css" rel="stylesheet">';
	}

	public static function js(){
		echo '<script type="text/javascript" charset="utf-8" src="'.route('ueditor.config').'"></script>';
		echo '<script type="text/javascript" charset="utf-8" src="'.asset('packages/ccl/ueditor/ueditor.all.min.js').'"></script>
			<script type="text/javascript" src="'.asset('packages/ccl/ueditor/lang/zh-cn/zh-cn.js').'"></script>'; 
	}
	/*扩展*/
	public static function expand(){
		if (func_num_args() > 0){
			$arr = func_get_args();
			foreach ($arr as $v) {
				echo '<script type="text/javascript" charset="utf-8" src="'.asset('packages/ccl/ueditor/expand/'.$v.'.js').'"></script>';
			}
		}
	}
}