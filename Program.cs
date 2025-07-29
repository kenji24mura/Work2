/*
 * TableSetupCmd
 * スケジューラにより実行される。
 * 中間テーブルを作成する。
 * 
 */
using com;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TableSetupCmd
{
    class Program
    {
        static string CONN_STRING_WEBGIS = System.Configuration.ConfigurationManager.AppSettings["CONN_STRING_WEBGIS"];
        static string CONN_STRING_DAMS = System.Configuration.ConfigurationManager.AppSettings["CONN_STRING_DAMS"];
        static string CONN_STRING_KEIBO = System.Configuration.ConfigurationManager.AppSettings["CONN_STRING_KEIBO"];
        static string CONN_STRING_DAMS_T = System.Configuration.ConfigurationManager.AppSettings["CONN_STRING_DAMS_T"];
        public static String DATA_PATH = System.Configuration.ConfigurationManager.AppSettings["DATA_PATH"];

        static Log lg = new Log();

        static OracleConnection gis_conn;

        static void Main(string[] args)
        {
            lg.LOGFNAME = DATA_PATH + "\\log\\TableSetupCmd.log";
            lg.loglimit = 1000000;
            lg.logmax = 10;

            string LogDir = DATA_PATH + "\\log";

            if (Directory.Exists(LogDir) == false)
            {
                Directory.CreateDirectory(LogDir);
            }

            if (args.Length > 0)
            {
                MsgOut("◆◆◆" + args[0] + "START");
            }
            else
            {
                MsgOut("args error");
            }

            gis_conn = new OracleConnection();

            try
            {
                gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                gis_conn.Open();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }



            //災害点
            if (args[0] == "TBSK0001")
            {
                int range = 0;
                if (args.Length >= 2)
                {
                    range = Int32.Parse(args[1]);
                }
                ReadDB_TBSK0001(range, 0);
            }
            //災害点（訓練用）
            if (args[0] == "TBSK0001_T")
            {
                int range = 0;
                if (args.Length >= 2)
                {
                    range = Int32.Parse(args[1]);
                }
                ReadDB_TBSK0001(range, 1);
            }
            //車両
            if (args[0] == "TBMP0200")
            {


                ReadDB_TBMP0200(0);
                int range = 0;
                if (args.Length >= 2)
                {
                    range = Int32.Parse(args[1]);
                }


            }
            //車両（訓練用）
            if (args[0] == "TBMP0200_T")
            {
                ReadDB_TBMP0200(1);
            }
            //水利
            if (args[0] == "TBJS0100")
            {
                ReadDB_TBJS0100();
            }
            //病院
            if (args[0] == "TBDS7100")
            {
                ReadDB_TBDS7100();
            }
            //福祉施設
            if (args[0] == "TBDS2200")
            {
                //                DelData2("n@5-1", 1502);
                ReadDB_TBDS2200();
            }
            //現場画像（写真）
            if (args[0] == "TBSK0901")
            {
                ReadDB_TBSK0901();
            }
            //街区
            if (args[0] == "TBDS0500")
            {
                ReadDB_TBDS0500();//n@8-1
            }
            //対象物
            if (args[0] == "TBDS1230")
            {
                ReadDB_TBDS1230();//n@6-1
            }

            //ENWA映像
            if (args[0] == "TBWG0010")
            {
                ReadDB_TBWG0010();//n@14-1 2417
            }
            //TBDS1900 高圧ガス施設
            if (args[0] == "TBDS1900")
            {
                ReadDB_TBDS1900();
            }
            //TBDS2000 毒劇物施設
            if (args[0] == "TBDS2000")
            {
                ReadDB_TBDS2000();
            }
            //TBDS2100 R1施設
            if (args[0] == "TBDS2100")
            {
                ReadDB_TBDS2100();
            }
            //TBDS2300 その他施設
            if (args[0] == "TBDS2300")
            {
                ReadDB_TBDS2300();
            }
            //TBDS4100 高速道路（出入口）
            if (args[0] == "TBDS4100")
            {
                ReadDB_TBDS4100();
            }
            //TBDS4200 高速道路（キロポスト）
            if (args[0] == "TBDS4200")
            {
                ReadDB_TBDS4200();
            }


            if (args[0] == "hospital")
            {
                Read_hospital();
            }

            try
            {
                gis_conn.Close();
                gis_conn.Dispose();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }


            MsgOut("◆◆◆" + args[0] + "END");
        }


        static private void Read_hospital()
        {
            int SYMBOL_ID = 9999;

            DelData2("n@19-1", SYMBOL_ID);

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            int cnt = 0;


            string fname = "F:\\setup\\data\\hospital.csv";

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                //  gis_conn.Open();


                try
                {
                    StreamReader sr = new StreamReader(
                          fname, Encoding.GetEncoding("UTF-8"));

                    while (sr.Peek() > -1)
                    {
                        string line = sr.ReadLine();

                        string[] param = line.Split(',');

                        //316,[医療機関名: ＪＡ新潟厚生連糸魚川総合病院][都道府県名: 新潟県][郡名: ][市町村名: 糸魚川市][住所: 糸魚川市竹ケ花４５７番地１][災害拠点病院指定: 有][二次医療圏: 上越][支援要否: -][医療派遣ステータス: -][更新日時: 2024/01/10 06:10:27][緊急時入力: ][施設の倒壊・倒壊の恐れ/入院病棟: 無][ライフライン・サプライ状況: ][現在の患者数状況/実働病床数: ][現在の患者数状況/受入患者数/重症: ][現在の患者数状況/受入患者数/中等症: ][その他: ][iconUrl: https://www.sip-bousai.jp/image/hospital/hospital_base_blue.png],Point,1,2,137.888994,37.04877

                        string info = param[1];

                        info = info.Replace("][", ",");
                        info = info.Replace("]", "");
                        info = info.Replace("[", "");

                        string[] info_param = info.Split(',');

                        if (info_param[1].IndexOf("大阪府") > 0)
                        {
                            zahyo_x = 0.0;
                            zahyo_y = 0.0;

                            try
                            {
                                zahyo_x = Double.Parse(param[5]);
                                zahyo_y = Double.Parse(param[6]);
                            }
                            catch (Exception ex)
                            {

                            }

                            cnt++;


                            lay_no = "n@19-1";
                            symbol_no = 9999;
                            info_type = 19;

                            item_no = cnt.ToString();
                            info_summery = "";

                            info_summery += "{";
                            info_summery += "\"受付日\":";
                            info_summery += "\"";
                            info_summery += "\"";
                            info_summery += ",\"連番\":";
                            info_summery += "\"";
                            info_summery += "\"";
                            info_summery += ",\"処理区分\":";
                            info_summery += "\"";
                            info_summery += "\"";

                            info_summery += ",\"備考\":";

                            info_summery += "\"";
                            info_summery += "病院コード:";
                            info_summery += param[0];
                            info_summery += ",府医療病院コード:";
                            info_summery += "";
                            info_summery += ",名前:";
                            info_summery += info_param[0].Replace("医療機関名: ", "");
                            info_summery += "\"";

                            info_summery += "}";
                            lay_type = 1;

                            strinfo1 = "";
                            strinfo2 = "";
                            strinfo3 = "";
                            str_zahyo_x = 0.0;
                            str_zahyo_y = 0.0;

                            item_no = info_type.ToString("D2");
                            item_no += symbol_no.ToString("D4");
                            item_no += cnt.ToString("D6");

                            AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);
                        }


                    }
                    sr.Close();

                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex);
                }

                //gis_conn.Close();
                //gis_conn.Dispose();
                //}
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }


        }


        static private void ReadDB_TBWG0010()
        {
            int SYMBOL_ID = 2417;

            DelData2("n@14-1", SYMBOL_ID);

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            //string sqlStr = "select T1.*,T2.CARNUM from TBWG0010 T1 INNER JOIN TBWG0011 T2 ON T1.PUBLISHER_ID = T2.PUBLISHER_ID";


            string sqlStr = "select T1.*,T2.CAR_MANEGE_CODE from WEBGIS.TBWG0010 T1 LEFT OUTER JOIN DAMS.VWJR0120 T2 ON T1.PUBLISHER_ID = T2.STREAM_ID";
            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                   // gis_conn.Open();

                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_DAMS;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    //status がpublishingのものに限定したい


                                    String publisher_id = reader["publisher_id"].ToString();
                                    String publisher_name = reader["publisher_name"].ToString();
                                    String broadcast_name = reader["broadcast_name"].ToString();
                                    String publish_status = reader["publish_status"].ToString();
                                    String izahyo_x = reader["zahyo_x"].ToString();
                                    String izahyo_y = reader["zahyo_y"].ToString();
                                    String carnum = reader["CAR_MANEGE_CODE"].ToString();


                                    if (publish_status.IndexOf("publishing") == 0)
                                    {
                                        MsgOut(publisher_id);

                                        zahyo_x = 0.0;
                                        zahyo_y = 0.0;

                                        try
                                        {
                                            zahyo_x = Double.Parse(izahyo_x);
                                            zahyo_y = Double.Parse(izahyo_y);
                                        }
                                        catch (Exception ex)
                                        {

                                        }

                                        cnt++;

                                        lay_no = "n@14-1";
                                        item_no = cnt.ToString();
                                        info_type = 14;
                                        info_summery = "";

                                        info_summery += "{";
                                        info_summery += "\"現場画像ID\":";
                                        info_summery += "\"";
                                        info_summery += publisher_id;
                                        info_summery += "\"";
                                        info_summery += ",\"リンクファイル１\":";
                                        info_summery += "\"";
                                        info_summery += "";
                                        info_summery += "\"";
                                        info_summery += ",\"リンクファイル２\":";
                                        info_summery += "\"";
                                        info_summery += "";
                                        info_summery += "\"";
                                        info_summery += ",\"リンクファイル３\":";
                                        info_summery += "\"";
                                        info_summery += "";
                                        info_summery += "\"";
                                        info_summery += ",\"リンクファイル４\":";
                                        info_summery += "\"";
                                        info_summery += "";
                                        info_summery += "\"";
                                        info_summery += ",\"備考\":";
                                        info_summery += "\"";
                                        info_summery += "メモ:" + broadcast_name;
                                        info_summery += ",名称:" + broadcast_name;
                                        info_summery += "\"";
                                        info_summery += "}";

                                        lay_type = 1;
                                        symbol_no = 2417;


                                        strinfo1 = "";
                                        strinfo2 = "";
                                        strinfo3 = "";
                                        str_zahyo_x = 0.0;
                                        str_zahyo_y = 0.0;

                                        item_no = info_type.ToString("D2");
                                        item_no += symbol_no.ToString("D4");
                                        item_no += cnt.ToString("D6");

                                        AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);
                                    }

                                }
                            }
                        }
                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

                //    gis_conn.Close();
                //    gis_conn.Dispose();
                //}
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }


        }

        //--------------------------------------------------------------------------
        //　　災害点
        //--------------------------------------------------------------------------


        static int GetRange(int mode)
        {
            int ret = 0;
            string sqlStr = "select * from TBSK1101 WHERE SETTING_ID=19 AND SETTING_SUB_ID=1";

            try
            {
                //コネクションを生成する
                using (OracleConnection conn = new OracleConnection())
                {
                    //コネクションを取得する
                    if (mode == 0)
                    {
                        conn.ConnectionString = CONN_STRING_DAMS;
                    }
                    else
                    {
                        conn.ConnectionString = CONN_STRING_DAMS_T;
                    }
                    conn.Open();

                    //コマンドを生成する
                    using (OracleCommand command = new OracleCommand(sqlStr))
                    {
                        command.Connection = conn;
                        command.CommandType = CommandType.Text;

                        //コマンドを実行する
                        using (OracleDataReader reader = command.ExecuteReader())
                        {
                            //検索結果が存在する間ループする
                            while (reader.Read())
                            {
                                String Range = reader["SETTING_VALUE"].ToString();

                                ret = Int32.Parse(Range);

                            }
                        }
                    }

                    //コネクションを切断する
                    conn.Close();

                    //コネクションを破棄する
                    conn.Dispose();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
            return ret;
        }


        static private void ReadDB_TBSK0001(int range, int mode)
        {
            if (mode == 0)
            {
                DelData3("n@1-1", 1);
            }
            else
            {
                DelData3("n@12-1", 12);
                DelData3("n@32-1", 32);
            }


            //string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;


            //            int range = Int32.Parse(textBox1.Text);

            if (range == 0)
            {
                range = GetRange(mode);
            }


            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(range, 0, 0, 0);

            //:            DateTime result = dt-sp1;
            //            string sqlStr = "select * from V_TBSK0001 WHERE UPD_DATE > '" + result + "') ";
            //            string sqlStr = "select * from V_TBSK0001";
            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            string sqlStr = "select * from V_TBSK0001 WHERE UKE_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            sqlStr += " AND STATUS <> 3";//条件追加　20230903


            //V_TBSK0001テーブルのSTATUS（対応状況）カラムが3以外のものを表示

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                  //  gis_conn.Open();
                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        if (mode == 0)
                        {
                            conn.ConnectionString = CONN_STRING_DAMS;
                        }
                        else
                        {
                            conn.ConnectionString = CONN_STRING_DAMS_T;
                        }
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String JISIKI = reader["JISIKI"].ToString();
                                    String SAISYU = reader["SAISYU"].ToString();
                                    String SAISYUNM = reader["SAISYUNM"].ToString();
                                    String KOSINDT = reader["KOSINDT"].ToString();
                                    String SIREBUNNM = reader["SIREBUNNM"].ToString();
                                    String X_LOCATE = reader["X_LOCATE"].ToString();
                                    String Y_LOCATE = reader["Y_LOCATE"].ToString();
                                    String UPD_DATE = reader["UPD_DATE"].ToString();
                                    //訓練区分処理追加　20230903
                                    String KUNRENKB = reader["KUNRENKB"].ToString();
                                    //20240501
                                    String SAIGAI_NO = reader["SAIGAI_NO"].ToString();
                                    //20240528
                                    String ADSNM = reader["ADSNM"].ToString();



                                    MsgOut(JISIKI + "," + UPD_DATE);

                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    //訓練区分処理追加　20230903
                                    int kunrenkb = Int32.Parse(KUNRENKB);

                                    try
                                    {
                                        lx = Double.Parse(X_LOCATE);
                                        ly = Double.Parse(Y_LOCATE);
                                    }
                                    catch (Exception ex)
                                    {
                                        Console.WriteLine(ex);
                                    }

                                    //                                lx = -45237600;
                                    //                                ly = -150372500;

                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;

                                    //正規化座標(m)→経緯度（日本）(秒）
                                    cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                    //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                    cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    cnt++;

                                    if (mode == 0)
                                    {
                                        lay_no = "n@1-1";
                                        info_type = 1;
                                    }
                                    else
                                    {
                                        //lay_no = "n@12-1";
                                        //info_type = 12;
                                    lay_no = "n@32-1";
                                    info_type = 32;
                                }
                                item_no = cnt.ToString();
                                    info_summery = "";


                                    info_summery += "{";
                                    info_summery += "\"事案識別子\":";
                                    info_summery += "\"";
                                    info_summery += JISIKI;
                                    info_summery += "\"";
                                    info_summery += ",\"発生日時\":";
                                    info_summery += "\"";
                                    info_summery += KOSINDT;
                                    info_summery += "\"";
                                    info_summery += ",\"対応状況\":";
                                    info_summery += "\"";
                                    info_summery += "\"";
                                    info_summery += ",\"災害種別コード\":";
                                    info_summery += "\"";
                                    info_summery += SAISYUNM;
                                    info_summery += "\"";
                                    info_summery += ",\"災害分類コード\":";
                                    info_summery += "\"";
                                    info_summery += SIREBUNNM;
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "災害番号:";

                                    //20240528

                                    if (SAIGAI_NO.Length > 4)
                                    {
                                        info_summery += SAIGAI_NO.Substring(SAIGAI_NO.Length - 4);
                                    }
                                    else
                                    {
                                        info_summery += SAIGAI_NO;
                                    }

                                    //20240528
                                    info_summery += ",災害点:";

                                    if (ADSNM.Length > 0)
                                    {
                                        info_summery += "(";
                                        info_summery += ADSNM;
                                        info_summery += ")";
                                    }
                                    info_summery += "\"";
                                    info_summery += "}";


                                    lay_type = 1;
                                    symbol_no = 1008;

                                    if (SAISYUNM != "")
                                    {

                                        if (SAISYUNM.IndexOf("火　災") == 0)
                                        {
                                            symbol_no = 1002;
                                        }
                                        if (SAISYUNM.IndexOf("救　急") == 0)
                                        {
                                            symbol_no = 1003;
                                        }
                                        if (SAISYUNM.IndexOf("救　助") == 0)
                                        {
                                            symbol_no = 1004;
                                        }
                                        if (SAISYUNM.IndexOf("救　護") == 0)
                                        {
                                            symbol_no = 1005;
                                        }
                                    }
                                    //訓練区分処理追加　20230903
                                    if (kunrenkb == 1)
                                    {
                                        //訓練区分処理追加　20230903
                                        //symbol_no = 1017;
                                        symbol_no = 1007;
                                    }

                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = "";
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");


                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

                    //gis_conn.Close();
                    //gis_conn.Dispose();
                //}
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }

        }
        //--------------------------------------------------------------------------
        //　　災害点（訓練用）
        //--------------------------------------------------------------------------
        /*
        static private void ReadDB_TBSK0001_T(int range)
        {

            DelData3("n@12-1", 1);
//            DelData3("n@1-1", 13);

            //string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;


            //            int range = Int32.Parse(textBox1.Text);

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(range, 0, 0, 0);

            //:            DateTime result = dt-sp1;
            //            string sqlStr = "select * from V_TBSK0001 WHERE UPD_DATE > '" + result + "') ";
            //            string sqlStr = "select * from V_TBSK0001";
            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            string sqlStr = "select * from V_TBSK0001 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            sqlStr += " AND STATUS <> 3";//条件追加　20230903


            //V_TBSK0001テーブルのSTATUS（対応状況）カラムが3以外のものを表示

            int cnt = 0;

            try
            {
                using (OracleConnection gis_conn = new OracleConnection())
                {
                    gis_conn.ConnectionString = CONN_STRING;
                    gis_conn.Open();
                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING2_DAMS_T;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String JISIKI = reader["JISIKI"].ToString();
                                    String SAISYU = reader["SAISYU"].ToString();
                                    String SAISYUNM = reader["SAISYUNM"].ToString();
                                    String KOSINDT = reader["KOSINDT"].ToString();
                                    String SIREBUNNM = reader["SIREBUNNM"].ToString();
                                    String X_LOCATE = reader["X_LOCATE"].ToString();
                                    String Y_LOCATE = reader["Y_LOCATE"].ToString();
                                    String UPD_DATE = reader["UPD_DATE"].ToString();
                                    //訓練区分処理追加　20230903
                                    String KUNRENKB = reader["KUNRENKB"].ToString();

                                    MsgOut(JISIKI + "," + UPD_DATE);

                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    //訓練区分処理追加　20230903
                                    int kunrenkb = Int32.Parse(KUNRENKB);

                                    try
                                    {
                                        lx = Double.Parse(X_LOCATE);
                                        ly = Double.Parse(Y_LOCATE);
                                    }
                                    catch (Exception ex)
                                    {
                                        Console.WriteLine(ex);
                                    }

                                    //                                lx = -45237600;
                                    //                                ly = -150372500;

                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;

                                    //正規化座標(m)→経緯度（日本）(秒）
                                    cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                    //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                    cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    cnt++;

                                    lay_no = "n@12-1";
                                    item_no = cnt.ToString();
                                    info_type = 1;
                                    info_summery = "";


                                    info_summery += "{";
                                    info_summery += "\"事案識別子\":";
                                    info_summery += "\"";
                                    info_summery += JISIKI;
                                    info_summery += "\"";
                                    info_summery += ",\"発生日時\":";
                                    info_summery += "\"";
                                    info_summery += KOSINDT;
                                    info_summery += "\"";
                                    info_summery += ",\"対応状況\":";
                                    info_summery += "\"";
                                    info_summery += "\"";
                                    info_summery += ",\"災害種別コード\":";
                                    info_summery += "\"";
                                    info_summery += SAISYUNM;
                                    info_summery += "\"";
                                    info_summery += ",\"災害分類コード\":";
                                    info_summery += "\"";
                                    info_summery += SIREBUNNM;
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += "}";


                                    lay_type = 1;
                                    symbol_no = 1008;

                                    if (SAISYUNM != "")
                                    {

                                        if (SAISYUNM.IndexOf("火　災") == 0)
                                        {
                                            symbol_no = 1002;
                                        }
                                        if (SAISYUNM.IndexOf("救　急") == 0)
                                        {
                                            symbol_no = 1003;
                                        }
                                        if (SAISYUNM.IndexOf("救　助") == 0)
                                        {
                                            symbol_no = 1004;
                                        }
                                        if (SAISYUNM.IndexOf("救　護") == 0)
                                        {
                                            symbol_no = 1005;
                                        }
                                    }
                                    //訓練区分処理追加　20230903
                                    if (kunrenkb == 1)
                                    {
                                        //訓練区分処理追加　20230903
                                        //symbol_no = 1017;
                                        symbol_no = 1007;
                                    }

                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = "";
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");


                                    AddData(gis_conn,lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

                    gis_conn.Close();
                    gis_conn.Dispose();
                }

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }

        }
        */
        //--------------------------------------------------------------------------
        //　　車両
        //--------------------------------------------------------------------------
        static private void ReadDB_TBMP0200(int mode)
        {
            if (mode == 0)
            {
                DelData3("n@10-1", 10);
            }
            else
            {
                DelData3("n@13-1", 13);
                DelData3("n@33-1", 33);
            }

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            //DateTime dt = DateTime.Now;
            //TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            //string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
//            string sqlStr = "select * from SIREI.TBMP0200";
            string sqlStr = "select * from TBMP0200";

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                   // gis_conn.Open();

                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        if (mode == 0)
                        {
                            conn.ConnectionString = CONN_STRING_DAMS;
                        }
                        else
                        {
                            conn.ConnectionString = CONN_STRING_DAMS_T;
                        }
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {

                                    String KANRISHARYO_CD = reader["KANRISHARYO_CD"].ToString();
                                    String SHARYO_CD = reader["SHARYO_CD"].ToString();
                                    String HOUKO = reader["HOUKO"].ToString();
                                    String DOTAI_KIHON_CD = reader["DOTAI_KIHON_CD"].ToString();
                                    String DOTAI_SYOSAI_CD = reader["DOTAI_SYOSAI_CD"].ToString();
                                    String ITI_ZAHYO_X = reader["ITI_ZAHYO_X"].ToString();
                                    String ITI_ZAHYO_Y = reader["ITI_ZAHYO_Y"].ToString();

                                    MsgOut(KANRISHARYO_CD);

                                    //動態コード
                                    int status = 0;

                                    status = Int32.Parse(DOTAI_KIHON_CD) * 100 + Int32.Parse(DOTAI_SYOSAI_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    if (ITI_ZAHYO_X.Length < 10 || ITI_ZAHYO_Y.Length < 10)
                                    {
                                        lx = Double.Parse(ITI_ZAHYO_X);
                                        ly = Double.Parse(ITI_ZAHYO_Y);

                                        //lx = -45237600;
                                        //ly = -150372500;

                                        int kijyunkei = 6;
                                        double m_keido = 0.0;
                                        double m_ido = 0.0;
                                        long m_keido_w = 0;
                                        long m_ido_w = 0;

                                        //正規化座標(m)→経緯度（日本）(秒）
                                        cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                        //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                        cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);
                                        zahyo_x = (double)m_keido_w / (3600 * 1000);
                                        zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    }
                                    else
                                    {
                                        zahyo_x = 0.0;
                                        zahyo_y = 0.0;
                                    }


                                    cnt++;


                                    if (mode == 0)
                                    {
                                        lay_no = "n@10-1";
                                        info_type = 10;
                                    }
                                    else
                                    {
                                        //lay_no = "n@13-1";
                                        //info_type = 13;
                                    lay_no = "n@33-1";
                                    info_type = 33;
                                }

                                item_no = cnt.ToString();
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"車両コード\":";
                                    info_summery += "\"";
                                    info_summery += KANRISHARYO_CD;
                                    info_summery += "\"";

                                    info_summery += ",\"車両動態\":";
                                    info_summery += "\"";
                                    info_summery += status.ToString("D4");
                                    info_summery += "\"";

                                    info_summery += ",\"方向\":";
                                    info_summery += "\"";
                                    info_summery += HOUKO;
                                    info_summery += "\"";

                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "車両名称:";
                                    info_summery += SHARYO_CD;
                                    info_summery += "\"";

                                    info_summery += "}";

                                    lay_type = 1;
                                    symbol_no = 1801;

                                    //待機
                                    if (status >= 100 && status <= 199)
                                    {
                                        symbol_no = 1801;
                                    }
                                    //災害出場
                                    if (status == 301)
                                    {
                                        symbol_no = 1802;
                                    }
                                    //緊急配備
                                    if (status == 304)
                                    {
                                        symbol_no = 1802;
                                    }
                                    //現場到着
                                    if (status == 306)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //緊配到着
                                    if (status == 305)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //搬送開始
                                    if (status == 307)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //転送
                                    if (status == 308)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //病院到着
                                    if (status == 309)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //院内待機
                                    if (status == 310)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //転進可能
                                    if (status == 311)
                                    {
                                        symbol_no = 1804;
                                    }
                                    //現場引き上げ
                                    if (status == 303)
                                    {
                                        symbol_no = 1805;
                                    }
                                    //病院引き上げ
                                    if (status == 302)
                                    {
                                        symbol_no = 1805;
                                    }
                                    //署外活動
                                    if (status >= 200 && status <= 299)
                                    {
                                        symbol_no = 1806;
                                    }
                                    //運用不能
                                    if (status >= 400 && status <= 499)
                                    {
                                        symbol_no = 1807;
                                    }

                                    //                                strinfo1 = KANRISHARYO_CD;
                                    strinfo1 = SHARYO_CD;
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                    //
                                    //DAMS DBを更新する
                                    //
                                    DateTime dt = DateTime.Now;


                                    if (mode == 0)//通常の時のみ 2024/08/28
                                    {
                                        try
                                        {
                                            UpdateDAMSTable(Int32.Parse(KANRISHARYO_CD), Int32.Parse(DOTAI_KIHON_CD), Int32.Parse(DOTAI_SYOSAI_CD), Int32.Parse(ITI_ZAHYO_X), Int32.Parse(ITI_ZAHYO_Y), dt);
                                        }
                                        catch (Exception ex)
                                        {

                                        }
                                    }
                                }
                            }
                        }
                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }
//                    gis_conn.Close();
  //                  gis_conn.Dispose();
    //            }

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }

        }
        //--------------------------------------------------------------------------
        //　　車両（訓練用）
        //--------------------------------------------------------------------------
        /*
        static private void ReadDB_TBMP0200_T()
        {
            DelData3("n@10-1", 12);
            DelData3("n@10-1", 13);

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            //DateTime dt = DateTime.Now;
            //TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            //string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            string sqlStr = "select * from SIREI.TBMP0200";

            int cnt = 0;

            try
            {
                using (OracleConnection gis_conn = new OracleConnection())
                {
                    gis_conn.ConnectionString = CONN_STRING;
                    gis_conn.Open();
                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING2_DAMS_T;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {

                                    String KANRISHARYO_CD = reader["KANRISHARYO_CD"].ToString();
                                    String SHARYO_CD = reader["SHARYO_CD"].ToString();
                                    String HOUKO = reader["HOUKO"].ToString();
                                    String DOTAI_KIHON_CD = reader["DOTAI_KIHON_CD"].ToString();
                                    String DOTAI_SYOSAI_CD = reader["DOTAI_SYOSAI_CD"].ToString();
                                    String ITI_ZAHYO_X = reader["ITI_ZAHYO_X"].ToString();
                                    String ITI_ZAHYO_Y = reader["ITI_ZAHYO_Y"].ToString();

                                    MsgOut(KANRISHARYO_CD);

                                    //動態コード
                                    int status = 0;

                                    status = Int32.Parse(DOTAI_KIHON_CD) * 100 + Int32.Parse(DOTAI_SYOSAI_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    if (ITI_ZAHYO_X.Length < 10 || ITI_ZAHYO_Y.Length < 10)
                                    {
                                        lx = Double.Parse(ITI_ZAHYO_X);
                                        ly = Double.Parse(ITI_ZAHYO_Y);

                                        //lx = -45237600;
                                        //ly = -150372500;

                                        int kijyunkei = 6;
                                        double m_keido = 0.0;
                                        double m_ido = 0.0;
                                        long m_keido_w = 0;
                                        long m_ido_w = 0;

                                        //正規化座標(m)→経緯度（日本）(秒）
                                        cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                        //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                        cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);
                                        zahyo_x = (double)m_keido_w / (3600 * 1000);
                                        zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    }
                                    else
                                    {
                                        zahyo_x = 0.0;
                                        zahyo_y = 0.0;
                                    }


                                    cnt++;

                                    lay_no = "n@10-1";
                                    item_no = cnt.ToString();
                                    info_type = 13;
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"車両コード\":";
                                    info_summery += "\"";
                                    info_summery += KANRISHARYO_CD;
                                    info_summery += "\"";

                                    info_summery += ",\"車両動態\":";
                                    info_summery += "\"";
                                    info_summery += status.ToString("D4");
                                    info_summery += "\"";

                                    info_summery += ",\"方向\":";
                                    info_summery += "\"";
                                    info_summery += HOUKO;
                                    info_summery += "\"";

                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";

                                    info_summery += "}";

                                    lay_type = 1;
                                    symbol_no = 1801;

                                    //待機
                                    if (status >= 100 && status <= 199)
                                    {
                                        symbol_no = 1801;
                                    }
                                    //災害出場
                                    if (status == 301)
                                    {
                                        symbol_no = 1802;
                                    }
                                    //緊急配備
                                    if (status == 304)
                                    {
                                        symbol_no = 1802;
                                    }
                                    //現場到着
                                    if (status == 306)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //緊配到着
                                    if (status == 305)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //搬送開始
                                    if (status == 307)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //転送
                                    if (status == 308)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //病院到着
                                    if (status == 309)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //院内待機
                                    if (status == 310)
                                    {
                                        symbol_no = 1803;
                                    }
                                    //転進可能
                                    if (status == 311)
                                    {
                                        symbol_no = 1804;
                                    }
                                    //現場引き上げ
                                    if (status == 303)
                                    {
                                        symbol_no = 1805;
                                    }
                                    //病院引き上げ
                                    if (status == 302)
                                    {
                                        symbol_no = 1805;
                                    }
                                    //署外活動
                                    if (status >= 200 && status <= 299)
                                    {
                                        symbol_no = 1806;
                                    }
                                    //運用不能
                                    if (status >= 400 && status <= 499)
                                    {
                                        symbol_no = 1807;
                                    }

                                    //                                strinfo1 = KANRISHARYO_CD;
                                    strinfo1 = SHARYO_CD;
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn,lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                    //
                                    //DAMS DBを更新する
                                    //
                                    DateTime dt = DateTime.Now;


                                    try
                                    {
                                        UpdateDAMSTable_T(Int32.Parse(KANRISHARYO_CD), Int32.Parse(DOTAI_KIHON_CD), Int32.Parse(DOTAI_SYOSAI_CD), Int32.Parse(ITI_ZAHYO_X), Int32.Parse(ITI_ZAHYO_Y), dt);
                                    }
                                    catch (Exception ex)
                                    {

                                    }
                                }
                            }
                        }
                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

                    gis_conn.Close();
                    gis_conn.Dispose();
                }

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }

        }
        */
        //--------------------------------------------------------------------------
        //　　DAMS車両テーブル更新
        //--------------------------------------------------------------------------
        static private void UpdateDAMSTable(int KANRISHARYO_CD, int DOTAI_KIHON_CD, int DOTAI_SYOSAI_CD, int ITI_ZAHYO_X, int ITI_ZAHYO_Y, DateTime UPD_DATE)
        {
            try
            {
                string sql = "update TBSK0022　set ZAHYO_X=:ZAHYO_X,ZAHYO_Y=:ZAHYO_Y,DOUTAI_KIHON=:DOUTAI_KIHON,DOUTAI_SYOSAI=:DOUTAI_SYOSAI,UPD_DATE=:UPD_DATE";
                sql += " WHERE SHARYO_CD=:SHARYO_CD";

                using (OracleConnection conn = new OracleConnection())
                {
                    conn.ConnectionString = CONN_STRING_DAMS;
                    conn.Open();
                    using (OracleTransaction transaction = conn.BeginTransaction())
                    {
                        try
                        {
                            using (OracleCommand cmd = new OracleCommand(sql, conn))
                            {
                                cmd.BindByName = true;
                                //
                                cmd.Parameters.Add(new OracleParameter(":SHARYO_CD", OracleDbType.Int32,
                                    KANRISHARYO_CD, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":ZAHYO_X", OracleDbType.Int32,
                                    ITI_ZAHYO_X, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":ZAHYO_Y", OracleDbType.Int32,
                                    ITI_ZAHYO_Y, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":DOUTAI_KIHON", OracleDbType.Int32,
                                    DOTAI_KIHON_CD, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":DOUTAI_SYOSAI", OracleDbType.Int32,
                                    DOTAI_SYOSAI_CD, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":UPD_DATE", OracleDbType.Date))
                                    .Value = UPD_DATE;

                                cmd.ExecuteNonQuery();

                                transaction.Commit();
                                MsgOut("UPDATE Commit!");
                            }
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            Console.WriteLine(ex.ToString());
                            MsgOut(ex.ToString());
                        }
                    }
                    //2024.01.09追加
                    //コネクションを切断する
                    conn.Close();
                    //コネクションを破棄する
                    conn.Dispose();

                }
            }
            catch (Exception ex)
            {
                MsgOut(ex.ToString());
                Console.WriteLine(ex.Message.ToString());
            }

        }
        //--------------------------------------------------------------------------
        //　　DAMS車両テーブル更新（訓練用）
        //--------------------------------------------------------------------------
        static private void UpdateDAMSTable_T(int KANRISHARYO_CD, int DOTAI_KIHON_CD, int DOTAI_SYOSAI_CD, int ITI_ZAHYO_X, int ITI_ZAHYO_Y, DateTime UPD_DATE)
        {
            try
            {
                string sql = "update TBSK0022　set ZAHYO_X=:ZAHYO_X,ZAHYO_Y=:ZAHYO_Y,DOUTAI_KIHON=:DOUTAI_KIHON,DOUTAI_SYOSAI=:DOUTAI_SYOSAI,UPD_DATE=:UPD_DATE";
                sql += " WHERE SHARYO_CD=:SHARYO_CD";

                using (OracleConnection conn = new OracleConnection())
                {
                    conn.ConnectionString = CONN_STRING_DAMS_T;
                    conn.Open();
                    using (OracleTransaction transaction = conn.BeginTransaction())
                    {
                        try
                        {
                            using (OracleCommand cmd = new OracleCommand(sql, conn))
                            {
                                cmd.BindByName = true;
                                //
                                cmd.Parameters.Add(new OracleParameter(":SHARYO_CD", OracleDbType.Int32,
                                    KANRISHARYO_CD, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":ZAHYO_X", OracleDbType.Int32,
                                    ITI_ZAHYO_X, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":ZAHYO_Y", OracleDbType.Int32,
                                    ITI_ZAHYO_Y, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":DOUTAI_KIHON", OracleDbType.Int32,
                                    DOTAI_KIHON_CD, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":DOUTAI_SYOSAI", OracleDbType.Int32,
                                    DOTAI_SYOSAI_CD, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":UPD_DATE", OracleDbType.Date))
                                    .Value = UPD_DATE;

                                cmd.ExecuteNonQuery();

                                transaction.Commit();
                                MsgOut("UPDATE Commit!");
                            }
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            Console.WriteLine(ex.ToString());
                            MsgOut(ex.ToString());
                        }
                    }
                    //2024.01.09追加
                    //コネクションを切断する
                    conn.Close();
                    //コネクションを破棄する
                    conn.Dispose();
                }
            }
            catch (Exception ex)
            {
                MsgOut(ex.ToString());
                Console.WriteLine(ex.Message.ToString());
            }

        }



        //--------------------------------------------------------------------------
        //　　水利
        //--------------------------------------------------------------------------
        static private void ReadDB_TBJS0100()
        {
            DelData("n@2-1");
            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(200, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            string sqlStr = "select * from TBJS0100 WHERE MAKE_KBN <> 'D'";

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                   // gis_conn.Open();
                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_KEIBO;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String SUIRI_CD = reader["SUIRI_CD"].ToString();
                                    String SUIRI_SBT = reader["SUIRI_SBT"].ToString();
                                    String SYMBOL_SBT = reader["SYMBOL_SBT"].ToString();
                                    String SHIYO_KAHI = reader["SHIYO_KAHI"].ToString();
                                    String HAIKAN_KOKEI = reader["HAIKAN_KOKEI"].ToString();
                                    String MOJI = reader["MOJI"].ToString();
                                    String IZAHYO_X = reader["IZAHYO_X"].ToString();
                                    String IZAHYO_Y = reader["IZAHYO_Y"].ToString();
                                    String FUKA = reader["FUKA"].ToString();

                                    //20240517 start
                                    if (FUKA.TrimEnd(' ').Length > 0)
                                    {
                                        MsgOut(SUIRI_CD);
                                        byte[] bytes = Encoding.Default.GetBytes(FUKA);
                                        string hexString = BitConverter.ToString(bytes);

                                        int idx1 = 0;
                                        int idx2 = 0;

                                        for (int i = 0; i < bytes.Length; i++)
                                        {
                                            if (bytes[i] == 0xf0)
                                            {
                                                idx1 = i;
                                            }
                                            if (idx1 > 0 && bytes[i] == 0x71)
                                            {
                                                idx2 = i;
                                                string target = "m3";
                                                byte[] target_bytes = Encoding.Default.GetBytes(target);

                                                bytes[idx1] = target_bytes[0];
                                                bytes[idx2] = target_bytes[1];
                                            }
                                        }

                                        //                                        MsgOut(FUKA+":"+hexString);

                                        FUKA = Encoding.GetEncoding("shift_jis").GetString(bytes);

                                    }
                                    //20240517 start

                                    MsgOut(SUIRI_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;
                                    try
                                    {
                                        lx = Double.Parse(IZAHYO_X);
                                        ly = Double.Parse(IZAHYO_Y);
                                    }
                                    catch (Exception ex)
                                    {
                                    }

                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;

                                    //正規化座標(m)→経緯度（日本）(秒）
                                    cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                    //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                    cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    cnt++;

                                    lay_no = "n@2-1";
                                    item_no = cnt.ToString();
                                    info_type = 2;
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"水利コード\":";
                                    info_summery += "\"";
                                    info_summery += SUIRI_CD;
                                    info_summery += "\"";
                                    info_summery += ",\"水利種別\":";
                                    info_summery += "\"";
                                    info_summery += SUIRI_SBT;
                                    info_summery += "\"";
                                    info_summery += ",\"配管口径\":";
                                    info_summery += "\"";
                                    info_summery += HAIKAN_KOKEI;
                                    info_summery += "\"";
                                    info_summery += ",\"部署台数\":";
                                    info_summery += "\"";
                                    info_summery += "0";
                                    info_summery += "\"";
                                    info_summery += ",\"使用可否\":";
                                    info_summery += "\"";
                                    info_summery += SHIYO_KAHI;
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    //20240502
                                    info_summery += "水利番号:";
                                    info_summery += MOJI;
                                    info_summery += "\"";
                                    info_summery += "}";

                                    lay_type = 1;

                                    if (Int32.Parse(SHIYO_KAHI) == 1)
                                    {
                                        symbol_no = Int32.Parse(SYMBOL_SBT) + 1150;
                                    }
                                    else
                                    {
                                        symbol_no = Int32.Parse(SYMBOL_SBT);
                                    }

                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = MOJI.Trim();
                                    strinfo2 = FUKA;
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

//                    gis_conn.Close();
  //                  gis_conn.Dispose();
    //            }

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }

        //--------------------------------------------------------------------------
        //　　病院
        //--------------------------------------------------------------------------
        static private void ReadDB_TBDS7100()
        {
            //災害拠点病院を検索

            string hosp_info = GetHospInfo();

            DelData2("n@5-1", 1501);
            DelData2("n@30-1", 1501);
            DelData2("n@19-1", 2203);
            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            string sqlStr = "select * from TBDS7100 ";

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                   // gis_conn.Open();
                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_DAMS;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String KEY_HOSP_CD = reader["KEY_HOSP_CD"].ToString();
                                    String TEIJI_FLG = reader["TEIJI_FLG"].ToString();
                                    String FU_MEDICAL_HOSP_CD = reader["FU_MEDICAL_HOSP_CD"].ToString();
                                    String HOSP_NAME = reader["HOSP_NAME"].ToString();

                                    //                                String KANRISHARYO_CD = reader["KANRISHARYO_CD"].ToString();
                                    //                              String HOUKO = reader["HOUKO"].ToString();
                                    //                            String DOTAI_KIHON_CD = reader["DOTAI_KIHON_CD"].ToString();
                                    String IZAHYO_X = reader["IZAHYO_X"].ToString();
                                    String IZAHYO_Y = reader["IZAHYO_Y"].ToString();



                                    MsgOut(KEY_HOSP_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    try
                                    {
                                        lx = Double.Parse(IZAHYO_X);
                                        ly = Double.Parse(IZAHYO_Y);
                                    }
                                    catch (Exception ex)
                                    {

                                    }


                                    //                                lx = -45237600;
                                    //                                ly = -150372500;

                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;

                                    //正規化座標(m)→経緯度（日本）(秒）
                                    cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                    //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                    cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    cnt++;

                                    if (hosp_info.IndexOf(FU_MEDICAL_HOSP_CD) > 0)
                                    {
                                        lay_no = "n@19-1";
                                        symbol_no = 2203;
                                        info_type = 19;
                                    }
                                    else
                                    {
                                        lay_no = "n@30-1";
                                        symbol_no = 1501;
                                    //info_type = 4;  // <--   from 5 to 4 2023/08/23
                                    info_type = 30;  // <--   from 4 to 30 2024/10/24
                                }

                                item_no = cnt.ToString();
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"受付日\":";
                                    info_summery += "\"";
                                    info_summery += "\"";
                                    info_summery += ",\"連番\":";
                                    info_summery += "\"";
                                    info_summery += "\"";
                                    info_summery += ",\"処理区分\":";
                                    info_summery += "\"";
                                    info_summery += "\"";

                                    info_summery += ",\"備考\":";

                                    info_summery += "\"";
                                    info_summery += "病院コード:";
                                    info_summery += KEY_HOSP_CD;
                                    info_summery += ",府医療病院コード:";
                                    info_summery += FU_MEDICAL_HOSP_CD;
                                    info_summery += ",名前:";
                                    info_summery += HOSP_NAME;
                                    info_summery += "\"";

                                    info_summery += "}";

                                    lay_type = 1;
                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = "";
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);

                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

            //        gis_conn.Close();
              //      gis_conn.Dispose();
                //}
            
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }

        //--------------------------------------------------------------------------
        //　　DAMS設定テーブルから災害拠点病院の情報を取得
        //--------------------------------------------------------------------------
        static String GetHospInfo()
        {
            String ret = "";

            string sqlStr = "select * from TBSK1101 WHERE SETTING_ID=16 AND SETTING_SUB_ID=1";

            try
            {
                //コネクションを生成する
                using (OracleConnection conn = new OracleConnection())
                {
                    //コネクションを取得する
                    conn.ConnectionString = CONN_STRING_DAMS;
                    conn.Open();

                    //コマンドを生成する
                    using (OracleCommand command = new OracleCommand(sqlStr))
                    {
                        command.Connection = conn;
                        command.CommandType = CommandType.Text;

                        //コマンドを実行する
                        using (OracleDataReader reader = command.ExecuteReader())
                        {
                            //検索結果が存在する間ループする
                            while (reader.Read())
                            {
                                String SETTING_VALUE = reader["SETTING_VALUE"].ToString();
                                ret = SETTING_VALUE;
                            }
                        }
                    }

                    //コネクションを切断する
                    conn.Close();

                    //コネクションを破棄する
                    conn.Dispose();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }

            return ret;
        }

        //--------------------------------------------------------------------------
        //　　街区
        //--------------------------------------------------------------------------
        static private void ReadDB_TBDS0500()
        {

            DelData("n@8-1");
            DelData("n@9-1");
            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            string sqlStr = "select * from TBDS0500 ";

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                   // gis_conn.Open();
                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_KEIBO;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String KU_CD = reader["KU_CD"].ToString();
                                    String TOWN_CD = reader["TOWN_CD"].ToString();
                                    String CHOME_CD = reader["CHOME_CD"].ToString();
                                    String GAIKU_CD = reader["GAIKU_CD"].ToString();

                                    String IZAHYO_X = reader["IZAHYO_X"].ToString();
                                    String IZAHYO_Y = reader["IZAHYO_Y"].ToString();



                                    MsgOut(cnt.ToString() + "," + KU_CD);



                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;
                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;

                                    if (IZAHYO_X.Length < 10 || IZAHYO_Y.Length < 10)
                                    {
                                        try
                                        {
                                            lx = Double.Parse(IZAHYO_X);
                                            ly = Double.Parse(IZAHYO_Y);
                                        }
                                        catch (Exception ex)
                                        {

                                        }
                                        //                                lx = -45237600;
                                        //                                ly = -150372500;


                                        //正規化座標(m)→経緯度（日本）(秒）
                                        cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                        //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                        cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);
                                    }

                                    cnt++;

                                    lay_no = "n@8-1";
                                    item_no = cnt.ToString();
                                    info_type = 8;
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"区コード\":";
                                    info_summery += "\"";
                                    info_summery += KU_CD;
                                    info_summery += "\"";
                                    info_summery += ",\"町コード\":";
                                    info_summery += "\"";
                                    info_summery += TOWN_CD;
                                    info_summery += "\"";
                                    info_summery += ",\"丁目コード\":";
                                    info_summery += "\"";
                                    info_summery += CHOME_CD;
                                    info_summery += "\"";
                                    info_summery += ",\"街区コード\":";
                                    info_summery += "\"";
                                    info_summery += GAIKU_CD;
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += "}";

                                    lay_type = 1;
                                    symbol_no = 1700 + Int32.Parse(GAIKU_CD);


                                    if (symbol_no > 1700)
                                    {
                                        zahyo_x = (double)m_keido_w / (3600 * 1000);
                                        zahyo_y = (double)m_ido_w / (3600 * 1000);
                                        strinfo1 = "";
                                        strinfo2 = "";
                                        strinfo3 = "";
                                        str_zahyo_x = 0.0;
                                        str_zahyo_y = 0.0;

                                        item_no = info_type.ToString("D2");
                                        item_no += symbol_no.ToString("D4");
                                        item_no += cnt.ToString("D6");

                                        AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);
                                    }

                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

                    //gis_conn.Close();
                    //gis_conn.Dispose();
                //}

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }

        static private void DelData(String layerID)
        {
            string msg;

            try
            {
                //プレースホルダでバインドする
                string sql = "delete from  TBWG0001 Where lay_no=:lay_no";

                using (OracleConnection conn = new OracleConnection())
                {
                    conn.ConnectionString = CONN_STRING_WEBGIS;
                    conn.Open();
                    using (OracleTransaction transaction = conn.BeginTransaction())
                    {
                        try
                        {
                            using (OracleCommand cmd = new OracleCommand(sql, conn))
                            {
                                cmd.BindByName = true;


                                cmd.Parameters.Add(new OracleParameter(":lay_no", OracleDbType.Varchar2,
                                    layerID, ParameterDirection.Input));

                                cmd.ExecuteNonQuery();

                                transaction.Commit();
                                msg = "Delete Commit! [" + layerID + "]";
                                MsgOut(msg);
                            }
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            msg = ex.ToString();
                            MsgOut(msg);
                        }
                    }
                    conn.Close();
                    conn.Dispose();
                }
            }
            catch (Exception ex)
            {
                msg = ex.ToString();
                MsgOut(msg);
            }
        }
        static private void DelData2(String layerID, int symbol_no)
        {
            string msg;

            try
            {
                //プレースホルダでバインドする
                string sql = "delete from  TBWG0001 Where lay_no=:lay_no AND symbol_no=:symbol_no";

                using (OracleConnection conn = new OracleConnection())
                {
                    conn.ConnectionString = CONN_STRING_WEBGIS;
                    conn.Open();
                    using (OracleTransaction transaction = conn.BeginTransaction())
                    {
                        try
                        {
                            using (OracleCommand cmd = new OracleCommand(sql, conn))
                            {
                                cmd.BindByName = true;


                                cmd.Parameters.Add(new OracleParameter(":lay_no", OracleDbType.Varchar2,
                                    layerID, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":symbol_no", OracleDbType.Int32,
                                    symbol_no, ParameterDirection.Input));

                                cmd.ExecuteNonQuery();

                                transaction.Commit();
                                msg = "Delete Commit! [" + layerID + "]";
                                MsgOut(msg);
                            }
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            msg = ex.ToString();
                            MsgOut(msg);
                        }
                    }
                    conn.Close();
                    conn.Dispose();
                }
            }
            catch (Exception ex)
            {
                msg = ex.ToString();
                MsgOut(msg);
            }
        }
        static private void DelData3(String layerID, int info_type)
        {
            string msg;

            try
            {
                //プレースホルダでバインドする
                string sql = "delete from  TBWG0001 Where lay_no=:lay_no AND info_type=:info_type";

                using (OracleConnection conn = new OracleConnection())
                {
                    conn.ConnectionString = CONN_STRING_WEBGIS;
                    conn.Open();
                    using (OracleTransaction transaction = conn.BeginTransaction())
                    {
                        try
                        {
                            using (OracleCommand cmd = new OracleCommand(sql, conn))
                            {
                                cmd.BindByName = true;


                                cmd.Parameters.Add(new OracleParameter(":lay_no", OracleDbType.Varchar2,
                                    layerID, ParameterDirection.Input));
                                cmd.Parameters.Add(new OracleParameter(":info_type", OracleDbType.Int32,
                                    info_type, ParameterDirection.Input));

                                cmd.ExecuteNonQuery();

                                transaction.Commit();
                                msg = "Delete Commit! [" + layerID + "]";
                                MsgOut(msg);
                            }
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            msg = ex.ToString();
                            MsgOut(msg);
                        }
                    }
                    conn.Close();
                    conn.Dispose();
                }
            }
            catch (Exception ex)
            {
                msg = ex.ToString();
                MsgOut(msg);
            }
        }

        static private void AddData(OracleConnection conn, String lay_no, String item_no, int info_type, String info_summery, int lay_type, int symbol_no, double zahyo_x, double zahyo_y, String strinfo1, String strinfo2, String strinfo3, double str_zahyo_x, double str_zahyo_y)
        {
            String msg;
            DateTime dt = DateTime.Now;
            try
            {
                //プレースホルダでバインドする
                string sql = "insert into  TBWG0001(lay_no,item_no,info_type,info_summery,lay_type,symbol_no,zahyo_x,zahyo_y,strinfo1,strinfo2,strinfo3,str_zahyo_x,str_zahyo_y,update_date)";
                sql += " VALUES(:lay_no,:item_no,:info_type,:info_summery,:lay_type,:symbol_no,:zahyo_x,:zahyo_y,:strinfo1,:strinfo2,:strinfo3,:str_zahyo_x,:str_zahyo_y,:update_date)";

                //using (OracleConnection conn = new OracleConnection())
                //{
                //conn.ConnectionString = CONN_STRING;
                //conn.Open();
                using (OracleTransaction transaction = conn.BeginTransaction())
                {
                    try
                    {
                        using (OracleCommand cmd = new OracleCommand(sql, conn))
                        {
                            cmd.BindByName = true;


                            cmd.Parameters.Add(new OracleParameter(":lay_no", OracleDbType.Varchar2,
                                lay_no, ParameterDirection.Input));
                            cmd.Parameters.Add(new OracleParameter(":item_no", OracleDbType.Varchar2,
                                item_no, ParameterDirection.Input));
                            cmd.Parameters.Add(new OracleParameter(":info_type", OracleDbType.Int32,
                                info_type, ParameterDirection.Input));
                            cmd.Parameters.Add(new OracleParameter(":info_summery", OracleDbType.Varchar2,
                                info_summery, ParameterDirection.Input));

                            cmd.Parameters.Add(new OracleParameter(":lay_type", OracleDbType.Varchar2,
                                lay_type, ParameterDirection.Input));
                            cmd.Parameters.Add(new OracleParameter(":symbol_no", OracleDbType.Varchar2,
                                symbol_no, ParameterDirection.Input));

                            cmd.Parameters.Add(new OracleParameter(":zahyo_x", OracleDbType.Double,
                                zahyo_x, ParameterDirection.Input));
                            cmd.Parameters.Add(new OracleParameter(":zahyo_y", OracleDbType.Double,
                                zahyo_y, ParameterDirection.Input));

                            cmd.Parameters.Add(new OracleParameter(":strinfo1", OracleDbType.Varchar2,
                                strinfo1, ParameterDirection.Input));
                            cmd.Parameters.Add(new OracleParameter(":strinfo2", OracleDbType.Varchar2,
                                strinfo2, ParameterDirection.Input));
                            cmd.Parameters.Add(new OracleParameter(":strinfo3", OracleDbType.Varchar2,
                                strinfo3, ParameterDirection.Input));

                            cmd.Parameters.Add(new OracleParameter(":str_zahyo_x", OracleDbType.Double,
                                str_zahyo_x, ParameterDirection.Input));
                            cmd.Parameters.Add(new OracleParameter(":str_zahyo_y", OracleDbType.Double,
                                str_zahyo_y, ParameterDirection.Input));
                            cmd.Parameters.Add(new OracleParameter(":update_date", OracleDbType.Date,
                                dt, ParameterDirection.Input));

                            cmd.ExecuteNonQuery();

                            transaction.Commit();

                        }
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        msg = ex.ToString();
                        MsgOut(msg);
                    }
                }
                //2024.01.09 追加
                //コネクションを切断する
                //conn.Close();
                //コネクションを破棄する
                //conn.Dispose();
                //}
            }
            catch (Exception ex)
            {
                msg = ex.ToString();
                MsgOut(msg);
            }

        }
        static public void MsgOut(string msg)
        {
            DateTime dt = DateTime.Now;

            Console.WriteLine(dt.ToString() + "," + msg);
            lg.LogOut(dt.ToString() + "," + msg);
        }


        //--------------------------------------------------------------------------
        //　　現場画像
        //--------------------------------------------------------------------------
        static private void ReadDB_TBSK0901()
        {
            DelData2("n@14-1", 2402);

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            string sqlStr = "select * from TBSK0901";

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                    //gis_conn.Open();

                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_DAMS;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {

                                    String KEY_SITEINFO_ID = reader["KEY_SITEINFO_ID"].ToString();
                                    String SUBJECT = reader["SUBJECT"].ToString();
                                    String LETTER_BODY = reader["LETTER_BODY"].ToString();
                                    String ADDR_X = reader["ADDR_X"].ToString();
                                    String ADDR_Y = reader["ADDR_Y"].ToString();
                                    String IMAGE_ORG_NAME001 = reader["IMAGE_ORG_NAME001"].ToString();
                                    String IMAGE_ORG_NAME002 = reader["IMAGE_ORG_NAME002"].ToString();
                                    String IMAGE_ORG_NAME003 = reader["IMAGE_ORG_NAME003"].ToString();
                                    String IMAGE_ORG_NAME004 = reader["IMAGE_ORG_NAME004"].ToString();



                                    MsgOut(KEY_SITEINFO_ID);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    if (ADDR_X.Length < 10 || ADDR_Y.Length < 10)
                                    {
                                        lx = Double.Parse(ADDR_X);
                                        ly = Double.Parse(ADDR_Y);

                                        //lx = -45237600;
                                        //ly = -150372500;

                                        int kijyunkei = 6;
                                        double m_keido = 0.0;
                                        double m_ido = 0.0;
                                        long m_keido_w = 0;
                                        long m_ido_w = 0;

                                        //正規化座標(m)→経緯度（日本）(秒）
                                        cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                        //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                        cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);
                                        zahyo_x = (double)m_keido_w / (3600 * 1000);
                                        zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    }
                                    else
                                    {
                                        zahyo_x = 0.0;
                                        zahyo_y = 0.0;
                                    }


                                    cnt++;

                                    //                                { "現場画像ID":"s001@osaka.com","リンクファイル１":"a.jpg","リンクファイル２":"a.jpg","リンクファイル３":"a.jpg","リンクファイル４":"a.jpg","備考":"***"}

                                    lay_no = "n@14-1";
                                    item_no = cnt.ToString();
                                    info_type = 14;
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"現場画像ID\":";
                                    info_summery += "\"";
                                    info_summery += KEY_SITEINFO_ID;
                                    info_summery += "\"";
                                    info_summery += ",\"リンクファイル１\":";
                                    info_summery += "\"";
                                    info_summery += IMAGE_ORG_NAME001;
                                    info_summery += "\"";
                                    info_summery += ",\"リンクファイル２\":";
                                    info_summery += "\"";
                                    info_summery += IMAGE_ORG_NAME002;
                                    info_summery += "\"";
                                    info_summery += ",\"リンクファイル３\":";
                                    info_summery += "\"";
                                    info_summery += IMAGE_ORG_NAME003;
                                    info_summery += "\"";
                                    info_summery += ",\"リンクファイル４\":";
                                    info_summery += "\"";
                                    info_summery += IMAGE_ORG_NAME004;
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "名称:";
                                    info_summery += SUBJECT;
                                    info_summery += "\"";
                                    info_summery += "}";

                                    lay_type = 1;
                                    symbol_no = 2402;


                                    strinfo1 = "";
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);
                                }
                            }
                        }
                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }
                //    gis_conn.Close();
                //    gis_conn.Dispose();
                //}

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }

        }
        //--------------------------------------------------------------------------
        //　　福祉施設--> 要支援者に変更
        //--------------------------------------------------------------------------
        private static void ReadDB_TBDS2200()
        {
            DelData2("n@18-1", 2401);

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            string sqlStr = "select * from TBDS2200 ";

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                    //gis_conn.Open();
                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_KEIBO;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String FUKUSHI_CD = reader["FUKUSHI_CD"].ToString();
                                    String ADD_INFO = reader["ADD_INFO"].ToString();
                                    String NAME_KANJI = reader["NAME_KANJI"].ToString();
                                    //String TEIJI_FLG = reader["TEIJI_FLG"].ToString();
                                    //String FU_MEDICAL_HOSP_CD = reader["FU_MEDICAL_HOSP_CD"].ToString();

                                    //                                String KANRISHARYO_CD = reader["KANRISHARYO_CD"].ToString();
                                    //                              String HOUKO = reader["HOUKO"].ToString();
                                    //                            String DOTAI_KIHON_CD = reader["DOTAI_KIHON_CD"].ToString();
                                    String IZAHYO_X = reader["IZAHYO_X"].ToString();
                                    String IZAHYO_Y = reader["IZAHYO_Y"].ToString();



                                    MsgOut(FUKUSHI_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;
                                    double ly = 0.0;

                                    if (IZAHYO_X.Length < 10 || IZAHYO_Y.Length < 10)
                                    {
                                        try
                                        {
                                            lx = Double.Parse(IZAHYO_X);
                                            ly = Double.Parse(IZAHYO_Y);
                                        }
                                        catch (Exception ex)
                                        {

                                        }


                                        //                                lx = -45237600;
                                        //                                ly = -150372500;


                                        //正規化座標(m)→経緯度（日本）(秒）
                                        cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                        //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                        cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    }

                                    cnt++;

                                    lay_no = "n@18-1";
                                    item_no = cnt.ToString();
                                    info_type = 18;
                                    info_summery = "";

                                    info_summery += "{";

                                    info_summery += "\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "福祉コード:";
                                    info_summery += FUKUSHI_CD;
                                    info_summery += ",住所:";
                                    info_summery += ADD_INFO;
                                    info_summery += ",名前:";
                                    info_summery += NAME_KANJI;
                                    info_summery += "\"";

                                    info_summery += "}";

                                    lay_type = 1;
                                    symbol_no = 2401;
                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = "";
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

                //    gis_conn.Close();
                //    gis_conn.Dispose();
                //}

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }
        //--------------------------------------------------------------------------
        //　　高圧ガス施設
        //--------------------------------------------------------------------------
        private static void ReadDB_TBDS1900()
        {
            DelData2("n@5-1", 1504);

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            //            string sqlStr = "select * from TBDS1900 ";
            //2024050
            string sqlStr = "select T1.*,T2.SHIREI_KANJI from TBDS1900 T1 LEFT JOIN TBDS1230 T2 ON T1.TAISHO_CD = T2.TAISHO_CD";

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                    //gis_conn.Open();

                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_KEIBO;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String GAS_CD = reader["GAS_CD"].ToString();
                                    String TAISHO_CD = reader["TAISHO_CD"].ToString();
                                    //String TEIJI_FLG = reader["TEIJI_FLG"].ToString();
                                    //String FU_MEDICAL_HOSP_CD = reader["FU_MEDICAL_HOSP_CD"].ToString();

                                    //                                String KANRISHARYO_CD = reader["KANRISHARYO_CD"].ToString();
                                    //                              String HOUKO = reader["HOUKO"].ToString();
                                    //                            String DOTAI_KIHON_CD = reader["DOTAI_KIHON_CD"].ToString();
                                    String IZAHYO_X = reader["IZAHYO_X"].ToString();
                                    String IZAHYO_Y = reader["IZAHYO_Y"].ToString();

                                    //20240501
                                    String SHIREI_KANJI = reader["SHIREI_KANJI"].ToString();

                                    MsgOut(GAS_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    try
                                    {
                                        lx = Double.Parse(IZAHYO_X);
                                        ly = Double.Parse(IZAHYO_Y);
                                    }
                                    catch (Exception ex)
                                    {

                                    }


                                    //                                lx = -45237600;
                                    //                                ly = -150372500;

                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;

                                    //正規化座標(m)→経緯度（日本）(秒）
                                    cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                    //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                    cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    cnt++;

                                    lay_no = "n@5-1";
                                    item_no = cnt.ToString();
                                    info_type = 5;
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"受付日\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"連番\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"処理区分\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "高圧ガス施設コード:";
                                    info_summery += GAS_CD;
                                    info_summery += ",対象物コード:";
                                    info_summery += TAISHO_CD;
                                    info_summery += ",名前:";
                                    info_summery += SHIREI_KANJI;
                                    info_summery += "\"";
                                    info_summery += "}";


                                    lay_type = 1;
                                    symbol_no = 1504;
                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = "";
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }
                  //  gis_conn.Close();
                  //  gis_conn.Dispose();
                //}

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }
        //--------------------------------------------------------------------------
        //　　毒劇物施設
        //--------------------------------------------------------------------------
        private static void ReadDB_TBDS2000()
        {
            DelData2("n@5-1", 1505);

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            //string sqlStr = "select * from TBDS2000 ";
            string sqlStr = "select T1.*,T2.SHIREI_KANJI from TBDS2000 T1 LEFT JOIN TBDS1230 T2 ON T1.TAISHO_CD = T2.TAISHO_CD";

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                  //  gis_conn.Open();
                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_KEIBO;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String POS_CD = reader["POS_CD"].ToString();
                                    String TAISHO_CD = reader["TAISHO_CD"].ToString();
                                    //String TEIJI_FLG = reader["TEIJI_FLG"].ToString();
                                    //String FU_MEDICAL_HOSP_CD = reader["FU_MEDICAL_HOSP_CD"].ToString();

                                    //                                String KANRISHARYO_CD = reader["KANRISHARYO_CD"].ToString();
                                    //                              String HOUKO = reader["HOUKO"].ToString();
                                    //                            String DOTAI_KIHON_CD = reader["DOTAI_KIHON_CD"].ToString();
                                    String IZAHYO_X = reader["IZAHYO_X"].ToString();
                                    String IZAHYO_Y = reader["IZAHYO_Y"].ToString();

                                    //20240501
                                    String SHIREI_KANJI = reader["SHIREI_KANJI"].ToString();

                                    MsgOut(POS_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    try
                                    {
                                        lx = Double.Parse(IZAHYO_X);
                                        ly = Double.Parse(IZAHYO_Y);
                                    }
                                    catch (Exception ex)
                                    {

                                    }


                                    //                                lx = -45237600;
                                    //                                ly = -150372500;

                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;

                                    //正規化座標(m)→経緯度（日本）(秒）
                                    cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                    //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                    cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    cnt++;

                                    lay_no = "n@5-1";
                                    item_no = cnt.ToString();
                                    info_type = 5;
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"受付日\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"連番\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"処理区分\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "毒劇物施設コード:";
                                    info_summery += POS_CD;
                                    info_summery += ",対象物コード:";
                                    info_summery += TAISHO_CD;
                                    info_summery += ",名前:";
                                    info_summery += SHIREI_KANJI;
                                    info_summery += "\"";
                                    info_summery += "}";

                                    lay_type = 1;
                                    symbol_no = 1505;
                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = "";
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

                //    gis_conn.Close();
                //    gis_conn.Dispose();
                //}

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }
        //--------------------------------------------------------------------------
        //　　R1施設
        //--------------------------------------------------------------------------
        private static void ReadDB_TBDS2100()
        {
            DelData2("n@5-1", 1507);

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            //            string sqlStr = "select * from TBDS2100 ";
            string sqlStr = "select T1.*,T2.SHIREI_KANJI from TBDS2100 T1 LEFT JOIN TBDS1230 T2 ON T1.TAISHO_CD = T2.TAISHO_CD";

            int cnt = 0;

            try
            {
               // using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                  //  gis_conn.Open();

                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_KEIBO;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String RIS_CD = reader["RIS_CD"].ToString();
                                    String TAISHO_CD = reader["TAISHO_CD"].ToString();
                                    //String TEIJI_FLG = reader["TEIJI_FLG"].ToString();
                                    //String FU_MEDICAL_HOSP_CD = reader["FU_MEDICAL_HOSP_CD"].ToString();

                                    //                                String KANRISHARYO_CD = reader["KANRISHARYO_CD"].ToString();
                                    //                              String HOUKO = reader["HOUKO"].ToString();
                                    //                            String DOTAI_KIHON_CD = reader["DOTAI_KIHON_CD"].ToString();
                                    String IZAHYO_X = reader["IZAHYO_X"].ToString();
                                    String IZAHYO_Y = reader["IZAHYO_Y"].ToString();

                                    //20240501
                                    String SHIREI_KANJI = reader["SHIREI_KANJI"].ToString();


                                    MsgOut(RIS_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    try
                                    {
                                        lx = Double.Parse(IZAHYO_X);
                                        ly = Double.Parse(IZAHYO_Y);
                                    }
                                    catch (Exception ex)
                                    {

                                    }


                                    //                                lx = -45237600;
                                    //                                ly = -150372500;

                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;

                                    //正規化座標(m)→経緯度（日本）(秒）
                                    cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                    //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                    cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    cnt++;

                                    lay_no = "n@5-1";
                                    item_no = cnt.ToString();
                                    info_type = 5;
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"受付日\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"連番\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"処理区分\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "R1施設コード:";
                                    info_summery += RIS_CD;
                                    info_summery += ",対象物コード:";
                                    info_summery += TAISHO_CD;
                                    info_summery += ",名前:";
                                    info_summery += SHIREI_KANJI;
                                    info_summery += "\"";
                                    info_summery += "}";

                                    lay_type = 1;
                                    symbol_no = 1507;
                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = "";
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

                 //   gis_conn.Close();
                 //   gis_conn.Dispose();
               // }

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }
        //--------------------------------------------------------------------------
        //　　その他施設
        //--------------------------------------------------------------------------
        private static void ReadDB_TBDS2300()
        {
            DelData2("n@7-1", 1508);

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            //            string sqlStr = "select * from TBDS2300 ";
            string sqlStr = "select T1.*,T2.SHIREI_KANJI from TBDS2300 T1 LEFT JOIN TBDS1230 T2 ON T1.TAISHO_CD = T2.TAISHO_CD";

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                   // gis_conn.Open();
                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_KEIBO;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String OTHER_CD = reader["OTHER_CD"].ToString();
                                    String TAISHO_CD = reader["TAISHO_CD"].ToString();
                                    //String TEIJI_FLG = reader["TEIJI_FLG"].ToString();
                                    //String FU_MEDICAL_HOSP_CD = reader["FU_MEDICAL_HOSP_CD"].ToString();

                                    //                                String KANRISHARYO_CD = reader["KANRISHARYO_CD"].ToString();
                                    //                              String HOUKO = reader["HOUKO"].ToString();
                                    //                            String DOTAI_KIHON_CD = reader["DOTAI_KIHON_CD"].ToString();
                                    String IZAHYO_X = reader["IZAHYO_X"].ToString();
                                    String IZAHYO_Y = reader["IZAHYO_Y"].ToString();


                                    //20240501
                                    String SHIREI_KANJI = reader["SHIREI_KANJI"].ToString();

                                    MsgOut(OTHER_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    try
                                    {
                                        lx = Double.Parse(IZAHYO_X);
                                        ly = Double.Parse(IZAHYO_Y);
                                    }
                                    catch (Exception ex)
                                    {

                                    }


                                    //                                lx = -45237600;
                                    //                                ly = -150372500;

                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;

                                    //正規化座標(m)→経緯度（日本）(秒）
                                    cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                    //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                    cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    cnt++;

                                    lay_no = "n@7-1";
                                    item_no = cnt.ToString();
                                    info_type = 7;
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"受付日\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"連番\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"処理区分\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "その他施設コード:";
                                    info_summery += OTHER_CD;
                                    info_summery += ",対象物コード:";
                                    info_summery += TAISHO_CD;
                                    info_summery += ",名前:";
                                    info_summery += SHIREI_KANJI;
                                    info_summery += "\"";
                                    info_summery += "}";

                                    lay_type = 1;
                                    symbol_no = 1508;
                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = "";
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

                //    gis_conn.Close();
                //    gis_conn.Dispose();
               // }

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }
        //--------------------------------------------------------------------------
        //　　高速道路（出入口）
        //--------------------------------------------------------------------------
        private static void ReadDB_TBDS4100()
        {
            DelData2("n@9-1", 1602);

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            //            string sqlStr = "select * from TBDS4100 ";
            string sqlStr = "select T1.*,T2.LINE_KANJI from TBDS4100 T1 LEFT JOIN TBDS4000 T2 ON T1.ROSEN_CD = T2.ROSEN_CD ";

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                  //  gis_conn.Open();
                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_KEIBO;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String ROSEN_CD = reader["ROSEN_CD"].ToString();
                                    String INTER_CD = reader["INTER_CD"].ToString();
                                    String INTERNM_TANSHUKU = reader["INTERNM_TANSHUKU"].ToString();
                                    //String TEIJI_FLG = reader["TEIJI_FLG"].ToString();
                                    //String FU_MEDICAL_HOSP_CD = reader["FU_MEDICAL_HOSP_CD"].ToString();

                                    //                                String KANRISHARYO_CD = reader["KANRISHARYO_CD"].ToString();
                                    //                              String HOUKO = reader["HOUKO"].ToString();
                                    //                            String DOTAI_KIHON_CD = reader["DOTAI_KIHON_CD"].ToString();
                                    String IZAHYO_X = reader["IZAHYO_X"].ToString();
                                    String IZAHYO_Y = reader["IZAHYO_Y"].ToString();

                                    String LINE_KANJI = reader["LINE_KANJI"].ToString();


                                    MsgOut(ROSEN_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    try
                                    {
                                        lx = Double.Parse(IZAHYO_X);
                                        ly = Double.Parse(IZAHYO_Y);
                                    }
                                    catch (Exception ex)
                                    {

                                    }


                                    //                                lx = -45237600;
                                    //                                ly = -150372500;

                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;

                                    //正規化座標(m)→経緯度（日本）(秒）
                                    cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                    //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                    cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    cnt++;

                                    lay_no = "n@9-1";
                                    item_no = cnt.ToString();
                                    info_type = 9;
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"受付日\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"連番\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"処理区分\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "路線コード:";
                                    info_summery += ROSEN_CD;
                                    info_summery += ",出入口コード:";
                                    info_summery += INTER_CD;
                                    info_summery += ",名前:";
                                    info_summery += LINE_KANJI;
                                    info_summery += "\"";
                                    info_summery += "}";

                                    lay_type = 1;
                                    symbol_no = 1602;
                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = INTERNM_TANSHUKU;
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }

               //     gis_conn.Close();
                 //   gis_conn.Dispose();
                //}

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }
        //--------------------------------------------------------------------------
        //　　高速道路（キロポスト）
        //--------------------------------------------------------------------------
        private static void ReadDB_TBDS4200()
        {
            DelData2("n@9-1", 1602);

            string msg;

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            //            string sqlStr = "select * from TBDS4200 ";
            string sqlStr = "select T1.*,T2.LINE_KANJI from TBDS4200 T1 LEFT JOIN TBDS4000 T2 ON T1.ROSEN_CD = T2.ROSEN_CD ";

            int cnt = 0;

            try
            {
               //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                    //gis_conn.Open();

                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_KEIBO;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String ROSEN_CD = reader["ROSEN_CD"].ToString();
                                    String KIROPOST_K = reader["KIROPOST_K"].ToString();
                                    String KIROPOST_M = reader["KIROPOST_M"].ToString();
                                    //String TEIJI_FLG = reader["TEIJI_FLG"].ToString();
                                    //String FU_MEDICAL_HOSP_CD = reader["FU_MEDICAL_HOSP_CD"].ToString();

                                    //                                String KANRISHARYO_CD = reader["KANRISHARYO_CD"].ToString();
                                    //                              String HOUKO = reader["HOUKO"].ToString();
                                    //                            String DOTAI_KIHON_CD = reader["DOTAI_KIHON_CD"].ToString();
                                    String IZAHYO_X = reader["IZAHYO_X"].ToString();
                                    String IZAHYO_Y = reader["IZAHYO_Y"].ToString();


                                    String LINE_KANJI = reader["LINE_KANJI"].ToString();
                                    MsgOut(ROSEN_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    double ly = 0.0;

                                    try
                                    {
                                        lx = Double.Parse(IZAHYO_X);
                                        ly = Double.Parse(IZAHYO_Y);
                                    }
                                    catch (Exception ex)
                                    {

                                    }


                                    //                                lx = -45237600;
                                    //                                ly = -150372500;

                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;

                                    //正規化座標(m)→経緯度（日本）(秒）
                                    cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                    //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                    cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    cnt++;

                                    lay_no = "n@9-1";
                                    item_no = cnt.ToString();
                                    info_type = 9;
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"受付日\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"連番\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"処理区分\":";
                                    info_summery += "\"";
                                    info_summery += "";
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "路線コード:";
                                    info_summery += ROSEN_CD;
                                    info_summery += ",キロポスト:";
                                    info_summery += KIROPOST_K;
                                    info_summery += ".";
                                    info_summery += KIROPOST_M;
                                    info_summery += ",名前:";
                                    info_summery += LINE_KANJI;
                                    info_summery += "\"";
                                    info_summery += "}";

                                    lay_type = 1;
                                    symbol_no = 1602;
                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = KIROPOST_K + "." + KIROPOST_M;
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }
                 //   gis_conn.Close();
                   // gis_conn.Dispose();
                //}

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }
        //--------------------------------------------------------------------------
        //　　対象物
        //--------------------------------------------------------------------------
        private static void ReadDB_TBDS1230()
        {
            int SYMBOL_ID = 1551;

            DelData2("n@6-1", SYMBOL_ID);

            String lay_no = "";
            String item_no = "";
            int info_type = 0;
            String info_summery = "";
            int lay_type = 0;
            int symbol_no = 0;
            double zahyo_x = 0.0;
            double zahyo_y = 0.0;
            String strinfo1 = "";
            String strinfo2 = "";
            String strinfo3 = "";
            double str_zahyo_x = 0.0;
            double str_zahyo_y = 0.0;

            DateTime dt = DateTime.Now;
            TimeSpan sp1 = new TimeSpan(30, 0, 0, 0);

            string result = (dt - sp1).ToString("yyyy/MM/dd HH:mm:ss");
            //            string sqlStr = "select * from TBMP0200 WHERE UPD_DATE > TO_DATE('" + result + "', 'YYYY-MM-DD HH24:MI:SS') ";
            string sqlStr = "select * from TBDS1230 WHERE SYMBOL_SBT=" + SYMBOL_ID;

            int cnt = 0;

            try
            {
                //using (OracleConnection gis_conn = new OracleConnection())
                //{
                  //  gis_conn.ConnectionString = CONN_STRING_WEBGIS;
                    //gis_conn.Open();

                    //コネクションを生成する
                    using (OracleConnection conn = new OracleConnection())
                    {
                        //コネクションを取得する
                        conn.ConnectionString = CONN_STRING_KEIBO;
                        conn.Open();

                        //コマンドを生成する
                        using (OracleCommand command = new OracleCommand(sqlStr))
                        {
                            command.Connection = conn;
                            command.CommandType = CommandType.Text;

                            //コマンドを実行する
                            using (OracleDataReader reader = command.ExecuteReader())
                            {
                                //検索結果が存在する間ループする
                                while (reader.Read())
                                {
                                    String TAISHO_CD = reader["TAISHO_CD"].ToString();
                                    String SHUBETSU_CD = reader["SHUBETSU_CD"].ToString();
                                    String TNM_KANJI = reader["TNM_KANJI"].ToString();
                                    String SHIREI_KANJI = reader["SHIREI_KANJI"].ToString();
                                    //String FU_MEDICAL_HOSP_CD = reader["FU_MEDICAL_HOSP_CD"].ToString();

                                    //                                String KANRISHARYO_CD = reader["KANRISHARYO_CD"].ToString();
                                    //                              String HOUKO = reader["HOUKO"].ToString();
                                    //                            String DOTAI_KIHON_CD = reader["DOTAI_KIHON_CD"].ToString();
                                    String IZAHYO_X = reader["IZAHYO_X"].ToString();
                                    String IZAHYO_Y = reader["IZAHYO_Y"].ToString();



                                    MsgOut(TAISHO_CD);


                                    MapCom.Convert cs = new MapCom.Convert();

                                    double lx = 0.0;
                                    int kijyunkei = 6;
                                    double m_keido = 0.0;
                                    double m_ido = 0.0;
                                    long m_keido_w = 0;
                                    long m_ido_w = 0;
                                    double ly = 0.0;

                                    if (IZAHYO_X.Length < 10 || IZAHYO_Y.Length < 10)
                                    {
                                        try
                                        {
                                            lx = Double.Parse(IZAHYO_X);
                                            ly = Double.Parse(IZAHYO_Y);
                                        }
                                        catch (Exception ex)
                                        {

                                        }


                                        //                                lx = -45237600;
                                        //                                ly = -150372500;


                                        //正規化座標(m)→経緯度（日本）(秒）
                                        cs.gpconv2(lx / 1000.0, ly / 1000.0, kijyunkei, ref m_keido, ref m_ido);
                                        //日本測地系（ミリ秒）→世界測地系（ミリ秒）
                                        cs.ConvJ2W((long)(m_keido * 1000), (long)(m_ido * 1000), ref m_keido_w, ref m_ido_w);

                                    }

                                    cnt++;

                                    lay_no = "n@6-1";
                                    item_no = cnt.ToString();
                                    info_type = 6;
                                    info_summery = "";

                                    info_summery += "{";
                                    info_summery += "\"対象物コード\":";
                                    info_summery += "\"";
                                    info_summery += TAISHO_CD;
                                    info_summery += "\"";
                                    info_summery += ",\"種別コード\":";
                                    info_summery += "\"";
                                    info_summery += SHUBETSU_CD;
                                    info_summery += "\"";
                                    info_summery += ",\"備考\":";
                                    info_summery += "\"";
                                    info_summery += "名前:";
                                    info_summery += SHIREI_KANJI;
                                    info_summery += "\"";
                                    info_summery += "}";

                                    lay_type = 1;
                                    symbol_no = SYMBOL_ID;
                                    zahyo_x = (double)m_keido_w / (3600 * 1000);
                                    zahyo_y = (double)m_ido_w / (3600 * 1000);
                                    strinfo1 = "";
                                    strinfo2 = "";
                                    strinfo3 = "";
                                    str_zahyo_x = 0.0;
                                    str_zahyo_y = 0.0;

                                    item_no = info_type.ToString("D2");
                                    item_no += symbol_no.ToString("D4");
                                    item_no += cnt.ToString("D6");

                                    AddData(gis_conn, lay_no, item_no, info_type, info_summery, lay_type, symbol_no, zahyo_x, zahyo_y, strinfo1, strinfo2, strinfo3, str_zahyo_x, str_zahyo_y);


                                }
                            }
                        }

                        //コネクションを切断する
                        conn.Close();

                        //コネクションを破棄する
                        conn.Dispose();
                    }
                    //gis_conn.Close();
                    //gis_conn.Dispose();
                //}

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }
    }
}
