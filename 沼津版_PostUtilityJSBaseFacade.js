/* jslint varstmt: false */ //varを許可
/* jshint -W101 */ //一行が長い警告抑制
/* jshint -W072 */ //引数が多すぎる警告抑制
/* jshint -W098 */ //未使用の変数警告抑制 実際はargumentsで拾って使用している
/* jslint esversion:5 */ //es5の記載を強制。

(function() {
    "use strict";

    //underscore.js の is~(_validator.isFunction など)を利用可能にしておく。
    var _validator = {};
    /* istanbul ignore next */
    (function() {
        var nativeIsArray = Array.isArray;
        // jshint -W117
        ["Arguments", "Function", "String", "Number", "Date", "RegExp", "Error"].forEach(function(name) {
            _validator["is" + name] = function(obj) {
                return toString.call(obj) === "[object " + name + "]";
            };
        });
        // Is a given value an array?
        // Delegates to ECMA5's native Array.isArray
        _validator.isArray = nativeIsArray || function(obj) {
            return toString.call(obj) === "[object Array]";
        };

        // Is a given variable an object?
        _validator.isObject = function(obj) {
            var type = typeof obj;
            return type === "function" || type === "object" && !!obj;
        };
        // jshint +W117

        // jshint -W116
        if(typeof /./ != "function" && typeof Int8Array != "object") {
            _validator.isFunction = function(obj) {
                return typeof obj == "function" || false;
            };
        }
        // jshint +W116
    })();

    // 各APIのコールバックで一度呼び出されたあと、コールバックを開放するかのフラグ。
    var KEY_FLG_CLEAR_CALLBACK = "__CLEAR_WhenCalledOnce__";

    // 各APIのコールバックで一度呼び出されたあと、コールバックを開放する関数のUUIDのフラグ
    // startCmdCallbacksのok,cancelなどの関数を同時に指定したときなどで使う。
    var KEY_CLEAR_CALLBACK_UUIDS = "__KEY_CLEAR_CALLBACK_UUIDS";

    /*
     * [JSBase向けJavaScriptインターフェイス ポストユーティリティ]
     * 別ドメイン facadeと連携しAPIを利用する
     * html5のpostMessageを使用するためクロスドメイン・クロスオリジンが可能
     */

    /**
     * @classdesc  JSBase 外部システム連携向けのJavaScriptインターフェイス外部ユーティリティ
     * @param {string} mapWindowUrl  連携先JSBaseページアドレス
     * @param {object} windowObject 連携先ウィンドウまたはiframe要素
     * @param {object} options 設定オプション "position","zoomLevel","menuJson","checkWindowSrcurl","windowSrcurl"
     * <pre>
     *  optionsは下記キーを持ったオブジェクトを設定することで初期設定などを行う(現状以下のみ)
     *  内部的には連携先との疎通を待ちsetPositionなどを呼んでいるだけです
     *  "position" 初期位置を設定します
     *  "zoomLevel" 初期ズームレベル(1~28)を設定します
     *  "menuJson" JSBase画面左端のメニューバー項目を任意で(非アクティブ・非表示)に出来ます
     *  "checkWindowSrcurl" trueのとき、メッセージを受信したとき、送信元のwindowが通信中のwindowかどうか
     *     (コンストラクタ引数のwindowObjectかどうか)をevendataのsrcurlプロパティでチェックします。
     *     evendataのsrcurlの値は [location.protocol]//[location.host]/[コンテキストパス] という形式
     *     (例: https://samplehost:8080/base )となります。
     *
     *  "windowSrcurl": 
     *     指定ありで "checkWindowSrcurl"がtrueのとき、 windowSrcurl  がevendataのsrcurlと一致するかチェックします。
     *     指定なしで "checkWindowSrcurl"がtrueのとき、 mapWindowUrl  がevendataのsrcurlと一致するかチェックします。
     *
     * 【コード例】
     * <code>
     * var options = {
     *  "position":{"lat":35,"lon":136},        // 初期位置を設定します
     *  "zoomLevel":8,                                  // 初期ズームレベルを設定します
     *  "menuJson":{                                    //メニューバーサンプルボタン非表示
     *      "Sample":{"hidden":true,"disabled":true},
     *          "ifx.parts.modulesample.ModuleSample":{"hidden":true,"disabled":true}
     *       }
     * }
     * </code>
     *
     * optionsに無い項目を設定する場合は各種APIを使用します。
     * facadeインスタンス生成後に実行したAPIはすべて連携先との疎通を待ち実行されます
     * </pre>
     * @constructor
     * @author Informatix Incorporated
     * @export
     * @global
     * @name IfxApiFacadePostUtil
     */
    var ifxApiFacadePostUtil = function(mapWindowUrl, windowObject, options) {

        var self = this;
        this._mapWindowUrl = mapWindowUrl;
        this._outWindowObj = windowObject;
        /**
         * コールバックとUUIDの対応を保持する連想配列
         * 最初のキー：API関数名, 入れ子のキー:コールバックのUUID,function: API関数のコールバック関数
         * @type {object.<string,object<string,function>>} 
         * @private
         */
        this._callbackfunc = {};
        /**
         * リスナー関数のeventIDからリスナー関数の_callbackfuncに登録されているUUIDへの連想配列
         * @type {object}
         * @private
         */
        this._eventIdToCbUuidMap = {};
        this._contentIdToUuidMap = {};
        this._initConnection = false;
        this._options = options;
        this._stagnatePostObj = [];
        this._contextMenuHookIdempotenceFlg = false; //contextMenuHookバインド済みフラグ
        this._checkWindowSrcurl = options.checkWindowSrcurl;
        this._windowSrcUrl = null;
        if(this._checkWindowSrcurl) {
            this._windowSrcUrl = options.windowSrcurl ?
                options.windowSrcurl : mapWindowUrl;
            if(this._windowSrcUrl.endsWith("/")) {
                this._windowSrcUrl = this._windowSrcUrl.substring(0,
                    this._windowSrcUrl.length - 1);
            }
        }

        // APIサイドから受信するリスナー
        window.addEventListener("message", function(event) {
            var ret = event.data;
            if(!ifxApiFacadePostUtil.isJson(ret)) {
                return;
            }
            var obj = JSON.parse(ret);

            if(self._windowSrcUrl) {
                if(obj && self._windowSrcUrl !== obj.srcurl) {
                    return;
                }
            }

            //JSBaseとの接続確認
            if(!self._initConnection && obj.name === "AlreadyConnected") {
                self._initConnection = true;

                //初期化処理
                self.initFunc();

                //接続前に待機した処理を順次実行
                if(self._stagnatePostObj.length !== 0) {
                    for(var i = 0; i < self._stagnatePostObj.length; i++) {
                        var postObj = self._stagnatePostObj[i];
                        self._post(postObj.funcName, postObj.arg, postObj.optOmitRemeveCbWhenCalledOnce);
                    }
                    self._stagnatePostObj = [];
                }
                return;
            }

            //ログアウト通知が来た場合
            if(self._initConnection && obj.name === "NotifyLogout") {
                self._initConnection = false;
            }

            //通常のポスト処理
            self._fireFunc(obj.name, obj.uuid, obj.ret);
        }, false);
    };

    ifxApiFacadePostUtil.listenerNames = [
        "setPosition",
        "setScale",
        "changeZoomLevel",
        "setLayerView",
        "getPosition",
        "getScale",
        "setControlVisibility",
        "getLayerList",
        "getFolderList",
        "changeVisibleLayer",
        "getVisibleLayerList",
        "scanItemAttributeFromPos",
        "changeLayerOnTable",
        "getCurrentPosition",
        "addListener",
        "removeListener",
        "getPositionFromAddress",
        "addLayerNode",
        "removeNode",
        "startDrawMode",
        "clearTempLayer",
        "getContextMenu",
        "addContextMenu",
        "removeContextMenu",
        "getLayerData",
        "getMainMenu",
        "setMainMenu",
        "showMessage",
        "getLayerExtent",
        "setViewExtent",
        "getViewExtent",
        "getCurrentNodeInfo",
        "getNodeInfoById",
        "addMainMenuContent",
        "removeMainMenuContent",
        "addMenubarButton",
        "addBtnbarButton",
        "removeMenubarButton",
        "getMenubar",
        "addCustomizerNodeFromJson",
        "addCircleLocusFilter",
        "addChildMainMenu",
        "sessionDelete",
        //消防向けAPI
        "setAngle",
        "drawItems",
        "deleteItem",
        "addNewLayerNode",
        "getUtmPointFromPosition",
        "addThunbnail",
        "exportImage",
        "refreshLayer",
        "refreshAllLayer",
        "densityAnalysis",
        "getAddressFromPosition",
        "setItemPosition",
        "changeVisibleLayers"
    ];

    /**
     * 属性データ型
     * @readonly
     * @enum {number}
     */
    ifxApiFacadePostUtil.attrType = {
        INT: 1,
        DOUBLE: 2,
        STRING: 3,
        LONG: 4,
        DATE: 5,
        TIME: 7,
        TIMESTAMP: 8,
        HYPERLINK: 9,
        BYNARY: 10,
        BOOLEAN: 11
    };

    ifxApiFacadePostUtil.prototype = {

        // 関数名とargument 受け渡し
        /**
         * 
         * @param {string} funcName 関数名。
         * @param {array.<*>} arg funcNameで指定した関数に渡す呼び出し引数
         * @param {boolean} [optOmitRemeveCbWhenCalledOnce] 
         *     コールバック関数呼び出し後、キャッシュからコールバック関数を削除する処理を省くか(デフォルトで削除されます。)
         * @private
         * @ignore
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        _call: function(funcName, arg, optOmitRemeveCbWhenCalledOnce) {

            var self = this;
            //接続確認できていない場合は待機
            if(!self._initConnection) {
                self._stagnatePostObj.push({
                    funcName: funcName,
                    arg: arg,
                    optOmitRemeveCbWhenCalledOnce: optOmitRemeveCbWhenCalledOnce
                });
                return;
            }
            self._post(funcName, arg, optOmitRemeveCbWhenCalledOnce);
        },
        // イベント通知名か判定
        /**
         * 
         * @private
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        _isListenerName: function(name) {
            for(var i in this.listenerNames) {
                if(this.listenerNames[i] === name) {
                    return true;
                }
            }
            return false;
        },
        // callbackのfunction 登録 一般メソッドの実行を非同期で対応
        /**
         * 
         * @private
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        _pushFunc: function(name, func, uuid) {
            var self = this;
            // TODO: self._isListenerNameで引数の指定が必要だが、引数の指定をするように直すと動作が変わる。
            // 現状は常にfalseが返る様子なので、
            // ifxApiFacadePostUtil.listenerNames, _isListenerName含めて不要な処理？
            if(self._isListenerName() === true) {
                self._addListener(name, func, uuid);
                return;
            }

            if(!self._callbackfunc[name]) {
                self._callbackfunc[name] = {};
            }
            self._callbackfunc[name][uuid] = func;
        },
        // callbackのfunction 発火
        /**
         * 
         * @private
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        _fireFunc: function(name, uuid, arg) {
            var self = this;
            if(!this._callbackfunc[name]) {
                return;
            }
            var callback = this._callbackfunc[name][uuid];
            if(_validator.isFunction(callback)) {
                callback(arg);
                if(callback[KEY_FLG_CLEAR_CALLBACK]) {
                    delete this._callbackfunc[name][uuid];
                }

                if(_validator.isArray(callback[KEY_CLEAR_CALLBACK_UUIDS])) {
                    var uuids = callback[KEY_CLEAR_CALLBACK_UUIDS];
                    uuids.forEach(function(uuid) {
                        delete self._callbackfunc[name][uuid];
                    });
                }
            }
        },
        // APIサイド(JSBaseWebアプリ側)に送信
        /**
         * 
         * @param {string} funcName 関数名。
         * @param {array.<*>|arguments} arg funcNameで指定した関数に渡す呼び出し引数
         * @param {boolean} [optOmitRemeveCbWhenCalledOnce] 
         *     コールバック関数呼び出し後、キャッシュからコールバック関数を削除する処理を省くか(デフォルトで削除されます。)
         * @private
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        _post: function(name, arg, optOmitRemeveCbWhenCalledOnce) {
            var self = this;
            var args = Array.prototype.slice.call(arg, 0);
            var inArray = [];
            for(var i = 0; i < args.length; i++) {
                if(args[i] !== undefined) {
                    inArray.push(args[i]);
                }
            }
            args = inArray;

            var uuid = ifxApiFacadePostUtil.createUuid();

            var argsFuncAr = args.filter(function(arg) {
                return typeof(arg) === "function";
            }) || [];

            var uuidAr = [];
            var callbackuuids = [];
            if(argsFuncAr.length > 1) {
                //複数コールバックを持つメソッドに対応
                args = args.map(function(arg) {
                    if(typeof(arg) === "function") {
                        var uuid_ml = ifxApiFacadePostUtil.createUuid();
                        if(!optOmitRemeveCbWhenCalledOnce) {
                            arg[KEY_FLG_CLEAR_CALLBACK] = true;
                            arg[KEY_CLEAR_CALLBACK_UUIDS] = callbackuuids;
                            callbackuuids.push(uuid_ml);
                        }
                        self._pushFunc(name, arg, uuid_ml);
                        uuidAr.push(uuid_ml);
                        // コールバック関数を表す特別な文字列
                        // ifx\parts\facade\js\JSBaseFacadeCmdManager.js
                        // でコールバック関数に変換。
                        return "__jsbase__callback__function__";
                    } else {
                        return arg;
                    }
                });
            } else {
                var lastArg = args[args.length - 1];
                if(typeof(lastArg) === "function") {
                    if(!optOmitRemeveCbWhenCalledOnce) {
                        lastArg[KEY_FLG_CLEAR_CALLBACK] = true;
                    }
                    if(name === "addListener") {
                        var eventId = args[1];
                        self._eventIdToCbUuidMap[eventId] = uuid;
                    } else if(optOmitRemeveCbWhenCalledOnce) { //addListener以外で複数回コールバックするAPIもIDをマップする
                        var contentId = args[1];

                        self._contentIdToUuidMap[this._createContentIdToUuidMapKey(name, contentId)] = uuid;

                    }
                    lastArg = args.pop();
                    self._pushFunc(name, lastArg, uuid);
                }
            }

            var pass_data = {
                "name": name,
                "uuid": uuid,
                "uuidAr": uuidAr
            };

            for(var ii = 0; ii < args.length; ii++) {
                var palm = args[ii];
                pass_data[ii] = palm;
            }
            if(this._outWindowObj) {
                this._postMsg(JSON.stringify(pass_data), this._mapWindowUrl);
            }
        },

        /**
         * 
         * @param {*} data 
         * @param {*} url 
         * @private
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        _postMsg: function(data, url) {
            this._outWindowObj.postMessage(data, url);
        },

        /**
         * 座標指定 指定した位置に地図を移動します
         * @param {object} position - {"lat":緯度,"lon":経度}
         * @param {boolean} animateFlag - 地図移動時のアニメーション有無（true:あり false:なし）
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        setPosition: function(position, animateFlag, callback) { this._call("setPosition", arguments); },

        /**
         * 指定したズームレベルに地図を変更します
         * @param {number} zoomLevel - ズームレベル (1~28) <br>
         * ※ システムで表示可能なズームレベルの範囲外が指定された場合、表示可能なズームレベルで地図を表示します<br>
         *  例えば、システムで表示可能なズームレベルが14～28、指定されたズームレベルが10だった場合、ズームレベル14で地図が表示されます
         * @param {boolean} animateFlag - 地図移動時のアニメーション有無（true:あり false:なし）
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        setScale: function(zoomLevel, animateFlag, callback) { this._call("setScale", arguments); },

        /**
         * 拡大縮小 指定した値をズームレベルに加算します
         * @param {number} zoomLevelDifference - 現在のズームレベルに加算するズームレベル (+27 ~ -27)<br>
         * ※ システムで表示可能なズームレベルの範囲外となるようなズームレベルが指定された場合、表示可能なズームレベルで地図を表示します<br>
         *  例えば、現在のズームレベルが18、システムで表示可能なズームレベルが14～28、指定されたズームレベルが-5だった場合、ズームレベル14で地図が表示されます
         * @param {boolean} animateFlag - 地図移動時のアニメーション有無（true:あり false:なし）
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        changeZoomLevel: function(zoomLevelDifference, animateFlag, callback) { this._call("changeZoomLevel", arguments); },

        /**
         * 縮尺指定 指定した縮尺に地図を変更
         * @param {number} cartographicScale - 設定縮尺 (1/5000 ならば 5000)※プロジェクトの設定に依存します
         * @param {boolean} animateFlag - 地図移動時のアニメーション有無
         * @param {function} callback -  [処理実行後コールバック]
         * <ul>
         * <pre>
         * <li>コールバック引数オブジェクト
         * <li>  methodName {string} : 実行メソッド名
         * <li>  result {string} : 実行結果("success":正常終了 "error":異常終了)
         * <li>  message {string} : エラーメッセージ ※エラー時のみ
         * <li>  stack {string} : スタックトレース ※エラー時のみ
         * </pre>
         * </ul>
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        setCartographicScale: function(cartographicScale, animateFlag, callback) { this._call("setCartographicScale", arguments); },

        /**
         * 指定したレイヤの全てのアイテムを包含する領域を表示します
         * @param layerNodeId - 対象レイヤのノードID
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : 対象レイヤのノードID
         * 
         * </pre>
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        setLayerView: function(layerNodeId, callback) { this._call("setLayerView", arguments); },

        /**
         * 指定したレイヤの全てのアイテムを包含する矩形を取得します
         * @param layerNodeId - 矩形を取得するレイヤノードID
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {object} { : 全てのアイテムを包含する矩形
         *     maxX : 矩形東端の経度(例)135.45
         *     maxY : 矩形北端の緯度(例)39.78
         *     minX : 矩形西端の経度(例)134.21
         *     minY : 矩形南端の緯度(例)38.53
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getLayerExtent: function(layerNodeId, callback) { this._call("getLayerExtent", arguments); },

        /**
         * 現在の表示範囲を取得します
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {object} { : 表示範囲の矩形
         *     maxX : 矩形東端の経度(例)135.45
         *     maxY : 矩形北端の緯度(例)39.78
         *     minX : 矩形西端の経度(例)134.21
         *     minY : 矩形南端の緯度(例)38.53
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getViewExtent: function(callback) { this._call("getViewExtent", arguments); },

        /**
         * 地図の表示範囲を設定します
         * @param {number} maxX 表示範囲最大経度(例)135.45
         * @param {number} maxY 表示範囲最大緯度(例)39.78
         * @param {number} minX 表示範囲最小経度(例)134.21
         * @param {number} minY 表示範囲最小緯度(例)38.53
         * @param {boolean} zoomFlag ズームレベル変更を許可するフラグ
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        setViewExtent: function(maxX, maxY, minX, minY, zoomFlag, callback) {

            var extentObj = {
                maxX: maxX,
                minX: minX,
                maxY: maxY,
                minY: minY
            };
            var arg = [extentObj, zoomFlag, callback];
            this._call("setViewExtent", arg);
        },

        /**
         * 現在の中心座標を取得します
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {object} { :
         *     lat : 地図の中心緯度(例)39.78
         *     lon : 地図の中心経度(例)135.45
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getPosition: function(callback) { this._call("getPosition", arguments); },

        /**
         * 現在の表示ズームレベルを取得します
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {number} : 現在のズームレベル
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getScale: function(callback) { this._call("getScale", arguments); },

        /**
         * 表示コントロールの開閉を設定します
         * @param {string} controlName - 対象コントロール名（"layer":レイヤリスト "attributeList":属性一覧）
         * @param {boolean} isVisible - 開閉状態(true:開く false:閉じる)
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        setControlVisibility: function(controlName, isVisible, callback) { this._call("setControlVisibility", arguments); },

        /**
         * レイヤ一覧を取得します
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value [ : レイヤ一覧
         *   {
         *     id {string} : レイヤのノードＩＤ (例) "L_顧客情報(自部署)"
         *     name {string} : レイヤの名称 (例) "顧客情報(○○支店)"
         *     status {string} : レイヤのステータス  (0:閲覧不可 1:閲覧可能  2:ヒット可能  3:編集可能)
         *   }]
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getLayerList: function(callback) { this._call("getLayerList", arguments); },

        /**
         * フォルダ一覧を取得します
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value [ : フォルダ一覧
         *   {
         *     id {string} : フォルダのノードＩＤ (例) "C_顧客"
         *     type {string} : フォルダのタイプ("folder":フォルダ "mapset":マップセット(最上位のフォルダ))
         *     name {string} : ノード名 (例) 顧客"
         *   }]
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getFolderList: function(callback) { this._call("getFolderList", arguments); },

        /**
         * 指定したレイヤの表示／非表示状態を切り替えます
         * @param {string} layerId - レイヤのノードID
         * @param {boolean} isVisible - 表示状態(true:表示 false:非表示)
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : 変更レイヤ
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        changeVisibleLayer: function(layerId, isVisible, callback) { this._call("changeVisibleLayer", arguments); },

        /**
         * IDで指定したカスタマイザの表示を切り替えます。
         * @param {string} customizerId カスタマイザのノードID
         * @param {boolean} isVisible 表示状態（true: 表示 false: 非表示）
         * @param {function} callback 実行後に呼ばれるコールバック
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : カスタマイザノードID
         * </pre>
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        changeVisibleCustomizer: function(customizerId, isVisible, callback) { this._call("changeVisibleCustomizer", arguments); },

        /**
         * 指定したフォルダの表示／非表示状態を切り替えます
         * @param {string} folderId - フォルダのノードID
         * @param {boolean} isVisible - 表示状態(true:表示 false:非表示)
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : 変更レイヤ
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        changeVisibleFolder: function(folderId, isVisible, callback) {
            var data = { "folderId": folderId, "isVisible": isVisible };
            this.startCmdCallbacks("ifx.parts.facade.ModuleInitialize.changeVisibleFolder", data, callback);
        },

        /**
         * レイヤの表示状態を取得します
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value [ : レイヤの表示状態を含む一覧情報
         *   {
         *     id {string} : レイヤのノードＩＤ (例) "n@6"
         *     name {string} : レイヤの名称 (例) "営業本部"
         *     display {string} : 表示状態 (1:表示 ,-1:非表示)
         *   }]
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getVisibleLayerList: function(callback) { this._call("getVisibleLayerList", arguments); },

        /**
         * ノードの設定メニュー項目にボタンを追加し、コールバックの処理をコマンドとして登録します。
         * ボタンの追加時とボタンの押下時に、登録した処理が実行されます。
         * @param {string}   category  [ mapset/view/folder/layer/filter/theme/annotation]
         * @param {string}   type      [上記categoryにより以下から選択]
         * <pre>
         *  // mapset { default }
         *  // view { default }
         *  // folder { default }
         *  // layer { default / cursor / bg / db }
         *  // filter { LocusFilter / ValueFilter / UserIdFilter}
         *  // theme { IndividualValueTheme / RangeTheme / OverrideStyleTheme / CrossRangeTheme }
         *  // annotation { LabelAnnotation }
         * </pre>
         * @param {string}   text      [ボタン名]
         * @param {string}   iconId    [アイコン指定 icon-pen/etc...] or [ボタンのsvgアイコンのID sprite-base-attributeset-list-icon/etc...]
         * @param {string}   svgId     [ボタンのsvgアイコンのID sprite-base-attributeset-list-icon/etc...]
         * @param {string}   svgClass  [ボタンのsvgアイコンのクラス名。複数指定する場合はスペース区切り。アイコン指定の場合不要。 icon-size-lg icon-color-primary-light/etc...]
         * @param {string}   commandId [コマンドID。コールバックはこのIDでコマンドとして登録されます。ボタンにはこのIDが紐づけられ、押下時にはこのIDでコマンドが呼び出されます。]
         * @param {Function} callback  [コールバック]
         *
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value : {
         *       "id" {string}: コマンドID
         *       "name" {string}: ボタンの名称
         *       "called" {string}: コールバックを判断する値("onRegist":ボタン追加時 "onFire"ボタン押下時)
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addLayerlistCommandSetting: function(category, type, text, iconId, svgId, svgClass, commandId, callback) { this._call("addLayerlistCommandSetting", arguments); },

        /**
         * ノードの設定メニュー項目からボタンを削除します
         * @param  {string}   commandId [コマンドID]
         * @param  {Function} callback  [処理実行後コールバック]
         *
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value : {
         *       "commandId" {string} : 削除されたメニュー項目のコマンドID
         *   }
         * </pre>
         * 
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        removeLayerlistCommandSetting: function(commandId, callback) { this._call("removeLayerlistCommandSetting", arguments); },

        /**
         * ノードの設定メニュー項目を取得します
         * @param  {Function} callback [処理実行後コールバック]
         *
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {object} : 全てのノードの種類それぞれについてのメニュー項目の設定内容
         * </pre>
         * 
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getLayerlistCommandSettings: function(callback) { this._call("getLayerlistCommandSettings", arguments); },

        /**
         * 指定された円の範囲内のアイテムを検索し、検索されたアイテムの情報を取得します<br>
         * ※ 検索対象レイヤのデータセットがGCWX形式のデータセットの場合、正しく検索されない可能性があります
         * @param {object} position - 円の中心座標
         * @param {double} radius 円の半径(m)
         * @param {Array<string>} layerIdArray - 対象レイヤノードIDの配列 ※空配列の場合は全レイヤを検索します
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {Array<object>} : 範囲内のアイテム情報（ヒット可能なアイテムのみ検索される）
         *   [{
         *     nodeId {string} : レイヤノードID
         *     items {Array<object>}  : アイテム情報オブジェクトの配列
         *     [{
         *       itemId {number} : アイテムID (例) 25
         *       itemAttributes {object} { : アイテム属性(属するレイヤごとに異なります)
         *           [属性名] : [属性値]
         *       }
         *       itemCoordinate {object} { :アイテム座標
         *         lat {number}: 緯度 (例) 35.684420046303,
         *         lon {number} : 経度 (例) 139.73741839893927
         *       }
         *     }]
         *   }]
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        scanItemAttributeFromPos: function(position, radius, layerIdArray, callback) { this._call("scanItemAttributeFromPos", arguments); },

        /**
         * 属性一覧に表示するレイヤを切り替えます
         * @param {string} layerId - レイヤのノードID
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        changeLayerOnTable: function(layerId, callback) { this._call("changeLayerOnTable", arguments); },

        /**
         * 指定されたデータを含む新規レイヤを追加します
         * @deprecated 廃止予定です
         * @param {string} name  追加レイヤ名
         * @param {string} parentNodeId 追加先ノードID
         * @param {string} type 入力データ形式（"csv" : CSVデータ形式） ※ 現状は"csv"のみ対応
         * @param {Array.<Array.<string>>} data 入力データCSVの2次元配列
         * @param {Array.<Array.<string>>} schema 属性スキーマ定義CSVの2次元配列
         * @param {function} callback -  処理実行後コールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : 追加されたレイヤのノードID
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addLayerNode: function(name, parentNodeId, type, data, schema, callback) {

            var createCsvStr = function(csvList) {
                var csvStr = "";
                for(var i = 0; i < csvList.length; i++) {
                    var row = csvList[i];
                    var rowS = "";
                    var rF = row[0];
                    for(var j = 0; j < row.length; j++) {
                        var valStr = row[j];
                        //ダブルコーテーション回避
                        if(valStr.indexOf(",") !== -1) {
                            valStr = "\\\"" + valStr + "\\\"";
                        }
                        if(j !== 0) {
                            rowS += ",";
                        }
                        rowS += valStr;
                    }
                    //改行
                    if(i !== csvList.length - 1) {
                        rowS += "\n";
                    }
                    csvStr += rowS;
                }
                return csvStr;
            };


            var createJsonStr = function(jsonList) {

                return JSON.stringify(jsonList);
            };

            var dataStr = type === "csv" ? createCsvStr(data) : createJsonStr(data);
            var schemaStr = type === "csv" ? createCsvStr(schema) : createJsonStr(schema);
            var argObj = { "name": name, "parentNodeId": parentNodeId, "dataset": { "type": type, "data": dataStr, "schema": schemaStr } };
            var arg = [argObj, callback];
            this._call("addLayerNode", arg);
        },

        /**
         * jsonから新規レイヤを追加します
         * @param {string} name  追加レイヤ名
         * @param {string} json レイヤノードJSON
         * @param {function} callback -  処理実行後コールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : 追加されたレイヤのノードID
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addLayerNodeFromJson: function(parentNodeId, json, callback) { this._call("addLayerNodeFromJson", arguments); },

        /*
         * 入力データCSVからキー情報に該当するデータを抽出して、当該データを含む新規レイヤを追加します
         * @param {string} name  追加レイヤ名
         *  @param {string} parentNodeId 追加先ノードID
         *  @param {string} dataCsv 入力データCSVの名称 （例）入力データCSVが「顧客情報.csv」の場合、「顧客情報」を指定
         *  @param {Array.<Array.<string>>} keyVaules キー情報の配列（複合キーの場合は「_（アンダーバー）」で連結）
         *  @param {function} callback -  処理実行後コールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : 追加したレイヤのノードID "n@832"
         * </pre>
         * 
         * @export
        }}
         */
        /*addLayerNodeByKey: function(name, parentNodeId, dataCsv, keyVaules, callback) {
            var argObj = { 'name': name, 'parentNodeId': parentNodeId, 'dataCsv': dataCsv, 'keyValues': keyVaules };
            var arg = [argObj, callback];
            this._call("addLayerByKey", arg);
        },*/

        /**
         * 指定したノードを削除します
         * @param {string} nodeId - 削除対象のノードID
         * @param {function} callback -  [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        removeNode: function(nodeId, callback) { this._call("removeNode", arguments); },

        /**
         * 指定したレイヤにアイテムを追加します。更新はメモリ上で行われ、対象のレイヤがGCWRデータセットの場合は更新情報がIndexedDBに保存されます。
         * GCWRデータセットの更新をサーバ側へ反映させる場合は{@link IfxApiFacadePostUtil#saveDataset}を利用します。
         * @param {string} layerNodeId レイヤノードのID
         * @param {Array<object>} itemList 追加するアイテムの配列
         * <pre>
         * [{
         *      "attr" {object} : 属性情報。[属性名]:[属性値]となる
         *      "geometry" {IfxApiFacadePostUtil.itemInfo_geomGeoJson}:ジオメトリ情報。GeoJSON形式で、coordinatesの緯度経度をEPSG:4326で与えてください。
         *      "style" {IfxApiFacadePostUtil.itemInfo_style}:スタイル情報。指定がない場合はデフォルトのスタイルとなる
         *      "angle" {number}: アイテムの角度。単位はラジアンで与えてください。指定がない場合、アイテムに角度はつきません。
         * }]
         * </pre>
         * @param {function} callback 実行後に呼ばれるコールバック
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果（"success":正常終了 "error":異常終了）
         *   message {string} : エラーメッセージ ※エラー、もしくは挿入に失敗したアイテムがある時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value :
         *     "itemIdList" {array.&lt;number&gt;}: 挿入されたアイテムIDの配列。挿入に成功したアイテムがない場合は空配列です。
         *     "itemErrorList" {array.&lt;IfxApiFacadePostUtil.itemErrorList_element&gt;}: アイテムのエラー情報の配列。挿入に失敗したアイテムがない場合は空配列です。
         *     "state" {IfxApiFacadePostUtil.ITEM_SAVE_STATE}: IndexedDBへの保存処理でどのようなエラーが起こったかを示す文字列。GCWRデータセットのレイヤを指定したときに、IndexedDBへの保存に失敗した場合のみ。
         * </pre>
         * @see IfxApiFacadePostUtil.itemInfo_geomGeoJson
         * @see IfxApiFacadePostUtil.itemInfo_style
         * @see IfxApiFacadePostUtil.itemErrorList_element
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        insertItem: function(layerNodeId, itemList, callback) { this._call("insertItem", arguments); },

        /**
         * 指定したレイヤのアイテムを編集します。更新はメモリ上で行われ、対象のレイヤがGCWRデータセットの場合は更新情報がIndexedDBに保存されます。
         * GCWRデータセットの更新をサーバ側へ反映させる場合は{@link IfxApiFacadePostUtil#saveDataset}を利用します。
         * このAPIはinitParam.json clientParam > brigdeOldGci > realTimeSaveFlg = false と設定しているケースでの利用を想定しています。
         * @param {string} layerNodeId レイヤノードのID
         * @param {number} itemId アイテムID
         * @param {object} data アイテムの編集内容。以下に示す内容のうち、編集したい内容のプロパティのみを持つオブジェクトを渡します。
         * 渡さなかったプロパティについては、元のアイテムの情報が保持されます。
         * <pre>
         * {
         *     "attr" {object}: 属性情報。[属性名]:[属性値]となる。差分だけでなく全ての属性を与えてください。
         *     "geometry" {IfxApiFacadePostUtil.itemInfo_geomGeoJson}: ジオメトリ情報。GeoJSON形式で、coordinatesの緯度経度をEPSG:4326で与えてください。
         *     "style" {IfxApiFacadePostUtil.itemInfo_style}: スタイル情報。差分だけでなく全ての情報を与えてください。（例えばpenのみを変更したい場合、pen以外の情報も渡す必要がある）
         *     "angle" {number}: アイテムの角度。単位はラジアンで与えてください。
         * }
         * </pre>
         * @param {object} options オプション引数。将来の拡張に備えて用意された引数で、現在は使用されていません。{}を指定してください。
         * @param {function} callback 実行後に呼ばれるコールバック
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果（"success":正常終了 "error":異常終了）
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value : ※geometry, styleの変換エラー、もしくはIndexedDBへの保存でのエラー時のみ
         *     "errorList" {array.&lt;string&gt;}: geometry, styleの変換でのエラー情報の配列。
         *     "state" {IfxApiFacadePostUtil.ITEM_SAVE_STATE}: IndexedDBへの保存処理でどのようなエラーが起こったかを示す文字列。
         *         "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.OFFLINE_SAVE_NG" または "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.OTHER_NG"です。
         * </pre>
         * @memberof IfxApiFacadePostUtil
         * @instance
         * @see IfxApiFacadePostUtil.itemInfo_geomGeoJson
         * @see IfxApiFacadePostUtil.itemInfo_style
         * @see IfxApiFacadePostUtil.ITEM_SAVE_STATE
         */
        editItem: function(layerNodeId, itemId, data, options, callback) { this._call("editItem", arguments); },

        /**
         * 指定したレイヤのアイテムを削除する。更新はメモリ上で行われ、対象のレイヤがGCWRデータセットの場合は更新情報がIndexedDBに保存されます。
         * GCWRデータセットの更新をサーバ側へ反映させる場合は{@link IfxApiFacadePostUtil#saveDataset}を利用します。
         * @param {string} layerNodeId レイヤノードのID
         * @param {number} itemId アイテムID
         * @param {function} callback 実行後に呼ばれるコールバック
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果（"success":正常終了 "error":異常終了）
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value :
         *     "state" {IfxApiFacadePostUtil.ITEM_SAVE_STATE}: IndexedDBへの保存処理でどのようなエラーが起こったかを示す文字列。GCWRデータセットのレイヤを指定したときに、IndexedDBへの保存に失敗した場合のみ。
         * </pre>
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        removeItem: function(layerNodeId, itemId, callback) { this._call("removeItem", arguments); },

        // 以下はifx.cmn.util.GISUtils.ITEM_SAVE_STATEを参照
        /**
         * 保存の形式及び結果を表す文字列。
         * <pre>
         * "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.ONLINE_SAVE_OK": サーバ保存に成功した場合
         * "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.OFFLINE_SAVE_OK": オフラインの保存(INDEXEDDB)に成功した場合。
         * "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.ONLINE_SAVE_NG": サーバ保存に失敗した場合（タイムアウト、サーバエラーなど。権限が不足した時と競合発生時は含まない）
         * "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.OFFLINE_SAVE_NG": オフラインの保存(INDEXEDDB)に失敗した場合。
         * "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.OTHER_NG": その他の失敗パターン。引数の指定が不正の場合等
         * "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.OTHER_OK": その他のOKパターン。（データセットのサーバへの反映をしない設定の場合等）
         * </pre>
         * @typedef {string} IfxApiFacadePostUtil.ITEM_SAVE_STATE
         */

        // 以下はifx.cmn.util.GISUtils.SERVER_ERR_FLGを参照
        /**
         * サーバで起きたエラーフラグ。
         * <pre>
         * "JSBaseAuthException": 権限が足りないとき
         * "RelateFilesUploadException": Planetsサーバへの関連ファイルのアップロードに失敗した時
         * "ConflictException": 競合が起きたとき
         * "Exception": その他のエラー
         * </pre>
         * @typedef {string} IfxApiFacadePostUtil.SERVER_ERR_FLG
         */

        /**
         * IndexedDBに保存されているデータセットの編集差分を使って、サーバ側のデータセットを更新します。
         * このAPIはinitParam.json clientParam > brigdeOldGci > realTimeSaveFlgの設定内容に関わらず、サーバへの送信を試みます。
         * @param {string} layerNodeId レイヤノードID
         * @param {object} options オプション引数。将来の拡張に備えて用意された引数で、現在は使用されていません。{}を指定してください。
         * @param {function} callback 実行後に呼ばれるコールバック
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果（"success":正常終了 "error":異常終了）。最終的に差分の一部でもサーバへ反映できなかった場合は"error"です。
         *   たとえばアイテム3つの編集差分があったとして、2つのアイテムの保存は成功し、1つのアイテムのみ競合が発生して保存できなかった場合は、"error"が返ります。
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value :
         *     "state" {IfxApiFacadePostUtil.ITEM_SAVE_STATE}: 保存処理の結果を表します。
         *         "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.ONLINE_SAVE_OK" "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.ONLINE_SAVE_NG" "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.OTHER_OK" "ifx.cmn.util.GISUtils.ITEM_SAVE_STATE.OTHER_NG"のいずれかです。
         *     "tempToPermMap" {Object}: 更新前後での新旧アイテムIDの対応を示すオブジェクト。キー名が旧ID、値が新IDです。差分にアイテムの挿入情報が含まれない場合は空オブジェクトです。（クライアント側で新規にアイテムを作図したときはアイテムIDはマイナス値で、それをサーバに保存するとプラスの値に変わります。）
         *     "errorInfo" {Object}: サーバ側の更新処理でのエラー内容。
         *         "errFlg" {IfxApiFacadePostUtil.SERVER_ERR_FLG}: サーバ側での保存処理実行時のエラー内容を表します。
         *         "arConflictedItemId" {array.&lt;number&gt;}: エラー内容が編集内容の競合を示す場合、競合の起きたアイテムのIDを配列で表します。
         * </pre>
         * @memberof IfxApiFacadePostUtil
         * @instance
         * @see IfxApiFacadePostUtil.ITEM_SAVE_STATE
         * @see IfxApiFacadePostUtil.SERVER_ERR_FLG
         */
        saveDataset: function(layerNodeId, options, callback) { this._call("saveDataset", arguments); },

        /**
         * 指定した全てのレイヤのデータセットを読み込み直し、最新の状態に更新します。
         * @param {Array.<string>} arLayerNodeId レイヤノードIDの配列
         * @param {boolean} bDiscard メモリ・IndexedDB上の編集内容を破棄してから再読み込みを行うかどうか。trueで破棄する。
         * @param {object} options オプション引数。将来の拡張に備えて用意された引数で、現在は使用されていません。{}を指定してください。
         * @param {Function} callback 実行後に呼び出すコールバック
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果（"success":正常終了 "error":異常終了）。1つでもデータセットの再読み込みに失敗したノードがある場合は"error"です。
         *     たとえば指定した3つのレイヤのうち2つの再読み込みに成功し、残り1つのレイヤは再読み込みできなかったケースでは"error"となります。
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {object} : ※指定したIDのノードがない・指定したノードがレイヤでない・bDiscard = trueのとき破棄処理に失敗したレイヤがある・
         *       データセット再構成に失敗したカーソルレイヤノードがある場合のみ
         *     "errorList" {array.&lt;object&gt;}: layerNodeId(レイヤノードID)とerrorInfo(エラー情報を示すメッセージ文字列)を持つオブジェクトの配列です。
         * </pre>
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        refreshLocalDatasets: function(arLayerNodeId, bDiscard, options, callback) { this._call("refreshLocalDatasets", arguments); },

        /**
         * 住所から該当地域を取得します
         * @param {string} address - 住所
         * @param {function} callback 値返却後のコールバック処理
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {object} { : 該当値域の矩形
         *     maxX : 矩形東端の経度　(例)135.45
         *     maxY : 矩形北端の緯度　(例)39.78
         *     minX : 矩形西端の経度　(例)134.21
         *     minY : 矩形南端の緯度　(例)38.53
         *     matchLevel : 住所のマッチングレベル　(例)5
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getPositionFromAddress: function(address, callback) { this._call("getPositionFromAddress", arguments); },

        /**
         * 現在地の座標を取得します
         * @param {function} callback 値返却後のコールバック処理
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value { : 現在地の座標
         *     "lon" : 経度 (例)135.45
         *     "lat" : 緯度 (例)39.78
         *   }
         *   ※設定時間内に処理が終わらない場合はタイムアウトでエラーメッセージを返します(設定時間は10秒です)
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getCurrentPosition: function(callback) { this._call("getCurrentPosition", arguments); },

        /**
         * スキーマ情報
         * getLayerDataやaddListener(changeCurrentNode)で使用
         * @typedef {object} IfxApiFacadePostUtil.schemeset
         * @property {object} attribute :属性情報
         * <pre>
         * {
         *       name {String} : 名称
         *       type {IfxApiFacadePostUtil.attrType} : データ型
         *       batedit {Boolean} : 一括編集
         * }
         * </pre>
         * @property {object} column : カラム情報
         * <pre>
         * {
         *       hidden {Boolean} : 非表示
         *       width {Number} : 表示幅
         *       pattern {String} : データ書式
         *       patternNull {String} : nullの表示値
         *       type {String} : JSBaseが定義する型を指定する整数の定数
         *  }
         * </pre>
         * @property {object} validator : 値の制限設定
         * <pre>
         * {
         *       min {Number} : 数値、日付の場合の最小値
         *       max {Number} : 数値、日付の場合の最大値
         *       maxCharLength {Number} :  文字列の場合の最大文字列長
         *       maxDataSize {Number} :  バイナリデータで許容する最大バイト数
         *       notNull {Boolean} : true:nullを許可しない, それ以外:nullを許可する
         *       values {String[] | Boolean[]}: 一覧選択の場合の値候補。※日時系、リンク型、バイナリ型では対応しない
         *       formattedValues {String[] | Boolean[]} : 一覧選択の場合の値候補のフォーマットされた値※日時系、リンク型、バイナリ型では対応しない
         * }
         * </pre>
         */

        /**
         * イベントリスナーを追加します<br>
         * イベントリスナーの追加時、およびそのイベントが発生したときにコールバックを発火します<br>
         * 地図の表示領域の変更時、選択ノード変更時、地図上で右クリック時、地図上で長押し時のイベントのリスナーを追加可能です<br>
         * 引数eventType, eventIdが文字列でなくても、そのまま処理されます。（動作を保障するものではありません）
         * @param {string} eventType - イベント種類
         *  <pre>
         *  "changeView" : 地図の表示領域が変更された場合
         *  "changeCurrentNode" : 選択ノードが変更された場合
         *  "rightClicked" : 地図上で右クリックした場合
         *  "longPress" : 地図上で長押しした場合
         *  "singleSnap" : アイテムをクリックで選択した場合独自イベントを追加する方法
         *  "rectangleSelect" : 地図上で範囲選択をした場合
         *
         *
         *  〇独自のイベントを足す方法
         *   addListenerで独自イベントを追加できます（以下引数）
         *   eventType ・・・任意の独自イベント名
         *   eventId・・・ユニークなイベントID(IfxApiFacadePostUtil.createUuidで生成できます)
         *   function・・・イベント発火時のコールバック関数
         *
         *  【コード例】
         *  <code>
         *   facade.addListener(eventType, eventId, function(e) {
         *       $("#fireEvent").val(JSON.stringify(e.value));
         *       consolelog(e);
         *   });
         *  </code>
         *
         *  〇独自イベントをJSBase側で発火し任意の情報を返す方法
         *  startCmd("ifx.parts.facade.ModuleInitialize.fireListener",～)にて実行。
         *  第二引数プロパティ(以下変数data内訳)
         *  eventType・・・発火する登録した独自イベント名
         *  args・・・連携先に送りたい情報オブジェクト
         *  ※JSON.stringifyで文字列化したとき情報が失われない型(number,boolean,string,null,Array,Object)に限り対応
         *
         * 【コード例】
         * <code>
         *  var data = { eventType: eventType, args: { called: CLASS_NAME + "._execFacadeFireListener" } };
         *  ifx.cmn.command.CommandMediator.startCmd("ifx.parts.facade.ModuleInitialize.fireListener", data, this.mapset);
         * </code>
         *
         * </pre>
         * @param {string} eventId - イベントリスナの固有ID (重複しない任意のIDを設定してください)
         * @see {@link IfxApiFacadePostUtil.createUuid} ユニークなイベントIDはIfxApiFacadePostUtil.createUuidで生成できます
         * @param {function} callback 値返却後のコールバック処理
         *
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {object} :
         *   {
         *    ○共通
         *    "called" {string} : コールバックを判断する値("onRegist":メインメニュー登録時 "onFire"メインメニュー実行時)
         *    "eventId" {string} : 登録/発火イベントリスナのID(一意なIDにするため、IfxApiFacadePostUtil.createUuid の値を渡すことを推奨します。)
         *    "eventType" {string} : 登録/発火イベントリスナのタイプ("changeView","changeCurrentNode","rightClicked","longPress")
         *
         *    ○イベント種類により分岐
         *    "data" {object} :
         *
         *     ①"changeView" 地図の表示領域が変更された場合
         *
         *      { : 地図の表示領域
         *       "lat" {number} : 緯度
         *       "lon" {number} : 経度
         *       "zoomLevel" {number} : ズームレベル
         *       "scaleText"{string} : 縮尺文字列(例) "1:5,000"
         *       "scale" {number} : 縮尺数値 (例) 5000.345
         *      }
         *
         *     ②"changeCurrentNode" 選択ノードが変更された場合
         *
         *      { : 選択ノード情報※選択ノードの種類によりパラメータが変わります
         *        ○全ノード共通のパラメータ
         *        "id" {String} : 選択ノードのID
         *        "type" {String} : 選択ノードのタイプ（mapset,layer等）
         *        "name" {String} : 選択ノードの名前 レイヤツリー等に表示されます
         *        "note" {String} : 選択ノードの注釈
         *        "disabled" {Boolean} : 選択ノードの有効無効状態(true:無効 false:有効)
         *        "hidden" {Boolean} : 選択ノードの表示状態(true:非表示 false:表示)
         *        "permission" {Number} : 選択ノードの編集権限(0:閲覧不可 1:閲覧可能 2:ヒット可能 3:編集可能)
         *        "metadata" {Object} : 開発者が自由に設定できるデータ情報
         *        "clazz" {String} : 選択ノードのクラス名
         *
         *        ○フォルダノード固有のパラメータ
         *        "display" {Number} : 表示状態
         *        "bufferedDisplay" {Number} : 設定されていた場合、displayの情報を上書きます
         *        "expanded" {Boolean} : フォルダの中身をツリー上で展開して表示するかのフラグ
         *
         *        ○レイヤノード固有のパラメータ
         *        "dts" {String} : データセットのパス情報
         *        "dtsOptions" {String} :  データセットオプション
         *        "minZoomLevel" {Number} : 表示する最大のズームレベル
         *        "maxZoomLevel" {Number} : 表示する最小のズームレベル
         *        "levelOfDetail" {Number} : 表示するズームレベル 1を設定した場合、表示ズームレベル+１のズームレベルのタイルを表示する
         *        "status" {Number} : 表示ステータス 参照可・ヒット可・編集可の状態を表現します。
         *        "memuFormula" {String} : メニューフォーミュラ
         *        "credit" {String} : レイヤの持つデータセットのクレジット情報
         *        "schemeset" {Array&lt;IfxApiFacadePostUtil.schemeset&gt;} : スキーマ情報
         *        "_dataset" {geoclod.Dataset} : データセット
         *        "alpha" {Number} : レイヤのアルファ値(透明度。 0 ~ 1の値。0で完全に透明になる。デフォルト値は1。)
         *        "useTileChache" {boolean} : レイヤのタイルがキャッシュされるかどうか。キャッシュされる場合 true。mapset.jsonに指定がなければtrueを返します。
         *      }
         *
         *     ③"rightClicked" 地図上で右クリックした場合
         *      { : 右クリックされた位置
         *        "lat" {number} : 緯度
         *        "lon" {number} : 経度
         *      }
         *
         *     ④"longPress" 地図上で長押しした場合
         *      { : 長押しされた位置
         *        "lat" {number} : 緯度
         *        "lon" {number} : 経度
         *      }
         *
         *     ⑤"singleSnap" 地図上をクリックした場合
         *      {
         *        "attr" {object} :選択アイテムの属性情報(クリック位置にアイテムがあった場合)
         *            (例){
         *             "選択・整数": 2,
         *             "選択・バイナリ": "11AC71",
         *             "__system__extent": "15531509,4223115,15546910,4236697",
         *             "選択・浮動小数点": 15.227,
         *             "タイプ": "フリーハンド"
         *           },
         *        "pos" {object}: { 選択アイテムまたはクリック座標情報（チルトがかかっている場合で水平線より上の領域をsnapした場合などとれないときアリ）
         *                "lat" {number} : 緯度
         *                "lon" {number} : 経度
         *           },
         *        "itemId" {number}:アイテムID,
         *        "layerNodeId" {string}:アイテムの属するレイヤノードID,
         *        "screen" {object}: { チャートの左上を(0,0)とした クリックした地点のピクセル座標値
         *              "x" {number} : geocloud.Snap#getSnapXで取れる値
         *              "y" {number} : geocloud.Snap#getSnapYで取れる値
         *           },
         *        "isRightClick" {boolean} : 右クリックの場合はtrue
         *        "isShiftDown" {boolean} : Shiftキーを押下していた場合はtrue
         *       }
         *     ⑥"rectangleSelect" 地図上で範囲選択をした場合
         *      {
         *        "items" {array} : {選択されたアイテム情報の配列 （選択されたアイテムがあった場合）
         *              "itemId" {number} : アイテムID
         *              "layerNodeId" {string}:	アイテムが属するレイヤノードID
         *         },
         *        "extent" {object} { : 選択した範囲のエクステント
         *              maxX : 矩形東端の経度(例)135.45
         *              maxY : 矩形北端の緯度(例)39.78
         *              minX : 矩形西端の経度(例)134.21
         *              minY : 矩形南端の緯度(例)38.53
         *         }
         *      }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addListener: function(eventType, eventId, callback) {
            // コールバックの削除をさせないようにする
            this._call("addListener", arguments, true);
        },

        /**
         * イベントリスナーを削除します
         * @param {string} eventId - イベントID(addListener使用時に設定したイベントリスナ固有ID)
         * @param {function} callback 値返却後のコールバック処理
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : 削除対象イベントID
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        removeListener: function(eventId, callback) {
            var self = this;
            var func = callback;
            if(_validator.isFunction(callback)) {
                // コールバックをラップして、呼び出し後,PostUtility側のeventIdのcallbackも削除
                func = function(arg) {
                    callback.apply(null, arguments);
                    if(arg && arg.result === "success") {
                        // eventIDをUUIDに変換
                        var uuid = self._eventIdToCbUuidMap[eventId];
                        if(uuid) {
                            var cbEventnames = Object.keys(self._callbackfunc);
                            cbEventnames.forEach(function(eventName) {
                                if(self._callbackfunc[eventName][uuid]) {
                                    delete self._callbackfunc[eventName][uuid];
                                }
                            });
                            delete self._eventIdToCbUuidMap[eventId];
                        }
                    }
                };
                func[KEY_FLG_CLEAR_CALLBACK] = true;
            }
            this._call("removeListener", [eventId, func]);
        },

        /**
         * 指定レイヤに対して作図をします
         * @param {string} drawType - 作図モード（現状"Symbol"のみ指定可能）
         * @param {string} layerNodeId - 対象レイヤのノードID（nullの場合は一時作図を行う）
         * @param {function} callback エラー/作図完了のコールバック処理
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value { : シンボル作図座標
         *    lat {Number} : 緯度
         *    lon {Number} : 経度
         * }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        startDrawMode: function(drawType, layerNodeId, callback) { this._call("startDrawMode", arguments); },

        /**
         * 一時作図レイヤをクリアします
         * @param {function} callback 実行後のコールバック処理
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         * </pre>
         * 
         */
        clearTempLayer: function(callback) { this._call("clearTempLayer", arguments); },

        /**
         * 地図上での右クリック時のメニューの構成要素を取得します
         *@param {function} callback 実行後のコールバック処理
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {: メニューの構成要素オブジェクト
         *    contextmenuonmap {
         *     menuList { :メニューの構成要素
         *       [メニューID] : [メニュー名]
         *  }}}
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getContextMenu: function(callback) { this._call("getContextMenu", arguments); },

        /**
         * コンテキストメニューを追加します<br>
         * メニューの追加時、及び、メニューの実行時にコールバックを発火します<br>
         * メニューの実行時のコールバック引数オブジェクトに、選択されている全てのアイテムの情報が格納されます<br>
         * 追加したメニューの削除にはremoveContextMenuが使用できます
         * @param {string} addName - メニュー名
         * @param {string} commandId 処理を追加するためのコマンドID(重複しない任意のIDを設定してください)
         * @param {function} callback  エラー/追加コンテキストメニュー実行時のコールバック処理
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value { :
         *     "items" {Array} : 選択アイテム情報
         *     [
         *       {
         *         itemId {String} : アイテムのID
         *         itemAttributes {object} : アイテム属性情報
         *         {
         *           [属性名] : [属性値]
         *         }
         *         itemCoordinate {object} : アイテムの座標
         *         {
         *           lat {number} : 緯度 (例) 35.684420046303,
         *           lon {number} : 経度 (例) 139.73741839893927
         *         }
         *       }
         *     ]
         *     "contextMenuPosition" {object} : コンテキストメニューを開く際に右クリックした地点の座標
         *     {
         *       lat {number} : 緯度 (例) 35.684420046303,
         *       lon {number} : 経度 (例) 139.73741839893927
         *     }
         *     "called" {string} : コールバックを判断する値("onRegist":コンテキストメニュー登録時 "onFire":コンテキストメニュー実行時))
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addContextMenu: function(addName, commandId, callback) { this._call("addContextMenu", arguments, true); /*複数回コールバックされる機能でリスナを残しておくためtrue*/ },

        /**
         * コンテキストメニューを削除します
         * @param {string} commandId コマンドID(addContextMenu時に使用した任意のID)
         * @param {function} callback 実行後のコールバック処理
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : commandId 削除したコマンドID
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        removeContextMenu: function(commandId, callback) {
            var func = this._createCallbackWithRemoval("addContextMenu", commandId, callback);
            this._call("removeContextMenu", [commandId, func]);
        },

        /**
         * APIのコールバックをラップし、削除後Util側のリスナを削除する処理をするようにラップしたコールバック関数を返します。
         * @param {string} funcName メニュー追加時の実行API名
         * @param {string} contentId メニュー登録ID(addContextMenuなど追加時に使用した任意のID)
         * @param {function} callback 実行後のコールバック処理
         * @returns {function} メニュー削除後Util側のリスナを削除する処理をラップしたfunction
         * @private
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        _createCallbackWithRemoval: function(funcName, contentId, callback) {
            var self = this;
            var func = callback;
            if(_validator.isFunction(callback)) {
                // コールバックをラップして、呼び出し後,PostUtility側のcontentIdのcallbackも削除
                func = function(arg) {
                    callback.apply(null, arguments);
                    if(arg && arg.result === "success") {

                        self._removeCallbackAndContentIdMap(funcName, contentId);
                    }
                };
                func[KEY_FLG_CLEAR_CALLBACK] = true;
            }
            return func;
        },

        /**
         * addLayerNodeで追加したレイヤのレイヤデータを取得します
         * @param {string} layerNodeId - レイヤノードID
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value { : レイヤデータ
         *     id {String} : ノード固有のID
         *     type {String} : ノードのタイプ（mapset,layer等）
         *     name { String} : ノードの名前 レイヤツリー等に表示されます
         *     disabled {Boolean} : ノードの有効・無効を表すフラグ
         *     permission {Number} : ノードの編集権限 (0 : 閲覧不可 1 : 閲覧可能 ,2 : ヒット可能 ,3 : 編集可能)
         *     metadata {Object } : 開発者が自由に設定できるデータ情報
         *     clazz {String} : ノードのクラス名
         *     dts {String} : データセットのパス情報
         *     dtsOptions {String} : データセットオプション
         *     minZoomLevel {Number} : 表示する最大のズームレベル
         *     maxZoomLevel {Number} : 表示する最小のズームレベル
         *     levelOfDetail {Number} : 表示するズームレベル 1を設定した場合、表示ズームレベル+１のズームレベルのタイルを表示する
         *     status {Number} : 表示ステータス 参照可・ヒット可・編集可の状態を表現します。
         *     memuFormula {String} : メニューフォーミュラ
         *     credit {String} : レイヤの持つデータセットのクレジット情報
         *     category {String} : カテゴリ
         *     csv {String} : レイヤ追加時に使用したcsv文字列
         *     newCsv {String} : 現在のデータセット状態をcsv文字列にしたもの
         * 
         *                       ※newCsvは追加時データに加えて「Edit」属性列が付加された形となります
         * 
         *                      【属性名】
         *                        "Edit" : データの変更内容を表す属性
         *                      【値域】
         *                        "0" : 変更のないデータ
         *                        "1" : 追加されたデータ
         *                        "2" : 変更されたデータ
         *                        "3" : 削除されたデータ
         * 
         *     gcwd {String} : データセット情報を持つ文字列
         *     _isChangedDts {String} : 追加後にデータセット更新したかを持つフラグ
         *     schemeset { : スキーマ情報
         *     attribute : {
         *       name {String} 名称
         *       type {Number} データ型(1:INT 2:DOUBLE 3:STRING 4:LONG 5:DATE 7:TIME 8:TIMESTAMP 9:HYPERLINK 10:BYNARY 11:BOOLEAN)
         *       batedit {Boolean}  一括編集
         *     }
         *     column { : カラム情報
         *       hidden {Boolean} : 非表示
         *       width {Number} : 表示幅
         *       pattern {String} : データ書式
         *       patternNull {String}  nullの表示値
         *       type {String}  JSBaseが定義する型を指定する整数の定数
         *     }
         *     validator { : 値の制限設定
         *       min Number  数値、日付の場合の最小値
         *       max Number  数値、日付の場合の最大値
         *       maxCharLength Number  文字列の場合の最大文字列長
         *       maxDataSize Number  バイナリデータで許容する最大バイト数
         *       notNull Boolean  true:nullを許可しない, それ以外:nullを許可する
         *       values String[] or Boolean[]  一覧選択の場合の値候補。※日時系、リンク型、バイナリ型では対応しない
         *       formattedValues String[] or Boolean[]  一覧選択の場合の値候補のフォーマットされた値※日時系、リンク型、バイナリ型では対応しない
         *     }
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         * @deprecated addLayerNodeが廃止予定のため、こちらも廃止予定となります。
         */
        getLayerData: function(layerNodeId, callback) { this._call("getLayerData", arguments); },

        /**
         * メインメニューの構成要素を取得します
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value { : メインメニューの構成要素オブジェクト
         *     [メニューID] : {
         *       disabled {Boolean} : メニューの有効／無効（true：無効 false: 有効)
         *       hidden {Boolean} : メニューの表示／非表示（true：非表示 false: 表示)
         *       name {String} : メニュー名
         *       children {Object} : メニュー子要素　※子要素が存在する場合のみ
         *    }
         *  }
         *  mainmenu.jsonファイルの元の形式とは異なります
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getMainMenu: function(callback) { this._call("getMainMenu", arguments); },

        /**
         * メインメニューの表示／非表示状態や有効／無効状態を設定します
         * @param {object} menuJson メインメニュー設定用のJson
         * 
         * <pre>
         * {
         *   [設定対象のメニューのID] {String} : {
         *     hidden {String} : メニューの表示／非表示（true：非表示 false: 表示)
         *     disabled {String} : メニューの有効／無効（true：無効 false: 有効)
         *   }
         * }
         * 
         * (設定例)
         * {
         *   "Sample":{"hidden":true,"disabled":true},
         *   "ifx.parts.modulesample.ModuleSample":{"hidden":true,"disabled":true}}
         * }
         * </pre>
         * 
         * @param {function} callback 処理実行後コールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        setMainMenu: function(menuJson, callback) { this._call("setMainMenu", arguments); },


        /**
         * メインメニューに新規メニューを追加します<br>
         * メニューの追加時、及び、メニューの実行時にコールバックを発火します<br>
         * 追加したメニューの削除にはremoveMainMenuContentが使用できます
         * @param {string} contentName - メニュー名
         * @param {string} contentId - メニューID(重複しない任意のIDを設定してください)
         * @param {string} contentImgSrc - メニューの画像データ(data URI schemeにて記述)<br>
         * （例) "data:image/png;base64,[base64データ]
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {
         *     "name" {String} : 追加メニュー名
         *     "id" {String} : 追加メニューID
         *     "called" {string} : コールバックを判断する値("onRegist":メインメニュー登録時 "onFire"メインメニュー実行時)
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addMainMenuContent: function(contentName, contentId, contentImgSrc, callback) { this._call("addMainMenuContent", arguments, true); /*複数回コールバックされる機能でリスナを残しておくためtrue*/ },

        /**
         * メインメニューの要素を削除します
         * @param {string} contentId - メニューID
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : 削除メニューID
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        removeMainMenuContent: function(contentId, callback) {
            var self = this;
            var parentFuncName = "addMainMenuContent";
            var childFuncName = "addChildMainMenu";
            var funcName =
                this._getCBUuidByContentId(parentFuncName, contentId) ? parentFuncName :
                this._getCBUuidByContentId(childFuncName, contentId) ? childFuncName :
                null;


            if(funcName === parentFuncName) {
                var childMenus = {};
                this.getMainMenu(function(ret) {
                    var menu = ret.value;
                    var parentId = self._getCBUuidByContentId(funcName, contentId);

                    function digJson(collection, func) {
                        Object.keys(collection).forEach(function(key) {
                            var content = collection[key];

                            if(content.children) {
                                digJson(content.children, func);
                            }
                            func(key, content);
                        });
                    }
                    //子要素オブジェクトを取得
                    digJson(menu, function(key, content) {
                        if(key === contentId && content.children) {
                            //子要素オブジェクトを探索し全てのコールバックを削除
                            digJson(content.children, function(key, content) {
                                self._removeCallbackAndContentIdMap(childFuncName, key);
                            });
                            return;
                        }
                    });


                });

            }

            var func = this._createCallbackWithRemoval(funcName, contentId, callback);
            this._call("removeMainMenuContent", [contentId, func]);
        },

        /**
         * 不要になったコールバックを削除しメニューIDとUUIDのマッピングからも削除する
         * @param {string} funcName 
         * @param {string} contentId 
         * @private
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        _removeCallbackAndContentIdMap: function(funcName, contentId) {
            var self = this;
            var uuid = self._getCBUuidByContentId(funcName, contentId);
            if(uuid) {
                if(self._callbackfunc[funcName][uuid]) {
                    delete self._callbackfunc[funcName][uuid];
                }
                delete self._contentIdToUuidMap[self._createContentIdToUuidMapKey(funcName, contentId)];
            }

        },

        /**
         * メッセージを表示させます
         * @param {string} type - 表示ダイアログのタイプ
         * 
         * <pre>
         * "alert" - 警告ダイアログ
         * "confirm" -  確認ダイアログ
         * "info" - 通知ダイアログ
         * </pre>
         * 
         * @param {string} message - 表示メッセージ(ダイアログ上で改行する場合は、文字列の改行したい箇所に"<br>"を使用する)
         * @param {string} title - ダイアログのタイトル
         * @param {function} callback ダイアログボタン押下時に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {object} : {
         *      status {string} : ダイアログ上で行われた操作を判定する値("OK":OKボタンが押下された場合 "CANCEL":キャンセル、または×ボタンが押下された場合)
         *      type {string} : 表示ダイアログのタイプ("alert","confirm","info")
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        showMessage: function(type, message, title, callback) { this._call("showMessage", arguments); },

        /**
         * 現在選択されているノードを取得します
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {object} :選択されているノード情報オブジェクト
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getCurrentNodeInfo: function(callback) { this._call("getCurrentNodeInfo", arguments); },

        /**
         * 地図上で選択されているアイテムの一覧を取得します。
         * @param {function} callback 取得後に呼ばれるコールバック
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果（"success":正常終了 "error":異常終了）
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {Object} : アイテム情報
         *   {
         *      "items" {Array&lt;object&gt;} :アイテム情報の配列
         *      [{
         *              "itemId" {number} : アイテムID
         *              "layerNodeId" {string} : アイテムが属するレイヤノードID
         *       }]
         *   }
         * </pre>
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getSelectedItemList: function(callback) { this._call("getSelectedItemList", arguments); },

        /**
         * アイテム挿入時のエラー情報。
         * <pre>
         * {
         *   "itemListIndex": 2,
         *   "errorInfo": ["Geometryの変換に失敗しました。","Styleの変換に失敗しました。"]
         * }
         * </pre>
         * @typedef {object} IfxApiFacadePostUtil.itemErrorList_element
         * @property {number} itemListIndex API呼び出し時に渡したアイテム情報の配列のインデックス番号
         * @property {array.<string>} errorInfo エラー内容（１つのアイテムに関するエラーを列挙する）
         */

        /**
         * ジオメトリ情報。GeoJSON形式。
         * <pre>
         * {
         *   "type": "Feature",
         *   "geometry": {
         *         "type": "Polygon",
         *         "coordinates": [
         *             [139.76979, 35.67616],
         *             [139.77283, 35.67495],
         *             [139.77469, 35.67805], ...
         *         ]
         *   },
         *   "properties": {}
         * }
         * </pre>
         * @typedef {object} IfxApiFacadePostUtil.itemInfo_geomGeoJson
         * @property {string} type 図形種別。必ず"Feature"となります。
         * @property {IfxApiFacadePostUtil.itemInfo_geomGeoJson_geometryCollection | IfxApiFacadePostUtil.itemInfo_geomGeoJson_geometry} geometry GeoJSON形式のジオメトリ情報。
         * @property {object} properties 属性情報。必ず空のオブジェクトが返ります。
         */

        /**
         * 複数のジオメトリ情報を表すオブジェクト。GeoJSON形式。
         * <pre>
         * {
         *   "type": "GeometryCollection",
         *   "geometries": [
         *       {
         *         "type": "LineString",
         *         "coordinates": [
         *             [139.76979, 35.67616],
         *             [139.77283, 35.67495],
         *             [139.77469, 35.67805], ...
         *         ]
         *       }, ...
         *   ]
         * }
         * @typedef {object} IfxApiFacadePostUtil.itemInfo_geomGeoJson_geometryCollection
         * @property {string} type 図形種別。複数のジオメトリを示す"GeometryCollection"になります。
         * @property {Array.<IfxApiFacadePostUtil.itemInfo_geomGeoJson_geometry>} geometries GeoJSON形式のジオメトリ情報の配列
         */

        /**
         * 1つのジオメトリ情報を表すオブジェクト。GeoJSON形式。
         * <pre>
         * {
         *   "type": "LineString",
         *   "coordinates": [
         *       [139.76979, 35.67616],
         *       [139.77283, 35.67495],
         *       [139.77469, 35.67805], ...
         *   ]
         * }
         * </pre>
         * @typedef {object} IfxApiFacadePostUtil.itemInfo_geomGeoJson_geometry
         * @property {string} type 図形種別（Point：点 MultiPoint: 複数の点 LineString：線 MultiLineString: 複数の線 Polygon：ポリゴン）
         * @property {array} coordinates 座標値の配列。値は緯度経度で経度、緯度の順とする。typeによって配列の深さが異なります。
         */

        /**
         * スタイルを表すJSONの型。
         * @typedef {object} IfxApiFacadePostUtil.itemInfo_style
         * @property {string} [pen] ペン色。0xから始まる8桁の16進数数値列
         * @property {string} [brush] ブラシ色。0xから始まる8桁の16進数数値列
         * @property {number} [fontHeight] フォントの高さ
         * @property {string} [font] フォント
         * @property {number} [horizontalJustification] テキストの水平方向の位置揃え
         * @property {number} [verticalJustification] テキストの垂直方向の位置揃え
         * @property {boolean} [bold] フォントの太字フラグ　（true：太字にする　false：太字にしない）
         * @property {boolean} [italic] フォントの斜体フラグ　（true：描画する　false：描画しない）
         * @property {boolean} [textVertical] テキストの縦書きフラグ　（true：縦書き　false：横書き）
         * @property {boolean} [background] テキストの背景描画フラグ　（true：描画する　false：描画しない）
         * @property {boolean} [textBox] テキストボックス描画フラグ　（true：描画する　false：描画しない）
         * @property {boolean} [halo] テキストの縁取りフラグ　（true：縁取りする　false：縁取りしない）
         * @property {string} [symbol] シンボル画像キー（画像はImageSetから取得）
         * @property {IfxApiFacadePostUtil.itemInfo_styleSymbolImageAttr} [symbolImage] シンボル画像情報。 有効なシンボルキーと同時に指定された場合、シンボル画像キーで取得できる画像を優先してスタイルに割当てする
         * @property {boolean} [symbolCurveEnd] シンボルがラインの終点に描画される設定かどうか
         * @property {boolean} [symbolCurveStart] シンボルがラインの始点に描画される設定かどうか
         * @property {boolean} [symbolCurveStroke] シンボルがラインに沿って繰り返し描画される設定かどうか。
         *     シンボル高さは lineWidth の値に、シンボル幅は patternLength の値に合わせられます。
         *     シンボルはラインの代わりに描画されます。
         * @property {number} [symbolHookX] シンボルのフックポイントのX座標(0~1の値)
         * @property {number} [symbolHookY] シンボルのフックポイントのY座標(0~1の値)
         * @property {boolean} [symbolMonochrome] シンボルがモノクロであるかどうか
         * @property {number} [symbolPixelAspectRatio] シンボルのイメージピクセルの縦横比(symbolかsymbolImageを指定したときのみ有効)
         * @property {Array.<IfxApiFacadePostUtil.itemInfo_symbolVectorItem>} [symbolVectorItemAr] ベクタシンボルのアイテム情報。
         * @property {number} [symbolVHeight] ベクタシンボルの高さ。
         * @property {boolean} [worldMeterUnits] スタイル単位
         * @property {Number} [minZoomLevel] 最小ズームレベル
         * @property {Number} [maxZoomLevel] 最大ズームレベル
         * @property {Number} [symbolScale] シンボルスケール
         * @property {Number} [code] 地物コード
         * @property {Number} [level] レベル
         * @property {Number} [lineWidth] ライン幅
         * @property {Array.<number>} [offset] オフセット
         * @property {String} [pattern] パターン 0x~から始まる4桁の16進数数値列
         * @property {Number} [patternLength] パターン幅
         * @property {boolean} [ignoreViewAngle] ビュー角度を考慮しないフラグ
         * @property {boolean} [square] 角端フラグ
         * @property {boolean} [symbolSurfaceInterior] サーフェス内シンボルフラグ
         * @property {IfxApiFacadePostUtil.itemInfo_style} [nextStyle] 子供のスタイル
         */

        /**
         * ベクタシンボルのアイテム情報
         * @typedef {object} IfxApiFacadePostUtil.itemInfo_styleSymbolImageAttr
         * @property {string} data イメージデータのバイト配列を文字列にしたもの
         * @property {number} width シンボル画像の幅
         * @property {number} height シンボル画像の高さ
         * @property {string} imageDataHash イメージデータのハッシュ。任意
         */

        /**
         * ベクタアイテムの一つのアイテムを表すオブジェクト。
         * @typedef {object} IfxApiFacadePostUtil.itemInfo_symbolVectorItem
         * @property {object} s スタイルのjson(geocloud.jsのStyle#toJSONしたもの)
         * @property {object} g ジオメトリのjson(geocloud.jsのGeometry#toJSONしたもの)
         */

        /**
         * アイテム情報を表すオブジェクト。
         * @typedef {object} IfxApiFacadePostUtil.itemInfo
         * @property {number} itemId アイテムID
         * @property {string} layerNodeId  レイヤノードID
         * @property {boolean} itemRet アイテムを取得できた場合true
         * @property {Object} itemRetObj 取得アイテム情報
         * <pre>
         * {
         *     "attributes" {Object} : アイテムの属性。[属性名]:[属性値]となる
         *     "geomWKT" {string} : wkt指定時のアイテムのジオメトリ
         *     "geomGeoJson" {IfxApiFacadePostUtil.itemInfo_geomGeoJson} : geojson指定時のアイテムのジオメトリ
         *     "style" {IfxApiFacadePostUtil.itemInfo_style} : アイテムのスタイル
         *     "angle" {number} : アイテムの角度
         * }
         * </pre>
         * @property {string} itemRetNGCode 異常系エラーコード
         * <pre>
         *     "CAN_NOT_GET_LAYER" レイヤノードからレイヤを取得できなかったケース
         *     "CAN_NOT_GET_ITEM" レイヤからアイテムを取得できなかったケース
         *     "LAYER_NODE_VISIBLE_ONLY" レイヤノードのステータスが表示のみのケース
         *     "CAN_NOT_GET_LAYER_NODE" レイヤノードを取得できなかったケース
         *     "OTHER" その他
         * </pre>
         */



        /**
         * 指定したレイヤノードIDとアイテムIDから、アイテムの情報を取得します。メモリに保持されているデータのみ対象となります。
         * @param {Array.<object>} arItemInfo 取得するレイヤノードIDとアイテムIDの組み合わせ配列
         * @param {string} arItemInfo.layerNodeId レイヤノードID
         * @param {number} arItemInfo.itemId アイテムID
         * @param {string} geomType アイテムのジオメトリをどの形式で返すか（geojsonかwkt）
         * @param {function} callback 実行後に呼ばれるコールバック
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {Object} : アイテムの情報。
         *   {
         *      "arItemInfo" {array.&lt;IfxApiFacadePostUtil.itemInfo&gt;}:  アイテム情報の配列
         *      "isError" {boolean}: コマンド内部でエラーが発生した時、true ※コマンド内部でエラーが発生した時のみ。後方互換のため残している。
         *      "cmdError" {boolean}: コマンド内部でエラーが発生した時、true ※コマンド内部でエラーが発生した時のみ
         *      "cmdErrorMessage" {string}: コマンド内部のエラー内容 ※コマンド内部でエラーが発生した時のみ
         *      "cmdErrorStack" {string}: コマンド内部のエラースタックトレース ※コマンド内部でエラーが発生した時のみ
         *   }
         * </pre>
         * @see IfxApiFacadePostUtil.itemInfo
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getItemInfo: function(arItemInfo, geomType, callback) {
            var data = { "arItemInfo": arItemInfo, "geomType": geomType };
            this.startCmdCallbacks(
                "ifx.parts.facade.ModuleInitialize.getItemInfo", data, callback);
        },

        /**
         * 指定ノードの情報を取得します
         * @param {string} nodeId ノードID
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {object} : ノード情報 詳細はgetLayerDataを参照してください
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getNodeInfoById: function(nodeId, callback) { this._call("getNodeInfoById", arguments); },

        /**
         * ヘッダーメニューに新規メニューを追加します<br>
         * メニューの追加時、及び、メニューの実行時にコールバックを発火します<br>
         * 追加したメニューの削除にはremoveMenubarButtonが使用できます
         * @param {string} contentName - メニュー名
         * @param {string} contentId - メニューID(重複しない任意のIDを設定してください)
         * @param {string} imgSrc - メニューの画像データ（data URI schemeにて記述）
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value { :
         *     "name" {String} : 追加メニュー名
         *     "id" {String} : 追加メニューID
         *     "called" {string} : コールバックを判断する値 - "onRegist"(登録時) "onFire"(イベント発火時)
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addMenubarButton: function(contentName, contentId, imgSrc, callback) { this._call("addMenubarButton", arguments, true); /*複数回コールバックされる機能でリスナを残しておくためtrue*/ },

        /**
         * 簡単レイアウトのボタンバーに新規メニューを追加します<br>
         * メニューの追加時、及び、メニューの実行時にコールバックを発火します<br>
         * 追加したメニューの削除にはremoveBtnbarButtonが使用できます
         * @param {string} contentName - メニュー名
         * @param {string} contentId - メニューID(重複しない任意のIDを設定してください)
         * @param {string} imgSrc - ボタンの画像データ（data URI schemeにて記述）
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value { :
         *     "name" {String} : 追加メニュー名
         *     "id" {String} : 追加メニューID
         *     "called" {string} : コールバックを判断する値 - "onRegist"(登録時) "onFire"(イベント発火時)
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addBtnbarButton: function(contentName, contentId, imgSrc, callback) { this._call("addBtnbarButton", arguments, true); /*複数回コールバックされる機能でリスナを残しておくためtrue*/ },

        /**
         * ヘッダーメニューの情報を取得します
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value [ : ヘッダーメニューの構成要素配列
         *   {
         *     id {String} : メニューID (例) "ifx.parts.rectanglezoom.RectangleZoom"
         *     name {String} : メニュー名 (例) "範囲ズーム"
         *     disabled {Boolean} :  メニューの有効／無効（true：無効 false: 有効)
         *     hidden {Boolean} : メニューの表示／非表示（true：非表示 false: 表示)
         *     imgFont {String} : メニューの画像データ（data URI schemeにて記述（例："data:image/png;base64,[base64データ]））
         *   }]
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        getMenubar: function(callback) { this._call("getMenubar", arguments); },

        /**
         * ヘッダーメニューからメニューを削除します
         * @param {string} contentId - メニューID
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : メニューID
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        removeMenubarButton: function(contentId, callback) {
            var func = this._createCallbackWithRemoval("addMenubarButton", contentId, callback);
            this._call("removeMenubarButton", [contentId, func]);
        },

        /**
         * 簡単レイアウトのボタンバーからメニューを削除します
         * @param {string} contentId - メニューID
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : メニューID
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        removeBtnbarButton: function(contentId, callback) {
            var func = this._createCallbackWithRemoval("addBtnbarButton", contentId, callback);
            this._call("removeBtnbarButton", [contentId, func]);
        },


        /**
         * フィルタ、注記、主題図などのカスタマイザノードを作成し、指定されたレイヤに追加します
         * @param {object} customizerNodeJson - カスタマイザノードのJSONオブジェクト
         * @param {string} layerNodeId - 追加対象レイヤのノードID
         * @param {function} callback 処理実行後コールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : 追加対象レイヤのノードID
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addCustomizerNodeFromJson: function(customizerNodeJson, layerNodeId, callback) { this._call("addCustomizerNodeFromJson", arguments); },

        /**
         * シンボル間の矢印描画を行います
         * @param {string} layerNodeId - 描画対象レイヤのノードID
         * @param {string} picAttr - 順序を参照する属性名(例:「表示順」属性値には昇順の整数値が入る)
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : 描画対象レイヤのノードID
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         * @deprecated 実装のないAPIの呼出しです。
         */
        addArrowAnnotation: function(layerNodeId, picAttr, callback) { this._call("addArrowAnnotation", arguments); },

        /**
         * シンボル間の矢印描画(オプション設定付)を行います
         * @param {string} layerNodeId - 追加先レイヤID
         * @param {string} picAttr - 順序を参照する属性名(例:「表示順」属性値には昇順の整数値が入る)
         * @param {string} option - 矢印描画の各種設定要素を記述したJSON文字列
         * <pre>
         * optionJSON文字列の記述内容
         * {
         *   "arrowColor" {string} : "#ffa500", 矢印の色(カラーコード)
         *   "arrowHeadSize" {number} : 64, アローヘッドの大きさ(ピクセル数)
         *   "lineWidth" {number} : 3, シャフトの太さ
         *   "circleColor" {string} : "rgb(255, 20, 17)", シンボルを囲む円の色(RGB形式)
         *   "circleLineWidth" {number} : 3 シンボルを囲む円の太さ
         * }
         * </pre>
         * @param {function} callback 取得後に呼ばれるコールバック
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : 矢印注記の追加先レイヤID
         * </pre>
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         * @deprecated 実装のないAPIの呼出しです。
         */
        addArrowAnnotationByOption: function(layerNodeId, picAttr, option, callback) { this._call("addArrowAnnotationByOption", arguments); },

        /**
         * 描画を一時表示非表示を切り替えます
         * @param {string} layerNodeId - 追加先レイヤID
         * @param {string} customerKeys - キー名
         * @param {function} callback - [処理実行後コールバック]
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : アイテム
         * </pre>
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         * @deprecated 実装のないAPIの呼出しです。
         */
        getDetailInfoByKey: function(layerNodeId, customerKeys, callback) { this._call("getDetailInfoByKey", arguments); },

        /**
         * 円領域フィルタを指定ノードに対して追加します
         * @param {object} position - 円領域中心座標
         * @param {double} radius - 円領域半径(m)
         * @param {Array<string>} layerIdArray - 対象レイヤノードIDの配列 ※空配列の場合は全レイヤに追加します
         * @param {boolean} moveFlag - フィルタ領域に画面を移動するかを指定するフラグ
         * @param {function} callback - [処理実行後コールバック]
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {string} : メニューID
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addCircleLocusFilter: function(position, radius, layerIdArray, moveFlag, callback) { this._call("addCircleLocusFilter", arguments); },

        /**
         * 指定されたメインメニューのカテゴリ配下に新規メニューを追加します<br>
         * メニューの追加時、及び、メニューの実行時にコールバックを発火します<br>
         * 追加したメニューの削除にはremoveMainMenuContentが使用できます
         * @param {string} contentName - メニュー名
         * @param {string} contentId - メニューID(重複しない任意のIDを設定してください)
         * @param {string} parentId - 追加先メインメニューカテゴリのID
         * @param {string} contentImgSrc - メニューの画像データ（data URI schemeにて記述<br>
         * （例："data:image/png;base64,[base64データ]））
         * @param {function} callback 取得後に呼ばれるコールバック
         * 
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {
         *     "name" {String} : 追加メニュー名
         *     "id" {String}: 追加メニューID
         *     "called" {string} : コールバックを判断する値 - "onRegist"(登録時) "onFire"(イベント発火時)
         *   }
         * </pre>
         * 
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addChildMainMenu: function(contentName, contentId, parentId, contentImgSrc, callback) { this._call("addChildMainMenu", arguments, true); /*複数回コールバックされる機能でリスナを残しておくためtrue*/ },



        /**
         * 外部からの任意コマンド実行します。事情がなければ、startCmdCallbacks の方を利用してください。
         * @param {String} cmdId コマンドID (このコマンドはdata.callbackを呼び出すように実装されている必要がある)
         * @param {Object} data コマンド用引数(実行するとdata.callbackに引数optCallbackがセットされる)
         * @param {function} [optCallback] コマンド処理実施後のコールバック
         * <pre>
         * 
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {
         *     // コマンドに応じたプロパティ
         *   }
         * </pre>
         * @deprecated 後方互換性などの事情がなければ、startCmdCallbacks の方を利用してください。
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        startCmd: function(cmdId, data, optCallback) {
            this._call("startCmd", arguments);
        },

        /**
         * 外部からの任意コマンド実行。<br>
         * コマンド実行後、optCallbackや、optCallbackCancelが呼び出されるには、コマンド側で
         * それぞれdata.callbacks.ok、data.callbacks.cancelの
         * コールバックの呼び出しを行っている必要があります。
         * @param {String} cmdId コマンドID(このコマンドはdata.callbacks.okを呼び出すように実装されている必要がある)
         * @param {Object} data コマンド用引数
         *     (実行するとコマンドのdata.callbacks.okに引数optCallbackが,
         *     data.callbacks.cancelに引数optCallbackCancelがセットされる。)
         * @param {function} [optCallback] コマンド処理実施後のコールバック
         * @param {function} [optCallbackCancel] コマンド処理実施キャンセル後のコールバック
         * @param {boolean} [optIsRetobjArgArray] optCallbackの引数をコマンドのコールバックの引数全体を配列形式にしたものにするかどうか。
         * デフォルトではfalseで、コマンドのコールバックの第一引数のみが渡されます。
         * @param {boolean} [optOmitRemeveCbWhenCalledOnce] 
         *     コールバック関数呼び出し後、キャッシュからコールバック関数を削除する処理を省くか(デフォルトで削除されます。trueにするとコールバック関数は削除されずに残ります。)
         * <pre>
         *
         * optCallback、optCallbackCancelのコールバックに渡される引数オブジェクトの形式は以下。
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         *   value {
         *     // コマンドに応じたプロパティ
         *   }
         * </pre>
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        startCmdCallbacks: function(cmdId, data, optCallback, optCallbackCancel, optIsRetobjArgArray, optOmitRemeveCbWhenCalledOnce) {
            this._call("startCmdCallbacks", [cmdId, data, optCallback, optCallbackCancel, optIsRetobjArgArray], optOmitRemeveCbWhenCalledOnce);
        },

        /**
         * サーバにセッション削除リクエストを送ります<br>
         * @param {function} callback 取得後に呼ばれるコールバック
         * <pre>
         * コールバック引数オブジェクト
         *   methodName {string} : 実行メソッド名
         *   result {string} : 実行結果("success":正常終了 "error":異常終了)
         *   message {string} : エラーメッセージ ※エラー時のみ
         *   stack {string} : スタックトレース ※エラー時のみ
         * </pre>
         * @ignore
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        sessionDelete: function(callback) { this._call("sessionDelete", arguments); },

        /**
         * @ignore
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        initFunc: function() {
            var self = this;
            var options = self._options;

            if(options !== undefined && options !== null) {
                //optionsの内容で初期設定を行う
                if(options.position) {
                    self.setPosition(options.position, false, function(ret) {
                        console.log(ret);
                    });
                }

                if(options.zoomLevel) {
                    self.setScale(options.zoomLevel, false, function(ret) {
                        console.log(ret);
                    });
                }

                //メインメニューの初期化
                var menuJson = {};
                if(options.menuJson) {
                    menuJson = options.menuJson;
                }

                self.setMainMenu(menuJson, function(e) {
                    console.log(e);
                });
            }
            //コンソールにログを表示するリスナーを登録できたりする。
            var eventId = ifxApiFacadePostUtil.createUuid();
            self.addListener("FacadeLog", eventId, function(e) {
                console.log(e);
            });
        },

        /**
         * コンテキストメニューにフックさせる関数の引数１
         * <pre>
         *  オリジナルコンテキストメニュー情報と選択アイテム情報を保持する
         *  選択アイテムが規定数より大きい場合アイテムの属性は取得しない(アイテムID・レイヤIDのみ)
         *  facadeモジュールconfig.jsonのifx_parts_facade.ModuleInitialize.contextMenuHook.itemLimitWithAttributesにて属性取得するアイテムの限界数を設定
         * </pre>
         * @typedef {object} IfxApiFacadePostUtil.contextMenuHook_setupFunc_contextInfo setupFuncの引数1
         * @property {object} menuJson オリジナルコンテキストメニューのjson
         * @property {IfxApiFacadePostUtil.contextMenuHook_setupFunc_contextInfo_itemProp} itemProp  選択アイテムが一つだけの場合値を渡す。そうでないときはnullを設定。
         * @property {array.<IfxApiFacadePostUtil.contextMenuHook_setupFunc_contextInfo_itemProp>} selectedItems 選択アイテム情報すべてを渡す。ないときは空配列を設定。
         */


        /** コンテキストメニューにフックさせたときの選択アイテム情報
         * @typedef {object} IfxApiFacadePostUtil.contextMenuHook_setupFunc_contextInfo_itemProp
         * @property {number} itemId アイテムID
         * @property {string} layerNodeId アイテムが属するレイヤノードのID
         * @property {object} attributes アイテムの属性
         */

        /**
         * コンテキストメニューにフックさせる関数の引数２
         * このコールバックを呼び出すと新たにコンテキストメニューを設定できる
         * @callback IfxApiFacadePostUtil.contextMenuHook_setupFunc_done setupFuncの引数2
         * @param {object} newMenuJson 新たなコンテキストメニューのjson
         */

        /**
         * コンテキストメニューにフックさせる関数
         * @callback IfxApiFacadePostUtil.contextMenuHook_setupFunc
         * @param {IfxApiFacadePostUtil.contextMenuHook_setupFunc_contextInfo} contextInfo 
         *     オリジナルコンテキストメニュー情報と選択アイテム情報を保持するオブジェクト
         * @param {IfxApiFacadePostUtil.contextMenuHook_setupFunc_done} done このコールバックを呼び出してコンテキストメニューを設定する
         */

        /**
         * コンテキストメニュー展開時にフックし選択アイテムによってはコンテキストメニューの内容を編集し
         * それをコンテキストメニューとして展開できる。複数回呼ばれることを想定していない。<br>
         * 登録されたリスナはこの関数の戻り値(イベントID)をremoveListenerに指定することで解除が可能です。
         * @param {IfxApiFacadePostUtil.contextMenuHook_setupFunc} setupFunc 新たなコンテキストメニューに相当するオブジェクトを生成しdoneに返して確定する関数
         * @param {function} optResultCallback コンテキストメニューフック時に状況を受け取る
         * @returns {number} eventId イベント解除用のイベントID
         * <pre>
         * 引数のsetupFunc で返すコンテキストメニューに相当するオブジェクトについて
         * ➀ このオブジェクトのkeyとvalueはそれぞれ、
         * “CommandMediatorに登録済みのコマンドID”, “UI上の名称” を指定する。
         * ➁コンテキストメニューには、セパレータを挿入することができる。セパレータを挿入する場合は、挿入したい位置に
         * keyとvalueをそれぞれ、“separatorを含むユニークな文字列”, “任意の文字列”で設定する。
         * ユニークではない、重複した文字列を指定した場合、意図した位置にセパレータが表示されない可能性がある。
         * ➂　➀と➁以外に特別なキー、「moveContext」が存在する。これは、クリックした位置を地図の中心にするためのコマンド。
         * （このコマンドはCommandMediator経由ではなく、contextmenuonmapモジュールに直接記述されている処理のため、特別なコマンド名となっている。）
         * </pre>
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        contextMenuHook: function(setupFunc, optResultCallback) {

            optResultCallback = typeof optResultCallback === "function" ? optResultCallback : function() {};
            var self = this;

            if(this._contextMenuHookIdempotenceFlg) { //contextMenuHookバインド済みフラグ
                return;
            }

            if(!setupFunc || typeof setupFunc !== "function") {
                return;
            }
            if(optResultCallback && typeof optResultCallback !== "function") {
                return;
            }

            var eventId = ifxApiFacadePostUtil.createUuid();
            this.addListener("ifx_parts_facade_ModuleInitialize_contextMenuHook", eventId, function(data) {
                var result = data.result;
                var value = data.value;

                if(result === "success" && value.called === "onFire") {

                    var newContextDone = function(newContext) {
                        self.startCmdCallbacks("ifx.parts.facade.ModuleInitialize.contextMenuSetup", { "newContext": newContext }, optResultCallback);
                        optResultCallback(data);
                    };
                    setupFunc(data.value.data, newContextDone);

                } else {
                    optResultCallback(data);
                }
            });
            this._contextMenuHookIdempotenceFlg = true;
            return eventId;
        },

        /**
         * addCommandのResultCallbackのコールバックです。
         * コマンド登録処理とリスナー関数追加処理のどちらも成功していないと
         * コマンドは正しく登録されていません。
         * @callback IfxApiFacadePostUtil.addCommand_ResultCallback
         * @param {object|null} resAddCommand コマンド登録後の結果オブジェクト。
         * 引数が不正の場合はnullが渡されます。
         * resAddCommand.value.のデータは以下の形式。
         * <pre>
         * {
         *   isError: エラー有無
         *   msg: 結果メッセージ
         *   error: エラー内容
         * }
         * </pre>
         * @param {object|null} resAddListener コマンドに紐付いたリスナー関数追加処理の結果オブジェクト。
         * 　　引数が不正の場合、コマンド登録に失敗している場合はnullが渡されます。
         */

        /**
         * JSBaseコマンドをAPI経由で追加します<br>
         * 主にコンテキストメニューで使用されるコマンドの追加を想定していますがコードからのコマンド呼び出しなども可能です<br>
         * 同名のコマンドが登録済みの場合は登録に失敗します(optIgnoreIfCommandExistsが指定されていない、またはfalseの場合)<br>
         * コマンド活性不活性設定不可のためコマンドの実行時に処理を実行できるかをfireCallback関数内で判定する必要があります<br>
         * <br>
         * コマンド登録に成功すると、fireCallbackがイベントリスナーとして登録されます<br>
         * コマンド呼び出し時に、fireCallbackがAPIのイベント経由でコールされます<br>
         * 登録されたリスナはこの関数の戻り値(イベントID)をremoveListenerに指定することで解除が可能です
         * @param {string} commandId 登録するコマンド名
         * @param {function} fireCallback バインドする関数です。JSBaseでコマンドが呼び出されたときにこのコールバック関数が呼び出されます。引数は
         * コマンド呼び出し元に依存してかわります。例えば、コンテキストメニューで呼び出された場合は選択アイテムのIDと属するレイヤノードIDが渡されます。
         * @param {IfxApiFacadePostUtil.addCommand_ResultCallback} [optResultCallback] 処理結果を受け取る関数
         * @param {boolean} [optIgnoreIfCommandExists] コマンドがすでに登録済みかのチェックを抑制します。
         *     登録済みの場合はすでにバインド済みのイベントリスナーを削除して上書きします。デフォルトでfalse。
         * @returns {string} リスナ登録したイベントID　
         * @export
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        addCommand: function(commandId, fireCallback, optResultCallback, optIgnoreIfCommandExists) {

            optResultCallback = typeof optResultCallback === "function" ? optResultCallback : function() {};
            var ignoreIfCommandExists = !!optIgnoreIfCommandExists;

            if(!commandId || typeof commandId !== "string") {
                optResultCallback(null, null);
                return;
            }
            var eventType = "addCommandListenerEventType_" + commandId;

            if(!fireCallback || typeof fireCallback !== "function") {
                optResultCallback(null, null);
                return;
            }

            var fireUuId = ifxApiFacadePostUtil.createUuid();

            // optIgnoreIfCommandExistsがtrueのときに
            // 既存のリスナーを一旦削除(startCmdCallbacksで実施)してから、新規にリスナーを追加するという動作の順になるように
            // 処理の順番が保証されるように入れ子のコールバックにしておく。
            this.startCmdCallbacks("ifx.parts.facade.ModuleInitialize.addCommand", {
                "commandId": commandId,
                "ignoreIfCommandExists": ignoreIfCommandExists,
                "data": { "eventType": eventType }
            }, function(dataAddCommand) {
                if(dataAddCommand && dataAddCommand.value &&
                    !dataAddCommand.value.isError) {
                    this.addListener(eventType, fireUuId, function(data) {
                        var result = data.result;
                        var value = data.value;

                        if(result === "success" && value.called === "onFire") {
                            fireCallback(data.value.data);
                        } else if(value.called === "onRegist") {
                            optResultCallback(dataAddCommand, data);
                        }
                    }.bind(this));
                } else {
                    optResultCallback(dataAddCommand, null);
                }
            }.bind(this));

            return fireUuId;

        },

        /**
         * 追加したメニュー(API名)とIDからコールバックのUUIDを取得します<br>
         * addListener以外の複数回コールバックされる機能向け<br>
         * 主にAPIで追加されたメニューが削除されたときにPostUtilityJSBaseFacade側にバインドされている不要なコールバックを削除するために使用
         * @param {string} funcName addMainMenuContentなどメニュー追加時のAPI名
         * @param {string} contentId メニュー追加時に設定したcontentID
         * @return {string} コールバックUUID
         * @private
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        _getCBUuidByContentId: function(funcName, contentId) {
            return this._contentIdToUuidMap[this._createContentIdToUuidMapKey(funcName, contentId)];
        },

        /**
         * メニュー追加API名とIDからコールバックUUID取得用キーを生成します
         * @param {string} funcName addMainMenuContentなどメニュー追加時のAPI名
         * @param {string} contentId メニュー追加時に設定するcontentID
         * @return {string} コールバックUUID取得用キー
         * @private
         * @memberof IfxApiFacadePostUtil
         * @instance
         */
        _createContentIdToUuidMapKey: function(funcName, contentId) {
            return funcName + "_" + contentId;
        }			,
			    //消防向けAPI
			    /**
			     * 角度指定 指定角度を設定した地図を表示します
			     * @param {number} angle - 角度（0～359で指定）
			     * @param {boolean} animateFlag - 地図移動時のアニメーション有無（true:あり false:なし）
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     * </pre>
			     *
			     * @export
			     */
			    setAngle: function(angle, animateFlag, callback) { this._call("setAngle", arguments); },

			    /**
			     * 図形描画 指定されたレイヤデータセットに対して複数アイテムの追加を行います
			     * @param {string} layerId - アイテムを追加するレイヤノードID
			     * @param {Array<object>} data - 作図アイテムの情報オブジェクトを配列で指定します。
			     *
			     * <pre>
			     * アイテム情報オブジェクト
			     *   data = [{
			     *      wkt {string} : アイテムのwkt文字列（"POINT (136.12 35.45)"）
			     *      attributes {object} : 属性名をkey、属性値をvalueとしたオブジェクト（{"属性1":1, "属性2":"2"}）
			     *   }]
			     * </pre>
			     *
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     *   value [{ : 追加アイテムの情報オブジェクト配列
			     *     itemId {number}: アイテムID
			     *     layerId {string} : 追加先のレイヤノードID
			     *     attributes {object} : 追加したアイテムの属性オブジェクト（{"属性1":1, "属性2":"2"}）
			     *   }]
			     * </pre>
			     *
			     * @export
			     */
			    drawItems: function(layerId, data, callback) { this._call("drawItems", arguments); },

			    /**
			     * 図形削除 指定したアイテムを対象レイヤデータセットから削除します
			     * @param {string} layerId - アイテム削除対象レイヤノードのID
			     * @param {number} itemId - 削除対象アイテムのID
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     * </pre>
			     *
			     * @export
			     */
			    deleteItem: function(layerId, itemId, callback) { this._call("deleteItem", arguments); },

			    /**
			     * 複数図形削除 指定した複数のアイテムを対象レイヤデータセットから削除します
			     * @param {string} layerId - アイテム削除対象レイヤノードのID
			     * @param {number[]} itemIds - 削除対象アイテムのID配列
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     * </pre>
			     *
			     * @export
			     */
			    deleteItems: function(layerId, itemId, callback) { this._call("deleteItems", arguments); },

			    /**
			     * 新規レイヤ追加 新規レイヤノードを対象フォルダノードの配下に作成します<br>
			     * "parentNodeId"に"mapset"の文字列を指定することで、マップセットの直下にレイヤを追加することが出来ます
			     * @param {string} name - 追加レイヤ名
			     * @param {string} parentNodeId - 追加先フォルダノードID（"mapset"を指定でマップセット直下）
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     *   value {string} : 追加されたレイヤノードのID
			     * </pre>
			     *
			     * @export
			     */
			    addNewLayerNode: function(name, parentNodeId, callback) { this._call("addNewLayerNode", arguments); },

			    /**
			     * UTMポイント取得 指定された緯度経度からUTMポイントを取得して返却します
			     * @param {object} position - {"lat":緯度(-90以上90以下),"lon":経度(-180以上180以下)}
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     *   value {string} : UTMポイントのコード文字列
			     * </pre>
			     *
			     * @export
			     */
			    getUtmPointFromPosition: function(position, callback) { this._call("getUtmPointFromPosition", arguments); },

			    /**
			     * 画像・動画表示 対象レイヤにシンボルを作成、吹き出しダイアログを表示し、ダイアログに画像、動画を表示します<br>
			     * ダイアログのsrc部分をクリックするとクリックイベントを発火しコールバック処理を呼び出します。"called"の値で登録時とイベント発火時で処理を分岐することが出来ます
			     * @param {string} layerId - シンボル追加先レイヤノードのID
			     * @param {object} position - {"lat":緯度(-90以上90以下),"lon":経度(-180以上180以下)}
			     * @param {string} type - 表示するソースの型（image/video/stream）
			     * @param {string} src - 表示するソース（"http://xxx.co.jp/img"）
			     * @param {function} callback -  [処理実行後コールバック]
			     * @param {object} optDialogSize - {"dlgW":ダイアログ幅（px）,"dlgH":ダイアログ高さ（px）,"dlgMinW":ダイアログの可変した際の最低幅,"dlgMinH":ダイアログの可変した際の最低高さ}
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     *   value { :
			     *     "itemId" {number} : 追加シンボルのアイテムID
			     *     "layerId" {string} :　シンボルを追加したレイヤのノードID
			     *     "called" {string} : コールバックを判断する値 - "onRegist"(登録時) "onFire"(イベント発火時、streamの場合はクリックイベントを登録しないので返ってきません)
			     *   }
			     * </pre>
			     *
			     * @export
			     */
			    addThumbnail: function(layerId, position, type, src, callback, optDialogSize) {
			    	this._call("addThumbnail", [layerId, position, type, src, optDialogSize ?? {}, callback]);
			    },

			    /**
			     * 画像出力 現在表示されている地図画面を、指定された画像形式で出力しbase64文字列で返却します
			     * @param {string} type - 画像形式（png/jpeg/jpg）
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     *   value {string} : 画像のbase64文字列
			     * </pre>
			     *
			     * @export
			     */
			    exportImage: function(type, callback) { this._call("exportImage", arguments); },

			    /**
			     * レイヤ更新 指定レイヤデータセットに対して変更の強制破棄と再読み込みを行います<br>
			     *　操作上の変更を強制破棄するため、新規追加したメモリーデータセットに関しては、レイヤが空の状態(初期状態)まで戻ります<br>
			     * ファイルから読み込んだGCWDなどは、読み込んだ時の状態に戻ります<br>
			     * 例）新規レイヤを追加し作図を行ったレイヤに対して密度分布を行う。分析対象レイヤを更新した場合、空の状態に戻ります<br>
			     *　　　密度分布結果レイヤはサーバ側で作成された状態で読み込まれたものなので、更新した場合、密度分布を行った直後の状態に戻ります
			     * @param {string} layerId - 更新対象レイヤノードID
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     * </pre>
			     *
			     * @export
			     */
			    refreshLayer: function(layerId, callback) { this._call("refreshLayer", arguments); },

			    /**
			     * 全レイヤ更新 マップセットで管理されている全てのレイヤデータセットに対して変更の強制破棄と再読み込みを行います<br>
			     *　操作上の変更を強制破棄するため、新規追加したメモリーデータセットに関しては、レイヤが空の状態(初期状態)まで戻ります<br>
			     * ファイルから読み込んだGCWDなどは、読み込んだ時の状態に戻ります<br>
			     * 例）新規レイヤを追加し作図を行ったレイヤに対して密度分布を行う。分析対象レイヤを更新した場合、空の状態に戻ります<br>
			     *　　　密度分布結果レイヤはサーバ側で作成された状態で読み込まれたものなので、更新した場合、密度分布を行った直後の状態に戻ります
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     * </pre>
			     *
			     * @export
			     */
			    refreshAllLayer: function(callback) { this._call("refreshAllLayer", arguments); },

			    /**
			     * 密度分布 指定レイヤノードに対して、指定サイズ範囲で密度分布表示を行います
			     * @param {string} layerId - 対象レイヤノードのID
			     * @param {number} size - 密度分布における1つの分析メッシュの大きさ（正方形の辺）（km）
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     *   value {string} : 密度分布結果レイヤノードのID
			     * </pre>
			     *
			     * @param {number} divideNum - レンジ主題図の分割数(オプション扱い、指定のない場合は5分割表記)
			     *
			     * @export
			     */
			    densityAnalysis: function(layerId, size, callback, divideNum) {
			    	//順序を入れ替えてdivideNumが存在しない場合はnull
			    	this._call("densityAnalysis", [layerId, size, divideNum ?? null, callback]);
			    },

			    /**
			     * 位置から住所を取得 緯度・経度から住所検索を行い住所情報を返却します<br>
			     * ゼンリン住宅地図から住所情報を取得できない場合は住所データベースでの住所検索をおこないます
			     * @param {object} position - {"lat":緯度(-90以上90以下),"lon":経度(-180以上180以下)}
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     *   value { : 住所情報オブジェクト
			     *     <検索個所に住宅図形がある場合>
			     *     "address" {string} : 取得した住所文字列
			     *     "pref" {string} : 都道府県
			     *     "cwtv" {string} : 市区町村
			     *     "major" {string} : 大字
			     *     "minor" {string} : 小字
			     *     "parcel" {string} : 街区
			     *     "plot" {string} : 地番・番地
			     *     "wkt" {string} : 住宅図形のwkt文字列
			     *     "step" {string} : 対象が見つかるまでにかかった検索のステップ数
			     *     "code" {string} : 住所コード　都道府県コード(ゼロ埋め2桁)+市区町村コード(ゼロ埋め3桁)+大字コード(ゼロ埋め3桁)+字丁目コード(ゼロ埋め3桁)　(例)27107005003
			     *
			     *     <住宅図形がなく住所データベースで検索した場合>
			     *     "address" {string} : 取得した住所文字列
			     *     "matchLevel" {string} : 検索結果のマッチレベル
			     *
			     *   }
			     * </pre>
			     *
			     * @export
			     */
			    getAddressFromPosition: function(position, callback) { this._call("getAddressFromPosition", arguments); },

			    /**
			     * ポイントアイテムの位置変更 対象ポイントアイテムを取得し、図形を指定座標に変更します
			     * @param {object} position - {"lat":緯度(-90以上90以下),"lon":経度(-180以上180以下)}
			     * @param {string} layerId - 対象レイヤノードのID
			     * @param {string} itemId - 対象アイテムのID
			     * @param {function} callback -  [処理実行後コールバック]
			     *
			     * <pre>
			     * コールバック引数オブジェクト
			     *   methodName {string} : 実行メソッド名
			     *   result {string} : 実行結果("success":正常終了 "error":異常終了)
			     *   message {string} : エラーメッセージ ※エラー時のみ
			     *   stack {string} : スタックトレース ※エラー時のみ
			     * </pre>
			     *
			     * @export
			     */
			    setItemPosition: function(position, layerId, itemId, callback) { this._call("setItemPosition", arguments); }

    };

    //==============================================
    // static functions
    //==============================================
    /**
     * ユニークなIdを作成する。
     * addListenerでリスナ設定するときに使用する
     *
     * @return {String} uuid
     * @static
     * @name IfxApiFacadePostUtil.createUuid
     * @function
     * @see IfxApiFacadePostUtil#addListener
     */
    ifxApiFacadePostUtil.createUuid = function() {
        var uuid = "",
            i, random;
        for(i = 0; i < 32; i++) {
            random = Math.random() * 16 | 0;

            if(i === 8 || i === 12 || i === 16 || i === 20) {
                uuid += "-";
            }
            uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
        }
        return uuid;
    };

    /**
     * 
     * @param {*} str 
     * @returns {boolean} JSON文字列かどうか
     * @ignore
     * @name IfxApiFacadePostUtil.isJson
     * @static
     * @function
     */
    ifxApiFacadePostUtil.isJson = function(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return isNaN(str);
    };

    /**
     * リザルト用のオブジェクトを作成します
     * PostUtilityJSBaseFacadeSalesforceUtilにて内部的に使用
     * @param {string} methodName - 実行メソッド名
     * @param {boolean} result - 成否
     * @param {string} message - 独自メッセージ
     * @param {object} error - エラーオブジェクト
     * @param {object} value - 戻り値
     * @ignore
     * @name IfxApiFacadePostUtil.createReturnObj
     * @static
     * @function
     */
    ifxApiFacadePostUtil.createReturnObj = function(methodName, result, message, error, value) {

        var ret = {};
        if(methodName === null) {
            methodName = "methodName_IS_UNKNOWN";
        }
        ret.methodName = methodName;
        ret.result = result === true ? "success" : "error";

        if(message !== null && message !== undefined) {
            ret.message = message;
        }

        //エラー内容
        if(error !== null && error !== undefined) {
            if(error.stack !== null && error.stack !== undefined) {
                ret.stack = error.stack;
            } else if(error.message !== null && error.message !== undefined) {
                ret.stack = error.message;
            } else {
                ret.stack = error;
            }
        }

        if(value !== null && value !== undefined) {
            ret.value = value;
        }
        return ret;
    };

    (function() {
        // jshint -W121
        // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
        if(!String.prototype.endsWith) {
            String.prototype.endsWith = function(search, this_len) {
                if(this_len === undefined || this_len > this.length) {
                    this_len = this.length;
                }
                return this.substring(this_len - search.length, this_len) === search;
            };
        }

        // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
        if(!String.prototype.startsWith) {
            String.prototype.startsWith = function(search, rawPos) {
                var pos = rawPos > 0 ? rawPos | 0 : 0;
                return this.substring(pos, pos + search.length) === search;
            };
        }
    })();
    window.ifxApiFacadePostUtil = ifxApiFacadePostUtil;
    window.IfxApiFacadePostUtil = ifxApiFacadePostUtil;
})();