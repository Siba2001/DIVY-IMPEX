package com.divyimpex.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "histories", indexes = {
    @Index(name = "idx_history_barcode", columnList = "barcode"),
    @Index(name = "idx_history_diamond_id", columnList = "diamondId")
})
public class History {

    @Id
    @Column(length = 64)
    private String id;

    @Column(length = 64)
    private String diamondId;

    @Column(length = 100, nullable = false)
    private String barcode;

    @Column(length = 255, nullable = false)
    private String action;

    @Column(length = 100)
    private String performedBy;

    @Column(length = 50)
    private String date;

    @Column(length = 50)
    private String time;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    public History() {}

    public History(String id, String diamondId, String barcode, String action, String performedBy, String date, String time, String remarks) {
        this.id = id;
        this.diamondId = diamondId;
        this.barcode = barcode;
        this.action = action;
        this.performedBy = performedBy;
        this.date = date;
        this.time = time;
        this.remarks = remarks;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDiamondId() { return diamondId; }
    public void setDiamondId(String diamondId) { this.diamondId = diamondId; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}

