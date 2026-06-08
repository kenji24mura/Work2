package com;

import com.fasterxml.jackson.annotation.JsonProperty;

public class JsonCarBean {
	@JsonProperty("car_cd")
	 private String car_cd;
	@JsonProperty("houko")
	 private String houko;
	@JsonProperty("dotai")
	 private int dotai;
	@JsonProperty("symbolid")
	 private int symbolid;
	@JsonProperty("zx")
	 private double zx;
	@JsonProperty("zy")
	 private double zy;
	
	//20260606
	private String dotai_kihon;
	private String dotai_shosai;
	
	private String sharyo_cd;
	
	public String getCar_cd() {
		return car_cd;
	}
	public void setCar_cd(String car_cd) {
		this.car_cd = car_cd;
	}
	public String getHouko() {
		return houko;
	}
	public void setHouko(String houko) {
		this.houko = houko;
	}
	public double getZx() {
		return zx;
	}
	public void setZx(double zx) {
		this.zx = zx;
	}
	public double getZy() {
		return zy;
	}
	public void setZy(double zy) {
		this.zy = zy;
	}
	public void setDotai(int dotai) {
		// TODO 自動生成されたメソッド・スタブ
		this.dotai = dotai;
	}
	public int getSymbolid() {
		return symbolid;
	}
	public void setSymbolid(int symbolid) {
		this.symbolid = symbolid;
	}
	public String getSharyo_cd() {
		return sharyo_cd;
	}
	public void setSharyo_cd(String sharyo_cd) {
		this.sharyo_cd = sharyo_cd;
	}
	
	//20260606
	public String getDotai_kihon() {
		return dotai_kihon;
	}
	public void setDotai_kihon(String dotai_kihon) {
		this.dotai_kihon = dotai_kihon;
	}
	public String getDotai_shosai() {
		return dotai_shosai;
	}
	public void setDotai_shosai(String dotai_shosai) {
		this.dotai_shosai = dotai_shosai;
	}
}
