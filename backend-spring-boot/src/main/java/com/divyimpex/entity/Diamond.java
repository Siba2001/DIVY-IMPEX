package com.divyimpex.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "diamonds", indexes = {
    @Index(name = "idx_diamond_barcode", columnList = "barcode", unique = true),
    @Index(name = "idx_diamond_company", columnList = "companyId"),
    @Index(name = "idx_diamond_worker", columnList = "assignedWorkerId"),
    @Index(name = "idx_diamond_status", columnList = "status")
})
public class Diamond {

    @Id
    @Column(length = 64)
    private String id;

    @Column(length = 100, nullable = false, unique = true)
    private String barcode;

    @Column(length = 100)
    private String serialNo;

    @Column(length = 100)
    private String roughCutNo;

    @Column(length = 64, nullable = false)
    private String companyId;

    @Column(length = 50)
    private String companyCode;

    private String companyName;

    @Column(length = 50)
    private String shape;

    @Column(length = 50)
    private String size;

    @Column(precision = 10, scale = 3)
    private Double weight = 0.0;

    @Column(precision = 10, scale = 3)
    private Double scaleWeight;

    @Column(precision = 10, scale = 3)
    private Double targetWeight;

    @Column(precision = 10, scale = 3)
    private Double actualWeight;

    @Column(precision = 10, scale = 3)
    private Double batchTotalWeight;

    @Column(length = 50)
    private String receivedDate;

    @Column(length = 100)
    private String receivedBy;

    @Column(length = 64)
    private String assignedWorkerId;

    private String assignedWorkerName;

    @Column(length = 50)
    private String assignedDate;

    @Column(length = 50)
    private String status = "RECEIVED";

    @Column(length = 50)
    private String completedDate;

    @Column(length = 100)
    private String completedBy;

    @Column(length = 50)
    private String depositedDate;

    @Column(length = 50)
    private String verifiedDate;

    @Column(length = 100)
    private String verifiedBy;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    public Diamond() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getSerialNo() { return serialNo; }
    public void setSerialNo(String serialNo) { this.serialNo = serialNo; }

    public String getRoughCutNo() { return roughCutNo; }
    public void setRoughCutNo(String roughCutNo) { this.roughCutNo = roughCutNo; }

    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }

    public String getCompanyCode() { return companyCode; }
    public void setCompanyCode(String companyCode) { this.companyCode = companyCode; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getShape() { return shape; }
    public void setShape(String shape) { this.shape = shape; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Double getScaleWeight() { return scaleWeight; }
    public void setScaleWeight(Double scaleWeight) { this.scaleWeight = scaleWeight; }

    public Double getTargetWeight() { return targetWeight; }
    public void setTargetWeight(Double targetWeight) { this.targetWeight = targetWeight; }

    public Double getActualWeight() { return actualWeight; }
    public void setActualWeight(Double actualWeight) { this.actualWeight = actualWeight; }

    public Double getBatchTotalWeight() { return batchTotalWeight; }
    public void setBatchTotalWeight(Double batchTotalWeight) { this.batchTotalWeight = batchTotalWeight; }

    public String getReceivedDate() { return receivedDate; }
    public void setReceivedDate(String receivedDate) { this.receivedDate = receivedDate; }

    public String getReceivedBy() { return receivedBy; }
    public void setReceivedBy(String receivedBy) { this.receivedBy = receivedBy; }

    public String getAssignedWorkerId() { return assignedWorkerId; }
    public void setAssignedWorkerId(String assignedWorkerId) { this.assignedWorkerId = assignedWorkerId; }

    public String getAssignedWorkerName() { return assignedWorkerName; }
    public void setAssignedWorkerName(String assignedWorkerName) { this.assignedWorkerName = assignedWorkerName; }

    public String getAssignedDate() { return assignedDate; }
    public void setAssignedDate(String assignedDate) { this.assignedDate = assignedDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCompletedDate() { return completedDate; }
    public void setCompletedDate(String completedDate) { this.completedDate = completedDate; }

    public String getCompletedBy() { return completedBy; }
    public void setCompletedBy(String completedBy) { this.completedBy = completedBy; }

    public String getDepositedDate() { return depositedDate; }
    public void setDepositedDate(String depositedDate) { this.depositedDate = depositedDate; }

    public String getVerifiedDate() { return verifiedDate; }
    public void setVerifiedDate(String verifiedDate) { this.verifiedDate = verifiedDate; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}

