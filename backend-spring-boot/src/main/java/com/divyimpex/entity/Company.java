package com.divyimpex.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(length = 50, unique = true)
    private String code;

    private String contactPerson;

    @Column(length = 20)
    private String phone;

    private String email;

    @Column(length = 50)
    private String status = "ACTIVE";

    @Column(columnDefinition = "TEXT")
    private String address;

    public Company() {}

    public Company(String id, String name, String code, String contactPerson, String phone, String email, String status, String address) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.status = status != null ? status : "ACTIVE";
        this.address = address;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}

