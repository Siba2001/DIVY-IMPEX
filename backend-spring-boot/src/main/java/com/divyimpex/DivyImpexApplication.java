package com.divyimpex;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DivyImpexApplication {

    public static void main(String[] args) {
        SpringApplication.run(DivyImpexApplication.class, args);
        System.out.println("=================================================");
        System.out.println("DIVY IMPEX Spring Boot Backend is RUNNING on port 8080!");
        System.out.println("Compatibility Endpoint: http://localhost:8080/exec");
        System.out.println("=================================================");
    }
}

