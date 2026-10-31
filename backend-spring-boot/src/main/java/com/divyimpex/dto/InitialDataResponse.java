package com.divyimpex.dto;

import com.divyimpex.entity.Company;
import com.divyimpex.entity.Diamond;
import com.divyimpex.entity.History;
import com.divyimpex.entity.Worker;

import java.util.List;

public class InitialDataResponse {
    private List<Company> companies;
    private List<Worker> workers;
    private List<Diamond> diamonds;
    private List<History> histories;

    public InitialDataResponse() {}

    public InitialDataResponse(List<Company> companies, List<Worker> workers, List<Diamond> diamonds, List<History> histories) {
        this.companies = companies;
        this.workers = workers;
        this.diamonds = diamonds;
        this.histories = histories;
    }

    public List<Company> getCompanies() { return companies; }
    public void setCompanies(List<Company> companies) { this.companies = companies; }

    public List<Worker> getWorkers() { return workers; }
    public void setWorkers(List<Worker> workers) { this.workers = workers; }

    public List<Diamond> getDiamonds() { return diamonds; }
    public void setDiamonds(List<Diamond> diamonds) { this.diamonds = diamonds; }

    public List<History> getHistories() { return histories; }
    public void setHistories(List<History> histories) { this.histories = histories; }
}

