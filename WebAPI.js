/*
 *
 */

//--------------------------------------------------------------------------------------------------------------
//グローバル変数定義
//--------------------------------------------------------------------------------------------------------------

var GIS_SERVER_IP = "172.23.29.3";//現地環境
//var GIS_SERVER_IP = "172.18.73.41"; //Azure

var windowObject = null;

var facade = null;
var kijyunkei = 6;

var lonlat = new Array();
var retval = new Array(); //座標変換用

var c_layerId = "";
var c_itemId = []; //同心円処理用
var c_flg = false;

var densityAnalysis_layerId = "";
var densityAnalysis_flg = false;

var disp_popUp = false;

//右クリック詳細情報退避用
var info_type = [];
var info_attr = [];
//20240216
var info_attr_layerId = [];
var info_value = [];
var info_value2 = [];
var info_value3 = [];

//2023.04.04　一時レイヤ格納用
var tmp_data = [];
var tmp_info = {};

//2023.04.17
var status_data = [];
var status_info = {};

//2023.04.17
var write_data = [];
var write_info = {};

//2023.04.27
var symbol_array_data = [];
var symbol_array_info = {};

//2023.04.27
var CommPos_data = [];
var _info = {};

//PKG LayerID <-->業務レイヤID
var layObject = {
	"n@1-1": "1",
	"n@2-1": "2",
	"n@3-1": "3",
	"n@4-1": "4",
	"n@5-1": "5",
	"n@6-1": "6",
	"n@7-1": "7",
	"n@8-1": "8",
	"n@9-1": "9",
	"n@10-1": "10",
	"n@11-1": "11",
	"n@12-1": "12",
	"n@13-1": "13",
	"n@14-1": "14",
	"n@15-1": "15",
	"n@16-1": "16",
	"n@17-1": "17",
	"n@17-2": "17",
	"n@17-3": "17",
	"n@18-1": "18",
	"n@19-1": "19",
	"n@20-1": "20",
	"n@21-1": "21",
	"n@22-1": "22",
	"n@23-1": "23",
	"n@24-1": "24",
	"n@28-1": "25",
	"n@28-1": "26",
	"n@28-1": "27",
	"n@28-1": "28",
	"n@29-1": "29",
	"n@30-1": "30",
	"n@90": "90",
	"n@109": "109",
};

var init_lon = 135.473737; //初期経度
var init_lat = 34.670165; //初期緯度
var init_zoom = 18; //初期倍率
var init_terminal_type = 0; //[0:DAMS 1:受令端末]
var init_terminal_id = "100"; //端末ID　<-- 文字で指定

var event_count = 0;

var click_mode = "none";

var dlg_flg = [];

//2023.08.07
var dlg_lay_no = [];
var dlg_item_no = [];
const dlg_max = 5;
//const dlg_submax = 3;
//2023.07.18 3-->4
const dlg_submax = 4;

for (var i = 0; i < dlg_max; i++) {
	dlg_flg[i] = false;
	//2023.08.07
	dlg_lay_no[i] = "";
	dlg_item_no[i] = "";
}

var jsonload = true;
var jsonflg = [];

let timer_result = function() {
	setTimeout(timer_result, 10000);

	/* 20241218 CommentOut
	if (facade != null) {
		facade.getPosition(function(ret) {
			console.log(ret);
		});

	}*/
};
timer_result();

var event_count_max = 0;
//2023.08.12
// iframeからのイベント処理
//
window.addEventListener("message", (response) => {
	if (response.data.type === "preview") {
		const data = response.data.data;

		console.log(data.id);
		PreviewFunc(data.id);
	}
	//previewダイアログからの終了通知イベント
	if (response.data.type === "preview_close") {
		const data = response.data.data;

		console.log(data.id);
		closePreviewDialog();
	}
	//preview2ダイアログからの終了通知イベント
	if (response.data.type === "preview2_close") {
		const data = response.data.data;

		console.log(data.id);
		closePreviewDialog2();
	}
});
//20230922 角度を退避
var m_angle = 0.0;
var ope_mode; //0:通常　1:訓練

var back_lon;
var back_lat;

//20240228
//端末の向き
var termOrientation = "Landscape"; //Portrait（縦向き） or Landscape(横向き)
//--------------------------------------------------------------------------------------------------------------
//MapObj 定義
//--------------------------------------------------------------------------------------------------------------
var MapObj = {
	init3(w_lon, w_lat, w_zoom, terminal_type, terminal_id) {
		PRAn2LonLatW(w_lon, w_lat, kijyunkei, retval);

		init_lon = retval[0];
		init_lat = retval[1];
		init_zoom = w_zoom;
		init_terminal_type = terminal_type;
		init_terminal_id = terminal_id;
		this.init();
	},
	init2(w_lon, w_lat, w_zoom) {
		PRAn2LonLatW(w_lon, w_lat, kijyunkei, retval);

		init_lon = retval[0];
		init_lat = retval[1];
		init_zoom = w_zoom;
		this.init();
	},
	init() {
		var consolelog = function(ret) {
			console.log(ret);
			document.getElementById("console").innerText = JSON.stringify(ret);
		};

		var protocol = window.location.protocol;
		var port = window.location.port;
		var path = window.location.pathname;
		var html = path.split("/").pop();
		path = path.replace("/" + html, "");

		var url = "https://" + GIS_SERVER_IP + ":1443/proj";

		$("body").append(
			'<form action="' +
			url +
			"/StartGisJS?jb_lon=" +
			init_lon +
			"&jb_lat=" +
			init_lat +
			"&jb_zl=" +
			init_zoom +
			'&jb_layouttype=easy" method="post" target="mapPrevframe" id="postToIframe"></form>'
		);

		$("#postToIframe").append(
			'<input type="hidden" name="user_id" value="1" />'
		);
		$("#postToIframe").append(
			'<input type="hidden" name="terminal_type" value="' +
			init_terminal_type +
			'" />'
		);

		$("#postToIframe").submit().remove();

		// $("#postToIframe").submit().remove();
		//画像保存用ダイアログの追加　2022.11.19

		var save_html =
			'<dialog id="save_dialog"><diinit_terminal_typev id="save_dialog_image"></div><button id="save_dialog_close">CLOSE</button></dialog>';
		var save_dialog_div = document.createElement("save_dialog_div");
		save_dialog_div.innerHTML = save_html;
		document.body.appendChild(save_dialog_div);

		//映像配信ダイアログ定義
		/*
					var dialog_html =
						'<dialog draggable="true" id="dialog1" class="video_dialog"><input type="button" id="dialog_close1"  value="X"><div id="image1"></div></dialog>';
					dialog_html +=
						'<dialog draggable="true" id="dialog2" class="video_dialog"><input type="button" id="dialog_close2"  value="X"><div id="image2"></div></dialog>';
					dialog_html +=
						'<dialog draggable="true" id="dialog3" class="video_dialog"><input type="button" id="dialog_close3"  value="X"><div id="image3"></div></dialog>';
					dialog_html +=
						'<dialog draggable="true" id="dialog4" class="video_dialog"><input type="button" id="dialog_close4"  value="X"><div id="image4"></div></dialog>';
					dialog_html +=
						'<dialog draggable="true" id="dialog5" class="video_dialog"><input type="button" id="dialog_close5"  value="X"><div id="image5"></div></dialog>';
			*/
		var dialog_html =
			'<dialog draggable="true" id="dialog1" class="video_dialog"><div id="image1"></div></dialog>';
		dialog_html +=
			'<dialog draggable="true" id="dialog2" class="video_dialog"><div id="image2"></div></dialog>';
		dialog_html +=
			'<dialog draggable="true" id="dialog3" class="video_dialog"><div id="image3"></div></dialog>';
		dialog_html +=
			'<dialog draggable="true" id="dialog4" class="video_dialog"><div id="image4"></div></dialog>';
		dialog_html +=
			'<dialog draggable="true" id="dialog5" class="video_dialog"><div id="image5"></div></dialog>';

		var video_dialog_div = document.createElement("video_dialog_div");
		video_dialog_div.innerHTML = dialog_html;
		document.body.appendChild(video_dialog_div);
		/*
					var dialog_close1 = document.getElementById("dialog_close1");
					var dialog_close2 = document.getElementById("dialog_close2");
					var dialog_close3 = document.getElementById("dialog_close3");
					var dialog_close4 = document.getElementById("dialog_close4");
					var dialog_close5 = document.getElementById("dialog_close5");
			
					dialog_close1.addEventListener("click", function() {
						dlg_flg[0] = false;
						dialog1.close();
					});
					dialog_close2.addEventListener("click", function() {
						dlg_flg[1] = false;
						dialog2.close();
					});
					dialog_close3.addEventListener("click", function() {
						dlg_flg[2] = false;
						dialog3.close();
					});
					dialog_close4.addEventListener("click", function() {
						dlg_flg[3] = false;
						dialog4.close();
					});
					dialog_close5.addEventListener("click", function() {
						dlg_flg[4] = false;
						dialog5.close();
					});
			*/
		//-------------------------------------------------------------------------------
		/*		let mouse1 = {
						x: 0,
						y: 0,
					};
					let mouse2 = {
						x: 0,
						y: 0,
					};
					let mouse3 = {
						x: 0,
						y: 0,
					};
					dialog1.addEventListener("dragstart", (evt) => {
						mouse1.y = dialog1.offsetTop - evt.pageY;
						mouse1.x = dialog1.offsetLeft - evt.pageX;
						evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0);
					});
					dialog1.addEventListener("drag", (evt) => {
						if (evt.x === 0 && evt.y === 0) return;
						const top = evt.pageY + mouse1.y;
						const left = evt.pageX + mouse1.x;
						const right = window.outerWidth - evt.pageX;
						dialog1.style.top = top + "px";
						dialog1.style.left = left + "px";
						dialog1.style.right = right + "px";
					});
					dialog1.addEventListener("dragend", (evt) => {
						mouse1 = {
							x: 0,
							y: 0,
						};
					});
			
					dialog2.addEventListener("dragstart", (evt) => {
						mouse2.y = dialog2.offsetTop - evt.pageY;
						mouse2.x = dialog2.offsetLeft - evt.pageX;
						evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0);
					});
					dialog2.addEventListener("drag", (evt) => {
						if (evt.x === 0 && evt.y === 0) return;
						const top = evt.pageY + mouse2.y;
						const left = evt.pageX + mouse2.x;
						const right = window.outerWidth - evt.pageX;
						dialog2.style.top = top + "px";
						dialog2.style.left = left + "px";
						dialog2.style.right = right + "px";
					});
					dialog2.addEventListener("dragend", (evt) => {
						mouse2 = {
							x: 0,
							y: 0,
						};
					});
					
					dialog3.addEventListener("dragstart", (evt) => {
						mouse3.y = dialog3.offsetTop - evt.pageY;
						mouse3.x = dialog3.offsetLeft - evt.pageX;
						evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0);
					});
					dialog3.addEventListener("drag", (evt) => {
						if (evt.x === 0 && evt.y === 0) return;
						const top = evt.pageY + mouse3.y;
						const left = evt.pageX + mouse3.x;
						const right = window.outerWidth - evt.pageX;
						dialog3.style.top = top + "px";
						dialog3.style.left = left + "px";
						dialog3.style.right = right + "px";
					});
					dialog3.addEventListener("dragend", (evt) => {
						mouse3 = {
							x: 0,
							y: 0,
						};
					});
					
					dialog4.addEventListener("dragstart", (evt) => {
						mouse4.y = dialog4.offsetTop - evt.pageY;
						mouse4.x = dialog4.offsetLeft - evt.pageX;
						evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0);
					});
					dialog4.addEventListener("drag", (evt) => {
						if (evt.x === 0 && evt.y === 0) return;
						const top = evt.pageY + mouse4.y;
						const left = evt.pageX + mouse4.x;
						const right = window.outerWidth - evt.pageX;
						dialog4.style.top = top + "px";
						dialog4.style.left = left + "px";
						dialog4.style.right = right + "px";
					});
					dialog4.addEventListener("dragend", (evt) => {
						mouse4 = {
							x: 0,
							y: 0,
						};
					});
					
					dialog5.addEventListener("dragstart", (evt) => {
						mouse5.y = dialog5.offsetTop - evt.pageY;
						mouse5.x = dialog5.offsetLeft - evt.pageX;
						evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0);
					});
					dialog4.addEventListener("drag", (evt) => {
						if (evt.x === 0 && evt.y === 0) return;
						const top = evt.pageY + mouse5.y;
						const left = evt.pageX + mouse5.x;
						const right = window.outerWidth - evt.pageX;
						dialog5.style.top = top + "px";
						dialog5.style.left = left + "px";
						dialog5.style.right = right + "px";
					});
					dialog5.addEventListener("dragend", (evt) => {
						mouse4 = {
							x: 0,
							y: 0,
						};
					});
			*/

		//-------------------------------------------------------------------------------
		//-------吹き出し対応------

		//var pop_dialog_html =
		//  '<dialog id="pop_dialog1" class="pop_dialog"><div id="pop_label1"></div></dialog>';
		// pop_dialog_html +=
		// '<dialog id="pop_dialog2" class="pop_dialog"><div id="pop_label2"></div></dialog>';

		//var pop_dialog_div = document.createElement("pop_dialog_div");
		//pop_dialog_div.innerHTML = pop_dialog_html;
		// document.body.appendChild(pop_dialog_div);

		//-----------------------------------------------------------------------

		windowObject = mapPrevframe.window;

		var circleId = 0;

		var options = {};
		//Facadeをインスタンス化
		facade = new ifxApiFacadePostUtil(url, windowObject, options);

		facade.addContextMenu("詳細情報", "showInfo", function(ret) {
			if (ret && ret.value && ret.value.called === "onRegist") {
				return;
			}

			var lat = ret.value.contextMenuPosition.lat;
			var lon = ret.value.contextMenuPosition.lon;
			showInfoDialog1(lon, lat);
			//callback(ret);
		});

		//20230403 コンテキストメニュー削除
		facade.removeContextMenu("moveContext", function(ret) { });
		facade.removeContextMenu("ifx.parts.draw.Style", function(ret) { });
		facade.removeContextMenu("ifx.parts.draw.DeleteItem", function(ret) { });
		facade.removeContextMenu("ifx.parts.draw.GrabHandle", function(ret) { });
		facade.removeContextMenu(
			"ifx.parts.attributesetballoon.ModuleInitialize",
			function(ret) { }
		);
		facade.removeContextMenu(
			"ifx.parts.attributesetdialog.AttributeSetDialog.panel",
			function(ret) { }
		);
		facade.removeContextMenu(
			"ifx.parts.itemcopy.ItemCopyModule",
			function(ret) { }
		);
		facade.removeContextMenu(
			"ifx.parts.layerlist.GearmenuFromContextModule",
			function(ret) { }
		);

		//起動時JSONファイル読み込み

		for (var i = 0; i < 15; i++) {
			jsonflg[i] = false;
		}
		if (init_terminal_type == "1") {
			//20231215 受令端末
			addCustomizerNodeFromJson("災害点関係（一時入力）.json", "n@20-1");
			jsonflg[0] = true;
			/*
							  addCustomizerNodeFromJson("水利関係（一時入力）_1.json", "n@21-1");
											  jsonflg[1] = true;
							  addCustomizerNodeFromJson("水利関係（一時入力）_2.json", "n@21-1");
											  jsonflg[2] = true;
							  addCustomizerNodeFromJson("水利関係（一時入力）_3.json", "n@21-1");
											  jsonflg[3] = true;
							  addCustomizerNodeFromJson("水利関係（一時入力）_4.json", "n@21-1");
											  jsonflg[4] = true;
							  addCustomizerNodeFromJson("水利関係（一時入力）_5.json", "n@21-1");
											  jsonflg[5] = true;
							  addCustomizerNodeFromJson("水利関係（一時入力）_6.json", "n@21-1");
											  jsonflg[6] = true;
							  addCustomizerNodeFromJson("水利関係（一時入力）_7.json", "n@21-1");
											  jsonflg[7] = true;
							  addCustomizerNodeFromJson("水利関係（一時入力）_8.json", "n@21-1");
											  jsonflg[8] = true;
											  */
			addCustomizerNodeFromJson("現場画像（一時入力）.json", "n@22-1");
			jsonflg[9] = true;
			addCustomizerNodeFromJson(
				"インフラ／ライフライン（一時入力）.json",
				"n@23-1"
			);
			jsonflg[10] = true;
			addCustomizerNodeFromJson("通行止め（一時入力）.json", "n@24-1");
			jsonflg[11] = true;
			addCustomizerNodeFromJson("作図用_その他.json", "n@28-1");
			jsonflg[12] = true;
			addCustomizerNodeFromJson("作図用_指揮隊風向き.json", "n@28-1");
			jsonflg[13] = true;
			addCustomizerNodeFromJson("作図用_車両.json", "n@28-1");
			jsonflg[14] = true;
		} else {
			if (jsonload == true) {
				addCustomizerNodeFromJson("災害点関係（一時入力）.json", "n@20-1");
				addCustomizerNodeFromJson("水利関係（一時入力）_1.json", "n@21-1");
				addCustomizerNodeFromJson("水利関係（一時入力）_2.json", "n@21-1");
				addCustomizerNodeFromJson("水利関係（一時入力）_3.json", "n@21-1");
				addCustomizerNodeFromJson("水利関係（一時入力）_4.json", "n@21-1");
				addCustomizerNodeFromJson("水利関係（一時入力）_5.json", "n@21-1");
				addCustomizerNodeFromJson("水利関係（一時入力）_6.json", "n@21-1");
				addCustomizerNodeFromJson("水利関係（一時入力）_7.json", "n@21-1");
				addCustomizerNodeFromJson("水利関係（一時入力）_8.json", "n@21-1");
				addCustomizerNodeFromJson("現場画像（一時入力）.json", "n@22-1");
				addCustomizerNodeFromJson(
					"インフラ／ライフライン（一時入力）.json",
					"n@23-1"
				);
				addCustomizerNodeFromJson("通行止め（一時入力）.json", "n@24-1");
				addCustomizerNodeFromJson("作図用_その他.json", "n@28-1");
				addCustomizerNodeFromJson("作図用_指揮隊風向き.json", "n@28-1");
				addCustomizerNodeFromJson("作図用_車両.json", "n@28-1");
				for (var i = 0; i < 15; i++) {
					jsonflg[i] = true;
				}
			}
		}

		//--20240424 start
		var icon1 = "./img/back.png";
		var icon2 = "./img/close_button.png";
		var info_dialog1_html = '<dialog id="info_dialog1" class="info_dialog">';
		info_dialog1_html +=
			'<div><table class="infotable1" width="450px"><tr><th width="93%" >重複シンボル一覧</th>';
		info_dialog1_html +=
			'<td><button type="button" style="border: 0px var(--header-bg-color);padding: 5px;background-color:var(--header-bg-color);" id="info_dialog1_close" onClick="closeInfoDialog1()"><img src=' +
			icon2 +
			' height ="24" width="24" /></button></td>';
		info_dialog1_html += "</tr></table></div>";

		info_dialog1_html +=
			'<div id="info_dialog1_attr" style="padding: 10px;background: #efefef !important;"></div>';
		info_dialog1_html += "</dialog>";

		var info_dialog1_div = document.createElement("info_dialog1_div");
		info_dialog1_div.innerHTML = info_dialog1_html;
		document.body.appendChild(info_dialog1_div);

		//-----------------------------------------------------------------------
		var info_dialog2_html = '<dialog id="info_dialog2" class="info_dialog">';
		info_dialog2_html += '<div><table class="infotable1" width="450px"><tr>';

		info_dialog2_html +=
			'<td><div style="background-color: var(--header-bg-color);"><button type="button" style="border: 0px var(--header-bg-color);padding: 5px;background-color:var(--header-bg-color);" id="info_dialog2_back" onClick="backInfoDialog2()"><img src=' +
			icon1 +
			' height ="24" width="24" /></button></div></td>';
		info_dialog2_html += '<th width="90%" >詳細情報</th>';
		info_dialog2_html +=
			'<td><button type="button" style="border: 0px var(--header-bg-color);padding: 5px;background-color:var(--header-bg-color);" id="info_dialog2_close" onClick="closeInfoDialog2()"><img src=' +
			icon2 +
			' height ="24" width="24" /></button>';
		info_dialog2_html += "</tr></table></div>";

		info_dialog2_html +=
			'<div id="info_dialog2_attr" style="padding: 10px;background: #efefef !important;"></div>';

		info_dialog2_html += "</dialog>";

		var info_dialog2_div = document.createElement("info_dialog2_div");
		info_dialog2_div.innerHTML = info_dialog2_html;
		document.body.appendChild(info_dialog2_div);
		//--20240424 end

		//--------2023.07.20 video preview dialog(受令端末)----------------------------------------
		//--------縦----------------------------------------
		var preview_dialog_html =
			"<dialog id='preview_dialog' class='preview_dialog'>";

		preview_dialog_html +=
			"<div id='preview_image' class='preview_image'></div>";
		preview_dialog_html += "</dialog>";

		var preview_dialog_div = document.createElement("preview_dialog_div");
		preview_dialog_div.innerHTML = preview_dialog_html;
		document.body.appendChild(preview_dialog_div);

		//--------横----------------------------------------
		var preview_dialog_html2 =
			"<dialog id='preview_dialog2' class='preview_dialog2'>";

		preview_dialog_html2 +=
			"<div id='preview_image2' class='preview_image2'></div>";
		preview_dialog_html2 += "</dialog>";

		var preview_dialog_div2 = document.createElement("preview_dialog_div2");
		preview_dialog_div2.innerHTML = preview_dialog_html2;
		document.body.appendChild(preview_dialog_div2);

		//-----------------------------------------------------------------------------

		//一時レイヤを表示状態にする
		//changeVisibleLayerは一活で処理する。
		LogOut("一時レイヤON　START");
		var mode = true;
		var layerId = "20";
		layerId = ChangeLay2(layerId);
		facade.refreshLayer(layerId, function(ret) { });

		layerId = "21";
		layerId = ChangeLay2(layerId);
		facade.refreshLayer(layerId, function(ret) { });

		layerId = "22";
		layerId = ChangeLay2(layerId);
		facade.refreshLayer(layerId, function(ret) { });

		layerId = "23";
		layerId = ChangeLay2(layerId);
		facade.refreshLayer(layerId, function(ret) { });

		layerId = "24";
		layerId = ChangeLay2(layerId);
		facade.refreshLayer(layerId, function(ret) { });

		layerId = "28";
		layerId = ChangeLay2(layerId);
		facade.refreshLayer(layerId, function(ret) { });
		LogOut("一時レイヤON　END");

		layerId = "90";
		layerId = ChangeLay2(layerId);
		facade.refreshLayer(layerId, function(ret) { });
		var layerIds = [];

		layerIds.push("20");
		layerIds.push("21");
		layerIds.push("22");
		layerIds.push("23");
		layerIds.push("24");
		layerIds.push("28");
		layerIds.push("90");

		var layerStr = "";
		for (var i = 0; i < layerIds.length; i++) {
			if (i > 0) {
				layerStr += ",";
			}
			layerStr += ChangeLay2(layerIds[i]);
		}
		console.log(layerStr);
		facade.changeVisibleLayers(layerStr, mode, function(ret) {
			console.log(ret);
		});
	},
	setjsonload(isload) {
		jsonload = isload;
	},
	addJsonFiles(callback) {
		var ret = {};
		addCustomizerNodeFromJson("災害点関係（一時入力）.json", "n@20-1");
		addCustomizerNodeFromJson("水利関係（一時入力）_1.json", "n@21-1");
		addCustomizerNodeFromJson("水利関係（一時入力）_2.json", "n@21-1");
		addCustomizerNodeFromJson("水利関係（一時入力）_3.json", "n@21-1");
		addCustomizerNodeFromJson("水利関係（一時入力）_4.json", "n@21-1");
		addCustomizerNodeFromJson("水利関係（一時入力）_5.json", "n@21-1");
		addCustomizerNodeFromJson("水利関係（一時入力）_6.json", "n@21-1");
		addCustomizerNodeFromJson("水利関係（一時入力）_7.json", "n@21-1");
		addCustomizerNodeFromJson("水利関係（一時入力）_8.json", "n@21-1");
		addCustomizerNodeFromJson("現場画像（一時入力）.json", "n@22-1");
		addCustomizerNodeFromJson(
			"インフラ／ライフライン（一時入力）.json",
			"n@23-1"
		);
		addCustomizerNodeFromJson("通行止め（一時入力）.json", "n@24-1");
		addCustomizerNodeFromJson("作図用_その他.json", "n@28-1");
		addCustomizerNodeFromJson("作図用_指揮隊風向き.json", "n@28-1");
		addCustomizerNodeFromJson("作図用_車両.json", "n@28-1");
		for (var i = 0; i < 15; i++) {
			jsonflg[i] = true;
		}

		ret.result = "success";
		callback(ret);
	},
	//submit(){
	//	$("#postToIframe").submit().remove();
	//},
	//--------------------------------------------------------------------------------------------------------------
	//位置指定
	//--------------------------------------------------------------------------------------------------------------
	setPosition(position, animateFlag, callback) {
		LogOut("setPosition start");

		//$("#postToIframe").submit().remove();
		if (
			position.lon > -188669211 &&
			position.lon < 91616819 &&
			position.lat > -290670512 &&
			position.lat < -414624
		) {
			PRAn2LonLatW(position.lon, position.lat, kijyunkei, retval);

			facade.setPosition(
				{
					lat: retval[1],
					lon: retval[0],
				},
				animateFlag,
				function(ret) {
					LogOut("setPosition end");

					callback(ret);
				}
			);
		} else {
			const result = {};
			result.result = "error";
			result.methodName = "setPosition";
			result.message = "座標範囲外";
			callback(result);
		}
	},
	//--------------------------------------------------------------------------------------------------------------
	//ズームレベル指定
	//--------------------------------------------------------------------------------------------------------------
	setScale(zoomLevel, animateFlag, callback) {
		var zoom = parseInt(zoomLevel);

		facade.setScale(zoom, animateFlag, function(ret) {
			callback(ret);
		});
	},
	//--------------------------------------------------------------------------------------------------------------
	//角度指定
	//--------------------------------------------------------------------------------------------------------------
	setAngle(angle, animateFlag, callback) {
		console.log(angle);

		facade.setAngle(parseInt(angle), animateFlag, function(ret) {
			//console.log(ret);
			callback(ret);
		});
	},
	//--------------------------------------------------------------------------------------------------------------
	//レイヤ表示切替
	//--------------------------------------------------------------------------------------------------------------
	changeVisibleLayer(layerId, isVisible, callback) {
		layerId = ChangeLay2(layerId);
		LogOut("changeVisibleLayer start:" + isVisible + "," + layerId);

		if (ope_mode == 1) {
			//訓練モード
			console.log("訓練モードなので代替レイヤを使用する");

			if (layerId == "n@1-1") {
				layerId = "n@12-1";
			}
			if (layerId == "n@10-1") {
				layerId = "n@13-1";
			}
			if (layerId == "n@14-1") {
				isVisible = false;
			}
			if (layerId == "n@15-1") {
				isVisible = false;
			}
			if (layerId == "n@16-1") {
				isVisible = false;
			}
		}

		//if (ope_mode == 0 && layerId == "n@12-1") {
		//	isVisible = false;
		//}
		//if (ope_mode == 0 && layerId == "n@13-1") {
		//	isVisible = false;
		//}

		//if(ope_mode == 0){
		facade.changeVisibleLayer(layerId, isVisible, function(ret) {
			LogOut("changeVisibleLayer end:" + isVisible + "," + layerId);

			console.log(ret);
			callback(ret);
		});

		//}else{

		//}
	},
	//--------------------------------------------------------------------------------------------------------------
	//レイヤ表示切替(複数) 2025.09.01
	//--------------------------------------------------------------------------------------------------------------

	changeVisibleLayers(layerIds, isVisible, callback) {
		var layerStr = "";
		for (var i = 0; i < layerIds.length; i++) {

			var layerId = ChangeLay2(layerIds[i])


			if (ope_mode == 1) {
				//訓練モード
				console.log("訓練モードなので代替レイヤを使用する");

				if (layerId == "n@1-1") {
					layerId = "n@12-1";
				}
				if (layerId == "n@10-1") {
					layerId = "n@13-1";
				}
			}

			if (i > 0) {
				layerStr += ",";
			}
			layerStr += layerId;
		}
		console.log(layerStr);
		facade.changeVisibleLayers(layerStr, isVisible, function(ret) {
			console.log(ret);
			callback(ret);
		});
	},
	//--------------------------------------------------------------------------------------------------------------
	//レイヤ一覧取得
	//--------------------------------------------------------------------------------------------------------------
	getLayerList(callback) {
		facade.getLayerList(function(ret) {
			console.log(ret);

			for (var i = 0; i < ret.value.length; i++) {
				console.log(ret.value[i].id);

				ret.value[i].id = ChangeLay(ret.value[i].id);
				ret.value[i].name = ChangeLayerName(ret.value[i].name);
			}

			callback(ret);
		});
	},
	//--------------------------------------------------------------------------------------------------------------
	//表示レイヤ一覧取得
	//--------------------------------------------------------------------------------------------------------------
	getVisibleLayerList(callback) {
		facade.getVisibleLayerList(function(ret) {
			for (var i = 0; i < ret.value.length; i++) {
				ret.value[i].id = ChangeLay(ret.value[i].id);
				ret.value[i].name = ChangeLayerName(ret.value[i].name);
			}

			callback(ret);
		});
	},
	//--------------------------------------------------------------------------------------------------------------
	//フォルダ表示切替
	//--------------------------------------------------------------------------------------------------------------
	changeVisibleFolder(folderId, isVisible, callback) {
		//    facade.changeVisibleLayer(folderId, isVisible, function (ret) {
		facade.changeVisibleFolder(folderId, isVisible, function(ret) {
			callback(ret);
		});
	},
	//--------------------------------------------------------------------------------------------------------------
	//フォルダ一覧取得
	//--------------------------------------------------------------------------------------------------------------
	getFolderList(callback) {
		facade.getFolderList(function(ret) {
			callback(ret);
		});
	},
	//位置取得
	getPosition(callback) {
		facade.getPosition(function(ret) {
			LonLatW2PRAn(ret.value.lon, ret.value.lat, kijyunkei, retval);
			//mmで返す
			ret.value.lon = retval[0];
			ret.value.lat = retval[1];

			callback(ret);
		});
	},
	//ズームレベル取得
	getScale(callback) {
		facade.getScale(function(ret) {
			callback(ret);
		});
	},
	//表示領域取得
	getViewExtent(callback) {
		facade.getViewExtent(function(ret) {
			var lx = new Array(2);
			var ly = new Array(2);

			lx[0] = ret.value.maxX * 3600 * 1000;
			lx[1] = ret.value.minX * 3600 * 1000;
			ly[0] = ret.value.maxY * 3600 * 1000;
			ly[1] = ret.value.minY * 3600 * 1000;

			//座標を正規化座標に変換

			//測地系変換

			ConvW2J(lx[0], ly[0], lonlat);

			var lx2 = lonlat[0] / 1000;
			var ly2 = lonlat[1] / 1000;

			console.log(lx2 + "," + ly2);

			//経緯度を正規化座標に変換

			gpconv(lx2, ly2, kijyunkei, lonlat);

			console.log(lonlat[0] + "," + lonlat[1]);

			ret.value.maxX = lonlat[0] * 1000;
			ret.value.maxY = lonlat[1] * 1000;

			ConvW2J(lx[1], ly[1], lonlat);

			lx2 = lonlat[0] / 1000;
			ly2 = lonlat[1] / 1000;

			console.log(lx2 + "," + ly2);

			//経緯度を正規化座標に変換

			gpconv(lx2, ly2, kijyunkei, lonlat);

			console.log(lonlat[0] + "," + lonlat[1]);

			ret.value.minX = lonlat[0] * 1000;
			ret.value.minY = lonlat[1] * 1000;

			callback(ret);
		});
	},
	//ポイント描画
	drawPoints(layerId, json, callback) {
		var data = [];

		//    console.log(json);
		var param = JSON.parse(json);

		for (var i = 0; i < param.length; i++) {
			var info = {};

			var v_drawMode = param[i].drawMode;

			var v_lon = param[i].pt.lon;
			var v_lat = param[i].pt.lat;

			PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);

			info.wkt = "POINT (" + retval[0] + " " + retval[1] + ")";

			//2022.12.07
			var str = JSON.stringify(param[i].attribute);
			str = str.replace("SYMBOLID", "シンボル種別");
			info.attributes = JSON.parse(str);
			//      info.attributes = param[i].attribute;

			data.push(info);
		}

		console.log("layerId=" + layerId);
		console.log(data);

		layerId = ChangeLay2(layerId);

		facade.drawItems(
			layerId,
			data, //JSONにせずに渡す
			function(ret) {
				//2023.04.04
				for (var i = 0; i < ret.value.length; i++) {
					tmp_info = {};
					tmp_info.zx = param[i].pt.lon;
					tmp_info.zy = param[i].pt.lat;
					tmp_info.attribute = param[i].attribute;
					tmp_info.layerId = ret.value[i].layerId;
					tmp_info.itemId = ret.value[i].itemId;
					tmp_data.push(tmp_info);
				}
				console.log(tmp_data);

				callback(ret);
			}
		);
	},
	//ライン描画
	drawContinuationLine(layerId, json, callback) {
		var data = [];

		console.log(json);
		var param = JSON.parse(json);

		for (var i = 0; i < param.length; i++) {
			var info = {};

			var v_drawMode = param[i].drawMode;

			info.wkt = "LINESTRING(";

			for (var j = 0; j < param[i].vertex.length; j++) {
				var v_lon = param[i].vertex[j].lon;
				var v_lat = param[i].vertex[j].lat;

				PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);

				if (j > 0) {
					info.wkt += ", ";
				}
				info.wkt += retval[0] + " " + retval[1];
			}
			info.wkt += ")";
			console.log(info.wkt);

			//2022.12.07
			var str = JSON.stringify(param[i].attribute);
			str = str.replace("SYMBOLID", "シンボル種別");
			info.attributes = JSON.parse(str);
			//      info.attributes = param[i].attribute;

			data.push(info);
		}

		console.log("layerId=" + layerId);

		layerId = ChangeLay2(layerId);

		facade.drawItems(
			layerId,
			data, //JSONにせずに渡す
			function(ret) {
				console.log(ret);
				callback(ret);
			}
		);
	},
	//ポリゴン描画
	drawPolygon(layerId, json, callback) {
		var data = [];

		console.log(json);
		var param = JSON.parse(json);

		for (var i = 0; i < param.length; i++) {
			var info = {};

			var v_drawMode = param[i].drawMode;

			info.wkt = "POLYGON(";

			for (var j = 0; j < param[i].vertex.length; j++) {
				var v_lon = param[i].vertex[j].lon;
				var v_lat = param[i].vertex[j].lat;

				PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);

				if (j > 0) {
					info.wkt += ", ";
				}
				info.wkt += retval[0] + " " + retval[1];
			}
			info.wkt += ")";
			console.log(info.wkt);

			//2022.12.07
			var str = JSON.stringify(param[i].attribute);
			str = str.replace("SYMBOLID", "シンボル種別");
			info.attributes = JSON.parse(str);
			//      info.attributes = param[i].attribute;
			data.push(info);
		}

		console.log(data);

		layerId = ChangeLay2(layerId);

		facade.drawItems(
			layerId,
			data, //JSONにせずに渡す
			function(ret) {
				console.log(ret);
				callback(ret);
			}
		);
	},
	//文字描画
	drawText(layerId, json, callback) {
		var data = [];

		console.log(json);
		var param = JSON.parse(json);

		for (var i = 0; i < param.length; i++) {
			var info = {};

			var v_drawMode = param[i].drawMode;

			var v_lon = param[i].pt.lon;
			var v_lat = param[i].pt.lat;

			PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);

			info.wkt = "POINT (" + retval[0] + " " + retval[1] + ")";

			console.log(info.wkt);

			info.attributes = param[i].attribute;
			data.push(info);
		}

		layerId = ChangeLay2(layerId);

		facade.drawItems(
			layerId,
			data, //JSONにせずに渡す
			function(ret) {
				console.log(ret);
				callback(ret);
			}
		);
	},
	//図形削除
	deleteItem(layerId, itemId, callback) {
		var i = parseInt(itemId);

		layerId = ChangeLay2(layerId);

		//2023.04.04
		tmp_data = tmp_data.filter(
			(item) => !(item.layerId == layerId && item.itemId == itemId)
		);

		facade.deleteItem(layerId, parseInt(itemId), function(ret) {
			console.log(ret);
			callback(ret);
		});
	},
	//図形削除(複数)
	deleteItems(json, callback) {
		console.log(json);

		const ret = {};

		var param = JSON.parse(json);
		for (var i = 0; i < param.length; i++) {
			var layerId = param[i].layerId;
			var itemId = param[i].itemId;

			layerId = ChangeLay2(layerId);

			//2023.04.04
			tmp_data = tmp_data.filter(
				(item) => !(item.layerId == layerId && item.itemId == itemId)
			);
			console.log(tmp_data);

			facade.deleteItem(layerId, parseInt(itemId), function(ret) {
				console.log(ret);
			});
		}
		ret.result = "SUCCESS";
		callback(ret);
	},
	//作図モード開始
	startDrawMode(drawType, layerNodeId, callback) {
		layerNodeId = ChangeLay2(layerNodeId);

		//facade.startDrawMode(mode,layerId,function(ret) {
		//consolelog(ret);
		//}, function(ret){consolelog(ret)
		//});

		facade.startDrawMode(
			drawType,
			layerNodeId,
			function(ret) {
				console.log(ret);

				if (ret.value.length > 0) {
					for (var k = 0; k < ret.value.length; k++) {
						var geomWKT = ret.value[k].geomWKT;

						console.log("1:geomWKT=" + geomWKT);

						var items = geomWKT.split(" ");

						for (var i = 0; i < items.length; i++) {
							items[i] = items[i].replace(/\(/g, "");
							items[i] = items[i].replace(/\)/g, "");
							items[i] = items[i].replace(/\,/g, "");
						}

						geomWKT = items[0] + " ((";

						var points = (items.length - 1) / 2;

						for (var i = 0; i < points; i++) {
							LonLatW2PRAn(
								items[i * 2 + 1],
								items[i * 2 + 2],
								kijyunkei,
								retval
							);

							console.log(retval[0]); //lon
							console.log(retval[1]); //lat

							ret.lon = retval[0];
							ret.lat = retval[1];

							if (i > 0) {
								geomWKT += ", ";
							}

							geomWKT += ret.lon;
							geomWKT += " ";
							geomWKT += ret.lat;
						}
						geomWKT += "))";

						console.log("2:geomWKT=" + geomWKT);

						ret.value[k].geomWKT = geomWKT;
					}
				}
				callback(ret);
			},
			function(ret) {
				ret.result = "cancel";
				callback(ret);
			}
		);
	},
	//作図モード開始
	startDrawMode2(drawType, layerNodeId, SymbolId, attr, callback) {
		layerNodeId = ChangeLay2(layerNodeId);

		const result = {};

		facade.startDrawMode(
			drawType,
			layerNodeId,
			function(ret) {
				var pointinfo = [];

				console.log(ret);

				if (ret.value.length > 0) {
					for (var k = 0; k < ret.value.length; k++) {
						var geomWKT = ret.value[k].geomWKT;

						//console.log("1:geomWKT=" + geomWKT);

						var items = geomWKT.split(" ");

						var points = (items.length - 1) / 2;

						if (k == 0) {
							result.points = points - 1;
						}

						for (var i = 0; i < items.length; i++) {
							items[i] = items[i].replace(/\(/g, "");
							items[i] = items[i].replace(/\)/g, "");
							items[i] = items[i].replace(/\,/g, "");
						}

						geomWKT = items[0] + " ((";

						result.strWKT = "";

						for (var i = 0; i < points; i++) {
							//
							//経緯度を配列に格納
							//
							pointinfo.push(items[i * 2 + 1]);
							pointinfo.push(items[i * 2 + 2]);

							LonLatW2PRAn(
								items[i * 2 + 1],
								items[i * 2 + 2],
								kijyunkei,
								retval
							);

							console.log(retval[0]); //lon
							console.log(retval[1]); //lat

							ret.lon = retval[0];
							ret.lat = retval[1];

							if (k == 0) {
								if (i < points - 1) {
									if (ret.lon >= 0) {
										result.strWKT += (
											"0000000000000" + parseInt(ret.lon)
										).slice(-13);
									} else {
										result.strWKT +=
											"-" +
											("000000000000" + Math.abs(parseInt(ret.lon))).slice(-12);
									}
									if (ret.lat >= 0) {
										result.strWKT += (
											"0000000000000" + parseInt(ret.lat)
										).slice(-13);
									} else {
										result.strWKT +=
											"-" +
											("000000000000" + Math.abs(parseInt(ret.lat))).slice(-12);
									}
								}
							}

							if (i > 0) {
								geomWKT += ", ";
							}

							geomWKT += ret.lon;
							geomWKT += " ";
							geomWKT += ret.lat;
						}
						geomWKT += "))";

						//console.log("2:geomWKT=" + geomWKT);

						ret.value[k].geomWKT = geomWKT;
					}

					//複数あっても最初の1件しか返さない
					result.itemId = ret.value[0].itemId;
					result.geomWKT = ret.value[0].geomWKT;

					//中間テーブル追加

					var lay_no;
					var item_no;
					var info_type;
					var info_summery;
					var lay_type;
					var symbol_no;
					var zahyo_x;
					var zahyo_y;
					var strinfo1;
					var strinfo2;
					var strinfo3;
					var str_zahyo_x;
					var str_zahyo_y;
					var zahyo_cnt;
					var info_zahyo;

					if (drawType == "Symbol") {
						lay_type = 1;
					}
					if (drawType == "Line") {
						lay_type = 2;
					}
					if (drawType == "Polygon") {
						lay_type = 3;
					}

					//属性編集
					let label = Object.keys(attr);
					var attr_str = "";
					for (var i = 0; i < label.length; i++) {
						if (i > 0) {
							attr_str += ",";
						}
						attr_str += label[i];
						attr_str += ",";
						attr_str += attr[label[i]];
					}

					if (layerNodeId == "n@23-1") {
						//ライフライン
						lay_no = "n@15-1";
						info_type = 15;
					}
					if (layerNodeId == "n@24-1") {
						//通行止め
						lay_no = "n@16-1";
						info_type = 16;
					}

					if (layerNodeId == "n@28-1") {
						//指揮隊
						lay_no = "n@10-1";
						info_type = 10;
					}

					symbol_no = SymbolId;
					info_summery = attr_str;

					item_no = "";
					zahyo_x = pointinfo[0];
					zahyo_y = pointinfo[1];
					strinfo1 = "";
					strinfo2 = "";
					strinfo3 = "";
					str_zahyo_x = 0.0;
					str_zahyo_y = 0.0;
					zahyo_cnt = points;
					info_zahyo = pointinfo;

					var dbresult = new Array();

					var xhr = new XMLHttpRequest();

					var url = "https://" + GIS_SERVER_IP + ":8443/Sample/InsertDB?";
					url += "lay_no=";
					url += lay_no;
					url += "&item_no=";
					url += item_no;
					url += "&info_type=";
					url += info_type;
					url += "&info_summery=";
					url += info_summery;
					url += "&lay_type=";
					url += lay_type;
					url += "&symbol_no=";
					url += symbol_no;
					url += "&zahyo_x=";
					url += zahyo_x;
					url += "&zahyo_y=";
					url += zahyo_y;
					url += "&strinfo1=";
					url += strinfo1;
					url += "&strinfo2=";
					url += strinfo2;
					url += "&strinfo3=";
					url += strinfo3;
					url += "&str_zahyo_x=";
					url += str_zahyo_x;
					url += "&str_zahyo_y=";
					url += str_zahyo_y;
					url += "&zahyo_cnt=";
					url += zahyo_cnt;

					url += "&info_zahyo=";
					url += info_zahyo;

					console.log(url);

					xhr.open("GET", url);
					xhr.send();

					xhr.onreadystatechange = function() {
						if (xhr.readyState === 4 && xhr.status === 200) {
							var json = xhr.responseText;

							var param = JSON.parse(json);

							console.log(json);

							//2023.07.02
							LonLatW2PRAn(param.zahyo_x, param.zahyo_y, kijyunkei, retval);

							result.lon = retval[0];
							result.lat = retval[1];

							result.methodName = ret.methodName;
							result.result = ret.result;
							result.message;
							result.value = ret.value;

							result.db_itemId = param.item_no;

							console.log(result);

							//
							//中間ファイルからレイヤ作成
							//
							//var value = String(info_type);
							//UpdateDB(value);

							callback(result);
						}
					};
				} //if
			},
			function(ret) {
				ret.result = "cancel";
				callback(ret);
			}
		);
	},
	//作図モード開始（直接更新）
	startDrawMode3(drawType, i_layerNodeId, SymbolId, attr, callback) {
		layerNodeId = ChangeLay2(i_layerNodeId);

		const result = {};

		var wk_layerNodeId = "n@28-1";

		facade.startDrawMode(
			drawType,
			wk_layerNodeId,
			function(ret) {
				var pointinfo = [];

				console.log(ret);

				if (ret.value.length > 0) {
					for (var k = 0; k < ret.value.length; k++) {
						var geomWKT = ret.value[k].geomWKT;

						var items = geomWKT.split(" ");
						var points = (items.length - 1) / 2;

						for (var i = 0; i < items.length; i++) {
							items[i] = items[i].replace(/\(/g, "");
							items[i] = items[i].replace(/\)/g, "");
							items[i] = items[i].replace(/\,/g, "");
						}

						geomWKT = items[0] + " ((";

						//2023.07.02
						if (k == 0) {
							result.points = points - 1;
						}

						result.strWKT = "";

						for (var i = 0; i < points; i++) {
							//
							//経緯度を配列に格納
							//
							pointinfo.push(items[i * 2 + 1]);
							pointinfo.push(items[i * 2 + 2]);

							LonLatW2PRAn(
								items[i * 2 + 1],
								items[i * 2 + 2],
								kijyunkei,
								retval
							);

							console.log(retval[0]); //lon
							console.log(retval[1]); //lat

							ret.lon = retval[0];
							ret.lat = retval[1];

							if (i > 0) {
								geomWKT += ", ";
							}

							geomWKT += ret.lon;
							geomWKT += " ";
							geomWKT += ret.lat;
						}
						geomWKT += "))";

						ret.value[k].geomWKT = geomWKT;
					}

					//複数あっても最初の1件しか返さない
					result.itemId = ret.value[0].itemId;
					result.geomWKT = ret.value[0].geomWKT;

					//中間テーブル追加

					var lay_no;
					var item_no;
					var info_type;
					var info_summery;
					var lay_type;
					var symbol_no;
					var zahyo_x;
					var zahyo_y;
					var strinfo1;
					var strinfo2;
					var strinfo3;
					var str_zahyo_x;
					var str_zahyo_y;
					var zahyo_cnt;
					var info_zahyo;

					lay_no = layerNodeId;

					if (drawType == "Symbol") {
						lay_type = 1;
					}
					if (drawType == "Line") {
						lay_type = 2;
					}
					if (drawType == "Polygon") {
						lay_type = 3;
					}

					//属性編集
					let label = Object.keys(attr);
					var attr_str = "";
					for (var i = 0; i < label.length; i++) {
						if (i > 0) {
							attr_str += ",";
						}
						attr_str += label[i];
						attr_str += ",";
						attr_str += attr[label[i]];
					}

					info_type = i_layerNodeId;

					symbol_no = SymbolId;
					info_summery = attr_str;

					item_no = "";
					zahyo_x = pointinfo[0];
					zahyo_y = pointinfo[1];
					strinfo1 = "";
					strinfo2 = "";
					strinfo3 = "";
					str_zahyo_x = 0.0;
					str_zahyo_y = 0.0;
					zahyo_cnt = points;
					info_zahyo = pointinfo;

					var dbresult = new Array();

					var xhr = new XMLHttpRequest();

					var url = "https://" + GIS_SERVER_IP + ":8443/Sample/InsertDB?";
					url += "lay_no=";
					url += lay_no;
					url += "&item_no=";
					url += item_no;
					url += "&info_type=";
					url += info_type;
					url += "&info_summery=";
					url += info_summery;
					url += "&lay_type=";
					url += lay_type;
					url += "&symbol_no=";
					url += symbol_no;
					url += "&zahyo_x=";
					url += zahyo_x;
					url += "&zahyo_y=";
					url += zahyo_y;
					url += "&strinfo1=";
					url += strinfo1;
					url += "&strinfo2=";
					url += strinfo2;
					url += "&strinfo3=";
					url += strinfo3;
					url += "&str_zahyo_x=";
					url += str_zahyo_x;
					url += "&str_zahyo_y=";
					url += str_zahyo_y;
					url += "&zahyo_cnt=";
					url += zahyo_cnt;

					url += "&info_zahyo=";
					url += info_zahyo;

					console.log(url);

					xhr.open("GET", url);
					xhr.send();

					xhr.onreadystatechange = function() {
						if (xhr.readyState === 4 && xhr.status === 200) {
							var json = xhr.responseText;

							var param = JSON.parse(json);

							console.log(json);

							//2023.07.02
							LonLatW2PRAn(param.zahyo_x, param.zahyo_y, kijyunkei, retval);

							result.lon = retval[0];
							result.lat = retval[1];

							result.methodName = ret.methodName;
							result.result = ret.result;
							result.message;
							result.value = ret.value;

							result.db_itemId = param.item_no;

							console.log(result);

							//
							//中間ファイルからレイヤ作成
							//
							var value = String(info_type);
							UpdateDB(value);

							callback(result);
						}
					};
				} //if
			},
			function(ret) {
				ret.result = "cancel";
				callback(ret);
			}
		);
	},
	//
	//作図モード開始（行政界ポリゴン）
	//
	startAddrPolygon(mode, callback) {
		const result = {};

		var layerId = "109";
		MapObj.refreshLayer(layerId, function(ret) { });

		if (mode == true) {
			click_mode = "getaddr";
			result.message = "行政界取得モード";
		} else {
			click_mode = "none";
			result.message = "行政界取得モードはキャンセルされました";
		}
		result.methodName = "startAddrPolygon";
		result.result = "success";
		callback(result);
	},
	//レイヤ追加**
	addLayerNode(name, parentNodeId, callback) {
		facade.addNewLayerNode(name, parentNodeId, function(ret) {
			callback(ret);
		});
	},
	//レイヤ・フォルダ削除**
	removeNode(nodeId, callback) {
		facade.removeNode(nodeId, function(ret) {
			callback(ret);
		});
	},
	//UTMポイント取得
	getUtmPointFromPosition(position, callback) {
		PRAn2LonLatW(position.lon, position.lat, kijyunkei, retval);

		facade.getUtmPointFromPosition(
			{
				lat: retval[1],
				lon: retval[0],
			},

			function(ret) {
				callback(ret);
			}
		);
	},
	//画像・動画表示
	addThumbnail(layerId, position, type, src, callback) {
		PRAn2LonLatW(position.lon, position.lat, kijyunkei, retval);
		layerId = ChangeLay2(layerId);

		//image
		if (type == "image") {
			url =
				'<iframe src="https://' +
				GIS_SERVER_IP +
				":8443/StreamList/Imagethumbnail.html?src=" +
				src +
				'" width="120" scrolling="no"></iframe>';
			//      url = "https://172.18.73.41:8443/StreamList/Imagethumbnail.html";
			console.log(url);
		}
		//video
		if (type == "video") {
			url =
				"https://' + GIS_SERVER_IP +':8443/StreamList/Moviethumbnail.html?src=" +
				src;
			url += "&terminal_type=";
			url += init_terminal_type;
		}
		//stream
		if (type == "stream") {
			//https://172.18.73.41:8443/StreamList/Videothumbnail.html?id=s01@jpf.com
			url = src;
			url += "&terminal_type=";
			url += init_terminal_type;
		}
		type = "Iframe";
		facade.addThumbnail(
			layerId,
			{
				lat: retval[1],
				lon: retval[0],
			},
			type,
			url,
			function(ret) {
				console.log(ret);
				callback(ret);
			}
		);
	},
	//画像・動画表示2
	addThumbnail2(position, type, src, callback) {
		PRAn2LonLatW(position.lon, position.lat, kijyunkei, retval);

		//映像レイヤ表示
		var layerId = "14";
		var isVisible = true;
		layerId = ChangeLay2(layerId);

		facade.changeVisibleLayer(layerId, isVisible, function(ret) {
			console.log(ret);
			callback(ret);
		});

		var lefttop = new Array();
		var animateFlag = false;

		facade.setPosition(
			{
				lat: retval[1],
				lon: retval[0],
			},
			animateFlag,
			function(ret) {
				LonLatToDisplayPos(position.lon, position.lat, lefttop, function(ret) {
					for (var j = 0; j < src.length; j++) {
						for (var i = 0; i < dlg_max; i++) {
							console.log("dialog" + i + "=" + dlg_flg[i]);
							if (dlg_flg[i] == false) {
								console.log("display dialog" + i);
								showdlg(i + 1, type, src[j], lefttop[0] + 120 * j, lefttop[1]);
								dlg_flg[i] = true;
								break;
							}
						}
					}
				});
			}
		);
	},
	//画像出力
	exportImage(imageType, callback) {
		facade.exportImage(imageType, function(ret) {
			/*
				  Base64ToImage(ret.value, function(img) {
					  //        let save_dialog = document.querySelector("save_dialog_div");
					  let save_dialog = document.getElementById("save_dialog");
					  let save_dialog_close = document.getElementById("save_dialog_close");
					  let save_dialog_image = document.getElementById("save_dialog_image");
	  	
					  save_dialog.showModal();
	  	
					  while (save_dialog_image.firstChild) {
						  save_dialog_image.removeChild(save_dialog_image.firstChild);
					  }
	  	
					  save_dialog_image.appendChild(img);
					  save_dialog_close.addEventListener(
						  "click",
						  function() {
							  save_dialog.close();
						  },
						  false
					  );
				  });
				  */
			callback(ret);
		});
	},
	//画像出力2
	exportImage2(imageType, imageFileName, callback) {
		facade.exportImage(imageType, function(ret) {
			//
			//base64形式をサーバに送信する
			//
			const param = {
				method: "POST",
				filename: imageFileName,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
				},
				body: JSON.stringify({ data: ret.value }),
			};

			var xhr = new XMLHttpRequest();
			var url = "https://" + GIS_SERVER_IP + ":8443/Sample/RecvImage";

			xhr.open("POST", url);
			xhr.onload = function(e) {
				console.log(e.currentTarget.responseText);
			};
			xhr.send(JSON.stringify(param));

			callback(ret);
		});
	},

	//レイヤメニュー表示
	setControlVisibility(controlName, isVisible, callback) {
		facade.setControlVisibility(controlName, isVisible, function(ret) {
			callback(ret);
		});
	},
	//レイヤ更新
	refreshLayer(layerId, callback) {
		layerId = ChangeLay2(layerId);

		//2023.04.04
		tmp_data = tmp_data.filter((item) => !(item.layerId == layerId));
		console.log(tmp_data);

		facade.refreshLayer(layerId, function(ret) {
			callback(ret);
		});
	},
	//全レイヤ更新
	refreshAllLayer(callback) {
		//2023.04.04
		tmp_data = [];

		facade.refreshAllLayer(function(ret) {
			callback(ret);
		});
	},
	//密度分布
	densityAnalysis(layerId, size, callback) {
		if (densityAnalysis_flg == true) {
			const result = {};
			result.result = "error";
			callback(result);
		} else {
			layerId = ChangeLay2(layerId);

			console.log(layerId);
			console.log(size);

			facade.densityAnalysis(layerId, size, function(ret) {
				console.log(ret);

				if (ret.result == "success") {
					densityAnalysis_layerId = ret.value.layerId;
					densityAnalysis_flg = true;

					var sep = 0;

					for (var i = 0; i < ret.value.entry.length; i++) {
						var label_wk = ret.value.entry[i].label;

						console.log(label_wk);

						var param = label_wk.split(" ");
						var low = param[0].replace(",", "");
						var high = param[2].replace(",", "");

						low = Math.floor(low);
						console.log("sep=" + sep);
						if (high > 0) {
							high = Math.floor(high) - 1;
							sep = high - low;
						} else {
							high = low + sep;
						}

						ret.value.entry[i].label = low + " ~ " + high;
					}
				}

				callback(ret);
			});
		}
	},
	//密度クリア
	densityAnalysis_cls(callback) {
		console.log("密度クリア:" + densityAnalysis_layerId);
		if (densityAnalysis_flg == false) {
			const result = {};
			result.result = "error";
			callback(result);
		} else {
			facade.removeNode(densityAnalysis_layerId, function(ret) {
				console.log(ret);
				densityAnalysis_flg = false;
				callback(ret);
			});
		}
	},
	//イベントリスナ登録
	addListener(eventType, eventId, callback) {
		facade.addListener(eventType, eventId, function(ret) {
			console.log(ret);
			//
			//2023.11.20 changeViewイベント処理をリスナーの先頭に移動
			//
			if (eventType == "changeView") {
				//20230922 changeViewの戻り値に角度を追加
				ret.angle = m_angle;

				event_count++;
				if (event_count > event_count_max) {
					console.log("MAX COUNT=" + event_count_max);
					event_count = 0;
					callback(ret);
				}
			}

			//onRegist時処理しない
			if (ret && ret.value && ret.value.called === "onRegist") {
				return;
			}

			//2023.08.03　右クリック時に入ってくるsingleSnapは無視する
			if (eventType == "singleSnap" && ret.value.data.isRightClick == true) {
				return;
			}

			//-----------20230922 角度取得 start
			if (eventType == "singleSnap") {
				var sc_x = ret.value.data.screen.x;
				var sc_y = ret.value.data.screen.y;

				console.log("screen_x=" + sc_x);
				console.log("screen_y=" + sc_y);

				LonLatW2PRAn(
					ret.value.data.pos.lon,
					ret.value.data.pos.lat,
					kijyunkei,
					retval
				);

				var c_lon = retval[0];
				var c_lat = retval[1];
				console.log("c_lon=" + c_lon);
				console.log("c_lat=" + c_lat);

				var targetElement = document.getElementById("mapPrevframe");

				var clientRect = targetElement.getBoundingClientRect();

				var w = clientRect.right - clientRect.left;
				var h = clientRect.bottom - clientRect.top;

				console.log("w=" + w);
				console.log("h=" + h);

				var x = sc_x - w / 2;
				var y = -(sc_y - h / 2);

				console.log("x=" + x);
				console.log("y=" + y);

				let radian = Math.atan2(y, x);
				let degree = radian * (180 / Math.PI);

				console.log("radian=" + radian);
				console.log("degree=" + degree);

				facade.getPosition(function(ret2) {
					LonLatW2PRAn(ret2.value.lon, ret2.value.lat, kijyunkei, retval);
					//mmで返す

					var p_x = retval[0];
					var p_y = retval[1];

					var x2 = 0;
					var y2 = 0;

					console.log("c_lon=" + c_lon);
					console.log("c_lat=" + c_lat);
					console.log("p_x=" + p_x);
					console.log("p_y=" + p_y);

					x2 = c_lon - p_x;
					y2 = c_lat - p_y;

					console.log("x2=" + x2);
					console.log("y2=" + y2);

					let radian2 = Math.atan2(y2, x2);
					let degree2 = radian2 * (180 / Math.PI);

					console.log("radian2=" + radian2);
					console.log("degree2=" + degree2);

					m_angle = degree2 - degree;
					console.log("m_angle=" + m_angle);

					//callback(ret);
				});
			}

			//-----------20230922 角度取得 end

			//ChangeAttr(ret.value.data.layerNodeId, ret.value.data.attr);

			const result = {};

			var e = ret.value;
			var data = e.data;

			if (eventType == "longPress") {
				//20230420
				if (ret && ret.value && ret.value.called === "onRegist") {
					return;
				}

				var lat = ret.value.data.lat;
				var lon = ret.value.data.lon;
				//showInfoDialog1(lon, lat);

				//        alert("right");
				///callback(ret);
				//20240226 longpressで詳細情報をコールバックに渡す
				GetAttriButes(lon, lat, function(retVal) {
					console.log(retVal);
					callback(retVal);
				});
			}
			if (eventType == "rightClicked") {
				//20230420
				if (ret && ret.value && ret.value.called === "onRegist") {
					return;
				}

				var lat = ret.value.data.lat;
				var lon = ret.value.data.lon;
				showInfoDialog1(lon, lat);

				//        alert("right");
				callback(ret);
			}
			/*
				  if (eventType == "changeView") {
					  //20230922 changeViewの戻り値に角度を追加
					  ret.angle = m_angle;
	  	
					  if (event_count > event_count_max) {
						  console.log("MAX COUNT=" + event_count_max);
						  event_count = 0;
						  callback(ret);
					  }
				  }
				  */
			if (eventType == "singleSnap") {


				if (click_mode == "getaddr") {
					//---------------------------------
					//行政界情報を取得
					//---------------------------------

					facade.getAddressFromPosition(
						{
							lat: data.pos.lat,
							lon: data.pos.lon,
						},
						function(ret) {
							console.log(ret.value.code);
							var code = ret.value.code;
							//27122012002
							if (code.length >= 11) {
								prif = code.substring(0, 2);
								city = code.substring(2, 5);
								town1 = code.substring(5, 8);
								town2 = code.substring(8);

							}

							//20240515
							var seqnum = 0;

							var xhr = new XMLHttpRequest();

							var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetAddrPolygon2?";
							url += "prif=";
							url += prif;
							url += "&city=";
							url += city;
							url += "&town1=";
							url += town1;
							url += "&town2=";
							url += town2;
							url += "&seqnum=";
							url += seqnum;

							console.log(url);

							xhr.open("GET", url, false);
							xhr.send(null);

							if (xhr.status == 200) {
								//データを取得後の処理を書く
								var json = xhr.responseText;
								var param = JSON.parse(json);

								const addr_zahyo = [];

								for (var i = 0; i < param.data.length; i++) {
									var info = {};
									var data = param.data[i];
									info.zahyo_cnt = data.zahyo_cnt;

									const zahyo_info = [];

									var jsondata = [];
									var jsoninfo = {};

									jsoninfo.wkt = "POLYGON(";

									for (var j = 0; j < data.data.length; j++) {
										pos = {};

										if (j > 0) {
											jsoninfo.wkt += ", ";
										}
										jsoninfo.wkt += data.data[j].x + " " + data.data[j].y;

										//経緯度->正規化座標変換
										LonLatW2PRAn(data.data[j].x, data.data[j].y, kijyunkei, retval);

										pos.x = retval[0];
										pos.y = retval[1];
										zahyo_info.push(pos);
									}
									info.zahyo_info = zahyo_info;
									addr_zahyo.push(info);

									jsoninfo.wkt += ")";

									jsoninfo.attributes = {};
									jsondata.push(jsoninfo);

									console.log(jsondata);
									/***** */

									layerId = "n@109";
									facade.drawItems(
										layerId,
										jsondata, //JSONにせずに渡す
										function(ret) {
											console.log(ret);
											//callback(ret);
										}
									);
									/***** */
								}

								//console.log(zahyo_cnt);
								//console.log(zahyo_info);

								var addr = {};

								addr.prif = prif;
								addr.city = city;
								addr.town1 = town1;
								addr.town2 = town2;

								addr.seqnum = seqnum;

								ret.addr = addr;
								ret.click_mode = "getaddr";
								ret.addr_zahyo = addr_zahyo;
								ret.result = "success";
								ret.methodName = "GetAddrPolygon2";
								ret.message = "";

								callback(ret);
							}








						}
					);
					click_mode = "none";
				} else {
					//---------------------------------
					//通常のクリックイベント
					//---------------------------------

					data.layerNodeId = ChangeLay(ret.value.data.layerNodeId);
					LonLatW2PRAn(data.pos.lon, data.pos.lat, kijyunkei, retval);

					//console.log(ret);
					if (data.layerNodeId == "16") {
						console.log(data.attr["アイテム番号"]);

						var lay_no = ret.value.data.layerNodeId;
						var item_no = data.attr["アイテム番号"];

						var xhr = new XMLHttpRequest();

						var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetLinkItem";
						url += "?";
						url += "lay_no=" + "n@16-1";
						url += "&item_no=" + item_no;

						console.log(url);

						xhr.open("GET", url);
						xhr.send();

						xhr.onreadystatechange = function() {
							if (xhr.readyState === 4 && xhr.status === 200) {
								var json = xhr.responseText;

								console.log(json);

								if (json.length >= 12) {
									data.attr["アイテム番号"] = json;
									result.click_mode = "none";
									result.lon = retval[0]; //正規化座標X
									result.lat = retval[1]; //正規化座標Y
									result.data = data;
									result.methodName = "addListener";
									result.message = "通常のクリックイベント";
									result.result = "success";

									callback(result);
								} else {
									//									data.attr["アイテム番号"] = item_no;
									result.click_mode = "none";
									result.lon = retval[0]; //正規化座標X
									result.lat = retval[1]; //正規化座標Y
									result.data = data;
									result.methodName = "addListener";
									result.message = "通常のクリックイベント";
									result.result = "success";

									callback(result);
								}
							}
						};
					}

					//現場画像レイヤ処理

					if (data.layerNodeId == "14" || data.layerNodeId == "22") {
						var lay_no = ret.value.data.layerNodeId;
						var item_no = data.attr["アイテム番号"];
						console.log(data);
						//現場画像
						let len = Object.values(data.attr).length;
						for (var k = 0; k < len; k++) {
							console.log(Object.keys(data.attr)[k]);
							console.log(Object.values(data.attr)[k]);
						}

						var src = [];
						var type = ""; // type:image/video/stream

						if (data.attr["シンボル種別"] == "2417") {
							src[0] = data.attr["現場画像ID"];
							type = "stream";

							if (init_terminal_type == "1") {
								//20230508 受令端末の場合、サムネイルを表示しない
								//20230703 受令端末の場合映像は表示しない
								//var url = 'https://' + GIS_SERVER_IP
								//+ ':8443/StreamList/VideoView.html?id=' + src[0];
								//url += '&terminal_type=';
								//url += init_terminal_type;
								//var option = 'width=330,height=600,toolbar=no,location=no,menubar=no,scrollbars=no';
								//window.open(url, null, option);
							} else {
								//2023.08.07
								//もし該当のレイヤID、アイテムIDがダイアログを表示していたら消去する
								//

								disp_cnt = 0;

								for (var i = 0; i < dlg_max; i++) {
									console.log("#" + dlg_flg[i]);
									console.log("#" + dlg_lay_no[i]);
									console.log("#" + dlg_item_no[i]);

									if (
										dlg_flg[i] == true &&
										dlg_lay_no[i] == lay_no &&
										dlg_item_no[i] == item_no
									) {
										console.log("表示中");
										hidedlg(i + 1);

										disp_cnt++;
									}
								}

								if (disp_cnt == 0) {
									//20230901 一度ダイアログをすべて消す

									for (var i = 0; i < dlg_max; i++) {
										if (dlg_flg[i] == true) {
											hidedlg(i + 1);
										}
									}

									var lefttop = new Array();

									LonLatToDisplayPos(
										retval[0],
										retval[1],
										lefttop,
										function(ret) {
											for (var i = 0; i < dlg_max; i++) {
												console.log("dialog" + i + "=" + dlg_flg[i]);
												if (dlg_flg[i] == false) {
													console.log("display dialog" + i);
													showdlg(i + 1, type, src[0], lefttop[0], lefttop[1]);
													dlg_flg[i] = true;
													dlg_lay_no[i] = lay_no;
													dlg_item_no[i] = item_no;

													break;
												}
											}
										}
									);
								}
							}
						} else {
							if (data.attr["シンボル種別"] == "2402") {
								if (init_terminal_type == "1") {
									//20230703 受令端末の場合、サムネイルを表示しない
								} else {
									//2023.08.07
									//もし該当のレイヤID、アイテムIDがダイアログを表示していたら消去する
									//
									disp_cnt = 0;

									for (var i = 0; i < dlg_max; i++) {
										console.log("#" + dlg_flg[i]);
										console.log("#" + dlg_lay_no[i]);
										console.log("#" + dlg_item_no[i]);
										if (
											dlg_flg[i] == true &&
											dlg_lay_no[i] == lay_no &&
											dlg_item_no[i] == item_no
										) {
											console.log("表示中");
											hidedlg(i + 1);
											disp_cnt++;
										}
									}

									if (disp_cnt == 0) {
										//20230901 一度ダイアログをすべて消す

										for (var i = 0; i < dlg_max; i++) {
											if (dlg_flg[i] == true) {
												hidedlg(i + 1);
											}
										}

										type = "image";
										src[0] = data.attr["リンクファイル１"]; //図面１
										src[1] = data.attr["リンクファイル２"]; //図面２
										src[2] = data.attr["リンクファイル３"]; //図面３
										src[3] = data.attr["リンクファイル４"]; //図面４

										var lefttop = new Array();

										LonLatToDisplayPos(
											retval[0],
											retval[1],
											lefttop,
											function(ret) {
												for (var j = 0; j < dlg_submax; j++) {
													//2023.07.18
													if (src[j].length == 0) {
														break;
													}

													for (var i = 0; i < dlg_max; i++) {
														if (dlg_flg[i] == false) {
															showdlg(
																i + 1,
																type,
																src[j],
																lefttop[0] + 120 * j,
																lefttop[1]
															);
															dlg_flg[i] = true;
															dlg_lay_no[i] = lay_no;
															dlg_item_no[i] = item_no;

															break;
														}
													}
												}
											}
										);
									}
								}
							}
						}
					}

					if (data.layerNodeId == "16") {
					} else {
						result.click_mode = "none";
						result.lon = retval[0]; //正規化座標X
						result.lat = retval[1]; //正規化座標Y
						result.data = data;
						result.methodName = "addListener";
						result.message = "通常のクリックイベント★";
						result.result = "success";

						callback(result);
					}
				}
			}
		});
	},

	removeListener(eventId, callback) {
		facade.removeListener(eventId, function(ret) {
			callback(ret);
		});
	},
	//アイテムスキャン
	scanItemAttributeFromPos(position, radius, layerIdArray, callback) {
		PRAn2LonLatW(position.lon, position.lat, kijyunkei, retval);
		for (var m = 0; m < layerIdArray.length; m++) {
			layerIdArray[m] = ChangeLay2(layerIdArray[m]);
		}

		facade.scanItemAttributeFromPos(
			{
				lat: retval[1],
				lon: retval[0],
			},
			parseInt(radius),
			layerIdArray,
			function(ret) {
				var len = ret.value.length;

				for (var i = 0; i < len; i++) {
					ret.value[i].nodeId = ChangeLay(ret.value[i].nodeId);

					var len2 = ret.value[i].items.length;

					for (var j = 0; j < len2; j++) {
						console.log("itemId=" + ret.value[i].items[j].itemId);

						let len = Object.values(
							ret.value[i].items[j].itemAttributes
						).length;
						console.log(len);

						for (var k = 0; k < len; k++) {
							console.log(Object.keys(ret.value[i].items[j].itemAttributes)[k]);
							console.log(
								Object.values(ret.value[i].items[j].itemAttributes)[k]
							);
						}

						//if (
						//	ret.value[i].items[j].itemAttributes["シンボル種別"] == "2401"
						//) {
						//	ret.value[i].items[j].itemAttributes["福祉コード"] = "12345";
						//}
					}
				}
				callback(ret);
			}
		);
	},
	//アイテムスキャン2
	scanItemAttributeFromPos2(position, radius, callback) {
		PRAn2LonLatW(position.lon, position.lat, kijyunkei, retval);

		let lay_no = [];

		var j = 0;
		//表示中レイヤを取得する
		facade.getVisibleLayerList(function(ret) {
			//			for (var i = 0; i < ret.value.length; i++) {
			//				if (ret.value[i].display == true) {
			//					lay_no[j] = ret.value[i].id;
			//					j++;
			//				}
			//			}
			/*
				  var chk1 = false;
				  var chk2 = false;
				  */
			for (var i = 0; i < ret.value.length; i++) {
				if (ret.value[i].display == true) {
					//		if (ret.value[i].id == "n@4-1" || ret.value[i].id == "n@11-1") {
					//			chk1 = true;
					//		}
					//		if (ret.value[i].id == "n@5-1") {
					//			chk2 = true;
					//		}

					lay_no[j] = ret.value[i].id;
					j++;
				}
			}
			/*
				  //5が非表示で4と11が表示なら5を対象にする
				  if (chk1 == true && chk2 == false) {
					  lay_no[j] = "n@5-1";
				  }
				  */

			var xhr = new XMLHttpRequest();

			//20230906			var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetNearAttributes";
			var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetNearAttributes2";
			url += "?";
			url += "lon=" + retval[0];
			url += "&lat=" + retval[1];
			url += "&radius=" + radius;
			for (var i = 0; i < lay_no.length; i++) {
				url += "&lay_no=" + lay_no[i];
			}

			console.log(url);

			xhr.open("GET", url);
			xhr.send();

			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					var json = xhr.responseText;
					console.log(json);
					res = JSON.parse(json);

					var len = res.data.length;

					console.log("len=" + len);

					let value = [];
					let items = {};
					let data = {};

					for (var i = 0; i < len; i++) {
						data = {};
						items = [];

						data.nodeId = res.data[i].lay_no;

						data2 = {};
						data2.itemId = res.data[i].item_no;
						data2.itemAttributes = JSON.parse(res.data[i].info_summery);

						//ChangeAttr(data.nodeId, data2.itemAttributes);
						items.push(data2);

						data.items = items;

						if (ope_mode == 1) {
							//訓練時
						} else {
							if (res.data[i].info_type != 13) {
								value.push(data);
							}
						}
					}

					var ret = {};
					ret.value = value;
					ret.result = "OK";
					ret.methodName = "scanItemAttributeFromPos2";
					ret.message = "";

					var json2 = JSON.stringify(ret);
					console.log("json2=" + json2);
					callback(ret);
				}
			};
		});
	},
	//住所取得[1]
	getAddressFromPosition(position, callback) {
		PRAn2LonLatW(position.lon, position.lat, kijyunkei, retval);

		facade.getAddressFromPosition(
			{
				lat: retval[1],
				lon: retval[0],
			},
			function(ret) {
				console.log(ret);
				callback(ret);
			}
		);
	},
	//住所取得[2]直近をとる
	getAddressFromPosition2(position, len, callback) {
		var xhr = new XMLHttpRequest();
		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetAddrFromPoint?";
		url += "lx=";
		url += position.lon;
		url += "&ly=";
		url += position.lat;
		url += "&len=";
		url += len;

		console.log(url);

		xhr.open("GET", url, false);
		xhr.send(null);

		if (xhr.status == 200) {
			//データを取得後の処理を書く
			var json = xhr.responseText;

			var res = JSON.parse(json);
			console.log(res);
			var code = "00000000000";

			if (res.result == "OK") {
				for (var i = 0; i < res.data.length; i++) {
					var v_prif = res.data[i].prif;
					var v_city = res.data[i].city;
					var v_town1 = res.data[i].town1;
					var v_town2 = res.data[i].town2;
					var v_name = res.data[i].name;
					var v_kana = res.data[i].kana;
					var v_zx = res.data[i].zx;
					var v_zy = res.data[i].zy;
					var v_lon = res.data[i].lon;
					var v_lat = res.data[i].lat;
					code = ("00" + v_prif).slice(-2);
					code += ("000" + v_city).slice(-3);
					code += ("000" + v_town1).slice(-3);
					code += ("000" + v_town2).slice(-3);
				}
			}
			PRAn2LonLatW(position.lon, position.lat, kijyunkei, retval);

			facade.getAddressFromPosition(
				{
					lat: retval[1],
					lon: retval[0],
				},
				function(ret) {
					ret.value.code = code;
					callback(ret);
				}
			);
		}
	},
	//住所から位置を取得****
	getPositionFromAddress(address, callback) {
		facade.getPositionFromAddress(address, function(ret) {
			console.log("★=" + ret.value.maxX);
			console.log("★=" + ret.value.maxY);
			console.log("★=" + ret.value.minX);
			console.log("★=" + ret.value.minY);

			if (ret.result == "success") {
				var lx = new Array(2);
				var ly = new Array(2);

				lx[0] = ret.value.minX;
				ly[0] = ret.value.minY;
				lx[1] = ret.value.maxX;
				ly[1] = ret.value.maxY;

				LonLatW2PRAn(lx[0], ly[0], kijyunkei, retval);

				ret.value.minX = retval[0] * 1000;
				ret.value.minY = retval[1] * 1000;

				LonLatW2PRAn(lx[1], ly[1], kijyunkei, retval);

				ret.value.maxX = retval[0] * 1000;
				ret.value.maxY = retval[1] * 1000;
			} else {
				ret.value = null;
			}

			callback(ret);
		});
	},
	//作図パネル呼び出し
	startCmdCallbacks(cmdId) {
		facade.startCmdCallbacks(cmdId, {}, function(ret) { });
	},
	//
	//<------------------    WEB API2 --------------------------
	//距離算出
	getLength(jsondata) {
		const ret = {};

		var param = JSON.parse(jsondata);

		let json_array = [];

		for (var i = 0; i < param.length; i++) {
			var v_id = param[i].id;
			var v_lat = param[i].lat;
			var v_lon = param[i].lon;

			var data = {};
			data["id"] = v_id;

			var x1 = param[0].lon;
			var y1 = param[0].lat;
			var x2 = v_lon;
			var y2 = v_lat;

			var len = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

			data["len"] = len;

			json_array.push(data);
		}

		ret.data = JSON.stringify(json_array);
		ret.result = "success";
		return ret;
	},
	//住所名称変換
	getAddrName(prif, city, town1, town2, num) {
		const ret = {};

		let json_array = [];

		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetAddrName?";
		url += "prif=";
		url += prif;
		url += "&city=";
		url += city;
		url += "&town1=";
		url += town1;
		url += "&town2=";
		url += town2;

		console.log(url);

		xhr.open("GET", url, false);
		xhr.send(null);

		ret.AddrName = "";
		ret.result = "error";

		if (xhr.status == 200) {
			//データを取得後の処理を書く
			var json = xhr.responseText;

			ret.AddrName = json + num;

			ret.result = "success";
		}
		return ret;
	},
	//住所一覧
	getAddrList(prif, city, town1, town2) {
		const ret = {};

		let json_array = [];

		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetAddr?";
		url += "prif=";
		url += prif;
		url += "&city=";
		url += city;
		url += "&town1=";
		url += town1;
		url += "&town2=";
		url += town2;

		console.log(url);

		xhr.open("GET", url, false);
		xhr.send(null);

		if (xhr.status == 200) {
			//データを取得後の処理を書く
			var json = xhr.responseText;

			//      var out = "";

			var res = JSON.parse(json);
			console.log(res);

			for (var i = 0; i < res.data.length; i++) {
				var v_prif = res.data[i].prif;
				var v_city = res.data[i].city;
				var v_town1 = res.data[i].town1;
				var v_town2 = res.data[i].town2;
				var v_name = res.data[i].name;
				var v_kana = res.data[i].kana;
				var v_zx = res.data[i].zx;
				var v_zy = res.data[i].zy;
				var v_lon = res.data[i].lon;
				var v_lat = res.data[i].lat;

				var data = {};
				//        data["prif"] = v_prif;
				//        data["city"] = v_city;
				//        data["town1"] = v_town1;
				//        data["town2"] = v_town2;
				//        data["name"] = v_name;
				if (prif == 0 && (city == 0) & (town1 == 0) && town2 == 0) {
					data["id"] = v_prif;
				}
				if (prif > 0 && (city == 0) & (town1 == 0) && town2 == 0) {
					data["id"] = v_city;
				}
				if (prif > 0 && (city > 0) & (town1 == 0) && town2 == 0) {
					data["id"] = v_town1;
				}
				if (prif > 0 && (city > 0) & (town1 > 0) && town2 == 0) {
					data["id"] = v_town2;
				}
				if (prif > 0 && (city > 0) & (town1 > 0) && town2 > 0) {
					data["id"] = v_town2;
				}
				data["name"] = v_name;
				json_array.push(data);
			}

			ret.data = JSON.stringify(json_array);
			ret.result = "success";

			return ret;
		}
	},
	//住所コードの座標を返す
	getAddrPoint(prif, city, town1, town2, num) {
		const ret = {};
		ret.value = {};

		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetAddrPoint?";
		url += "prif=";
		url += prif;
		url += "&city=";
		url += city;
		url += "&town1=";
		url += town1;
		url += "&town2=";
		url += town2;
		url += "&num=";
		url += num;

		console.log(url);

		xhr.open("GET", url, false);
		xhr.send(null);

		if (xhr.status == 200) {
			//データを取得後の処理を書く
			var json = xhr.responseText;

			var out = "";

			var res = JSON.parse(json);
			console.log(res);

			ret.value.lat = 0;
			ret.value.lon = 0;
			ret.result = "error";

			if (res.result == "OK") {
				if (res.data.length > 0) {
					//2023.05.25		ret.value.lat = res.data[0].zx;
					//					ret.value.lon = res.data[0].zy;
					ret.value.lon = res.data[0].zx;
					ret.value.lat = res.data[0].zy;
					ret.result = "success";
				}
			}

			return ret;
		}
	},
	//
	//同心円表示
	//
	drawCircles(layerId, position, r, cnt, callback) {
		layerId = ChangeLay2(layerId);

		var vertex_cnt = 64; //頂点の数
		var cross_len = 40; //十字線の長さ(m)

		if (c_flg == false) {
			var data = [];
			var info = {};
			var point = {};
			var points = [];
			for (var k = 0; k < cnt; k++) {
				info = {};
				points = [];

				for (var i = 0; i < vertex_cnt + 1; i++) {
					var clen = parseInt(r * 1000 * (k + 1));

					console.log("clen=" + clen);

					var range = i * (360 / vertex_cnt);

					point = {};

					var wx = clen * Math.cos((range * Math.PI) / 180);
					var wy = clen * Math.sin((range * Math.PI) / 180);

					console.log(wx);
					console.log(wy);

					point.x = parseInt(position.lon) + wx;
					point.y = parseInt(position.lat) + wy;

					points.push(point);
				}

				console.log(points);
				info.wkt = "LINESTRING(";

				for (var j = 0; j < points.length; j++) {
					var v_lon = points[j].x;
					var v_lat = points[j].y;

					console.log(v_lon);
					console.log(v_lat);

					//オーバフローすると、制御が返ってこない！
					PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
					if (j > 0) {
						info.wkt += ", ";
					}
					info.wkt += retval[0] + " " + retval[1];
				}
				info.wkt += ")";
				var attr = {};
				attr["シンボル種別"] = "3012";

				//attr["AA"]="AA";

				info.attributes = attr;
				data.push(info);
			}

			//十字線たて
			info = {};
			info.wkt = "LINESTRING(";

			v_lon = parseInt(position.lon) + cross_len * 1000;
			v_lat = parseInt(position.lat);
			PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
			info.wkt += retval[0] + " " + retval[1];

			info.wkt += ", ";

			v_lon = parseInt(position.lon) - cross_len * 1000;
			v_lat = parseInt(position.lat);
			PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
			info.wkt += retval[0] + " " + retval[1];

			info.wkt += ")";
			var attr = {};
			attr["シンボル種別"] = "3012";
			info.attributes = attr;

			data.push(info);

			//十字線よこ
			info = {};
			info.wkt = "LINESTRING(";

			v_lon = parseInt(position.lon);
			v_lat = parseInt(position.lat) + cross_len * 1000;
			PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
			info.wkt += retval[0] + " " + retval[1];

			info.wkt += ", ";

			v_lon = parseInt(position.lon);
			v_lat = parseInt(position.lat) - cross_len * 1000;
			PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
			info.wkt += retval[0] + " " + retval[1];

			info.wkt += ")";
			var attr = {};
			attr["シンボル種別"] = "3012";
			info.attributes = attr;

			data.push(info);

			console.log(data);

			facade.drawItems(
				layerId,
				data, //JSONにせずに渡す
				function(ret) {
					console.log("ret=" + ret);
					//
					c_layerId = layerId;

					for (var m = 0; m < ret.value.length; m++) {
						c_itemId[m] = ret.value[m].itemId;
					}

					c_flg = true;
					//
					console.log(ret);
					callback(ret);
				}
			);
		}
	},
	//
	//同心円表示[2]
	//
	drawCircles2(layerId, position, rs, callback) {
		facade.getViewExtent(function(ret) {
			var lx = new Array(2);
			var ly = new Array(2);

			lx[0] = ret.value.maxX;
			lx[1] = ret.value.minX;
			ly[0] = ret.value.maxY;
			ly[1] = ret.value.minY;

			LonLatW2PRAn(lx[0], ly[0], kijyunkei, retval);

			var zx0 = retval[0]; //mm
			var zy0 = retval[1]; //mm

			LonLatW2PRAn(lx[1], ly[1], kijyunkei, retval);

			var zx1 = retval[0]; //mm
			var zy1 = retval[1]; //mm

			var w = Math.abs(zx0 - zx1); //mm
			var h = Math.abs(zy0 - zy1); //mm

			console.log("w=" + w + ",h=" + h);

			layerId = ChangeLay2(layerId);

			cnt = rs.length; //半径のarrayの数

			var vertex_cnt = 64; //頂点の数
			var cross_len = parseInt(w) / (1000 * 30); //十字線の長さ(m)

			if (c_flg == false) {
				var data = [];
				var info = {};
				var point = {};
				var points = [];
				for (var k = 0; k < cnt; k++) {
					info = {};
					points = [];

					for (var i = 0; i < vertex_cnt + 1; i++) {
						var clen = parseInt(rs[k] * 1000);

						console.log("clen=" + clen);

						var range = i * (360 / vertex_cnt);

						point = {};

						var wx = clen * Math.cos((range * Math.PI) / 180);
						var wy = clen * Math.sin((range * Math.PI) / 180);

						point.x = parseInt(position.lon) + wx;
						point.y = parseInt(position.lat) + wy;

						points.push(point);
					}

					info.wkt = "LINESTRING(";

					for (var j = 0; j < points.length; j++) {
						var v_lon = points[j].x;
						var v_lat = points[j].y;

						//オーバフローすると、制御が返ってこない！
						PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
						if (j > 0) {
							info.wkt += ", ";
						}
						info.wkt += retval[0] + " " + retval[1];
					}
					info.wkt += ")";
					var attr = {};
					attr["シンボル種別"] = "3012";

					//attr["AA"]="AA";

					info.attributes = attr;
					data.push(info);
				}

				//十字線たて
				info = {};
				info.wkt = "LINESTRING(";

				v_lon = parseInt(position.lon) + cross_len * 1000;
				v_lat = parseInt(position.lat);
				PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
				info.wkt += retval[0] + " " + retval[1];

				info.wkt += ", ";

				v_lon = parseInt(position.lon) - cross_len * 1000;
				v_lat = parseInt(position.lat);
				PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
				info.wkt += retval[0] + " " + retval[1];

				info.wkt += ")";
				var attr = {};
				attr["シンボル種別"] = "3012";
				info.attributes = attr;

				data.push(info);

				//十字線よこ
				info = {};
				info.wkt = "LINESTRING(";

				v_lon = parseInt(position.lon);
				v_lat = parseInt(position.lat) + cross_len * 1000;
				PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
				info.wkt += retval[0] + " " + retval[1];

				info.wkt += ", ";

				v_lon = parseInt(position.lon);
				v_lat = parseInt(position.lat) - cross_len * 1000;
				PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
				info.wkt += retval[0] + " " + retval[1];

				info.wkt += ")";
				var attr = {};
				attr["シンボル種別"] = "3012";
				info.attributes = attr;

				data.push(info);

				console.log(data);

				facade.drawItems(
					layerId,
					data, //JSONにせずに渡す
					function(ret) {
						console.log("ret=" + ret);
						//
						c_layerId = layerId;

						for (var m = 0; m < ret.value.length; m++) {
							c_itemId[m] = ret.value[m].itemId;
						}

						c_flg = true;
						//
						console.log(ret);
						callback(ret);
					}
				);
			}
		});
	},
	//
	//同心円クリア
	//
	clearCircles(callback) {
		if (c_flg == true) {
			console.log(c_itemId);

			for (var m = 0; m < c_itemId.length; m++) {
				facade.deleteItem(c_layerId, c_itemId[m], function(ret) {
					console.log(ret);
					callback(ret);
				});
			}
			c_flg = false;
		}
	},
	drawThumbNail(isDisp, callback) {
		var layerId = "14";

		//テストデータ--start--

		var pos_info = [];
		var value = {};

		var minx = 0;
		var miny = 0;
		var maxx = 0;
		var maxy = 0;

		if (isDisp == true) {
			//中間テーブルから情報を取得

			var s_layerId = ChangeLay2(layerId);
			var xhr = new XMLHttpRequest();

			var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetStreamSymbol?";
			url += "lay_no=";
			url += s_layerId;
			url += "&symbol_no=";
			url += 2417;

			console.log(url);

			xhr.open("GET", url, false);
			xhr.send(null);

			if (xhr.status == 200) {
				//データを取得後の処理を書く
				var json = xhr.responseText;
				var res = JSON.parse(json);

				//console.log(res);
				for (var i = 0; i < res.data.length; i++) {
					var x = res.data[i].zahyo_x;
					var y = res.data[i].zahyo_y;
					var summery = JSON.parse(res.data[i].info_summery);
					console.log(summery["現場画像ID"]);

					LonLatW2PRAn(x, y, kijyunkei, retval);

					value = {};
					value.lon = retval[0];
					value.lat = retval[1];
					value.src = summery["現場画像ID"];
					pos_info.push(value);
				}

				////サムネイル件数判定　start
				if (pos_info.length == 0) {
					console.log("サムネイル0件");

					console.log("init_lon=" + init_lon + ",init_lat=" + init_lat);
					//20240508 コメント
					//PRAn2LonLatW(init_lon, init_lat, kijyunkei, retval);


					facade.setPosition(
						{
							lat: init_lat,
							lon: init_lon
						},
						animateFlag,
						function(ret) {
							console.log(ret);
							const result = {};

							result.message = "";
							result.methodName = "drawThumbNail2";
							result.result = "success";
							callback(result);
						}
					);
				} else {
					//映像レイヤ表示
					var isVisible = isDisp;
					layerId = ChangeLay2(layerId);

					facade.changeVisibleLayer(layerId, isVisible, function(ret) {
						console.log(ret);
						callback(ret);
					});

					console.log("サムネイル表示");
					for (var i = 0; i < dlg_max; i++) {
						dlg_flg[i] = false;
					}

					//サムネイルの中心と表示領域を求める
					for (var i = 0; i < pos_info.length; i++) {
						if (i == 0) {
							minx = pos_info[i].lon;
							miny = pos_info[i].lat;
							maxx = pos_info[i].lon;
							maxy = pos_info[i].lat;
						} else {
							if (pos_info[i].lon < minx) {
								minx = pos_info[i].lon;
							}
							if (pos_info[i].lon > maxx) {
								maxx = pos_info[i].lon;
							}
							if (pos_info[i].lat < miny) {
								miny = pos_info[i].lat;
							}
							if (pos_info[i].lat > maxy) {
								maxy = pos_info[i].lat;
							}
						}
					}

					var centerx = (minx + maxx) / 2;
					var centery = (miny + maxy) / 2;
					var w = Math.abs(maxx - minx);
					var h = Math.abs(maxy - miny);

					console.log("centerx=" + centerx);
					console.log("centery=" + centery);
					console.log("w=" + w);
					console.log("h=" + h);

					var scale = [];
					GetScale(w, h, scale);

					//世界測地経度緯度に変換
					PRAn2LonLatW(centerx, centery, kijyunkei, retval);

					var animateFlag = false;

					//★中心移動
					facade.setPosition(
						{
							lat: retval[1],
							lon: retval[0],
						},
						animateFlag,
						function(ret) {
							var zoom = parseInt(scale[0]) - 1;
							//★スケール変更
							facade.setScale(zoom, animateFlag, function(ret) {
								//★表示範囲取得
								facade.getViewExtent(function(ret) {
									//地図キャンバスのサイズを取得する
									var targetElement = document.getElementById("mapPrevframe");
									var clientRect = targetElement.getBoundingClientRect();

									var w = clientRect.right - clientRect.left;
									var h = clientRect.bottom - clientRect.top;

									LonLatW2PRAn(ret.value.minX, ret.value.minY, kijyunkei, retval);
									//最小値をmmで返す
									var zx0 = retval[0];
									var zy0 = retval[1];

									LonLatW2PRAn(ret.value.maxX, ret.value.maxY, kijyunkei, retval);
									//最大値をmmで返す
									var zx1 = retval[0];
									var zy1 = retval[1];

									//1pixあたりの距離を求める

									var px = (zx1 - zx0) / w;
									var py = (zy1 - zy0) / h;

									for (var i = 0; i < pos_info.length; i++) {
										console.log(pos_info[i]);

										var src = pos_info[i].src;
										var type = "stream";
										var x = pos_info[i].lon;
										var y = pos_info[i].lat;
										//地図ビューの相対位置を求める
										var left = (x - zx0) / px;
										var top = h - (y - zy0) / py;

										if (i + 1 < dlg_max) {
											//2023.08.04

											console.log("left=" + left);
											console.log("top=" + top);

											if (init_terminal_type == 0) {
												showdlg(i + 1, type, src, left, top); // type:image/video/stream
											} else {
												var offset_x = 60;
												var offset_y = 100;
												showdlg(
													i + 1,
													type,
													src,
													left - offset_x,
													top - offset_y
												); // type:image/video/stream
											}
										}

										dlg_flg[i] = true;
									}
									const result = {};

									result.message = "";
									result.methodName = "drawThumbNail2";
									result.result = "success";

									callback(result);
								});
							});
						}
					);

				}//サムネイル件数判定　end

			}
		} else {
			console.log("サムネイル非表示");
			hidedlg(1);
			hidedlg(2);
			hidedlg(3);
			hidedlg(4);
			hidedlg(5);
			for (var i = 0; i < dlg_max; i++) {
				dlg_flg[i] = false;
			}
			const ret = {};

			ret.message = "";
			ret.methodName = "drawThumbNail2";
			ret.result = "success";

			callback(ret);
		}
	},
	//
	// 映像表示(dialog)
	//
	videoView(termID, callback) {
		//
		//2023.01.18 サムネイルではない
		//
		var url =
			"https://" +
			GIS_SERVER_IP +
			":8443/StreamList/VideoView.html?id=" +
			termID;
		url += "&terminal_type=";
		url += init_terminal_type;

		var url2 =
			"https://" +
			GIS_SERVER_IP +
			":8443/StreamList/VideoView2.html?id=" +
			termID;
		url2 += "&terminal_type=";
		url2 += init_terminal_type;

		if (init_terminal_type == "0") {
			//DAMS
			var option =
				"width=800,height=600,toolbar=no,location=no,menubar=no,scrollbars=no";
			window.open(url, null, option);
		} else {
			if (init_terminal_type == "1") {

				/*
								url =
									"VideoView.html?id=" +
									termID;
								url += "&terminal_type=";
								url += init_terminal_type;
				
								url2 =
									"VideoView2.html?id=" +
									termID;
				*/
				//受令 2023.07.20
				var preview_dialog = document.getElementById("preview_dialog");
				var preview_image = document.getElementById("preview_image");
				var preview_dialog2 = document.getElementById("preview_dialog2");
				var preview_image2 = document.getElementById("preview_image2");

				console.log(termOrientation);

				//portrait-primary 縦長
				//ylandscape-primar　横長

				if (termOrientation == "Landscape") {
					var html = '<iframe src="';
					html += url2;
					html +=
						'" width="100%" height="100%" scrolling="no" marginwidth="1" marginheight="1" ';
					html += "></iframe>";

					console.log(html);

					// 横長の処理
					console.log("横長");
					preview_image2.innerHTML = html;
					preview_dialog2.showModal();
				} else {
					// 縦長の処理
					var html = '<iframe src="';
					html += url;
					html +=
						'" width="100%" height="100%" scrolling="no" marginwidth="1" marginheight="1" ';
					html += "></iframe>";

					if (termOrientation == "Portrait") {
						console.log("縦長");
						preview_image.innerHTML = html;
						preview_dialog.showModal();
					}
				}
			} else {
				var option =
					"width=800,height=600,toolbar=no,location=no,menubar=no,scrollbars=no";
				window.open(url, null, option);
			}
		}
		//Crome ではwidth,height 以外は無効
		//

		/*
			var video_html = '<dialog id="video_dialog" class="video_dialog">';
			video_html += '<button id="video_dialog_close">×</button>';
			video_html +=
			  '<div id="video_dialog_image"><iframe src="https://' +
			  GIS_SERVER_IP +
			  ":8443/StreamList/VideoPlay.html?id=" +
			  termID +
			  '" width="120" scrolling="no">';
			video_html += "</iframe></div>";
			video_html += "</dialog>";
			
			var video_dialog_div = document.createElement("video_dialog_div");
			
			video_dialog_div.innerHTML = video_html;
			document.body.appendChild(video_dialog_div);
			
			const ret = {};
			
			let video_dialog = document.getElementById("video_dialog");
			let video_dialog_close = document.getElementById("video_dialog_close");
			let video_dialog_image = document.getElementById("video_dialog_image");
			
			//    video_dialog.showModal();
			
			//地図ペインの相対位置を取得する
			var flex_top = $(".flex_right").position().top;
			var flex_left = $(".flex_right").position().left;
			
			console.log(flex_top);
			console.log(flex_left);
			
			video_dialog.style.position = "absolute";
			video_dialog.style.top = flex_top + "px";
			video_dialog.style.left = flex_left + "px";
			video_dialog.style.width = "120px";
			video_dialog.style.padding = 0;
			video_dialog.style.border = 0;
			
			video_dialog.show();
			
			video_dialog_image.addEventListener(
			  "click",
			  function () {
				video_dialog.close();
			  },
			  false
			);
			
			video_dialog_close.addEventListener(
			  "click",
			  function () {
				video_dialog.close();
			  },
			  false
			);
			*/

		ret.message = "";
		ret.methodName = "videoView";
		ret.result = "success";
		callback(ret);
	},
	//シンボル表示
	drawSymbolArray(layerId, json, isDisp, callback) {
		if (isDisp == false) {
			console.log("クリア");
			console.log(symbol_array_data);

			//var result = {};

			for (var i = 0; i < symbol_array_data.length; i++) {
				var layerId = symbol_array_data[i].layerId;
				var itemId = symbol_array_data[i].itemId;

				tmp_data = tmp_data.filter(
					(item) => !(item.layerId == layerId && item.itemId == itemId)
				);

				layerId = ChangeLay2(layerId);

				facade.deleteItem(layerId, parseInt(itemId), function(ret) {
					console.log(ret);
				});
			}
			callback(ret);

			//退避中のシンボルをクリア
		} else {
			layerId = ChangeLay2(layerId);

			var param = JSON.parse(json);

			var xhr = new XMLHttpRequest();

			var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetCarInfo";

			//20231024
			url += "?ope_mode=" + ope_mode;

			console.log(url);

			xhr.open("GET", url, false);
			xhr.send(null);

			if (xhr.status == 200) {
				//データを取得後の処理を書く
				var carjson = xhr.responseText;
				var res = JSON.parse(carjson);

				var data = [];
				var hitcnt = 0;

				//20230405
				var entry_data = [];
				var entry_info = {};

				for (var i = 0; i < res.data.length; i++) {
					for (var j = 0; j < param.length; j++) {
						var info = {};
						attr = {};

						if (res.data[i].car_cd == param[j]["id"]) {
							attr["シンボル種別"] = res.data[i].symbolid;
							attr["車両コード"] = res.data[i].car_cd;
							attr["車両動態"] = res.data[i].dotai;
							attr["方向"] = res.data[i].houko;

							//20230910
							if (param[j]["文字情報1"] === undefined) {
								attr["文字情報1"] = res.data[i].sharyo_cd;
							} else {
								attr["文字情報1"] = param[j]["文字情報1"];
							}

							info.wkt =
								"POINT (" + res.data[i].zx + " " + res.data[i].zy + ")";
							info.attributes = attr;
							data.push(info);

							//20230405
							entry_info = {};

							LonLatW2PRAn(res.data[i].zx, res.data[i].zy, kijyunkei, retval);

							entry_info.zx = retval[0];
							entry_info.zy = retval[1];
							entry_info.attr = attr;
							entry_data.push(entry_info);

							hitcnt++;
						}
					}
				}
				//
				console.log("layerId=" + layerId);
				console.log(data);

				if (hitcnt > 0) {
					facade.drawItems(
						layerId,
						data, //JSONにせずに渡す
						function(ret) {
							symbol_array_data = [];

							//2023.04.04
							for (var i = 0; i < ret.value.length; i++) {
								tmp_info = {};
								tmp_info.zx = entry_data[i].zx;
								tmp_info.zy = entry_data[i].zy;
								tmp_info.attribute = entry_data[i].attr;
								tmp_info.layerId = ret.value[i].layerId;
								tmp_info.itemId = ret.value[i].itemId;
								tmp_data.push(tmp_info);

								symbol_array_info = {};

								symbol_array_info.layerId = ret.value[i].layerId;
								symbol_array_info.itemId = ret.value[i].itemId;

								symbol_array_data.push(symbol_array_info);
							}

							callback(ret);
						}
					);
				} else {
					const result = {};
					result.message = "";
					result.methodName = "drawSymbolArray";
					result.result = "error";

					callback(result);
				}
			}
		}
	},
	//
	//シンボルアレイの中心を表示する
	//
	SetPosSymbolArray(layerId, json, callback) {
		const ret = {};

		var m_scale;
		var m_center_x;
		var m_center_y;

		layerId = ChangeLay2(layerId);

		var param = JSON.parse(json);

		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetCarInfo";

		//20231024
		url += "?ope_mode=" + ope_mode;

		console.log(url);

		xhr.open("GET", url, false);
		xhr.send(null);

		if (xhr.status == 200) {
			//データを取得後の処理を書く
			var carjson = xhr.responseText;
			var res = JSON.parse(carjson);

			var k = 0;

			var minx = 0;
			var maxx = 0;
			var miny = 0;
			var maxy = 0;

			for (var i = 0; i < res.data.length; i++) {
				for (var j = 0; j < param.length; j++) {
					if (res.data[i].car_cd == param[j]["id"]) {
						LonLatW2PRAn(res.data[i].zx, res.data[i].zy, kijyunkei, retval);

						if (k == 0) {
							minx = retval[0];
							miny = retval[1];
							maxx = retval[0];
							maxy = retval[1];
						} else {
							if (retval[0] < minx) {
								minx = retval[0];
							}
							if (retval[0] > maxx) {
								maxx = retval[0];
							}
							if (retval[1] < miny) {
								miny = retval[1];
							}
							if (retval[1] > maxy) {
								maxy = retval[1];
							}
						}
						k++;
					}
				}
			}

			if (k > 0) {
				var centerx = (minx + maxx) / 2;
				var centery = (miny + maxy) / 2;
				m_center_x = centerx;
				m_center_y = centery;

				var w = Math.abs(maxx - minx);
				var h = Math.abs(maxy - miny);

				console.log("centerx=" + centerx);
				console.log("centery=" + centery);
				console.log("w=" + w);
				console.log("h=" + h);

				var scale = [];
				GetScale(w, h, scale);
				//
				//20240130
				//算出したスケールより1段階広くする
				//
				m_scale = parseInt(scale[0]) - 1;
				console.log("m_scale=" + m_scale);

				//世界測地経度緯度に変換
				PRAn2LonLatW(centerx, centery, kijyunkei, retval);

				var animateFlag = false;
				//★中心移動
				facade.setPosition(
					{
						lat: retval[1],
						lon: retval[0],
					},
					animateFlag,
					function(ret) {
						var zoom = parseInt(scale[0]) - 1;
						//★スケール変更
						facade.setScale(zoom, animateFlag, function(ret) { });
					}
				);
			}
		}
		ret.methodName = "SetPosSymbolArray";
		ret.scale = m_scale;
		ret.x = m_center_x;
		ret.y = m_center_y;
		ret.result = "success";
		callback(ret);
	},
	//
	//２点表示
	//
	drawMultiPoits(point1, point2, callback) {
		const ret = {};
		console.log(point1);
		console.log(point2);

		var x1 = parseInt(point1.lon);
		var y1 = parseInt(point1.lat);
		var x2 = parseInt(point2.lon);
		var y2 = parseInt(point2.lat);

		var w = Math.abs(x1 - x2);
		var h = Math.abs(y1 - y2);

		var scale = [];

		GetScale(w, h, scale);

		//中心位置
		var lx = (parseInt(point1.lon) + parseInt(point2.lon)) / 2;
		var ly = (parseInt(point1.lat) + parseInt(point2.lat)) / 2;

		//世界測地経度緯度に変換
		PRAn2LonLatW(lx, ly, kijyunkei, retval);

		var animateFlag = false;

		facade.setPosition(
			{
				lat: retval[1],
				lon: retval[0],
			},
			animateFlag,
			function(ret) {
				var zoom = parseInt(scale[0]) - 1;

				facade.setScale(zoom, animateFlag, function(ret) {
					callback(ret);
				});
			}
		);
	},
	//
	//シンボル状況更新
	//
	setSymbolStatus(layerId, json, callback) {
		const ret = {};
		layerId = ChangeLay2(layerId);

		//
		//初期化処理から端末IDを取得する
		//
		var carcd = init_terminal_id;

		var param = JSON.parse(json);

		console.log(param);
		//2023.05.24 intにparseしないとサーブレット側で数値として取得できない。
		param.carcd = parseInt(carcd);

		json2 = JSON.stringify(param);

		console.log("json2=" + json2);

		//シンボル状況を書き込む
		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/UpdateStatusTable";

		xhr.open("POST", url);
		xhr.onload = function(e) {
			console.log(e.currentTarget.responseText);

			ret.methodName = "setSymbolStatus";
			ret.message = e.currentTarget.responseText;
			ret.result = "success";
			callback(ret);
		};
		xhr.send(json2);
	},
	drawDeptWaterSymbol(jnumber, disp, callback) {
		//--------------------------------------------------------------------------------------------------------------
		//部署水利表示
		//--------------------------------------------------------------------------------------------------------------
		var carcd = init_terminal_id;

		if (jsonflg[1] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_1.json", "n@21-1");
			jsonflg[1] = true;
		}
		if (jsonflg[2] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_2.json", "n@21-1");
			jsonflg[2] = true;
		}
		if (jsonflg[3] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_3.json", "n@21-1");
			jsonflg[3] = true;
		}
		if (jsonflg[4] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_4.json", "n@21-1");
			jsonflg[4] = true;
		}
		if (jsonflg[5] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_5.json", "n@21-1");
			jsonflg[5] = true;
		}
		if (jsonflg[6] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_6.json", "n@21-1");
			jsonflg[6] = true;
		}
		if (jsonflg[7] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_7.json", "n@21-1");
			jsonflg[7] = true;
		}
		if (jsonflg[8] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_8.json", "n@21-1");
			jsonflg[8] = true;
		}

		//2023.06.13
		if (init_terminal_type == 0) {
			LogOut("DAMSはcarcdは無効");
			carcd = "";
		}

		var jisiki = jnumber;
		var layerId = "21";
		layerId = ChangeLay2(layerId);
		//
		//オブジェクトから指定のデータを削除する
		//
		tmp_data = tmp_data.filter((item) => !(item.layerId == layerId));

		if (disp == false) {
			//シンボル消去
			for (var i = 0; i < status_data.length; i++) {
				console.log("layerId=" + status_data[i].layerId);
				console.log("itemId=" + status_data[i].itemId);

				var d_layerId = ChangeLay2(status_data[i].layerId);
				var d_itemId = status_data[i].itemId;

				facade.deleteItem(d_layerId, parseInt(d_itemId), function(ret) {
					console.log("deleteItem:" + ret);
				});
			}
		} else {
			//シンボル表示
			for (var i = 0; i < status_data.length; i++) {
				console.log("layerId=" + status_data[i].layerId);
				console.log("itemId=" + status_data[i].itemId);

				var d_layerId = ChangeLay2(status_data[i].layerId);
				var d_itemId = status_data[i].itemId;

				facade.deleteItem(d_layerId, parseInt(d_itemId), function(ret) {
					console.log("deleteItem:" + ret);
				});
			}

			console.log(layerId);
			status_data = [];

			var lon;
			var lat;

			var radius = 100; //(m)

			facade.getPosition(function(ret) {
				lon = ret.value.lon;
				lat = ret.value.lat;

				console.log("lon=" + lon);
				console.log("lat=" + lat);

				var xhr = new XMLHttpRequest();

				var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetWaterSymbol";
				url += "?";
				url += "lon=" + lon;
				url += "&lat=" + lat;
				url += "&radius=" + radius;
				url += "&jisiki=" + jisiki;
				url += "&carcd=" + carcd;
				//20231024
				url += "&ope_mode=" + ope_mode;

				console.log(url);

				xhr.open("GET", url);
				xhr.send();

				xhr.onreadystatechange = function() {
					if (xhr.readyState === 4 && xhr.status === 200) {
						var r_json = xhr.responseText;
						console.log(r_json);
						res = JSON.parse(r_json);

						var len = res.data.length;

						console.log("len=" + len);

						var data = [];
						var attributes = [];

						for (var i = 0; i < len; i++) {
							var info = {};
							attr = {};

							attr["シンボル種別"] = res.data[i].symbol_sbt;
							attr["水利コード"] = res.data[i].suiri_cd;

							//2023.07.19　start
							attr["文字情報1"] = res.data[i].moji;
							//2023.07.19　end

							attrdata = "水利使用可否:";
							attrdata += res.data[i].shiyo_kahi;
							attrdata += ",水利状況コード:";
							attrdata += res.data[i].suiriStatusCode;
							attrdata += ",相掛り車両コード１:";
							attrdata += res.data[i].jointCarCode1;
							attrdata += ",相掛り車両コード２:";
							attrdata += res.data[i].jointCarCode2;
							attrdata += ",表示名:";
							attrdata += res.data[i].disp_name;

							//20240528
							attrdata += ",水利番号:";
							attrdata += res.data[i].moji;
							attr["備考"] = attrdata;

							attributes[i] = attr;

							var v_lon = res.data[i].izahyo_x;
							var v_lat = res.data[i].izahyo_y;

							PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);

							info.wkt = "POINT(";
							info.wkt += retval[0] + " " + retval[1];
							info.wkt += ")";
							info.attributes = attr;
							data.push(info);
						}
						console.log(data);

						facade.drawItems(
							layerId,
							data, //JSONにせずに渡す
							function(ret) {
								console.log(ret);

								for (var i = 0; i < ret.value.length; i++) {
									status_info = {};
									status_info.attribute = ret.value[i].attributes;
									status_info.layerId = ret.value[i].layerId;
									status_info.itemId = ret.value[i].itemId;
									status_data.push(status_info);

									tmp_info = {};
									tmp_info.zx = res.data[i].izahyo_x;
									tmp_info.zy = res.data[i].izahyo_y;
									tmp_info.attribute = attributes[i];
									tmp_info.layerId = ret.value[i].layerId;
									tmp_info.itemId = ret.value[i].itemId;
									tmp_data.push(tmp_info);
								}
								callback(ret);
							}
						);
					}
				};
			});
		}
	},
	drawDeptWaterSymbol2(jnumber, disp, radius, position, callback) {
		//--------------------------------------------------------------------------------------------------------------
		//部署水利表示
		//--------------------------------------------------------------------------------------------------------------
		var carcd = init_terminal_id;
		if (jsonflg[1] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_1.json", "n@21-1");
			jsonflg[1] = true;
		}
		if (jsonflg[2] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_2.json", "n@21-1");
			jsonflg[2] = true;
		}
		if (jsonflg[3] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_3.json", "n@21-1");
			jsonflg[3] = true;
		}
		if (jsonflg[4] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_4.json", "n@21-1");
			jsonflg[4] = true;
		}
		if (jsonflg[5] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_5.json", "n@21-1");
			jsonflg[5] = true;
		}
		if (jsonflg[6] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_6.json", "n@21-1");
			jsonflg[6] = true;
		}
		if (jsonflg[7] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_7.json", "n@21-1");
			jsonflg[7] = true;
		}
		if (jsonflg[8] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_8.json", "n@21-1");
			jsonflg[8] = true;
		}

		//2023.06.13
		if (init_terminal_type == 0) {
			LogOut("DAMSはcarcdは無効");
			carcd = "";
		}

		var jisiki = jnumber;
		var layerId = "21";
		layerId = ChangeLay2(layerId);
		//
		//オブジェクトから指定のデータを削除する
		//
		tmp_data = tmp_data.filter((item) => !(item.layerId == layerId));

		if (disp == false) {
			//シンボル消去

			var items = [];
			for (var i = 0; i < status_data.length; i++) {
				//console.log("layerId=" + status_data[i].layerId);
				//console.log("itemId=" + status_data[i].itemId);

				var d_layerId = ChangeLay2(status_data[i].layerId);
				var d_itemId = status_data[i].itemId;

				//facade.deleteItem(d_layerId, parseInt(d_itemId), function(ret) {
				//				//console.log("deleteItem:" + ret);
				//callback(ret);
				//});
				items.push(parseInt(d_itemId));
			}

			facade.deleteItems(d_layerId, items, function(ret) {
				callback(ret);
				console.log("deleteItems:" + ret);
			});
		} else {
			//シンボル表示
			for (var i = 0; i < status_data.length; i++) {
				console.log("layerId=" + status_data[i].layerId);
				console.log("itemId=" + status_data[i].itemId);

				var d_layerId = ChangeLay2(status_data[i].layerId);
				var d_itemId = status_data[i].itemId;

				facade.deleteItem(d_layerId, parseInt(d_itemId), function(ret) {
					console.log("deleteItem:" + ret);
				});
			}

			console.log(layerId);
			status_data = [];

			//			var lon;
			//			var lat;

			console.log(position);
			PRAn2LonLatW(position.lon, position.lat, kijyunkei, retval);

			lon = retval[0];
			lat = retval[1];

			//var radius = 100; //(m)

			//facade.getPosition(function(ret) {
			//lon = ret.value.lon;
			//lat = ret.value.lat;

			console.log("lon=" + lon);
			console.log("lat=" + lat);

			var xhr = new XMLHttpRequest();

			var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetWaterSymbol";
			url += "?";
			url += "lon=" + lon;
			url += "&lat=" + lat;
			url += "&radius=" + radius;
			url += "&jisiki=" + jisiki;
			url += "&carcd=" + carcd;
			//20231024
			url += "&ope_mode=" + ope_mode;

			console.log(url);

			xhr.open("GET", url);
			xhr.send();

			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					var r_json = xhr.responseText;
					console.log(r_json);
					res = JSON.parse(r_json);

					var len = res.data.length;

					console.log("len=" + len);

					var data = [];
					var attributes = [];

					for (var i = 0; i < len; i++) {
						var info = {};
						attr = {};

						attr["シンボル種別"] = res.data[i].symbol_sbt;
						attr["水利コード"] = res.data[i].suiri_cd;

						//2023.07.19　start
						attr["文字情報1"] = res.data[i].moji;
						//2023.07.19　end

						attrdata = "水利使用可否:";
						attrdata += res.data[i].shiyo_kahi;
						attrdata += ",水利状況コード:";
						attrdata += res.data[i].suiriStatusCode;
						attrdata += ",相掛り車両コード１:";
						attrdata += res.data[i].jointCarCode1;
						attrdata += ",相掛り車両コード２:";
						attrdata += res.data[i].jointCarCode2;
						attrdata += ",表示名:";
						attrdata += res.data[i].disp_name;
						//20240528
						attrdata += ",水利番号:";
						attrdata += res.data[i].moji;

						attr["備考"] = attrdata;

						attributes[i] = attr;

						var v_lon = res.data[i].izahyo_x;
						var v_lat = res.data[i].izahyo_y;

						PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);

						info.wkt = "POINT(";
						info.wkt += retval[0] + " " + retval[1];
						info.wkt += ")";
						info.attributes = attr;
						data.push(info);
					}
					console.log(data);

					facade.drawItems(
						layerId,
						data, //JSONにせずに渡す
						function(ret) {
							console.log(ret);

							for (var i = 0; i < ret.value.length; i++) {
								status_info = {};
								status_info.attribute = ret.value[i].attributes;
								status_info.layerId = ret.value[i].layerId;
								status_info.itemId = ret.value[i].itemId;
								status_data.push(status_info);

								tmp_info = {};
								tmp_info.zx = res.data[i].izahyo_x;
								tmp_info.zy = res.data[i].izahyo_y;
								tmp_info.attribute = attributes[i];
								tmp_info.layerId = ret.value[i].layerId;
								tmp_info.itemId = ret.value[i].itemId;
								tmp_data.push(tmp_info);
							}
							callback(ret);
						}
					);
				}
			};
			//});
		}
	},

	//
	//警防地図番号座標変換　20221212
	//
	mapNumberToPosition(mapno, callback) {
		var orgx = -57750; //原点X
		var orgy = -136500; //原点Y
		var w = 750;
		var h = 500;

		var x = parseInt(mapno / 100);
		var y = mapno % 100;

		var ret = {};
		ret.methodName = "mapNumberToPosition";

		if (x > 0 && y > 0 && x < 100 && y < 100) {
			var zx0 = orgx + x * w;
			var zy0 = orgy - y * h;
			var zx1 = orgx + (x + 1) * w;
			var zy1 = orgy - (y + 1) * h;

			var cx = (zx0 + zx1) / 2;
			var cy = (zy0 + zy1) / 2;

			ret.result = "success";

			var data = {};

			//単位をmmにする
			data.lux = zx0 * 1000;
			data.luy = zy0 * 1000;
			data.rdx = zx1 * 1000;
			data.rdy = zy1 * 1000;
			data.cx = cx * 1000;
			data.cy = cy * 1000;

			ret.data = data;
			callback(ret);
		} else {
			ret.result = "error";
			ret.message = "指定地図番号が不当です";
			callback(ret);
		}
	},
	//
	//座標警防地図番号変換　20221225
	//
	PositionToMapNumber(position, callback) {
		var orgx = -57750; //原点X
		var orgy = -136500; //原点Y
		var w = 750;
		var h = 500;

		x = (position.x / 1000 - orgx) / w;
		y = -(position.y / 1000 - orgy) / h;

		mx = parseInt(x);
		my = parseInt(y);

		var ret = {};

		ret.methodName = "PositionToMapNumber";
		ret.result = "success";
		ret.mapno = mx * 100 + my;

		callback(ret);
	},
	//
	//DB情報取得　20221225
	//
	GetDBInfo(drawType, lay_no, item_no, callback) {
		lay_no = ChangeLay2(lay_no);

		const ret = {};

		if (drawType == "Symbol") {
			lay_type = 1;
		}
		if (drawType == "Line") {
			lay_type = 2;
		}
		if (drawType == "Polygon") {
			lay_type = 3;
		}

		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetDB?";
		url += "lay_no=";
		url += lay_no;
		url += "&item_no=";
		url += item_no;
		url += "&lay_type=";
		url += lay_type;

		console.log(url);

		xhr.open("GET", url, false);
		xhr.send(null);

		if (xhr.status == 200) {
			//データを取得後の処理を書く
			var json = xhr.responseText;

			//var out = "";

			var param = JSON.parse(json);

			console.log(param);

			if (param.result == "OK") {
				const value = {};
				const zahyo_info = [];
				var pos = {};
				value.symbol_no = param.symbol_no;

				LonLatW2PRAn(param.zahyo_x, param.zahyo_y, kijyunkei, retval);

				value.zahyo_x = retval[0];
				value.zahyo_y = retval[1];

				if (lay_type == 1) {
					//シンボル
					value.zahyo_cnt = 0;
				} else {
					//ライン・ポリゴン
					value.zahyo_cnt = param.zahyo_cnt;
					for (var j = 0; j < param.data.length; j++) {
						pos = {};

						LonLatW2PRAn(param.data[j].x, param.data[j].y, kijyunkei, retval);

						pos.x = retval[0];
						pos.y = retval[1];

						zahyo_info.push(pos);
					}
					ret.zahyo_info = zahyo_info;
				}
				ret.value = value;
				ret.result = "success";
				ret.methodName = "GetDBInfo";
				ret.message = "";
			} else {
				ret.result = "error";
				ret.methodName = "GetDBInfo";
				ret.message = "";
			}

			callback(ret);
		}
	},
	GetDBInfo2(drawType, lay_no, item_no, callback) {
		lay_no = ChangeLay2(lay_no);

		const ret = {};

		if (drawType == "Symbol") {
			lay_type = 1;
		}
		if (drawType == "Line") {
			lay_type = 2;
		}
		if (drawType == "Polygon") {
			lay_type = 3;
		}

		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetDB2?";
		url += "lay_no=";
		url += lay_no;
		url += "&item_no=";
		url += item_no;
		url += "&lay_type=";
		url += lay_type;

		console.log(url);

		xhr.open("GET", url, false);
		xhr.send(null);

		if (xhr.status == 200) {
			//データを取得後の処理を書く
			var json = xhr.responseText;

			//var out = "";

			var param = JSON.parse(json);

			console.log(param);

			if (param.result == "OK") {

				var len = param.symbolInfoArray.length;

				ret.array = [];

				for (var k = 0; k < len; k++) {

					const ret2 = {};
					sarray = param.symbolInfoArray[k];

					const value = {};
					const zahyo_info = [];
					var pos = {};
					value.symbol_no = sarray.symbol_no;

					LonLatW2PRAn(sarray.zahyo_x, sarray.zahyo_y, kijyunkei, retval);

					value.zahyo_x = retval[0];
					value.zahyo_y = retval[1];

					if (lay_type == 1) {
						//シンボル
						value.zahyo_cnt = 0;
					} else {
						//ライン・ポリゴン
						value.zahyo_cnt = sarray.zahyo_cnt;
						for (var j = 0; j < sarray.data.length; j++) {
							pos = {};

							LonLatW2PRAn(sarray.data[j].x, sarray.data[j].y, kijyunkei, retval);

							pos.x = retval[0];
							pos.y = retval[1];

							zahyo_info.push(pos);
						}
						ret2.value = value;
						ret2.zahyo_info = zahyo_info;
						ret.array.push(ret2);
					}
				}

				ret.result = "success";
				ret.methodName = "GetDBInfo2";
				ret.message = "";

				callback(ret);
			} else {
				ret.result = "error";
				ret.methodName = "GetDBInfo2";
				ret.message = "";

			}

			/*
			if (param.result == "OK") {
			  const value = {};
			  const zahyo_info = [];
			  var pos = {};
			  value.symbol_no = param.symbol_no;
	  
			  LonLatW2PRAn(param.zahyo_x, param.zahyo_y, kijyunkei, retval);
	  
			  value.zahyo_x = retval[0];
			  value.zahyo_y = retval[1];
	  
			  if (lay_type == 1) {
				//シンボル
				value.zahyo_cnt = 0;
			  } else {
				//ライン・ポリゴン
				value.zahyo_cnt = param.zahyo_cnt;
				for (var j = 0; j < param.data.length; j++) {
				  pos = {};
	  
				  LonLatW2PRAn(param.data[j].x, param.data[j].y, kijyunkei, retval);
	  
				  pos.x = retval[0];
				  pos.y = retval[1];
	  
				  zahyo_info.push(pos);
				}
				ret.zahyo_info = zahyo_info;
			  }
			  ret.value = value;
			  ret.result = "success";
			  ret.methodName = "GetDBInfo2";
			  ret.message = "";
			} else {
			  ret.result = "error";
			  ret.methodName = "GetDBInfo2";
			  ret.message = "";
			}
	  
			callback(ret);
			*/
		}
	},
	//
	//DB情報登録[直接登録] 2023/01/07
	//
	SetDBInfo(
		drawType,
		layerNodeId,
		SymbolId,
		attr,
		points,
		i_pointinfo,
		callback
	) {
		const ret = {};

		lay_no = ChangeLay2(layerNodeId);

		/*
			var items = geomWKT.split(" ");
			var points = (items.length - 1) / 2;
			
			for (var i = 0; i < items.length; i++) {
			  items[i] = items[i].replace(/\(/g, "");
			  items[i] = items[i].replace(/\)/g, "");
			  items[i] = items[i].replace(/\,/g, "");
			}
			
			var pointinfo = [];
		*/
		var pointinfo = [];

		for (var i = 0; i < points; i++) {
			//正規化座標を経度緯度に変換
			PRAn2LonLatW(
				i_pointinfo[i * 2],
				i_pointinfo[i * 2 + 1],
				kijyunkei,
				retval
			);

			console.log(retval[0]); //lon
			console.log(retval[1]); //lat

			pointinfo.push(retval[0]);
			pointinfo.push(retval[1]);
		}

		//中間テーブル追加

		var lay_no;
		var item_no;
		var info_type;
		var info_summery;
		var lay_type;
		var symbol_no;
		var zahyo_x;
		var zahyo_y;
		var strinfo1;
		var strinfo2;
		var strinfo3;
		var str_zahyo_x;
		var str_zahyo_y;
		var zahyo_cnt;
		var info_zahyo;

		if (drawType == "Symbol") {
			lay_type = 1;
		}
		if (drawType == "Line") {
			lay_type = 2;
		}
		if (drawType == "Polygon") {
			lay_type = 3;
		}

		//属性編集
		let label = Object.keys(attr);
		var attr_str = "";
		for (var i = 0; i < label.length; i++) {
			if (i > 0) {
				attr_str += ",";
			}
			attr_str += label[i];
			attr_str += ",";
			attr_str += attr[label[i]];
		}

		info_type = layerNodeId;

		symbol_no = SymbolId;
		info_summery = attr_str;

		item_no = "";
		zahyo_x = pointinfo[0];
		zahyo_y = pointinfo[1];
		strinfo1 = "";
		strinfo2 = "";
		strinfo3 = "";
		str_zahyo_x = 0.0;
		str_zahyo_y = 0.0;
		zahyo_cnt = points;
		info_zahyo = pointinfo;

		//var dbresult = new Array();

		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/InsertDB?";
		url += "lay_no=";
		url += lay_no;
		url += "&item_no=";
		url += item_no;
		url += "&info_type=";
		url += info_type;
		url += "&info_summery=";
		url += info_summery;
		url += "&lay_type=";
		url += lay_type;
		url += "&symbol_no=";
		url += symbol_no;
		url += "&zahyo_x=";
		url += zahyo_x;
		url += "&zahyo_y=";
		url += zahyo_y;
		url += "&strinfo1=";
		url += strinfo1;
		url += "&strinfo2=";
		url += strinfo2;
		url += "&strinfo3=";
		url += strinfo3;
		url += "&str_zahyo_x=";
		url += str_zahyo_x;
		url += "&str_zahyo_y=";
		url += str_zahyo_y;
		url += "&zahyo_cnt=";
		url += zahyo_cnt;

		url += "&info_zahyo=";
		url += info_zahyo;

		console.log(url);

		xhr.open("GET", url);
		xhr.send();

		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var json = xhr.responseText;

				var param = JSON.parse(json);

				console.log(json);

				ret.methodName = ret.methodName;
				ret.result = ret.result;
				ret.message;
				ret.value = ret.value;
				ret.db_itemId = param.item_no;

				console.log(ret);
				//
				//中間ファイルからレイヤ作成
				//
				var value = String(info_type);
				UpdateDB(value);

				callback(ret);
			}
		};
	},
	//
	//DB情報削除
	//
	DeleteDBInfo(drawType, lay_no, item_no, callback) {
		lay_no = ChangeLay2(lay_no);

		if (drawType == "Symbol") {
			lay_type = 1;
		}
		if (drawType == "Line") {
			lay_type = 2;
		}
		if (drawType == "Polygon") {
			lay_type = 3;
		}

		if (lay_no == "n@15-1") {
			//ライフライン
			info_type = 15;
		}
		if (lay_no == "n@16-1") {
			//通行止め
			info_type = 16;
		}
		if (lay_no == "n@10-1") {
			//指揮隊
			info_type = 10;
		}

		const ret = {};
		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/DeleteDB?";
		url += "lay_no=";
		url += lay_no;
		url += "&item_no=";
		url += item_no;
		url += "&lay_type=";
		url += lay_type;
		xhr.open("GET", url);
		xhr.send();

		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var json = xhr.responseText;
				var out = json;
				console.log(out);

				ret.value = value;
				ret.result = "OK";
				ret.methodName = "DeleteDBInfo";
				ret.message = "";

				var value = String(info_type);

				UpdateDB(value);
				callback(ret);
			}
		};
	},
	//--------------------------------------------------------------------------------------------------------------
	//指揮本部位置表示
	//--------------------------------------------------------------------------------------------------------------
	drawCommPos(jnumber, disp, callback) {
		if (disp == false) {
			console.log("クリア");
			console.log(CommPos_data);

			var result = {};

			for (var i = 0; i < CommPos_data.length; i++) {
				var layerId = CommPos_data[i].layerId;
				var itemId = CommPos_data[i].itemId;

				tmp_data = tmp_data.filter(
					(item) => !(item.layerId == layerId && item.itemId == itemId)
				);
				var layerId = "n@28-1";

				facade.deleteItem(layerId, parseInt(itemId), function(ret) {
					console.log(ret);
				});
			}
			callback(result);
		} else {
			var xhr = new XMLHttpRequest();

			var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetTBCR0002";
			url += "?";
			url += "jisiki=" + jnumber;

			//20231024
			url += "&ope_mode=" + ope_mode;

			xhr.open("GET", url);
			xhr.send();

			console.log(url);

			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					var json = xhr.responseText;
					console.log(json);
					res = JSON.parse(json);

					var len = res.data.length;

					var data = [];

					for (var i = 0; i < len; i++) {
						var info = {};
						attr = {};
						//						attr["シンボル種別"] = "1402";
						//2023.05.23 固定になっていたシンボルIDを、データから読み込むよう修正
						attr["シンボル種別"] = res.data[i].symbol_id;

						var v_lon = res.data[i].zahyo_x;
						var v_lat = res.data[i].zahyo_y;

						PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);

						info.wkt = "POINT(";
						info.wkt += retval[0] + " " + retval[1];
						info.wkt += ")";
						info.attributes = attr;
						data.push(info);
					}

					var layerId = "n@28-1"; //

					console.log(data);

					facade.drawItems(
						layerId,
						data, //JSONにせずに渡す
						function(ret) {
							//						disp_popUp = true;
							CommPos_data = [];

							//2023.04.04
							for (var i = 0; i < ret.value.length; i++) {
								tmp_info = {};
								tmp_info.zx = res.data[i].zx;
								tmp_info.zy = res.data[i].zy;
								tmp_info.attribute = res.data[i].attr;
								tmp_info.layerId = ret.value[i].layerId;
								tmp_info.itemId = ret.value[i].itemId;
								tmp_data.push(tmp_info);

								CommPos_info = {};

								CommPos_info.layerId = ret.value[i].layerId;
								CommPos_info.itemId = ret.value[i].itemId;

								CommPos_data.push(CommPos_info);
							}

							console.log(ret);
							callback(ret);
						}
					);

					//var ret = {};
					//ret.value = value;
					//ret.result = "OK";
					//callback(ret);
				}
			};
		}
	},
	//--------------------------------------------------------------------------------------------------------------
	//事案手書き表示
	//--------------------------------------------------------------------------------------------------------------
	drawHandWriteData(jnumber, disp, callback) {
		console.log(disp);

		if (disp == false) {
			console.log("クリア");
			console.log(write_data);

			var result = {};

			for (var i = 0; i < write_data.length; i++) {
				var layerId = write_data[i].layerId;
				var itemId = write_data[i].itemId;

				layerId = ChangeLay2(layerId);

				facade.deleteItem(layerId, parseInt(itemId), function(ret) {
					console.log(ret);
				});
			}
			callback(result);
		} else {
			var xhr = new XMLHttpRequest();

			var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetTBCR0003";
			url += "?";
			url += "jisiki=" + jnumber;
			//20231024
			url += "&ope_mode=" + ope_mode;

			xhr.open("GET", url);
			xhr.send();

			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					var json = xhr.responseText;
					//console.log(json);
					res = JSON.parse(json);

					var len = res.data.length;

					LogOut("len=" + len);

					var data = [];
					var attr = {};

					for (var i = 0; i < len; i++) {
						//LogOut(i+ ":data="+res.data[i]);

						var info = {};
						attr = {};

						//   3012(黒)
						//   3013(赤)
						//   3014(青)
						if (res.data[i].line_color == 1) {
							attr["シンボル種別"] = "3012";
							attr["事案識別子"] = jnumber;
						}
						if (res.data[i].line_color == 2) {
							attr["シンボル種別"] = "3013";
							attr["事案識別子"] = jnumber;
						}
						if (res.data[i].line_color == 3) {
							attr["シンボル種別"] = "3014";
							attr["事案識別子"] = jnumber;
						}
						info.wkt = "LINESTRING(";

						for (var j = 0; j < res.data[i].data.length; j++) {
							var v_lon = res.data[i].data[j].x;
							var v_lat = res.data[i].data[j].y;

							PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
							if (j > 0) {
								info.wkt += ", ";
							}
							info.wkt += retval[0] + " " + retval[1];
						}
						info.wkt += ")";
						console.log(info.wkt);

						info.attributes = attr;

						//2023.07.05 点が１の場合は対象外
						if (res.data[i].data.length > 1) {
							data.push(info);
						}
					}
					//console.log(data);

					var layerId = "28"; //共通レイヤに書く

					layerId = ChangeLay2(layerId);
					facade.drawItems(layerId, data, function(ret) {
						console.log(ret);
						for (var ii = 0; ii < ret.value.length; ii++) {
							write_info = {};
							//									status_info.zx = param[i].pt.lon;
							//								status_info.zy = param[i].pt.lat;
							write_info.layerId = ret.value[ii].layerId;
							write_info.itemId = ret.value[ii].itemId;
							write_data.push(write_info);
						}
						console.log(write_data);
						callback(ret);
					});
				}
			};
		}
	},
	drawPopUp(isDisp, callback) {
		//--------------------------------------------------------------------------------------------------------------
		//吹き出し表示
		//--------------------------------------------------------------------------------------------------------------

		if (jsonflg[1] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_1.json", "n@21-1");
			jsonflg[1] = true;
		}
		if (jsonflg[2] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_2.json", "n@21-1");
			jsonflg[2] = true;
		}
		if (jsonflg[3] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_3.json", "n@21-1");
			jsonflg[3] = true;
		}
		if (jsonflg[4] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_4.json", "n@21-1");
			jsonflg[4] = true;
		}
		if (jsonflg[5] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_5.json", "n@21-1");
			jsonflg[5] = true;
		}
		if (jsonflg[6] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_6.json", "n@21-1");
			jsonflg[6] = true;
		}
		if (jsonflg[7] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_7.json", "n@21-1");
			jsonflg[7] = true;
		}
		if (jsonflg[8] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_8.json", "n@21-1");
			jsonflg[8] = true;
		}

		const ret = {};

		var lon;
		var rat;
		var radius = 100; //(m)

		if (isDisp == true && disp_popUp == false) {
			facade.getPosition(function(ret) {
				lon = ret.value.lon;
				lat = ret.value.lat;

				console.log("lon=" + lon);
				console.log("lat=" + lat);

				var xhr = new XMLHttpRequest();

				var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetWaterSymbol2";
				url += "?";
				url += "lon=" + lon;
				url += "&lat=" + lat;
				url += "&radius=" + radius;
				url += "&lay_no=" + "n@2-1";
				//20231024
				url += "&ope_mode=" + ope_mode;

				console.log(url);

				xhr.open("GET", url);
				xhr.send();

				xhr.onreadystatechange = function() {
					if (xhr.readyState === 4 && xhr.status === 200) {
						var json = xhr.responseText;
						console.log(json);
						res = JSON.parse(json);

						var len = res.data.length;

						console.log("len=" + len);

						var data = [];

						for (var i = 0; i < len; i++) {
							var info = {};
							attr = {};

							if (res.data[i].check == 1) {
								attr["シンボル種別"] = "3003";
							} else {
								attr["シンボル種別"] = "3001";
							}

							var type = res.data[i].suiri_sbt;

							var type_name = "その他";
							if (type == 11) {
								type_name = "消火栓";
							}
							if (type == 11) {
								type_name = "消火栓";
							}
							if (type == 12) {
								type_name = "貯水槽";
							}
							if (type == 13) {
								type_name = "プール";
							}
							if (type == 14) {
								type_name = "ウオール";
							}
							if (type == 20) {
								type_name = "採水口";
							}

							attr["TEXT"] = type_name + "-" + res.data[i].suiri_cd;

							var v_lon = res.data[i].izahyo_x;
							var v_lat = parseInt(res.data[i].izahyo_y) + 10000; //水利シンボルとかぶらないよう調整

							PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);

							info.wkt = "POINT(";
							info.wkt += retval[0] + " " + retval[1];
							info.wkt += ")";
							info.attributes = attr;
							data.push(info);
						}

						var layerId = "n@21-1";

						console.log(data);

						facade.drawItems(
							layerId,
							data, //JSONにせずに渡す
							function(ret) {
								disp_popUp = true;
								console.log(ret);
								callback(ret);
							}
						);

						var ret = {};
						//ret.value = value;
						ret.result = "OK";
						callback(ret);
					}
				};
			});
		} else {
			if (isDisp == false) {
				disp_popUp = false;
				var layerId = "n@21-1";
				facade.refreshLayer(layerId, function(ret) {
					callback(ret);
				});
			}
		}
	},
	drawPopUp2(isDisp, kdate, callback) {
		//--------------------------------------------------------------------------------------------------------------
		//吹き出し表示２　　2024/07/02
		//--------------------------------------------------------------------------------------------------------------

		if (jsonflg[1] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_1.json", "n@21-1");
			jsonflg[1] = true;
		}
		if (jsonflg[2] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_2.json", "n@21-1");
			jsonflg[2] = true;
		}
		if (jsonflg[3] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_3.json", "n@21-1");
			jsonflg[3] = true;
		}
		if (jsonflg[4] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_4.json", "n@21-1");
			jsonflg[4] = true;
		}
		if (jsonflg[5] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_5.json", "n@21-1");
			jsonflg[5] = true;
		}
		if (jsonflg[6] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_6.json", "n@21-1");
			jsonflg[6] = true;
		}
		if (jsonflg[7] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_7.json", "n@21-1");
			jsonflg[7] = true;
		}
		if (jsonflg[8] == false) {
			addCustomizerNodeFromJson("水利関係（一時入力）_8.json", "n@21-1");
			jsonflg[8] = true;
		}

		const ret = {};

		var lon;
		var rat;
		var radius = 100; //(m)

		if (isDisp == true && disp_popUp == false) {
			facade.getPosition(function(ret) {
				lon = ret.value.lon;
				lat = ret.value.lat;

				console.log("lon=" + lon);
				console.log("lat=" + lat);

				var xhr = new XMLHttpRequest();

				var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetWaterSymbol2";
				url += "?";
				url += "lon=" + lon;
				url += "&lat=" + lat;
				url += "&radius=" + radius;
				url += "&lay_no=" + "n@2-1";
				//20231024
				url += "&ope_mode=" + ope_mode;
				//20240701
				url += "&kdate=" + kdate;

				console.log(url);

				xhr.open("GET", url);
				xhr.send();

				xhr.onreadystatechange = function() {
					if (xhr.readyState === 4 && xhr.status === 200) {
						var json = xhr.responseText;
						console.log(json);
						res = JSON.parse(json);

						var len = res.data.length;

						console.log("len=" + len);

						var data = [];

						for (var i = 0; i < len; i++) {
							var info = {};
							attr = {};

							if (res.data[i].check == 1) {
								attr["シンボル種別"] = "3003";
							} else {
								attr["シンボル種別"] = "3001";
							}

							var type = res.data[i].suiri_sbt;

							var type_name = "その他";
							if (type == 11) {
								type_name = "消火栓";
							}

							/*							
										  4	11	消火栓	« NULL »	« NULL »	« NULL »	消火	2022/10/11 21:39:56
										  4	12	貯水槽	« NULL »	« NULL »	« NULL »	貯水	2022/10/11 21:39:56
										  4	13	プ－ル	« NULL »	« NULL »	« NULL »	プ	2022/10/11 21:39:56
										  4	14	ウォ－ル	« NULL »	« NULL »	« NULL »	Ｗ	2022/10/11 21:39:56
										  4	15	吸管投入口	« NULL »	« NULL »	« NULL »	吸管	2022/10/11 21:39:56
										  4	16	呼水設備	« NULL »	« NULL »	« NULL »	呼水	2022/10/11 21:39:56
										  4	17	工導水	« NULL »	« NULL »	« NULL »	導水	2022/10/11 21:39:56
										  4	18	マンホ－ル	« NULL »	« NULL »	« NULL »	マン	2022/10/11 21:39:56
										  4	19	その他（人工）	« NULL »	« NULL »	« NULL »	他	2022/10/11 21:39:56
										  4	20	採水口	« NULL »	« NULL »	« NULL »	採	2022/10/11 21:39:56
										  4	21	池	« NULL »	« NULL »	« NULL »	池	2022/10/11 21:39:56
										  4	22	河川	« NULL »	« NULL »	« NULL »	河川	2022/10/11 21:39:56
										  4	23	海	« NULL »	« NULL »	« NULL »	海	2022/10/11 21:39:56
										  4	24	井戸	« NULL »	« NULL »	« NULL »	井戸	2022/10/11 21:39:56
										  4	25	堀	« NULL »	« NULL »	« NULL »	堀	2022/10/11 21:39:56
										  4	26	橋	« NULL »	« NULL »	« NULL »	橋	2022/10/11 21:39:56
										  4	29	その他（自然）	« NULL »	« NULL »	« NULL »	他	2022/10/11 21:39:56
										  4	31	私設消火栓	« NULL »	« NULL »	« NULL »	私設	2022/10/11 21:39:56
										  4	32	市外消火栓	« NULL »	« NULL »	« NULL »	市外	2022/10/11 21:39:56
										  */
							if (type == 11) {
								type_name = "消火栓";
							}
							if (type == 12) {
								type_name = "貯水槽";
							}
							if (type == 13) {
								type_name = "プール";
							}
							if (type == 14) {
								type_name = "ウオール";
							}
							if (type == 20) {
								type_name = "採水口";
							}

							attr["TEXT"] = type_name + "-" + res.data[i].suiri_cd;

							var v_lon = res.data[i].izahyo_x;
							var v_lat = parseInt(res.data[i].izahyo_y) + 10000; //水利シンボルとかぶらないよう調整

							PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);

							info.wkt = "POINT(";
							info.wkt += retval[0] + " " + retval[1];
							info.wkt += ")";
							info.attributes = attr;
							data.push(info);
						}

						var layerId = "n@21-1";

						console.log(data);

						facade.drawItems(
							layerId,
							data, //JSONにせずに渡す
							function(ret) {
								disp_popUp = true;
								console.log(ret);
								callback(ret);
							}
						);

						var ret = {};
						//ret.value = value;
						ret.result = "OK";
						callback(ret);
					}
				};
			});
		} else {
			if (isDisp == false) {
				disp_popUp = false;
				var layerId = "n@21-1";
				facade.refreshLayer(layerId, function(ret) {
					callback(ret);
				});
			}
		}
	},

	//--------------------------------------------------------------------------------------------------------------
	//部署車両表示
	//--------------------------------------------------------------------------------------------------------------
	/*
		  drawWaterTBCK0001(jisiki,carcd, callback) {
	  	
			  var layerId = "n@21-1";
			  var xhr = new XMLHttpRequest();
	  	
			  var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetTBCK0001";
			  url += "?";
			  url += "jisiki=" + jisiki;
			  url += "&carcd=" + carcd;
	  	
			  console.log(url);
	  	
			  xhr.open("GET", url);
			  xhr.send();
	  	
			  xhr.onreadystatechange = function() {
				  if (xhr.readyState === 4 && xhr.status === 200) {
					  var json = xhr.responseText;
					  console.log(json);
					  res = JSON.parse(json);
	  	
					  var len = res.data.length;
	  	
					  console.log("len=" + len);
	  	
					  var data = [];
	  	
					  for (var i = 0; i < len; i++) {
	  	
						  var info = {};
						  attr = {};
	  	
						  attr["シンボル種別"] = res.data[i].symbol_id;
	  	
						  var v_lon = res.data[i].zx;
						  var v_lat = res.data[i].zy;
	  	
						  PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);
	  	
						  info.wkt = "POINT(";
						  info.wkt += retval[0] + " " + retval[1];
						  info.wkt += ")";
						  info.attributes = attr;
						  data.push(info);
	  	
					  }
					  console.log(data);
	  	
					  facade.drawItems(
						  layerId,
						  data, //JSONにせずに渡す
						  function(ret) {
							  disp_popUp = true;
							  console.log(ret);
							  callback(ret);
	  	
						  }
					  );
				  }
			  };
	  	
		  },
		  */
	//--------------------------------------------------------------------------------------------------------------
	//行政界ポリゴン取得
	//--------------------------------------------------------------------------------------------------------------
	GetAddrPolygon(prif, city, town1, town2, callback) {
		const ret = {};

		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetAddrPolygon?";
		url += "prif=";
		url += prif;
		url += "&city=";
		url += city;
		url += "&town1=";
		url += town1;
		url += "&town2=";
		url += town2;

		console.log(url);

		xhr.open("GET", url, false);
		xhr.send(null);

		if (xhr.status == 200) {
			//データを取得後の処理を書く
			var json = xhr.responseText;

			var param = JSON.parse(json);

			console.log(param);

			if (param.result == "OK") {
				const zahyo_info = [];
				var pos = {};

				for (var j = 0; j < param.data.length; j++) {
					pos = {};

					//経緯度->正規化座標変換
					LonLatW2PRAn(param.data[j].x, param.data[j].y, kijyunkei, retval);

					pos.x = retval[0];
					pos.y = retval[1];

					zahyo_info.push(pos);
				}

				ret.zahyo_info = zahyo_info;
				ret.zahyo_cnt = param.zahyo_cnt;
				ret.result = "success";
				ret.methodName = "GetAddrPolygon";
				ret.message = "";
			} else {
				ret.result = "error";
				ret.methodName = "GetAddrPolygon";
				ret.message = "";
			}
			callback(ret);
		}
	},
	//--------------------------------------------------------------------------------------------------------------
	//行政界ポリゴン取得
	//--------------------------------------------------------------------------------------------------------------
	GetAddrPolygon2(prif, city, town1, town2, seqnum, callback) {
		const ret = {};

		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetAddrPolygon2?";
		url += "prif=";
		url += prif;
		url += "&city=";
		url += city;
		url += "&town1=";
		url += town1;
		url += "&town2=";
		url += town2;
		url += "&seqnum=";
		url += seqnum;

		console.log(url);

		xhr.open("GET", url, false);
		xhr.send(null);

		if (xhr.status == 200) {
			//データを取得後の処理を書く
			var json = xhr.responseText;
			var param = JSON.parse(json);

			const addr_zahyo = [];

			for (var i = 0; i < param.data.length; i++) {
				var info = {};
				var data = param.data[i];
				info.zahyo_cnt = data.zahyo_cnt;

				const zahyo_info = [];

				for (var j = 0; j < data.data.length; j++) {
					pos = {};

					//経緯度->正規化座標変換
					LonLatW2PRAn(data.data[j].x, data.data[j].y, kijyunkei, retval);

					pos.x = retval[0];
					pos.y = retval[1];
					zahyo_info.push(pos);
				}
				info.zahyo_info = zahyo_info;
				addr_zahyo.push(info);
			}

			//console.log(zahyo_cnt);
			//console.log(zahyo_info);
			ret.addr_zahyo = addr_zahyo;
			ret.result = "success";
			ret.methodName = "GetAddrPolygon2";
			ret.message = "";

			callback(ret);
		}
	},
	InsertAddrPolygon(
		lay_no,
		symbol_no,
		prif,
		city,
		town1,
		town2,
		seqnum,
		callback
	) {
		const ret = {};

		var info_type = lay_no;
		var lay_type = 3;

		lay_no = ChangeLay2(lay_no);
		//DB登録
		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/InsertAddrPolygon?";
		url += "lay_no=";
		url += lay_no;
		url += "&lay_type=";
		url += lay_type;
		url += "&info_type=";
		url += info_type;
		url += "&symbol_no=";
		url += symbol_no;
		url += "&prif=";
		url += prif;
		url += "&city=";
		url += city;
		url += "&town1=";
		url += town1;
		url += "&town2=";
		url += town2;
		url += "&seqnum=";
		url += seqnum;

		console.log(url);

		xhr.open("GET", url);
		xhr.send();
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var json = xhr.responseText;
				console.log(json);

				var param = JSON.parse(json);

				ret.item_no = param.item_no;
				ret.result = "success";
				ret.methodName = "InsertAddrPolygon";
				ret.message = "";
				callback(ret);
			}
		};
	},
	DeleteAddrPolygon(lay_no, item_no, lay_type, callback) {
		const ret = {};

		lay_no = ChangeLay2(lay_no);
		//DB登録
		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/DeleteAddrPolygon?";
		url += "lay_no=";
		url += lay_no;
		url += "&item_no=";
		url += item_no;
		url += "&lay_type=";
		url += lay_type;

		console.log(url);

		xhr.open("GET", url);
		xhr.send();
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var json = xhr.responseText;

				console.log(json);
				var param = JSON.parse(json);

				ret.result = "success";
				ret.methodName = "DeleteAddrPolygon";
				ret.message = "";
				callback(ret);
			}
		};
	},
	//--------------------------------------------------------------------------------------------------------------
	//行政界ポリゴン登録(廃止)
	//--------------------------------------------------------------------------------------------------------------
	/*
	SetAddrPolygon(prif, city, town1, town2, callback) {
	  var drawType = "Polygon";
	  var layerNodeId = "n@23-1";
  
	  facade.startDrawMode(
		drawType,
		layerNodeId,
		function (ret) {
		  var pointinfo = [];
  
		  console.log(ret);
  
		  if (ret.value.length > 0) {
			for (var k = 0; k < ret.value.length; k++) {
			  var geomWKT = ret.value[k].geomWKT;
  
			  var items = geomWKT.split(" ");
  
			  var points = (items.length - 1) / 2;
  
			  for (var i = 0; i < items.length; i++) {
				items[i] = items[i].replace(/\(/g, "");
				items[i] = items[i].replace(/\)/g, "");
				items[i] = items[i].replace(/\,/g, "");
			  }
			  for (var i = 0; i < points; i++) {
				//
				//経緯度を配列に格納
				//
				pointinfo.push(items[i * 2 + 1]);
				pointinfo.push(items[i * 2 + 2]);
			  }
  
			  var xhr = new XMLHttpRequest();
  
			  var url =
				"https://" + GIS_SERVER_IP + ":8443/Sample/InsertAddrPolygon?";
  
			  url += "prif=";
			  url += prif;
			  url += "&city=";
			  url += city;
			  rt;
			  url += "&town1=";
			  url += town1;
			  url += "&town2=";
			  url += town2;
			  url += "&seqnum=";
			  url += 1;
			  url += "&zahyo_cnt=";
			  url += points; //(x,y で一組とする)
  
			  url += "&info_zahyo=";
			  url += pointinfo;
  
			  console.log(url);
  
			  xhr.open("GET", url);
			  xhr.send();
  
			  xhr.onreadystatechange = function () {
				if (xhr.readyState === 4 && xhr.status === 200) {
				  var json = xhr.responseText;
  
				  var out = json;
				  console.log(out);
				}
			  };
			}
			callback(ret);
		  } //if
		},
		function (ret) {
		  ret.result = "cancel";
		  callback(ret);
		}
	  ); //facade
	},
	*/
	//--------------------------------------------------------------------------------------------------------------
	//行政界ポリゴン削除(廃止)
	//--------------------------------------------------------------------------------------------------------------
	/*
	DeleteAddrPolygon(prif, city, town1, town2, callback) {
	  const ret = {};
  
	  var xhr = new XMLHttpRequest();
  
	  var url = "https://" + GIS_SERVER_IP + ":8443/Sample/DeleteAddrPolygon?";
  
	  url += "prif=";
	  url += prif;
	  url += "&city=";
	  url += city;
	  url += "&town1=";
	  url += town1;
	  url += "&town2=";
	  url += town2;
  
	  console.log(url);
  
	  xhr.open("GET", url);
	  xhr.send();
  
	  xhr.onreadystatechange = function () {
		if (xhr.readyState === 4 && xhr.status === 200) {
		  var json = xhr.responseText;
		  var out = json;
		  console.log(out);
  
		  callback(ret);
		}
	  };
	},
	*/
	//--------------------------------------------------------------------------------------------------------------
	//イベント取得閾値変更
	//--------------------------------------------------------------------------------------------------------------
	SetEventCountMax(count) {
		event_count_max = count;
	},
	//--------------------------------------------------------------------------------------------------------------
	//配信一覧取得　20230902
	//--------------------------------------------------------------------------------------------------------------
	GetStreamList(callback) {
		const ret = {};

		var xhr = new XMLHttpRequest();
		//		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetStreamList?";
		//		url += "publisher_type=";
		//		url += 0;


		//2024.09.03
		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetStreamList2";

		console.log(url);

		xhr.open("GET", url);
		xhr.send();

		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var json = xhr.responseText;
				var obj = JSON.parse(json);

				if (obj.result == "OK") {
					ret.result = "success";
				} else {
					ret.result = "error";
				}
				ret.data = obj.data;

				callback(ret);
			}
		};
	},
	//--------------------------------------------------------------------------------------------------------------
	//ピクセル->メートル 20230922
	//--------------------------------------------------------------------------------------------------------------
	PixcelToScale(pix, callback) {
		const result = {};

		facade.getViewExtent(function(ret) {
			//地図キャンバスのサイズを取得する
			var targetElement = document.getElementById("mapPrevframe");
			var clientRect = targetElement.getBoundingClientRect();

			var w = clientRect.right - clientRect.left;
			var h = clientRect.bottom - clientRect.top;

			console.log("w=" + w);
			console.log("h=" + h);

			LonLatW2PRAn(ret.value.minX, ret.value.minY, kijyunkei, retval);
			//最小値をmmで返す
			var zx0 = retval[0];
			var zy0 = retval[1];

			LonLatW2PRAn(ret.value.maxX, ret.value.maxY, kijyunkei, retval);
			//最大値をmmで返す
			var zx1 = retval[0];
			var zy1 = retval[1];

			//1pixあたりの距離を求める

			console.log("zx0=" + zx0);
			console.log("zy0=" + zy0);
			console.log("zx1=" + zx1);
			console.log("zy1=" + zy1);

			var px = (zx1 - zx0) / w; // mm
			var py = (zy1 - zy0) / h; // mm

			console.log("px=" + px);

			result.scale = Math.round((pix * px) / 1000); //mm -> m

			callback(result);
		});
	},
	//--------------------------------------------------------------------------------------------------------------
	//他事案を表示する 20230922
	//--------------------------------------------------------------------------------------------------------------
	drawOtherJianSymbol(jnumber, disp, radius, position, callback) {
		var layerId = "20";

		if (disp == false) {
			console.log("クリア");
			console.log(jian_array_data);

			var result = {};

			for (var i = 0; i < jian_array_data.length; i++) {
				var layerId = jian_array_data[i].layerId;
				var itemId = jian_array_data[i].itemId;

				tmp_data = tmp_data.filter(
					(item) => !(item.layerId == layerId && item.itemId == itemId)
				);

				layerId = ChangeLay2(layerId);

				facade.deleteItem(layerId, parseInt(itemId), function(ret) {
					console.log(ret);
				});
			}
			callback(result);

			//退避中のシンボルをクリア
		} else {
			layerId = ChangeLay2(layerId);

			console.log(position);
			PRAn2LonLatW(position.lon, position.lat, kijyunkei, retval);

			lon = retval[0];
			lat = retval[1];

			console.log("lon=" + lon);
			console.log("lat=" + lat);

			var xhr = new XMLHttpRequest();

			var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetOtherJianSymbol";
			url += "?";
			url += "lon=" + lon;
			url += "&lat=" + lat;
			url += "&radius=" + radius;
			url += "&jisiki=" + jnumber;
			//20240603
			url += "&ope_mode=" + ope_mode;


			console.log(url);

			xhr.open("GET", url);
			xhr.send();

			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					var r_json = xhr.responseText;
					console.log(r_json);
					res = JSON.parse(r_json);

					var len = res.data.length;

					console.log("len=" + len);

					var data = [];
					var attributes = [];

					for (var i = 0; i < len; i++) {
						var info = {};
						attr = {};

						//					attr["シンボル種別"] = res.data[i].symbol_sbt;
						attr["シンボル種別"] = "1012";
						if (res.data[i].saisyunm == "火　災") {
							attr["シンボル種別"] = "1012";
						}
						if (res.data[i].saisyunm == "救　急") {
							attr["シンボル種別"] = "1013";
						}
						if (res.data[i].saisyunm == "救　助") {
							attr["シンボル種別"] = "1014";
						}
						if (res.data[i].saisyunm == "救　護") {
							attr["シンボル種別"] = "1015";
						}

						//20240529 start
						attr["事案識別子"] = res.data[i].jisiki;

						var saigai_no = res.data[i].saigai_no;
						if (saigai_no != null) {
							if (saigai_no.length > 4) {
								attr["災害番号"] = saigai_no.substring(saigai_no.length - 4);
							} else {
								attr["災害番号"] = saigai_no;
							}
						} else {
							attr["災害番号"] = "";
						}

						attr["災害点"] = res.data[i].adsnm;
						//20240529 end
						//					attr["水利コード"] = res.data[i].suiri_cd;

						//2023.07.19　start
						//					attr["文字情報1"] = res.data[i].moji;
						//2023.07.19　end
						/*
														attrdata = "水利使用可否:"
														attrdata += res.data[i].shiyo_kahi;
														attrdata += ",水利状況コード:"
														attrdata += res.data[i].suiriStatusCode;
														attrdata += ",相掛り車両コード１:"
														attrdata += res.data[i].jointCarCode1;
														attrdata += ",相掛り車両コード２:"
														attrdata += res.data[i].jointCarCode2;
														attrdata += ",表示名:"
														attrdata += res.data[i].disp_name;
									
									
														attr["備考"] = attrdata;
									*/
						attributes[i] = attr;

						var v_lon = res.data[i].x_locate;
						var v_lat = res.data[i].y_locate;

						PRAn2LonLatW(v_lon, v_lat, kijyunkei, retval);

						info.wkt = "POINT(";
						info.wkt += retval[0] + " " + retval[1];
						info.wkt += ")";
						info.attributes = attr;
						data.push(info);
					}
					console.log(data);

					facade.drawItems(
						layerId,
						data, //JSONにせずに渡す
						function(ret) {
							jian_array_data = [];
							console.log(ret);

							for (var i = 0; i < ret.value.length; i++) {
								tmp_info = {};
								tmp_info.zx = res.data[i].x_locate;
								tmp_info.zy = res.data[i].y_locate;
								tmp_info.attribute = attributes[i];
								tmp_info.layerId = ret.value[i].layerId;
								tmp_info.itemId = ret.value[i].itemId;
								tmp_data.push(tmp_info);

								jian_array_info = {};

								jian_array_info.layerId = ret.value[i].layerId;
								jian_array_info.itemId = ret.value[i].itemId;

								jian_array_data.push(jian_array_info);
							}
							callback(ret);
						}
					);
				}
			};
		}
	},
	//--------------------------------------------------------------------------------------------------------------
	//運用モード切り替え 20230922
	//--------------------------------------------------------------------------------------------------------------
	SetMode(mode) {
		ope_mode = mode;

		if (ope_mode == 0) {
			console.log("通常モードです");
		} else {
			console.log("訓練モードです");
		}
	},

	SetJsonLoad(mode) {
		jsonload = mode;
	},
	//--------------------------------------------------------------------------------------------------------------
	//端末方向指定 20240228
	//--------------------------------------------------------------------------------------------------------------
	SetOrientation(val, callback) {
		//Portrait（縦向き） or Landscape(横向き)
		const result = {};
		result.methodName = "SetOrientation";
		if (val.indexOf("Landscape") == 0 || val.indexOf("Portrait") == 0) {
			result.sucess = "true";
			result.message = val;
			termOrientation = val;
		} else {
			result.sucess = "error";
			result.message = "パラメータエラー";
		}

		console.log(termOrientation);
		callback(result);
	},
	//
	//届け出レイヤを更新しレイヤを作成する。
	//
	UpdateReportLayer(callback) {
		const result = {};
		var InfoType = 16;
		var value = String(InfoType);
		var xhr = new XMLHttpRequest();
		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/CreateReportLayer";
		xhr.open("GET", url);
		xhr.send();
		LogOut(url);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var json = xhr.responseText;
				console.log(json);

				res = JSON.parse(json);

				result.sucess = res.result;
				result.message = res.message;

				console.log(result);
				callback(result);

				var xhr2 = new XMLHttpRequest();
				var url2 =
					"https://" + GIS_SERVER_IP + ":1443/odgenerator/ReCreateLayer";

				var request;
				request = {
					request: {
						info_type: value,
					},
				};
				console.log(request);

				xhr2.open("POST", url2);
				xhr2.onload = function(e) {
					console.log(e.currentTarget.responseText);
				};
				xhr2.setRequestHeader("Content-Type", "application/json");
				xhr2.send(JSON.stringify(request));
			}
		};
	},
};

function addCustomizerNodeFromJson(jsonfname, nodeId) {
	var xhr = new XMLHttpRequest();
	var url =
		"https://" + GIS_SERVER_IP + ":8443/Sample/ReadJson?jsonfname=" + jsonfname;
	console.log(url);
	xhr.open("GET", url);
	xhr.send();
	LogOut(url);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			var json = xhr.responseText;

			facade.addCustomizerNodeFromJson(
				JSON.parse(json),
				nodeId,
				function(ret) {
					console.log(ret);
					LogOut("addCustomizerNodeFromJson");
				}
			);
		}
	};
}

//--------------------------------------------------------------------------------------------------------------
//指定範囲が収まるスケールを求める　len:mm scale[]:戻り値の配列 [受令専用]
//--------------------------------------------------------------------------------------------------------------
function GetScale(w, h, scale) {
	//scale:スケール　width:横(mm) height:縦(mm)
	const scale_json = [
		{ scale: 6, width: 729865261.1643331, height: 1365763185.461823 },
		{ scale: 8, width: 182941307.73250282, height: 341478303.4141067 },
		{ scale: 9, width: 91482493.43495901, height: 170740131.3480271 },
		{ scale: 10, width: 45742726.40312521, height: 85370188.44665234 },
		{ scale: 11, width: 22871548.15411111, height: 42685109.57984795 },
		{ scale: 12, width: 11435797.19571665, height: 21342556.70983824 },
		{ scale: 13, width: 5717901.487855732, height: 10671278.594912797 },
		{ scale: 14, width: 2858951.1050032675, height: 5335639.327420294 },
		{ scale: 15, width: 1429475.597652711, height: 2667819.66745764 },
		{ scale: 16, width: 714737.8044728711, height: 1333909.8342398107 },
		{ scale: 17, width: 357368.9030953273, height: 666954.917176187 },
		{ scale: 18, width: 178684.45148005337, height: 333477.4585558772 },
		{ scale: 19, width: 89342.22575569153, height: 166738.72931924462 },
		{ scale: 20, width: 44671.11287622154, height: 83369.36465847492 },
		{ scale: 21, width: 44671.11287622154, height: 83369.36465847492 },
	];

	for (let i = 0; i < scale_json.length; i++) {
		if (w > h) {
			console.log(w);
			if (w < scale_json[i].width) {
				scale[0] = scale_json[i].scale;
			}
		} else {
			console.log(h);
			if (h < scale_json[i].height) {
				scale[0] = scale_json[i].scale;
			}
		}
	}
}

//--------------------------------------------------------------------------------------------------------------
//中間テーブルからデータを取得する
//--------------------------------------------------------------------------------------------------------------
function GetSymbolInfo(lay_no, item_no, lay_type, ret) {
	//  const ret = {};
	//  ret.value = {};

	var xhr = new XMLHttpRequest();

	var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetDB?";
	url += "lay_no=";
	url += lay_no;
	url += "&item_no=";
	url += item_no;
	url += "&lay_type=";
	url += lay_type;

	console.log(url);

	xhr.open("GET", url, false);
	xhr.send(null);

	if (xhr.status == 200) {
		//データを取得後の処理を書く
		var json = xhr.responseText;

		var out = "";

		var ret = JSON.parse(json);
		console.log(ret);
	}
}

//--------------------------------------------------------------------------------------------------------------
//中間テーブルにデータを登録する
//--------------------------------------------------------------------------------------------------------------
function InsertDB(
	lay_no,
	item_no,
	info_type,
	info_summery,
	lay_type,
	symbol_no,
	zahyo_x,
	zahyo_y,
	strinfo1,
	strinfo2,
	strinfo3,
	str_zahyo_x,
	str_zahyo_y,
	zahyo_cnt,
	info_zahyo,
	dbresult
) {
	var xhr = new XMLHttpRequest();

	var url = "https://" + GIS_SERVER_IP + ":8443/Sample/InsertDB?";
	url += "lay_no=";
	url += lay_no;
	url += "&item_no=";
	url += item_no;
	url += "&info_type=";
	url += info_type;
	url += "&info_summery=";
	url += info_summery;
	url += "&lay_type=";
	url += lay_type;
	url += "&symbol_no=";
	url += symbol_no;
	url += "&zahyo_x=";
	url += zahyo_x;
	url += "&zahyo_y=";
	url += zahyo_y;
	url += "&strinfo1=";
	url += strinfo1;
	url += "&strinfo2=";
	url += strinfo2;
	url += "&strinfo3=";
	url += strinfo3;
	url += "&str_zahyo_x=";
	url += str_zahyo_x;
	url += "&str_zahyo_y=";
	url += str_zahyo_y;
	url += "&zahyo_cnt=";
	url += zahyo_cnt;

	url += "&info_zahyo=";
	url += info_zahyo;

	xhr.open("GET", url);
	xhr.send();

	//	console.log(url);

	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			var json = xhr.responseText;

			var ret = JSON.parse(json);
			var param = JSON.parse(json);

			dbresult[0] = param.result;
			dbresult[1] = param.message;
			dbresult[2] = param.item_no;
			dbresult[3] = param.sql;
		}
	};
}
//--------------------------------------------------------------------------------------------------------------
//中間テーブルからデータを削除する
//--------------------------------------------------------------------------------------------------------------
function DeleteDB(lay_no, item_no, lay_type) {
	var xhr = new XMLHttpRequest();

	var url = "https://" + GIS_SERVER_IP + ":8443/Sample/DeleteDB?";
	url += "lay_no=";
	url += document.getElementById("lay_no").value;
	url += "&item_no=";
	url += document.getElementById("item_no").value;
	url += "&lay_type=";
	url += document.getElementById("lay_type").value;
	xhr.open("GET", url);
	xhr.send();

	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			var json = xhr.responseText;

			var out = json;

			list.innerHTML = out;
		}
	};
}

//--------------------------------------------------------------------------------------------------------------
//中間テーブルから地図レイヤを作成する value:info_type
//--------------------------------------------------------------------------------------------------------------
function UpdateDB(value) {
	var xhr = new XMLHttpRequest();

	var url = "https://" + GIS_SERVER_IP + ":1443/odgenerator/ReCreateLayer";

	var request;
	request = {
		request: {
			info_type: value,
		},
	};

	console.log(request);

	xhr.open("POST", url);
	xhr.onload = function(e) {
		console.log(e.currentTarget.responseText);
	};
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(JSON.stringify(request));
}
//--------------------------------------------------------------------------------------------------------------
//平面直角座標系を経緯度に変換する
//--------------------------------------------------------------------------------------------------------------
function PRAn2LonLatW(lx, ly, kijyunkei, retval) {
	const ret = {};
	var v_lx = lx / 1000;
	var v_ly = ly / 1000;

	//経緯度に変換
	gpconv2(v_lx, v_ly, kijyunkei, lonlat);

	var lx2 = lonlat[0] * 1000;
	var ly2 = lonlat[1] * 1000;

	//測地系（日本⇒世界）
	ConvJ2W(lx2, ly2, lonlat);

	var lon = lonlat[0] / (3600 * 1000);
	var lat = lonlat[1] / (3600 * 1000);

	retval[0] = lon;
	retval[1] = lat;
}

//--------------------------------------------------------------------------------------------------------------
//経緯度を平面直角座標系に変換する
//--------------------------------------------------------------------------------------------------------------
function LonLatW2PRAn(lon, lat, kijyunkei, retval) {
	const ret = {};
	lx = lon * 3600 * 1000;
	ly = lat * 3600 * 1000;

	//座標を正規化座標に変換

	//測地系変換
	ConvW2J(lx, ly, lonlat);

	var lx2 = lonlat[0] / 1000;
	var ly2 = lonlat[1] / 1000;

	//経緯度を正規化座標に変換

	gpconv(lx2, ly2, kijyunkei, lonlat);

	lx2 = lonlat[0] * 1000;
	ly2 = lonlat[1] * 1000;

	retval[0] = lx2;
	retval[1] = ly2;
}

//--------------------------------------------------------------------------------------------------------------
//経緯度を平面直角座標系に変換する
//--------------------------------------------------------------------------------------------------------------
function gpconv(m_keido, m_ido, kijyunkei, ret) {
	var lx = 0.0;
	var ly = 0.0;

	var phi = 0.0;
	var lamda = 0.0;
	var x = 0.0;
	var y = 0.0;
	var phi0 = 0.0;
	var lamda0 = 0.0;

	var KJN_IDO = 0;
	var KJN_KDO = 0;
	var keido = [
		466200, 471600, 475800, 480600, 483600, 489600, 493800, 498600, 503400,
		507000, 504900, 512100, 519300, 511200, 459000, 446400, 471600, 489600,
		554400,
	];

	var ido = [
		118800, 118800, 129600, 118800, 129600, 129600, 129600, 129600, 129600,
		144000, 158400, 158400, 158400, 93600, 93600, 93600, 93600, 72000, 93600,
	];

	KJN_IDO = ido[kijyunkei - 1];
	KJN_KDO = keido[kijyunkei - 1];

	var Ba = 0.0;
	var Bb = 0.0;
	var Bc = 0.0;
	var Bd = 0.0;
	var Be = 0.0;

	var A = 0.0;
	var E = 0.0;
	var SR = 0.0;
	var PAI = 0.0;

	A = 6377397.155; //'長半径(meter)
	E = 0.006674372231315; //'離心率の二乗
	SR = 206264.806; //'秒・ラジアン換算係数
	PAI = 3.14159265;

	var b = 0.0;
	var s = 0.0;
	var c = 0.0;
	var c2 = 0.0;
	var c4 = 0.0;
	var t = 0.0;
	var t2 = 0.0;
	var t4 = 0.0;
	var h2 = 0.0;
	var h4 = 0.0;
	var N = 0.0;
	var lam2 = 0.0;
	var lamc2 = 0.0;
	var lamc4 = 0.0;

	var x1 = 0.0;
	var x2 = 0.0;
	var y1 = 0.0;
	var y2 = 0.0;

	phi = parseFloat(String(m_ido));
	lamda = parseFloat(String(m_keido));

	phi0 = parseFloat(String(KJN_IDO));
	lamda0 = parseFloat(String(KJN_KDO));

	//    '秒からラジアンへ
	lamda = lamda - lamda0;
	lamda = (PAI / 180) * (lamda / 3600);
	phi = (PAI / 180) * (phi / 3600);
	phi0 = (PAI / 180) * (phi0 / 3600);

	s = Math.sin(phi);
	c = Math.cos(phi);
	c2 = c * c;
	c4 = c2 * c2;
	t = Math.tan(phi);
	t2 = t * t;
	t4 = t2 * t2;
	h2 = (E * c2) / (1 - E);
	h4 = h2 * h2;
	N = A / Math.sqrt(1 - E * s * s);
	lam2 = lamda * lamda;
	lamc2 = lam2 * c2;
	lamc4 = lamc2 * lamc2;

	var ph1 = 0.0;
	var ph2 = 0.0;

	ph1 = phi0;
	ph2 = phi;

	Ba = 1.005037306049 * (ph2 - ph1);
	Bb = (0.0050478492403 * (Math.sin(2 * ph2) - Math.sin(2 * ph1))) / 2;
	Bc = (0.0000105637868 * (Math.sin(4 * ph2) - Math.sin(4 * ph1))) / 4;
	Bd = (0.00000002063332 * (Math.sin(6 * ph2) - Math.sin(6 * ph1))) / 6;
	Be = (0.000000000038853 * (Math.sin(8 * ph2) - Math.sin(8 * ph1))) / 8;

	b = A * (1 - E) * (Ba - Bb + Bc - Bd + Be);

	x1 = (lamc2 * (5 - t2 + 9 * h2 + 4 * h4)) / 24;
	x2 = (lamc4 * (61 - 58 * t2 + t4 + 270 * h2 - 330 * h2 * t2)) / 720;
	y1 = (lamc2 * (1 - t2 + h2)) / 6;
	y2 = (lamc4 * (5 - 18 * t2 + t4 + 14 * h2 - 58 * h2 * t2)) / 120;
	x = 0.9999 * (b + N * s * c * lam2 * (0.5 + x1 + x2));
	y = 0.9999 * N * c * lamda * (1 + y1 + y2);

	// y,x 逆
	lx = y;
	ly = x;

	ret[0] = lx;
	ret[1] = ly;
}
//--------------------------------------------------------------------------------------------------------------
//平面直角座標系を経緯度に変換する
//--------------------------------------------------------------------------------------------------------------
function gpconv2(lx, ly, kijyunkei, ret) {
	var phi = 0.0;
	var lamda = 0.0;
	var phi0 = 0.0;
	var lamda0 = 0.0;
	var x = 0.0;
	var y = 0.0;

	var KJN_KDO = 0;
	var KJN_IDO = 0;
	var keido = [
		466200, 471600, 475800, 480600, 483600, 489600, 493800, 498600, 503400,
		507000, 504900, 512100, 519300, 511200, 459000, 446400, 471600, 489600,
		554400,
	];

	var ido = [
		118800, 118800, 129600, 118800, 129600, 129600, 129600, 129600, 129600,
		144000, 158400, 158400, 158400, 93600, 93600, 93600, 93600, 72000, 93600,
	];

	KJN_IDO = ido[kijyunkei - 1];
	KJN_KDO = keido[kijyunkei - 1];

	//絶対座標取得
	x = parseFloat(String(ly));
	y = parseFloat(String(lx));

	//座標計算
	//            phi0 = KJN_IDO;
	//            lamda0 = KJN_KDO;
	phi0 = parseFloat(String(KJN_IDO));
	lamda0 = parseFloat(String(KJN_KDO));

	//平面直角座標系->極座標系

	var mot = 0.0;
	var m = 0.0;
	var s = 0.0;
	var ab = 0.0;
	var ph0 = 0.0;
	var ph1 = 0.0;
	var si = 0.0;
	var co = 0.0;

	var ri = 0.0;
	var ni = 0.0;
	var cr = 0.0;
	var eta2 = 0.0;
	var t = 0.0;
	var t2 = 0.0;
	var t4 = 0.0;
	var y1 = 0.0;
	var y2 = 0.0;
	var y4 = 0.0;
	var f1 = 0.0;
	var f2 = 0.0;
	var A = 0.0;
	var E = 0.0;
	var SR = 0.0;
	var PAI = 0.0;

	var wph1 = 0.0;
	var wph2;

	var Ba = 0.0;
	var Bb = 0.0;
	var Bc = 0.0;
	var Bd = 0.0;
	var Be = 0.0;

	A = 6377397.155; //長半径(meter)
	E = 0.006674372231315; //離心率の二乗
	SR = 206264.806; //秒・ラジアン換算係数
	PAI = 3.14159265358979;

	si = 0;

	//秒からラジアンへ
	lamda0 = (PAI / 180) * (lamda0 / 3600);
	phi0 = (PAI / 180) * (phi0 / 3600);

	ab = 1;
	ph0 = PAI * 0.2;

	wph1 = 0;
	///		wph2 = ph0;     20030731
	wph2 = phi0;

	Ba = 1.005037306049 * (wph2 - wph1);
	Bb = (0.0050478492403 * (Math.sin(2 * wph2) - Math.sin(2 * wph1))) / 2;
	Bc = (0.0000105637868 * (Math.sin(4 * wph2) - Math.sin(4 * wph1))) / 4;
	Bd = (0.00000002063332 * (Math.sin(6 * wph2) - Math.sin(6 * wph1))) / 6;
	Be = (0.000000000038853 * (Math.sin(8 * wph2) - Math.sin(8 * wph1))) / 8;

	m = x / 0.9999 + A * (1 - E) * (Ba - Bb + Bc - Bd + Be);
	y = y / 0.9999;
	mot = 1 / (A * (1 - E));

	while (ab > 0.00000000000001) {
		wph1 = 0;
		wph2 = ph0;
		Ba = 1.005037306049 * (wph2 - wph1);
		Bb = (0.0050478492403 * (Math.sin(2 * wph2) - Math.sin(2 * wph1))) / 2;
		Bc = (0.0000105637868 * (Math.sin(4 * wph2) - Math.sin(4 * wph1))) / 4;
		Bd = (0.00000002063332 * (Math.sin(6 * wph2) - Math.sin(6 * wph1))) / 6;
		Be = (0.000000000038853 * (Math.sin(8 * wph2) - Math.sin(8 * wph1))) / 8;
		s = A * (1 - E) * (Ba - Bb + Bc - Bd + Be);
		si = Math.sin(ph0);
		ph1 = ph0 + (m - s) * Math.pow(1 - E * si * si, 1.5) * mot;
		ab = ph1 - ph0;
		ph0 = ph1;
		if (ab < 0) {
			ab = -1 * ab;
		}
	}

	co = Math.cos(ph0);
	cr = Math.sqrt(1 - E * si * si);
	ni = cr / A;
	ri = cr * cr * cr * mot;
	eta2 = (co * co * E) / (1 - E);
	t = Math.tan(ph0);
	t2 = t * t;
	t4 = t2 * t2;
	y1 = y * ni;
	y2 = y1 * y1;
	y4 = y2 * y2;
	f1 = -8.33333333333333e-2 * y2 * (5 + 3 * t2 + eta2 - 9 * t2 * eta2);
	f2 = 2.77777777777778e-3 * y4 * (61 + 90 * t2 + 45 * t4);
	phi = ph0 - 0.5 * y * y1 * ri * t * (1 + f1 + f2);
	phi = ((phi * 180) / PAI) * 3600;
	f1 = -0.166666666666667 * y2 * (1 + 2 * t2 + eta2);
	f2 = 8.33333333333333e-3 * y4 * (5 + 28 * t2 + 24 * t4);
	lamda = lamda0 + (y1 / co) * (1 + f1 + f2);
	lamda = ((lamda * 180) / PAI) * 3600;

	//            m_keido = lamda;
	//            m_ido = phi;

	ret[0] = lamda;
	ret[1] = phi;

	return 0;
}
//--------------------------------------------------------------------------------------------------------------
//世界測地系→日本測地系
//--------------------------------------------------------------------------------------------------------------
function ConvW2J(Mx, My, ret) {
	var BTokyo = 0.0;
	var LTokyo = 0.0;
	var BWGS84 = 0.0;
	var LWGS84 = 0.0;

	LWGS84 = Mx / (3600 * 1000);
	BWGS84 = My / (3600 * 1000);

	BTokyo = BWGS84 + 0.00010696 * BWGS84 - 0.000017467 * LWGS84 - 0.004602;
	LTokyo = LWGS84 + 0.000046047 * BWGS84 + 0.000083049 * LWGS84 - 0.010041;

	ret[0] = LTokyo * 3600 * 1000;
	ret[1] = BTokyo * 3600 * 1000;
}
//--------------------------------------------------------------------------------------------------------------
//日本測地系→世界測地系
//--------------------------------------------------------------------------------------------------------------
function ConvJ2W(Mx, My, ret) {
	var BTokyo = 0.0;
	var LTokyo = 0.0;
	var BWGS84 = 0.0;
	var LWGS84 = 0.0;

	//console.log("Mx=" + Mx);
	//console.log("My=" + My);

	LTokyo = Mx / (3600 * 1000);
	BTokyo = My / (3600 * 1000);

	LWGS84 = LTokyo - 0.000046038 * BTokyo - 0.000083043 * LTokyo + 0.01004;
	BWGS84 = BTokyo - 0.00010695 * BTokyo + 0.000017464 * LTokyo + 0.0046017;

	ret[0] = LWGS84 * 3600 * 1000;
	ret[1] = BWGS84 * 3600 * 1000;
}

//--------------------------------------------------------------------------------------------------------------
// ifx LayerID --> 業務レイヤID
//--------------------------------------------------------------------------------------------------------------
function ChangeLay(id) {
	var result = id;

	var newid = layObject[id];

	if (typeof newid === "undefined") {
	} else {
		result = newid;
	}
	return result;
}

//--------------------------------------------------------------------------------------------------------------
// ifx LayerID <-- 業務レイヤID
//--------------------------------------------------------------------------------------------------------------
function ChangeLay2(id) {
	var result = id;
	for (let i in layObject) {
		if (layObject[i] == id) {
			result = i;
			break;
		}
	}
	return result;
}
//=====================================================
// Base64形式の文字列 → <img>要素に変換
//   base64img: Base64形式の文字列
//   callback : 変換後のコールバック。引数は<img>要素
//=====================================================
function Base64ToImage(base64img, callback) {
	var img = new Image();
	img.onload = function() {
		callback(img);
	};
	img.src = base64img;
}
/*
function ParseGeomWKT(geomWKT,points){
	
	var items = geomWKT.split(" ");
	
	for(var i=0;i<items.length;i++){
		items[i] = items[i].replace(/\(/g,'')
		items[i] = items[i].replace(/\)/g,'')
		items[i] = items[i].replace(/\,/g,'')
		points[i] = items[i];
	}
}
*/
//--------------------------------------------------------------------------------------------------------------
// [showdlg]映像配信ダイアログ表示
//dialog_id:ダイアログID
//termID:映像ソースID
//top:上表示位置
//left:左表示位置
//--------------------------------------------------------------------------------------------------------------
function showdlg(dialog_id, type, src, left, top) {
	var dialog = document.getElementById("dialog" + dialog_id);

	console.log("**left=" + left);
	console.log("**top=" + top);

	var targetElement = document.getElementById("mapPrevPane");
	var clientRect = targetElement.getBoundingClientRect();

	console.log(clientRect);

	//地図ペインの相対位置を取得する
	//var flex_top = $(".flex_right").position().top;
	//var flex_left = $(".flex_right").position().left;

	console.log(clientRect.top);
	console.log(clientRect.left);

	console.log("dialog_id=" + dialog_id);

	dialog.style.position = "absolute";
	dialog.style.top = top + clientRect.top + "px";
	dialog.style.left = left + clientRect.left + "px";
	dialog.style.width = "120px";
	dialog.style.height = "80px";
	//  dialog.style.width = "240px";
	//dialog.style.height = "160px";

	dialog.style.padding = 0;
	dialog.style.border = 0;

	var url;
	//image
	if (type == "image") {
		url =
			"https://" +
			GIS_SERVER_IP +
			":8443/StreamList/Imagethumbnail.html?src=" +
			src;
		url += "&terminal_type=";
		url += init_terminal_type;
	}
	//video
	if (type == "video") {
		url =
			"https://" +
			GIS_SERVER_IP +
			":8443/StreamList/Moviethumbnail.html?src=" +
			src;
		url += "&terminal_type=";
		url += init_terminal_type;
	}
	//stream
	if (type == "stream") {
		url = "https://" + GIS_SERVER_IP + ":8443/MapAPI/VideoPlay.html?id=" + src;
		//			"./VideoPlay.html?id=" + src;
		url += "&terminal_type=";
		url += init_terminal_type;
	}

	console.log("url='" + url + "'");

	var html = '<iframe src="';
	html += url;
	html +=
		'" width="100%" height="100%" scrolling="no" marginwidth="1" marginheight="1" ';
	html += "></iframe>";
	//	html += '"></iframe>';

	console.log(html);

	//var image = document.getElementById("image" + dialog_id);
	//image.innerHTML = html;
	dialog.innerHTML = html;

	dialog.show();
}
//--------------------------------------------------------------------------------------------------------------
// [showPopdlg]吹き出しダイアログ表示
//dialog_id:ダイアログID
//text:文字列
//color:背景色
//top:上表示位置
//left:左表示位置
//--------------------------------------------------------------------------------------------------------------

/*
function showPopdlg(dialog_id, text, color, left, top) {
  var dialog = document.getElementById("pop_dialog" + dialog_id);

  console.log("left=" + left);
  console.log("top=" + top);

  var targetElement = document.getElementById("mapPrevPane");
  var clientRect = targetElement.getBoundingClientRect();

  console.log(clientRect);

  console.log(clientRect.top);
  console.log(clientRect.left);

  console.log("dialog_id=" + dialog_id);

  dialog.style.position = "absolute";
  dialog.style.top = top + clientRect.top + "px";
  dialog.style.left = left + clientRect.left + "px";
  dialog.style.width = "80px";
  dialog.style.padding = 0;
  dialog.style.border = 1;
  dialog.style.backgroundColor = color;

  var html = "<label>" + text + "</label>";
  var label = document.getElementById("pop_label" + dialog_id);
  label.innerHTML = html;

  dialog.show();
}
*/
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//属性編集 2023.08.16
//--------------------------------------------------------------------------------------------------------------
function ChangeAttr(layerNodeId, attr) {
	if (layerNodeId == "n@4-1") {
		delete attr.事案識別子;
	}
	if (layerNodeId == "n@5-1") {
		delete attr.受付日;
		delete attr.連番;
		delete attr.処理区分;
	}
	if (layerNodeId == "n@11-1") {
		delete attr.事案識別子;
		delete attr.事案内インデックス;
	}
	if (layerNodeId == "n@12-1") {
		delete attr.事案識別子;
		delete attr.事案内インデックス;
	}
	if (layerNodeId == "n@15-1") {
		delete attr.事案グループ;
	}
	if (layerNodeId == "n@16-1") {
		delete attr.事案グループ;
	}
}
//--------------------------------------------------------------------------------------------------------------
//レイヤ名置換 2023.08.16
//--------------------------------------------------------------------------------------------------------------
function ChangeLayerName(layerName) {
	var result = layerName;
	if (layerName == "指揮関係") {
		result = "警防情報関係１";
	}
	if (layerName == "警防情報関係") {
		result = "警防情報関係２";
	}
	if (layerName == "風向き") {
		result = "警防情報関係３";
	}

	return result;
}
//--------------------------------------------------------------------------------------------------------------
//属性取得　20240226
//--------------------------------------------------------------------------------------------------------------

function GetAttriButes(lon, lat, callback) {
	var attrs = [];

	back_lon = lon;
	back_lat = lat;

	LonLatW2PRAn(lon, lat, kijyunkei, retval);

	var px = retval[0];
	var py = retval[1];

	var radius = 10; //(m))
	let lay_no = [];

	var j = 0;
	//表示中レイヤを取得する
	facade.getVisibleLayerList(function(ret) {
		var chk1 = false;
		var chk2 = false;
		for (var i = 0; i < ret.value.length; i++) {
			if (ret.value[i].display == true) {
				lay_no[j] = ret.value[i].id;
				j++;
			}
		}

		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetNearAttributes";
		url += "?";
		url += "lon=" + lon;
		url += "&lat=" + lat;
		url += "&radius=" + radius;
		for (var i = 0; i < lay_no.length; i++) {
			url += "&lay_no=" + lay_no[i];
		}
		//20240603
		url += "&ope_mode=" + ope_mode;


		xhr.open("GET", url);
		xhr.send();

		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var json = xhr.responseText;
				console.log(json);
				res = JSON.parse(json);

				var len = res.data.length;

				for (var i = 0; i < len; i++) {
					var attr = JSON.parse(res.data[i].info_summery);
					console.log(attr);

					attrs.push(attr);
				}
				var tmp_len = tmp_data.length;

				console.log("tmp_data.length=" + tmp_len);

				var disp_cnt = 0;

				for (var i = 0; i < tmp_data.length; i++) {
					var zx = tmp_data[i].zx;
					var zy = tmp_data[i].zy;

					var far = Math.sqrt((px - zx) * (px - zx) + (py - zy) * (py - zy));

					console.log("far=" + far);
					if (far < parseInt(radius) * 1000) {
						var attr = tmp_data[i].attribute;
						console.log(attr);

						attrs.push(attr);
					}
				}

				retval.attrs = attrs;
				console.log(attrs);
				callback(retval);
			}
		};
	});
}

//--------------------------------------------------------------------------------------------------------------
//右クリック処理
//--------------------------------------------------------------------------------------------------------------

function showInfoDialog1(lon, lat) {
	back_lon = lon;
	back_lat = lat;

	LonLatW2PRAn(lon, lat, kijyunkei, retval);

	var px = retval[0];
	var py = retval[1];

	var info_dialog1 = document.getElementById("info_dialog1");
	//  var info_dialog1_list = document.getElementById("info_dialog1_list");
	//while (info_dialog1_list.firstChild) {
	//info_dialog1_list.removeChild(info_dialog1_list.firstChild);
	//}

	var radius = 10; //(m))
	let lay_no = [];

	var attrValue = [];
	var j = 0;
	//表示中レイヤを取得する
	facade.getVisibleLayerList(function(ret) {
		var chk1 = false;
		var chk2 = false;
		for (var i = 0; i < ret.value.length; i++) {
			if (ret.value[i].display == true) {
				if (ret.value[i].id == "n@4-1" || ret.value[i].id == "n@11-1") {
					chk1 = true;
				}
				if (ret.value[i].id == "n@5-1") {
					chk2 = true;
				}

				lay_no[j] = ret.value[i].id;
				j++;
			}
		}
		//5が非表示で4と11が表示なら5を対象にする
		if (chk1 == true && chk2 == false) {
			lay_no[j] = "n@5-1";
		}

		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetNearAttributes";
		url += "?";
		url += "lon=" + lon;
		url += "&lat=" + lat;
		url += "&radius=" + radius;
		for (var i = 0; i < lay_no.length; i++) {
			url += "&lay_no=" + lay_no[i];
		}

		xhr.open("GET", url);
		xhr.send();

		//20240501
		var list_name = "";
		var key = "";
		var value = "";
		var value2 = "";
		var value3 = "";
		var value4 = "";
		var value5 = "";

		var type = "";

		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var json = xhr.responseText;
				console.log(json);
				res = JSON.parse(json);

				var len = res.data.length;

				console.log("len=" + len);
				var info_dialog1_attr = document.getElementById("info_dialog1_attr");
				var attr_html = "";
				//--20240424
				attr_html += "<table class='infotable2' id='jufukuinfo' width='430px'>";
				attr_html += "<th style='width:125px;'>";
				attr_html += "種別";
				attr_html += "</th><th>";
				attr_html += "名称";
				attr_html += "</th>";

				for (var i = 0; i < len; i++) {
					var attr = JSON.parse(res.data[i].info_summery);
					console.log(attr);

					info_attr[i] = attr;
					info_attr_layerId[i] = res.data[i].lay_no;

					value = "";
					value2 = "";
					value3 = "";

					if (res.data[i].lay_no == "n@1-1") {
						type = 1;
						key = "災害点関係";
						value = Object.values(attr)[0];

						attrValue = [];
						GetParamFromAttr("災害番号", attr["備考"], attrValue);
						console.log(attrValue[0]);
						list_name = attrValue[0];
						attrValue = [];
						GetParamFromAttr("災害点", attr["備考"], attrValue);
						console.log(attrValue[0]);
						list_name += attrValue[0];
						console.log(list_name);
					}
					if (res.data[i].lay_no == "n@2-1") {
						type = 1;
						key = "水利関係";
						value = Object.values(attr)[0];
						attrValue = [];
						GetParamFromAttr("水利番号", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@3-1") {
						type = 1;
						key = "堤防等";

						//20240903 add start


						attrValue = [];
						GetParamFromAttr("区コード", attr["備考"], attrValue);
						value = attrValue[0];
						attrValue = [];
						GetParamFromAttr("地区コード", attr["備考"], attrValue);
						value2 = attrValue[0];;
						attrValue = [];
						GetParamFromAttr("防潮堤ID", attr["備考"], attrValue);
						value3 = attrValue[0];;
						list_name = attrValue[0];

						//20240903 add end

					}
					if (res.data[i].lay_no == "n@4-1") {
						type = 1;
						key = "警防情報関係１";
						//備考から病院コードを取得する
						attrValue = [];
						GetParamFromAttr("病院コード", attr["備考"], attrValue);
						value = attrValue[0];
						attrValue = [];
						GetParamFromAttr("名前", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@5-1") {
						type = 1;
						key = "警防情報関係２";
						//備考から対象物コードを取得する
						attrValue = [];
						GetParamFromAttr("対象物コード", attr["備考"], attrValue);
						value = attrValue[0];
						attrValue = [];
						GetParamFromAttr("名前", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@6-1") {
						type = 1;
						key = "対象物";
						value = Object.values(attr)[0];
						attrValue = [];
						GetParamFromAttr("名前", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@7-1") {
						type = 1;
						key = "その他";
						//備考から対象物コードを取得する
						attrValue = [];
						GetParamFromAttr("対象物コード", attr["備考"], attrValue);
						value = attrValue[0];
						attrValue = [];
						GetParamFromAttr("名前", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@8-1") {
						type = 1;
						key = "枝街区番号";

						//"区コード":"01","町コード":"0001","丁目コード":"01","街区コード":"01"を取得
						value = Object.values(attr)[0];
						value2 = Object.values(attr)[1];
						value3 = Object.values(attr)[2];
						value4 = Object.values(attr)[3];
						list_name = value;
					}
					if (res.data[i].lay_no == "n@9-1") {
						type = 1;
						key = "高速道路／出場区";
						//備考から路線コード,キロ,メートルを取得する
						attrValue = [];
						GetParamFromAttr("路線コード", attr["備考"], attrValue);
						value = attrValue[0];

						attrValue = [];
						GetParamFromAttr("キロポスト", attr["備考"], attrValue);

						console.log("attrValue=" + attrValue[0]);

						var floatVal = parseFloat(attrValue[0]);
						value2 = parseInt((floatVal * 10) / 10);
						value3 = parseInt((floatVal * 10) % 10);

						attrValue = [];
						GetParamFromAttr("名前", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@10-1") {
						type = 1;
						key = "車両";
						value = Object.values(attr)[0];
						attrValue = [];
						GetParamFromAttr("車両名称", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@11-1") {
						type = 1;
						key = "警防情報関係３";

						attrValue = [];
						GetParamFromAttr("受付日", attr["備考"], attrValue);
						value = attrValue[0];
						GetParamFromAttr("連番", attr["備考"], attrValue);
						value2 = attrValue[0];
						attrValue = [];
						GetParamFromAttr("名称", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@12-1") {
						type = 1;
						key = "災害点関係";
						list_name = value;
						if (ope_mode == 1) {
							//訓練時
							res.data[i].lay_no = "n@1-1";
							attrValue = [];
							GetParamFromAttr("災害番号", attr["備考"], attrValue);
							console.log(attrValue[0]);
							list_name = attrValue[0];
							attrValue = [];
							GetParamFromAttr("災害点", attr["備考"], attrValue);
							console.log(attrValue[0]);
							list_name += attrValue[0];
							console.log(list_name);
						}
					}
					if (res.data[i].lay_no == "n@13-1") {
						type = 1;
						key = "車両";
						list_name = value;

						if (ope_mode == 1) {
							//訓練時
							res.data[i].lay_no = "n@10-1";
							attrValue = [];
							GetParamFromAttr("車両名称", attr["備考"], attrValue);
							list_name = attrValue[0];
						}
					}
					if (res.data[i].lay_no == "n@14-1") {
						type = 1;
						key = "現場画像";
						value = Object.values(attr)[0];
						attrValue = [];
						GetParamFromAttr("名称", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@15-1") {
						type = 1;
						key = "インフラ／ライフライン";
						value = Object.values(attr)[0]; //受付日
						value2 = Object.values(attr)[1]; //連番
						attrValue = [];
						GetParamFromAttr("名称", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@16-1") {
						type = 1;
						key = "通行止め";
						value = Object.values(attr)[0]; //受付日
						value2 = Object.values(attr)[1]; //連番
						attrValue = [];
						GetParamFromAttr("名称", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@17-1") {
						type = 1;
						key = "お絵かき";
						value = Object.values(attr)[0];
						list_name = value;
					}
					if (res.data[i].lay_no == "n@18-1") {
						type = 1;
						key = "要援護者";
						//備考から福祉コードを取得する
						attrValue = [];
						GetParamFromAttr("福祉コード", attr["備考"], attrValue);
						value = attrValue[0];

						attrValue = [];
						GetParamFromAttr("名前", attr["備考"], attrValue);
						list_name = attrValue[0];
					}
					if (res.data[i].lay_no == "n@19-1") {
						type = 1;
						key = "災害拠点病院";

						//備考から病院コードを取得する
						attrValue = [];
						GetParamFromAttr("病院コード", attr["備考"], attrValue);
						value = attrValue[0];

						attrValue = [];
						GetParamFromAttr("名前", attr["備考"], attrValue);
						list_name = attrValue[0];
					}

					info_type[i] = type;
					info_value[i] = value;
					info_value2[i] = value2;
					info_value3[i] = value3;

					//if (ope_mode == 1) {
					//訓練時
					//} else {
					//if (res.data[i].info_type != 13) {
					//--20240424
					attr_html += "<tr style='cursor: pointer;'";
					attr_html += " onclick='clickInfoDialog(";
					attr_html += type;
					attr_html += ",";
					attr_html += i;
					attr_html += ",";
					attr_html += lon;
					attr_html += ",";
					attr_html += lat;
					attr_html += ")'";
					attr_html += ">";
					//--20240424
					attr_html += "<td>";
					attr_html += key;
					attr_html += "</td><td>";
					//--20240501
					attr_html += list_name;
					attr_html += "</td></tr>";
					//}
					//}
				}
				//一時シンボルを検索する
				var tmp_len = tmp_data.length;

				console.log("tmp_data.length=" + tmp_len);

				var disp_cnt = 0;

				for (var i = 0; i < tmp_data.length; i++) {
					var zx = tmp_data[i].zx;
					var zy = tmp_data[i].zy;

					var far = Math.sqrt((px - zx) * (px - zx) + (py - zy) * (py - zy));

					console.log("far=" + far);
					if (far < parseInt(radius) * 1000) {
						var attr = tmp_data[i].attribute;
						console.log(attr);

						info_attr[len + disp_cnt] = attr;
						//20240216
						info_attr_layerId[len + disp_cnt] = tmp_data[i].layerId;

						value = "";
						value2 = "";
						value3 = "";

						if (tmp_data[i].layerId == "n@20-1") {
							//type = 2;
							//20240529 災害点の属性はDBから取得
							type = 1;
							key = "災害点関係（一時入力）";
							value = attr["事案識別子"];
							//20240528-29

							name1 = attr["災害番号"];
							name2 = attr["災害点"];

							list_name = name1;
							if (name2.length > 0) {
								list_name += "(";
								list_name += name2;
								list_name += ")";
							}
						}
						if (tmp_data[i].layerId == "n@21-1") {
							//             type = 2;
							type = 1;
							//              type = 2;
							key = "水利関係（一時入力）";
							value = attr["水利コード"];
							//20240528
							list_name = attr["文字情報1"];
						}
						if (tmp_data[i].layerId == "n@22-1") {
							type = 2;
							key = "現場画像（一時入力）";
							value = attr["現場画像ID"];
							//20240528
							list_name = value;
						}
						if (tmp_data[i].layerId == "n@23-1") {
							type = 2;
							key = "インフラ／ライフライン（一時入力）";
							//20240528
							list_name = value;
						}
						if (tmp_data[i].layerId == "n@24-1") {
							type = 2;
							key = "通行止め（一時入力）";
							//20240528
							list_name = value;
						}
						if (tmp_data[i].layerId == "n@28-1") {
							type = 2;
							key = "作図用（一時入力）";
							//20240528
							list_name = value;
						}

						info_type[len + disp_cnt] = type;
						info_value[len + disp_cnt] = value;
						info_value2[len + disp_cnt] = value2;
						info_value3[len + disp_cnt] = value3;

						//--20240424
						attr_html += "<tr style='cursor: pointer;'";
						attr_html += " onclick='clickInfoDialog(";
						attr_html += type;
						attr_html += ",";
						attr_html += len + disp_cnt;
						attr_html += ",";
						attr_html += lon;
						attr_html += ",";
						attr_html += lat;
						attr_html += ")'";
						attr_html += ">";
						//--20240424
						attr_html += "<td>";
						attr_html += key;
						attr_html += "</td><td>";
						//            attr_html += value;
						attr_html += list_name;
						attr_html += "</td></tr>";

						disp_cnt++;
					}
				}

				attr_html += "</table>";
				console.log(attr_html);
				info_dialog1_attr.innerHTML = attr_html;

				if (len + disp_cnt > 0) {
					if (len + disp_cnt == 1) {
						//var attr = info_attr[0];
						//var attr_layerId = info_attr_layerId[0];

						let ele = document.getElementById("info_dialog2_back");
						ele.style.visibility = "hidden";

						showInfoDialog2(
							info_type[0],
							info_attr_layerId[0],
							info_attr[0],
							lon,
							lat,
							info_value[0],
							info_value2[0],
							info_value3[0]
						);
					} else {
						//setDialogPos(info_dialog1,lon,lat);
						info_dialog1.showModal();

						var dlgw = info_dialog1.clientWidth;
						var dlgh = info_dialog1.clientHeight;
						setDialogPos(info_dialog1, lon, lat, dlgw, dlgh);
						/*
									facade.getViewExtent(function (ret) {
									  //地図キャンバスのサイズを取得する
									  var targetElement = document.getElementById("mapPrevframe");
									  var clientRect = targetElement.getBoundingClientRect();
								  
									  var w = clientRect.right - clientRect.left;
									  var h = clientRect.bottom - clientRect.top;
								  
									  LonLatW2PRAn(lon, lat, kijyunkei, retval);
									  //最大値をmmで返す
									  var x = retval[0];
									  var y = retval[1];
								  
									  LonLatW2PRAn(ret.value.minX, ret.value.minY, kijyunkei, retval);
									  //最小値をmmで返す
									  var zx0 = retval[0];
									  var zy0 = retval[1];
								  
									  LonLatW2PRAn(ret.value.maxX, ret.value.maxY, kijyunkei, retval);
									  //最大値をmmで返す
									  var zx1 = retval[0];
									  var zy1 = retval[1];
								  
									  //1pixあたりの距離を求める
								  
									  var px = (zx1 - zx0) / w;
									  var py = (zy1 - zy0) / h;
								  
									  var left = (x - zx0) / px;
									  var top = h - (y - zy0) / py;
								  
									  var targetElement = document.getElementById("mapPrevPane");
									  var clientRect = targetElement.getBoundingClientRect();
								  
									  info_dialog1.style.position = "absolute";
								  
									  console.log("clientRect.top=" + clientRect.top);
									  console.log("clientRect.left=" + clientRect.left);
								  
									  console.log("top=" + top);
									  console.log("left=" + left);
								  
									  info_dialog1.style.top = top + clientRect.top + "px";
									  info_dialog1.style.left = left + clientRect.left + "px";
									  info_dialog1.showModal();
									});
									*/
					}
				}
			}
		};
	});
}

function GetParamFromAttr(key, subattr, value) {
	//備考:"病院コード:31,府医療病院コード:1270102000,名前:北野病院（３次）＊"
	var param = subattr.split(",");
	for (var i = 0; i < param.length; i++) {
		var idx = param[i].indexOf(":");
		if (idx > 0) {
			var paramKey = param[i].substring(0, idx);
			var paramValue = param[i].substring(idx + 1);

			console.log("key=" + paramKey);
			console.log("value=" + paramValue);

			if (paramKey.indexOf(key) == 0) {
				value[0] = paramValue;
			}
		}
	}
}

//2023.07.20
function closePreviewDialog() {
	var preview_dialog = document.getElementById("preview_dialog");
	preview_dialog.close();
}
function closePreviewDialog2() {
	var preview_dialog2 = document.getElementById("preview_dialog2");
	preview_dialog2.close();
}

function closeInfoDialog1() {
	var info_dialog1 = document.getElementById("info_dialog1");
	console.log("info_dialog1を閉じる");
	info_dialog1.close();
}

function clickInfoDialog(type, idx, lon, lat) {
	//var attr = info_attr[idx];
	//2024.02.16
	//var attr_layerId = info_attr_layerId[idx];

	//console.log(attr);

	let ele = document.getElementById("info_dialog2_back");
	ele.style.visibility = "visible";

	showInfoDialog2(
		info_type[idx],
		info_attr_layerId[idx],
		info_attr[idx],
		lon,
		lat,
		info_value[idx],
		info_value2[idx],
		info_value3[idx]
	);
	info_dialog1.close();
}

function showInfoDialog2(
	type,
	attr_layerId,
	attr,
	lon,
	lat,
	value,
	value2,
	value3
) {
	console.log(attr_layerId);

	var subattr = attr["備考"];
	console.log(subattr);

	var info_dialog2 = document.getElementById("info_dialog2");
	var info_dialog2_attr = document.getElementById("info_dialog2_attr");

	//---標準レイヤ処理--------------------------------------------------------------------------
	if (type == 1) {
		console.log("標準レイヤ処理");
		var xhr = new XMLHttpRequest();

		var url = "https://" + GIS_SERVER_IP + ":8443/Sample/GetAttributes";
		url += "?";
		url += "layerId=" + attr_layerId;
		url += "&keyValue=" + value;
		url += "&keyValue2=" + value2;
		url += "&keyValue3=" + value3;
		//20240603
		url += "&ope_mode=" + ope_mode;


		console.log(url);

		xhr.open("GET", url);
		xhr.send();

		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var json = xhr.responseText;
				console.log(json);
				res = JSON.parse(json);
				//--20240424
				var attr_html = "";
				attr_html +=
					"<table class='infotable2'  width='430px' style='table-layout: fixed;word-break:break-all;'>";
				attr_html += "<th style='width:125px;'>";
				attr_html += "項目";
				attr_html += "</th><th>";
				attr_html += "内容";
				attr_html += "</th>";

				if (res.data != null) {
					for (var i = 0; i < res.data.length; i++) {
						var key = res.data[i].key;
						var value = res.data[i].value;

						if (value == null) {
							value = "";
						} else {
							if (value.length > 0) {
								value = value.replace("null", "");
							}
						}

						attr_html += "<tr><td>";
						attr_html += key;
						attr_html += "</td><td>";
						attr_html += value;
						attr_html += "</td></tr>";
					}
					attr_html += "</table>";
					console.log(attr_html);
					info_dialog2_attr.innerHTML = attr_html;

					var dlgw = document.getElementById("info_dialog2").clientWidth;
					var dlgh = document.getElementById("info_dialog2").clientHeight;

					console.log(dlgw);
					console.log(dlgh);

					setDialogPos(info_dialog2, lon, lat, dlgw, dlgh);

				} else {
					let len = Object.values(attr).length;
					for (var i = 0; i < len; i++) {
						var key = Object.keys(attr)[i];
						var value = Object.values(attr)[i];
						//
						//2023.07.02 start
						//splitを実行する対象はstringでなくてはならない！のでtypeofでチェックする
						//
						console.log(key);
						console.log(value);

						if (value == null) {
							value = "";
						} else {
							if (value.length > 0) {
								value = value.replace("null", "");
							}
						}

						if (typeof value === "string") {
							var items = value.split(",");
							if (items.length < 2) {
								attr_html += "<tr><td>";
								attr_html += key;
								attr_html += "</td><td>";
								attr_html += value;
								attr_html += "</td></tr>";
							} else {
								for (var j = 0; j < items.length; j++) {
									var items2 = items[j].split(":");
									attr_html += "<tr><td>";
									attr_html += items2[0];
									attr_html += "</td><td>";
									attr_html += items2[1];
									attr_html += "</td></tr>";
								}
							}
						} else {
							attr_html += "<tr><td>";
							attr_html += key;
							attr_html += "</td><td>";
							attr_html += value;
							attr_html += "</td></tr>";
						}
					}
					attr_html += "</table>";
					console.log(attr_html);
					info_dialog2_attr.innerHTML = attr_html;

					var dlgw = info_dialog2.clientWidth;
					var dlgh = info_dialog2.clientHeight;

					console.log(dlgw);
					console.log(dlgh);

					setDialogPos(info_dialog2, lon, lat, dlgw, dlgh);

				}
			}
		};
	} else {
		console.log("一時レイヤ処理");
		//---一時レイヤ処理--------------------------------------------------------------------------

		var attr_html = "";
		//--20240424
		attr_html +=
			"<table class='infotable2' border='1'  width='430px' style='table-layout: fixed;word-break:break-all;'>";
		attr_html += "<th style='width:125px;'>";
		attr_html += "項目";
		attr_html += "</th><th>";
		attr_html += "内容";
		attr_html += "</th>";

		let len = Object.values(attr).length;

		for (var i = 0; i < len; i++) {
			var key = Object.keys(attr)[i];
			var value = Object.values(attr)[i];

			if (key == "備考") {
				console.log(value);
				var sub_param = value.split(",");

				for (var p = 0; p < sub_param.length; p++) {
					var sub_param2 = sub_param[p].split(":");
					var key2 = sub_param2[0];
					var value2 = sub_param2[1];

					attr_html += "<tr><td>";
					attr_html += key2;
					attr_html += "</td><td>";
					attr_html += value2;
					attr_html += "</td></tr>";
				}
			} else {
				if (CheckTempAttrKey(attr_layerId, key) == true) {
					console.log(key);
					console.log(value);

					attr_html += "<tr><td>";
					attr_html += key;
					attr_html += "</td><td>";
					attr_html += value;
					attr_html += "</td></tr>";
				}
			}
		}

		attr_html += "</table>";
		console.log(attr_html);
		info_dialog2_attr.innerHTML = attr_html;

		var dlgw = info_dialog2.clientWidth;
		var dlgh = info_dialog2.clientHeight;

		console.log(dlgw);
		console.log(dlgh);

		setDialogPos(info_dialog2, lon, lat, dlgw, dlgh);

	}

	//setDialogPos(info_dialog2,lon,lat);
	info_dialog2.showModal();
	/*
	facade.getViewExtent(function (ret) {
	  //地図キャンバスのサイズを取得する
	  var targetElement = document.getElementById("mapPrevframe");
	  var clientRect = targetElement.getBoundingClientRect();
  
	  var w = clientRect.right - clientRect.left;
	  var h = clientRect.bottom - clientRect.top;
  
	  LonLatW2PRAn(lon, lat, kijyunkei, retval);
	  //最大値をmmで返す
	  var x = retval[0];
	  var y = retval[1];
  
	  LonLatW2PRAn(ret.value.minX, ret.value.minY, kijyunkei, retval);
	  //最小値をmmで返す
	  var zx0 = retval[0];
	  var zy0 = retval[1];
  
	  LonLatW2PRAn(ret.value.maxX, ret.value.maxY, kijyunkei, retval);
	  //最大値をmmで返す
	  var zx1 = retval[0];
	  var zy1 = retval[1];
  
	  //1pixあたりの距離を求める
  
	  var px = (zx1 - zx0) / w;
	  var py = (zy1 - zy0) / h;
  
	  var left = (x - zx0) / px;
	  var top = h - (y - zy0) / py;
  
	  var targetElement = document.getElementById("mapPrevPane");
	  var clientRect = targetElement.getBoundingClientRect();
  
	  info_dialog2.style.position = "absolute";
  
	  console.log("clientRect.top=" + clientRect.top);
	  console.log("clientRect.left=" + clientRect.left);
  
	  console.log("top=" + top);
	  console.log("left=" + left);
  
	  info_dialog2.style.left = left + clientRect.left + "px";
	  info_dialog2.style.top = top + clientRect.top + "px";
  
	  info_dialog2.showModal();
  
	  var dlgw = document.getElementById("info_dialog2").clientWidth;
	  var dlgh = document.getElementById("info_dialog2").clientHeight;
  
	  console.log(dlgw);
	  console.log(dlgh);
  
	});
	*/
}

function CheckTempAttrKey(attr_layerId, key) {
	var ret = false;

	if (attr_layerId == "n@20-1") {
		//災害点関係（一時入力）

		var label = [
			"事案識別子",
			"緊急度",
			"覚知番号",
			"災害番号",
			"覚知時刻",
			"指令時刻",
			"指令分類",
			"対応隊",
			"災害点",
			"対象物名（追記文字含む）",
			"通報者名",
			"内容１",
			"内容２",
		];

		for (var i = 0; i < label.length; i++) {
			if (label[i].indexOf(key) == 0) {
				ret = true;
			}
		}
	}
	if (attr_layerId == "n@21-1") {
		var label = ["水利コード"];
		for (var i = 0; i < label.length; i++) {
			if (label[i].indexOf(key) == 0) {
				ret = true;
			}
		}
	}
	if (attr_layerId == "n@22-1") {
		//現場画像（一時入力）
		var label = [
			"現場情報ID",
			"受信時刻",
			"件名 ",
			"本文",
			"登録地点",
			"メールアドレス",
			"職員番号",
		];
		for (var i = 0; i < label.length; i++) {
			if (label[i].indexOf(key) == 0) {
				ret = true;
			}
		}
	}
	if (attr_layerId == "n@23-1") {
		//インフラ／ライフライン（一時入力）
		var label = [
			"受付日",
			"登録場所",
			"状況 ",
			"情報種別",
			"エリア",
			"発生時刻",
			"解消予定時刻",
			"再確認時刻",
			"解消時刻",
			"登録地点",
			"備考",
		];
		for (var i = 0; i < label.length; i++) {
			if (label[i].indexOf(key) == 0) {
				ret = true;
			}
		}
	}
	if (attr_layerId == "n@24-1") {
		//通行止め（一時入力）
		var label = [
			"受付日",
			"登録場所",
			"状況 ",
			"情報種別",
			"エリア",
			"発生時刻",
			"解消予定時刻",
			"再確認時刻",
			"解消時刻",
			"登録地点",
			"備考",
		];
		for (var i = 0; i < label.length; i++) {
			if (label[i].indexOf(key) == 0) {
				ret = true;
			}
		}
	}
	if (attr_layerId == "n@28-1") {
		//作図用（一時入力）
		var label = ["車両名", "車両動態（基本）", "車両動態（詳細）"];
		for (var i = 0; i < label.length; i++) {
			if (label[i].indexOf(key) == 0) {
				ret = true;
			}
		}
	}
	return ret;
}

function closeInfoDialog2() {
	console.log("info_dialog2を閉じる");
	var info_dialog2 = document.getElementById("info_dialog2");
	info_dialog2.close();
}
function backInfoDialog2() {
	closeInfoDialog2();
	showInfoDialog1(back_lon, back_lat);
}

//--------------------------------------------------------------------------------------------------------------
// [hidedlg]映像配信ダイアログ消去
//dialog_id:ダイアログID
//--------------------------------------------------------------------------------------------------------------
function hidedlg(dialog_id) {
	var dialog = document.getElementById("dialog" + dialog_id);
	console.log(dialog_id - 1);
	dlg_flg[dialog_id - 1] = false;
	dialog.close();
}
//--------------------------------------------------------------------------------------------------------------
// 2023.08.04 dialogからdialogを呼び出す
//--------------------------------------------------------------------------------------------------------------
function PreviewFunc(send_src) {
	var url =
		"https://" +
		GIS_SERVER_IP +
		":8443/StreamList/VideoView.html?id=" +
		send_src;
	url += "&terminal_type=";
	url += init_terminal_type;

	var url2 =
		"https://" +
		GIS_SERVER_IP +
		":8443/StreamList/VideoView2.html?id=" +
		send_src;
	url2 += "&terminal_type=";
	url2 += init_terminal_type;

	var preview_dialog = document.getElementById("preview_dialog");
	var preview_image = document.getElementById("preview_image");
	var preview_dialog2 = document.getElementById("preview_dialog2");
	var preview_image2 = document.getElementById("preview_image2");

	console.log(termOrientation);

	//portrait-primary 縦長
	//ylandscape-primar　横長

	if (termOrientation == "Landscape") {
		var html = '<iframe src="';
		html += url2;
		html +=
			'" width="100%" height="100%" scrolling="no" marginwidth="1" marginheight="1" ';
		html += "></iframe>";

		console.log(html);

		// 横長の処理
		console.log("横長");
		preview_image2.innerHTML = html;
		preview_dialog2.showModal();
	} else {
		// 縦長の処理
		var html = '<iframe src="';
		html += url;
		html +=
			'" width="100%" height="100%" scrolling="no" marginwidth="1" marginheight="1" ';
		html += "></iframe>";

		if (termOrientation == "Portrait") {
			console.log("縦長");
			preview_image.innerHTML = html;
			preview_dialog.showModal();
		}
	}
}

//
//経度緯度を画面表示位置にする
//
function LonLatToDisplayPos(x, y, lefttop, callback) {
	var ret = {};

	console.log("x=" + x);
	console.log("y=" + y);

	//地図キャンバスのサイズを取得する
	var targetElement = document.getElementById("mapPrevframe");
	var clientRect = targetElement.getBoundingClientRect();

	console.log(clientRect);

	var w = clientRect.right - clientRect.left;
	var h = clientRect.bottom - clientRect.top;

	console.log("w=" + w);
	console.log("h=" + h);

	//表示範囲を取得する
	facade.getViewExtent(function(ret) {
		console.log(ret);

		LonLatW2PRAn(ret.value.minX, ret.value.minY, kijyunkei, retval);
		//mmで返す
		var zx0 = retval[0];
		var zy0 = retval[1];

		LonLatW2PRAn(ret.value.maxX, ret.value.maxY, kijyunkei, retval);
		//mmで返す
		var zx1 = retval[0];
		var zy1 = retval[1];

		console.log(zx0 + "," + zy0);
		console.log(zx1 + "," + zy1);

		//1pixあたりの距離

		var px = (zx1 - zx0) / w;
		var py = (zy1 - zy0) / h;

		lefttop[0] = (x - zx0) / px;
		lefttop[1] = h - (y - zy0) / py;

		console.log("lefttop=" + lefttop);
		callback(ret);
	});
}

function setDialogPos(m_dialog, lon, lat, dlgw, dlgh) {

	facade.getViewExtent(function(ret) {
		//地図キャンバスのサイズを取得する
		var targetElement = document.getElementById("mapPrevframe");
		var clientRect = targetElement.getBoundingClientRect();

		var w = clientRect.right - clientRect.left;
		var h = clientRect.bottom - clientRect.top;

		LonLatW2PRAn(lon, lat, kijyunkei, retval);
		//最大値をmmで返す
		var x = retval[0];
		var y = retval[1];

		LonLatW2PRAn(ret.value.minX, ret.value.minY, kijyunkei, retval);
		//最小値をmmで返す
		var zx0 = retval[0];
		var zy0 = retval[1];

		LonLatW2PRAn(ret.value.maxX, ret.value.maxY, kijyunkei, retval);
		//最大値をmmで返す
		var zx1 = retval[0];
		var zy1 = retval[1];

		//1pixあたりの距離を求める

		var px = (zx1 - zx0) / w;
		var py = (zy1 - zy0) / h;

		var left = (x - zx0) / px;
		var top = h - (y - zy0) / py;

		var targetElement = document.getElementById("mapPrevPane");
		var clientRect = targetElement.getBoundingClientRect();

		m_dialog.style.position = "absolute";

		console.log("clientRect.top=" + clientRect.top);
		console.log("clientRect.left=" + clientRect.left);

		console.log("top=" + top);
		console.log("left=" + left);

		if (left > (w / 2)) {
			left -= dlgw;
		}
		if (top > (h / 2)) {
			top -= dlgh;
		}

		m_dialog.style.left = left + clientRect.left + "px";
		m_dialog.style.top = top + clientRect.top + "px";

	});
}

//
//コンソールログサービス
//
function LogOut(msg) {
	var dt = new Date();
	var y = dt.getFullYear();
	var m = ("00" + (dt.getMonth() + 1)).slice(-2);
	var d = ("00" + dt.getDate()).slice(-2);
	var h = ("00" + dt.getHours()).slice(-2);
	var mi = ("00" + dt.getMinutes()).slice(-2);
	var s = ("00" + dt.getSeconds()).slice(-2);
	var ms = ("000" + dt.getMilliseconds()).slice(-3);

	var formatdate =
		y + "/" + m + "/" + d + " " + h + ":" + mi + ":" + s + "." + ms;
	console.log("【WebAPI】" + formatdate + "," + msg);
}
