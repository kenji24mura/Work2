package com;

import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Servlet implementation class GetCarInfo
 */
@WebServlet("/GetCarInfo")
public class GetCarInfo extends HttpServlet {
  private static final long serialVersionUID = 1L;

  String URL = "";
  String USER = "";
  String PASS = "";
  String URL2 = "";
  String USER2 = "";
  String PASS2 = "";
  String URL3 = "";
  String USER3 = "";
  String PASS3 = "";
  String MODE = "";

  // 20240130 start
  int kijyunkei = 6;
  // 20240130 end

  // private String conn_str = "jdbc:oracle:thin:@172.23.124.202:1521/fire1.rac.osaka";
  // private String conn_str="jdbc:oracle:thin:@172.18.73.12:1521/fire.osaka";
  // private String conn_user = "DAMS";
  // private String conn_pass = "DAMS2022";

  /**
   * @see HttpServlet#HttpServlet()
   */
  public GetCarInfo() {
    super();
    // TODO Auto-generated constructor stub
  }

  /**
   * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
   */
  protected void doGet(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    // TODO Auto-generated method stub
    log("Start");

    request.setCharacterEncoding("UTF-8");

    // response.setContentType("text/html; charset=UTF-8");
    response.setContentType("text/html");
    response.setHeader("Cache-Control", "nocache");
    response.setHeader("Access-Control-Allow-Origin", "*"); // CROS対策
    response.setCharacterEncoding("utf-8");

    // 20240130 start
    String coordinate = request.getParameter("coordinate");
    if (coordinate == null) {
    } else {
      kijyunkei = Integer.parseInt(coordinate);
    }
    // 20240130 end

    // 運用モード
    int OPE_MODE = 0;
    String ope_mode = request.getParameter("ope_mode");
    if (ope_mode == null) {
    } else {
      OPE_MODE = Integer.parseInt(ope_mode);
    }
    if (OPE_MODE == 0) {
      System.out.println("運用モードは[通常]");
    } else {
      System.out.println("運用モードは[訓練]");
    }



    // 設定ファイル読み込み処理
    ObjectMapper objectMapper = new ObjectMapper();
    try {
      JsonNode json = objectMapper.readTree(
          Paths.get(getServletContext().getRealPath("/WEB-INF/webgis_config.json")).toFile());
      System.out.println(json);

      if (OPE_MODE == 0) {
        URL = json.get("conn_url").textValue();
        USER = json.get("conn_user").textValue();
        PASS = json.get("conn_pass").textValue();
        URL2 = json.get("conn_url2").textValue();
        USER2 = json.get("conn_user2").textValue();
        PASS2 = json.get("conn_pass2").textValue();

        MODE = json.get("mode").textValue();
        if (MODE.indexOf("debug") == 0) {
          URL3 = json.get("conn_url").textValue();
          USER3 = json.get("conn_user").textValue();
          PASS3 = json.get("conn_pass").textValue();

        } else {
          URL3 = json.get("conn_url3").textValue();
          USER3 = json.get("conn_user3").textValue();
          PASS3 = json.get("conn_pass3").textValue();
        }

      } else {
        URL = json.get("conn_url_t").textValue();
        USER = json.get("conn_user_t").textValue();
        PASS = json.get("conn_pass_t").textValue();
        URL2 = json.get("conn_url2_t").textValue();
        USER2 = json.get("conn_user2_t").textValue();
        PASS2 = json.get("conn_pass2_t").textValue();

        MODE = json.get("mode").textValue();
        if (MODE.indexOf("debug") == 0) {
          URL3 = json.get("conn_url_t").textValue();
          USER3 = json.get("conn_user_t").textValue();
          PASS3 = json.get("conn_pass_t").textValue();

        } else {
          URL3 = json.get("conn_url3_t").textValue();
          USER3 = json.get("conn_user3_t").textValue();
          PASS3 = json.get("conn_pass3_t").textValue();
        }
      }

    } catch (Exception e) {
      e.printStackTrace();
    }


    CarDto dto = new CarDto();
    PrintWriter out = response.getWriter();


    if (ReadDB(out, dto) == 0) {
      dto.setResult("OK");
    } else {
      dto.setResult("NG");
    }

    ObjectMapper mapper = new ObjectMapper();

    try {
      String jsonData = mapper.writeValueAsString(dto);
      out.write(jsonData);
    } catch (JsonProcessingException e) {
      e.printStackTrace();
    }
    out.flush();
    log("End");
  }

  /**
   * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
   */
  public int ReadDB(PrintWriter out, CarDto dto) {

    int ret = 0;

    // final String URL = conn_str;
    // final String USER = conn_user;
    // final String PASS = conn_pass;

    String SQL = "";

    if (MODE.indexOf("debug") == 0) {
//      SQL = "select * from TBMP0200 ";
//20260606      
		SQL = "select T1.*,T2.DIS_DOTAI_KIHON,T2.DIS_DOTAI_SHOSAI from TBMP0200  T1 ";
		SQL += " INNER JOIN TBDW0240A T2 ON TO_NUMBER(T2.DOTAI_CD)=TO_NUMBER(T1.DOTAI_KIHON_CD)*100+TO_NUMBER(T1.DOTAI_SYOSAI_CD)";
      
    } else {
//      SQL = "select * from SIREI.TBMP0200 ";
//20260606
    	SQL = "select T1.*,T2.DIS_DOTAI_KIHON,T2.DIS_DOTAI_SHOSAI from SIREI.TBMP0200 T1 ";
		SQL += " INNER JOIN TBDW0240A T2 ON TO_NUMBER(T2.DOTAI_CD)=TO_NUMBER(T1.DOTAI_KIHON_CD)*100+TO_NUMBER(T1.DOTAI_SYOSAI_CD)";
      
    }

    int reccnt = 0;
    List<JsonCarBean> jsonList = new ArrayList<>();

    System.out.println("URL2=" + URL2);
    System.out.println("USER2=" + USER2);
    System.out.println("PASS2=" + PASS2);

    try (Connection conn = DriverManager.getConnection(URL2, USER2, PASS2);
        PreparedStatement ps = conn.prepareStatement(SQL)) {

      try (ResultSet rs = ps.executeQuery()) {

        while (rs.next()) {

          ret = 0;

          String KANRISHARYO_CD = rs.getString("KANRISHARYO_CD");
          String HOUKO = rs.getString("HOUKO");

          // 20230906
          String SHARYO_CD = rs.getString("SHARYO_CD");

          String DOTAI_KIHON_CD = rs.getString("DOTAI_KIHON_CD");
          String DOTAI_SYOSAI_CD = rs.getString("DOTAI_SYOSAI_CD");
          String ITI_ZAHYO_X = rs.getString("ITI_ZAHYO_X");
          String ITI_ZAHYO_Y = rs.getString("ITI_ZAHYO_Y");

          //20260606
			String DIS_DOTAI_KIHON = rs.getString("DIS_DOTAI_KIHON");
			String DIS_DOTAI_SHOSAI = rs.getString("DIS_DOTAI_SHOSAI");
			

          if (ITI_ZAHYO_X.length() > 10) {
            ITI_ZAHYO_X = "0";
          }
          if (ITI_ZAHYO_Y.length() > 10) {
            ITI_ZAHYO_Y = "0";
          }

          int zx = 0;
          int zy = 0;

          try {
            zx = Integer.parseInt(ITI_ZAHYO_X);
            zy = Integer.parseInt(ITI_ZAHYO_Y);
          } catch (Exception ex) {
            ex.printStackTrace();
          }


          MapConvert mc = new MapConvert();

          // 20240130 コメント
          // int kijyunkei = 6;

          double[] result = new double[2];
          result[0] = 0.0;
          result[1] = 0.0;

          mc.ConvertPos(zx, zy, kijyunkei, result);

          double zahyo_x = result[0];
          double zahyo_y = result[1];

          reccnt++;

          JsonCarBean jsonBean = new JsonCarBean();

          int dotai = 0;

          try {
            dotai = Integer.parseInt(DOTAI_KIHON_CD) * 100 + Integer.parseInt(DOTAI_SYOSAI_CD);
          } catch (Exception ex) {

          }

          int symbolid = 0;
          symbolid = 1801;

          if (dotai >= 100 && dotai <= 199) {
            symbolid = 1801;
          }
          if (dotai >= 200 && dotai <= 299) {
            symbolid = 1806;
          }
          if (dotai >= 400 && dotai <= 499) {
            symbolid = 1807;
          }
          if (dotai == 301) {
            symbolid = 1802;
          }
          if (dotai == 306) {
            symbolid = 1803;
          }
          if (dotai == 307) {
            symbolid = 1803;
          }
          if (dotai == 308) {
            symbolid = 1803;
          }
          if (dotai == 309) {
            symbolid = 1803;
          }
          if (dotai == 302) {
            symbolid = 1805;
          }
          if (dotai == 311) {
            symbolid = 1804;
          }
          if (dotai == 303) {
            symbolid = 1805;
          }
          if (dotai == 305) {
            symbolid = 1803;
          }
          if (dotai == 310) {
            // 20230906
            symbolid = 1803;
          }
          if (dotai == 304) {
            symbolid = 1802;
          }


          jsonBean.setCar_cd(KANRISHARYO_CD);
          jsonBean.setDotai(dotai);
          jsonBean.setHouko(HOUKO);
          jsonBean.setSymbolid(symbolid);

          jsonBean.setZx(zahyo_x);
          jsonBean.setZy(zahyo_y);

          // 20230906
          jsonBean.setSharyo_cd(SHARYO_CD);
          
          //20260606
          jsonBean.setDotai_kihon(DIS_DOTAI_KIHON);
          jsonBean.setDotai_shosai(DIS_DOTAI_SHOSAI);

          jsonList.add(jsonBean);

          System.out.println(reccnt);

        }
        dto.setData(jsonList);
      }
    } catch (SQLException e) {
      e.printStackTrace();
      ret = -1;
      out.println(e.toString());
    } catch (Exception e) {
      e.printStackTrace();
      ret = -1;
      out.println(e.toString());
    } finally {
      System.out.println("処理が完了しました");
    }
    return ret;

  }

  protected void doPost(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    // TODO Auto-generated method stub
    doGet(request, response);
  }

}
