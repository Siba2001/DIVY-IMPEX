package com.divyimpex.dto;

import com.fasterxml.jackson.databind.JsonNode;

public class GasRequest {
    private String action;
    private String key;
    private JsonNode data;

    public GasRequest() {}

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public JsonNode getData() { return data; }
    public void setData(JsonNode data) { this.data = data; }
}

