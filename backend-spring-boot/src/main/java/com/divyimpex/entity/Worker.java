package com.divyimpex.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "workers")
public class Worker {

    @Id
    @Column(length = 64)
    private String id;

    @Column(length = 50, unique = true)
    private String employeeId;

    @Column(nullable = false)
    private String name;

    @Column(length = 100)
    private String department = "General";

    @Column(length = 20)
    private String phone;

    @Column(length = 50)
    private String status = "ACTIVE";

    public Worker() {}

    public Worker(String id, String employeeId, String name, String department, String phone, String status) {
        this.id = id;
        this.employeeId = employeeId;
        this.name = name;
        this.department = department != null ? department : "General";
        this.phone = phone;
        this.status = status != null ? status : "ACTIVE";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

